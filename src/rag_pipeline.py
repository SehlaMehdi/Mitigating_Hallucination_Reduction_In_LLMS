import os
import time
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer
from groq import Groq

# 1. Initialize global resources
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# 1. Initialize global resources
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Use the globally supported model for all API calls
MODEL_NAME = "openai/gpt-oss-20b"

# Ensure it finds the data folder relative to this file
base_dir = os.path.dirname(os.path.dirname(__file__))
data_path = os.path.join(base_dir, "data", "prototype_qa_data.csv")

df = pd.read_csv(data_path)
knowledge_base = df['knowledge'].dropna().tolist()

embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
document_embeddings = embedder.encode(knowledge_base, convert_to_numpy=True, normalize_embeddings=True)

dimension = document_embeddings.shape[1]
index = faiss.IndexFlatIP(dimension)
index.add(document_embeddings)

# 2. System A (Baseline LLM)
def run_system_a(query):
    """
    System A: Baseline LLM generation without knowledge retrieval.
    Directly queries the LLM with safe response parsing, token-limit handling,
    and bounded retry logic.
    """
    if not query or not str(query).strip():
        return "Error: Empty query provided."

    def call_model(max_tokens, reasoning_effort="low"):
        return client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "user", "content": f"Answer this question directly: {query}"}
            ],
            temperature=0.0,
            max_tokens=max_tokens,
            reasoning_effort=reasoning_effort
        )

    try:
        # Initial call with standard generation budget
        response = call_model(max_tokens=600, reasoning_effort="low")
        
        # Validate response structure
        if not response or not getattr(response, "choices", None) or len(response.choices) == 0:
            return "Error: No response choices returned by model."
            
        choice = response.choices[0]
        finish_reason = getattr(choice, "finish_reason", None)
        message = getattr(choice, "message", None)
        
        if not message:
            return "Error: Missing message object in model response."
            
        content = getattr(message, "content", None)
        clean_content = content.strip() if (content and isinstance(content, str)) else ""

        # Handle token-limit termination / empty content with a single bounded retry
        if (finish_reason == "length" or not clean_content):
            try:
                retry_response = call_model(max_tokens=1000, reasoning_effort="low")
                if retry_response and getattr(retry_response, "choices", None) and len(retry_response.choices) > 0:
                    retry_choice = retry_response.choices[0]
                    retry_msg = getattr(retry_choice, "message", None)
                    if retry_msg:
                        retry_content = getattr(retry_msg, "content", None)
                        if retry_content and isinstance(retry_content, str) and retry_content.strip():
                            return retry_content.strip()
            except Exception:
                pass

        if clean_content:
            return clean_content

        if finish_reason == "length":
            return "Error: Response incomplete due to model token limit."
            
        return "Error: Model returned an empty response."

    except Exception as e:
        return f"Error: {type(e).__name__} - {str(e)}"

# 3. System B (Naive RAG)
def run_system_b(query, k=2):
    """
    System B: Naive RAG retrieval and context-conditioned generation.
    Retrieves top-k chunks from FAISS without semantic filtering or verification,
    using defensive parsing, increased token budget, and a single bounded retry.
    """
    if not query or not str(query).strip():
        return "Error: Empty query provided.", []

    try:
        query_vec = embedder.encode([query], convert_to_numpy=True, normalize_embeddings=True)
        _, indices = index.search(query_vec, k)
        retrieved_docs = [knowledge_base[i] for i in indices[0] if i != -1]
    except Exception as e:
        return f"Error during retrieval: {type(e).__name__} - {str(e)}", []

    context_str = "\n".join(retrieved_docs)
    prompt = f"Answer the question based strictly on the context.\n\nContext:\n{context_str}\n\nQuestion: {query}"

    def call_model(max_tokens, reasoning_effort="low"):
        return client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=max_tokens,
            reasoning_effort=reasoning_effort
        )

    try:
        # Initial generation attempt with standard token budget
        response = call_model(max_tokens=600, reasoning_effort="low")

        if not response or not getattr(response, "choices", None) or len(response.choices) == 0:
            return "Error: No response choices returned by model.", retrieved_docs

        choice = response.choices[0]
        finish_reason = getattr(choice, "finish_reason", None)
        message = getattr(choice, "message", None)

        if not message:
            return "Error: Missing message object in model response.", retrieved_docs

        content = getattr(message, "content", None)
        clean_content = content.strip() if (content and isinstance(content, str)) else ""

        # Handle token exhaustion or empty output with a single bounded retry
        if (finish_reason == "length" or not clean_content):
            try:
                retry_response = call_model(max_tokens=1000, reasoning_effort="low")
                if retry_response and getattr(retry_response, "choices", None) and len(retry_response.choices) > 0:
                    retry_choice = retry_response.choices[0]
                    retry_finish = getattr(retry_choice, "finish_reason", None)
                    retry_msg = getattr(retry_choice, "message", None)
                    if retry_msg:
                        retry_content = getattr(retry_msg, "content", None)
                        if retry_content and isinstance(retry_content, str) and retry_content.strip() and retry_finish != "length":
                            return retry_content.strip(), retrieved_docs
            except Exception:
                pass

        if clean_content and finish_reason != "length":
            return clean_content, retrieved_docs

        if finish_reason == "length":
            return "Error: Response incomplete due to model token limit.", retrieved_docs

        return "Error: Model returned an empty response.", retrieved_docs

    except Exception as e:
        return f"Error: {type(e).__name__} - {str(e)}", retrieved_docs

# 4. Phase 2: AI Evaluators (Relevance & Fact Checking)
def judge_chunk_relevance(query, chunk_text):
    """
    Evaluates whether a context chunk provides relevant evidence for the query,
    accommodating multi-hop entity properties, definitions, and co-references.
    """
    prompt = (
        "You are an expert retrieval relevance evaluator for multi-hop question answering.\n"
        "Determine whether the context chunk contains useful evidence, entities, properties, or alternative names relevant to answering the question.\n"
        "Note: In multi-hop questions, a chunk may describe a property (like solubility, nationality, location, or founding date) or define an alternative name of a relevant entity.\n\n"
        f"Question: {query}\n"
        f"Context Chunk: {chunk_text}\n\n"
        "Is this chunk genuinely relevant to answering the question? Reply with ONLY: YES or NO."
    )
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME, 
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=300,
            reasoning_effort="low"
        )
        content = (response.choices[0].message.content or "").strip().upper()
        if not content and hasattr(response.choices[0].message, "reasoning"):
            content = (response.choices[0].message.reasoning or "").strip().upper()
        if "NO" in content and "YES" not in content:
            return False
        return True
    except:
        return True

def verify_answer(query, context, generated_answer):
    """
    Strict factual verification evaluator:
    Checks that the answer directly answers the question and is grounded in the context.
    """
    prompt = (
        "You are a factual verification evaluator.\n"
        "Assess whether the GENERATED ANSWER directly answers the specific QUESTION and is grounded in the CONTEXT.\n"
        "Verification Rules:\n"
        "1. The answer must directly address what the question asks.\n"
        "2. The answer must be supported by the context, including reasonable temporal or entity deductions (such as publication periods).\n"
        "3. If the answer contradicts the context or discusses an unrelated entity, reply UNSUPPORTED.\n"
        "4. Reply with ONLY one word: SUPPORTED or UNSUPPORTED.\n\n"
        f"QUESTION: {query}\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"GENERATED ANSWER: {generated_answer}\n\n"
        "VERDICT (SUPPORTED or UNSUPPORTED):"
    )
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME, 
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=300,
            reasoning_effort="low"
        )
        content = (response.choices[0].message.content or "").strip().upper()
        if not content and hasattr(response.choices[0].message, "reasoning"):
            content = (response.choices[0].message.reasoning or "").strip().upper()
        return "UNSUPPORTED" not in content and "SUPPORTED" in content
    except:
        return True

def remove_redundant_chunks(filtered_docs, similarity_cutoff=0.85):
    """Removes text chunks that are near-duplicates."""
    unique_docs = []
    for doc, score in filtered_docs:
        is_redundant = False
        for u_doc, _ in unique_docs:
            words_doc = set(doc.lower().split())
            words_u = set(u_doc.lower().split())
            if len(words_doc) > 0 and len(words_u) > 0:
                intersection = len(words_doc.intersection(words_u))
                union = len(words_doc.union(words_u))
                jaccard = intersection / union if union > 0 else 0
                if jaccard > similarity_cutoff:
                    is_redundant = True
                    break
        if not is_redundant:
            unique_docs.append((doc, score))
    return unique_docs

# 5. System C (Advanced RAG with Relevance Filtering, Verification, & Re-Retrieval Fallback)
def run_system_c(query, k=5):
    """
    Advanced RAG pipeline:
    1. Dense vector retrieval (FAISS)
    2. Multi-hop semantic relevance filtering
    3. Jaccard redundancy removal
    4. Direct evidence-grounded generation
    5. Factual consistency verification
    6. Re-retrieval fallback loop (widening k to 8 if needed)
    """
    def execute_rag_attempt(active_k):
        query_vec = embedder.encode([query], convert_to_numpy=True, normalize_embeddings=True)
        scores, indices = index.search(query_vec, active_k)
        
        filtered_docs = []
        for score, idx in zip(scores[0], indices[0]):
            if idx != -1:
                chunk_text = knowledge_base[idx]
                if judge_chunk_relevance(query, chunk_text):
                    filtered_docs.append((chunk_text, float(score)))
                time.sleep(0.05)
                
        unique_docs = remove_redundant_chunks(filtered_docs)
        if not unique_docs:
            return None, []
            
        context_str = "\n\n".join([f"[{i+1}] {doc}" for i, (doc, _) in enumerate(unique_docs)])
        
        prompt = (
            "You are an accurate, evidence-grounded QA assistant.\n"
            "Answer the user's specific QUESTION directly and concisely based strictly on the provided CONTEXT.\n"
            "Rely only on clear facts stated in the context. Do not invent facts or answer unrelated topics.\n"
            "Provide a direct, factual answer in 1-2 clear sentences without preamble.\n\n"
            f"CONTEXT:\n{context_str}\n\n"
            f"QUESTION: {query}\n\n"
            "DIRECT ANSWER:"
        )
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=600,
                reasoning_effort="low"
            )
            msg = response.choices[0].message
            content = getattr(msg, "content", None)
            answer = content.strip() if (content and isinstance(content, str)) else ""
            if not answer and hasattr(msg, "reasoning") and msg.reasoning:
                lines = [l.strip() for l in msg.reasoning.strip().splitlines() if l.strip()]
                answer = lines[-1] if lines else ""
            
            # Post-generation factual verification check
            if answer:
                is_supported = verify_answer(query, context_str, answer)
                if not is_supported:
                    return None, unique_docs
                return answer, unique_docs
                
            return None, unique_docs
        except Exception:
            return None, unique_docs

    # --- Attempt 1: Standard Search (K=5) ---
    answer, docs = execute_rag_attempt(k)
    
    # --- Attempt 2: Re-retrieval Fallback Loop (Widening Net to K=8 if Attempt 1 failed or lacked support) ---
    if not answer:
        fallback_answer, fallback_docs = execute_rag_attempt(active_k=8)
        if fallback_answer:
            answer = fallback_answer
            docs = fallback_docs
        elif not docs and fallback_docs:
            docs = fallback_docs
        
    # --- Final Abstention Message if No Reliable Grounded Answer Was Determined ---
    if not answer:
        answer = "A reliable answer could not be determined from the available knowledge."
        
    return answer, docs
