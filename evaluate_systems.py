import os
import re
import string
import argparse
import numpy as np
import pandas as pd
from collections import Counter

# Import pipeline resources
from src.rag_pipeline import embedder, run_system_a, run_system_b, run_system_c


# ==============================================================================
# 1. TEXT NORMALIZATION & EVALUATION METRICS
# ==============================================================================

def normalize_text(text: str) -> str:
    """
    Standard QA evaluation normalization:
    - Lowercase
    - Strip punctuation
    - Remove articles ('a', 'an', 'the')
    - Normalize whitespace
    Preserves meaningful alphanumeric characters.
    """
    if not text or not isinstance(text, str):
        return ""
    text = text.lower()
    text = "".join(ch for ch in text if ch not in string.punctuation)
    text = re.sub(r'\b(a|an|the)\b', ' ', text)
    return " ".join(text.split())


def classify_response(response: str) -> str:
    """
    Classifies a response into one of three standardized states:
    - 'valid': Model returned a topical answer to the query.
    - 'abstention': System deliberately and safely declined to answer due to insufficient grounded evidence.
    - 'error': Model failed, crashed, ran out of tokens, or returned an empty response.
    """
    if not response or not isinstance(response, str):
        return "error"
    clean = response.strip()
    if not clean or clean.startswith("Error:") or clean == "No response generated.":
        return "error"
    
    abstention_phrases = [
        "a reliable answer could not be determined from the available knowledge",
        "no relevant context found to answer the query",
        "based on available knowledge, the system processed the query successfully"
    ]
    if any(phrase in clean.lower() for phrase in abstention_phrases):
        return "abstention"
    return "valid"


def compute_exact_match(prediction: str, reference: str, status: str = "valid") -> float:
    """
    Computes Normalized Exact Match (EM) between prediction and reference answer.
    Errors and abstentions are scored as 0.0.
    """
    if status != "valid" or not prediction or not reference:
        return 0.0
    norm_pred = normalize_text(prediction)
    norm_ref = normalize_text(reference)
    if not norm_pred or not norm_ref:
        return 0.0
    return 1.0 if norm_pred == norm_ref else 0.0


def compute_token_metrics(prediction: str, reference: str, status: str = "valid") -> tuple[float, float, float]:
    """
    Computes token-level Precision, Recall, and F1 overlap between prediction and reference.
    Errors and abstentions are scored as (0.0, 0.0, 0.0).
    Note: Token overlap is a lexical metric and does not establish complete factual correctness.
    """
    if status != "valid" or not prediction or not reference:
        return 0.0, 0.0, 0.0
    
    pred_tokens = normalize_text(prediction).split()
    ref_tokens = normalize_text(reference).split()
    if not pred_tokens or not ref_tokens:
        return 0.0, 0.0, 0.0
    
    common = Counter(pred_tokens) & Counter(ref_tokens)
    num_same = sum(common.values())
    if num_same == 0:
        return 0.0, 0.0, 0.0
    
    precision = num_same / len(pred_tokens)
    recall = num_same / len(ref_tokens)
    f1 = (2 * precision * recall) / (precision + recall)
    return precision, recall, f1


def compute_semantic_similarity_batch(predictions: list[str], references: list[str], statuses: list[str]) -> list[float]:
    """
    Calculates cosine similarity between predictions and reference answers using the
    project's existing sentence-transformers embedding model.
    Errors and abstentions are scored as 0.0.
    Note: Semantic similarity measures topical/semantic proximity, not factual verification.
    """
    n = len(predictions)
    similarities = [0.0] * n
    valid_indices = [i for i in range(n) if statuses[i] == "valid" and predictions[i].strip() and references[i].strip()]
    
    if not valid_indices:
        return similarities

    valid_preds = [predictions[i] for i in valid_indices]
    valid_refs = [references[i] for i in valid_indices]

    pred_vecs = embedder.encode(valid_preds, convert_to_numpy=True, normalize_embeddings=True)
    ref_vecs = embedder.encode(valid_refs, convert_to_numpy=True, normalize_embeddings=True)

    # Dot product of unit-normalized embeddings yields exact cosine similarity
    sim_scores = np.clip(np.sum(pred_vecs * ref_vecs, axis=1), 0.0, 1.0)

    for idx, sim in zip(valid_indices, sim_scores):
        similarities[idx] = float(sim)

    return similarities


# ==============================================================================
# 2. EVALUATION PIPELINE RUNNER
# ==============================================================================

def evaluate_pipeline(
    csv_path: str = "data/prototype_qa_data.csv",
    max_samples: int | None = 5,
    shuffle: bool = False,
    random_seed: int = 42,
    mock: bool = False
):
    """
    Executes comparative evaluation across System A, System B, and System C.
    Preserves backward compatibility for results/evaluation_summary.csv while
    generating comprehensive quantitative metrics and an aggregate summary.
    """
    print("=" * 80)
    print("EVALUATION PIPELINE: BASELINE (A) vs NAIVE RAG (B) vs ADVANCED RAG (C)")
    print("=" * 80)

    # Path resolution
    if not os.path.exists(csv_path):
        fallback_path = os.path.join(os.path.dirname(__file__), "data", "prototype_qa_data.csv")
        if os.path.exists(fallback_path):
            csv_path = fallback_path
        else:
            raise FileNotFoundError(f"Evaluation dataset not found at {csv_path}")

    print(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)
    total_dataset_rows = len(df)

    if shuffle:
        df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)

    if max_samples is not None and 0 < max_samples < total_dataset_rows:
        eval_df = df.head(max_samples).copy()
    else:
        eval_df = df.copy()

    num_samples = len(eval_df)
    print(f"Dataset size: {total_dataset_rows} rows | Evaluation subset: {num_samples} samples")
    if mock:
        print("[MOCK MODE ACTIVATED: Simulating system responses without external API calls]")

    # Response accumulation
    questions = []
    references = []
    answers_a = []
    answers_b = []
    answers_c = []

    for idx, row in eval_df.iterrows():
        question = str(row['question']).strip()
        ref_answer = str(row['right_answer']).strip()
        print(f"\nEvaluating [{idx+1}/{num_samples}]: {question[:75]}...")

        questions.append(question)
        references.append(ref_answer)

        if mock:
            # Deterministic simulation of responses for fast testing
            ans_a = f"Direct answer to: {ref_answer}"
            ans_b = f"Retrieved answer: {ref_answer}"
            ans_c = ref_answer
        else:
            # System A (Baseline LLM)
            try:
                ans_a = run_system_a(question)
            except Exception as e:
                ans_a = f"Error: System A exception - {e}"

            # System B (Naive RAG)
            try:
                ans_b, _ = run_system_b(question, k=2)
            except Exception as e:
                ans_b = f"Error: System B exception - {e}"

            # System C (Advanced RAG)
            try:
                ans_c, _ = run_system_c(question, k=5)
            except Exception as e:
                ans_c = f"Error: System C exception - {e}"

        answers_a.append(ans_a)
        answers_b.append(ans_b)
        answers_c.append(ans_c)

    # --------------------------------------------------------------------------
    # METRICS CALCULATION
    # --------------------------------------------------------------------------
    print("\nComputing evaluation metrics (Normalized EM, Token F1, Semantic Similarity)...")

    systems_data = {
        "system_a": answers_a,
        "system_b": answers_b,
        "system_c": answers_c
    }

    metrics_per_system = {}

    for sys_name, pred_list in systems_data.items():
        statuses = [classify_response(p) for p in pred_list]
        ems = [compute_exact_match(p, r, s) for p, r, s in zip(pred_list, references, statuses)]
        token_results = [compute_token_metrics(p, r, s) for p, r, s in zip(pred_list, references, statuses)]
        precisions = [p for p, _, _ in token_results]
        recalls = [r for _, r, _ in token_results]
        f1s = [f for _, _, f in token_results]
        sims = compute_semantic_similarity_batch(pred_list, references, statuses)

        metrics_per_system[sys_name] = {
            "status": statuses,
            "em": ems,
            "precision": precisions,
            "recall": recalls,
            "f1": f1s,
            "similarity": sims
        }

    # --------------------------------------------------------------------------
    # BUILD PRIMARY DETAILED CSV (Backward-compatible with frontend/backend/PDF)
    # --------------------------------------------------------------------------
    detailed_df = pd.DataFrame({
        "question": questions,
        "reference": references,
        "system_a": answers_a,
        "system_b": answers_b,
        "system_c": answers_c,
        # System A detailed metrics
        "system_a_status": metrics_per_system["system_a"]["status"],
        "system_a_em": metrics_per_system["system_a"]["em"],
        "system_a_precision": metrics_per_system["system_a"]["precision"],
        "system_a_recall": metrics_per_system["system_a"]["recall"],
        "system_a_f1": metrics_per_system["system_a"]["f1"],
        "system_a_similarity": metrics_per_system["system_a"]["similarity"],
        # System B detailed metrics
        "system_b_status": metrics_per_system["system_b"]["status"],
        "system_b_em": metrics_per_system["system_b"]["em"],
        "system_b_precision": metrics_per_system["system_b"]["precision"],
        "system_b_recall": metrics_per_system["system_b"]["recall"],
        "system_b_f1": metrics_per_system["system_b"]["f1"],
        "system_b_similarity": metrics_per_system["system_b"]["similarity"],
        # System C detailed metrics
        "system_c_status": metrics_per_system["system_c"]["status"],
        "system_c_em": metrics_per_system["system_c"]["em"],
        "system_c_precision": metrics_per_system["system_c"]["precision"],
        "system_c_recall": metrics_per_system["system_c"]["recall"],
        "system_c_f1": metrics_per_system["system_c"]["f1"],
        "system_c_similarity": metrics_per_system["system_c"]["similarity"],
    })

    os.makedirs("results", exist_ok=True)
    summary_csv_path = "results/evaluation_summary.csv"
    detailed_df.to_csv(summary_csv_path, index=False)
    print(f"Per-sample detailed results saved to: {summary_csv_path}")

    # --------------------------------------------------------------------------
    # BUILD AGGREGATE SUMMARY TABLE
    # --------------------------------------------------------------------------
    summary_records = []

    for sys_key, label in [("system_a", "System A (Baseline LLM)"),
                           ("system_b", "System B (Naive RAG)"),
                           ("system_c", "System C (Advanced RAG)")]:
        m = metrics_per_system[sys_key]
        n_total = len(m["status"])
        n_valid = sum(1 for s in m["status"] if s == "valid")
        n_abstain = sum(1 for s in m["status"] if s == "abstention")
        n_error = sum(1 for s in m["status"] if s == "error")

        record = {
            "system": label,
            "total_evaluated": n_total,
            "valid_count": n_valid,
            "valid_pct": round(n_valid / n_total * 100, 2) if n_total > 0 else 0.0,
            "abstention_count": n_abstain,
            "abstention_pct": round(n_abstain / n_total * 100, 2) if n_total > 0 else 0.0,
            "error_count": n_error,
            "error_pct": round(n_error / n_total * 100, 2) if n_total > 0 else 0.0,
            "mean_normalized_em": round(float(np.mean(m["em"])), 4) if n_total > 0 else 0.0,
            "mean_token_precision": round(float(np.mean(m["precision"])), 4) if n_total > 0 else 0.0,
            "mean_token_recall": round(float(np.mean(m["recall"])), 4) if n_total > 0 else 0.0,
            "mean_token_f1": round(float(np.mean(m["f1"])), 4) if n_total > 0 else 0.0,
            "mean_semantic_similarity": round(float(np.mean(m["similarity"])), 4) if n_total > 0 else 0.0,
        }
        summary_records.append(record)

    summary_df = pd.DataFrame(summary_records)
    metrics_summary_path = "results/evaluation_metrics_summary.csv"
    summary_df.to_csv(metrics_summary_path, index=False)
    print(f"Aggregate metrics summary saved to: {metrics_summary_path}")

    # --------------------------------------------------------------------------
    # PRINT TABULAR REPORT
    # --------------------------------------------------------------------------
    print("\n" + "=" * 90)
    print("QUANTITATIVE BENCHMARK SUMMARY")
    print("=" * 90)
    col_format = "{:<28} | {:<7} | {:<9} | {:<7} | {:<8} | {:<8} | {:<8} | {:<8}"
    print(col_format.format("System", "Valid%", "Abstain%", "Error%", "Norm EM", "Token P", "Token R", "Token F1"))
    print("-" * 90)
    for r in summary_records:
        print(col_format.format(
            r["system"][:28],
            f"{r['valid_pct']}%",
            f"{r['abstention_pct']}%",
            f"{r['error_pct']}%",
            f"{r['mean_normalized_em']:.3f}",
            f"{r['mean_token_precision']:.3f}",
            f"{r['mean_token_recall']:.3f}",
            f"{r['mean_token_f1']:.3f}"
        ))
    print("=" * 90)
    print("Evaluation completed successfully.")
    return detailed_df, summary_df


# ==============================================================================
# 3. COMMAND LINE INTERFACE
# ==============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Systems A, B, and C on QA Benchmark.")
    parser.add_argument(
        "--samples",
        type=str,
        default="5",
        help="Number of samples to evaluate (e.g. '5', '20', '50', or 'all'). Default is 5."
    )
    parser.add_argument(
        "--shuffle",
        action="store_true",
        help="Shuffle the dataset before selecting the evaluation subset."
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for dataset shuffling. Default is 42."
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Run in mock mode to validate metrics and CSV output without making external Groq API calls."
    )

    args = parser.parse_args()

    max_samples_val = None if args.samples.strip().lower() == "all" else int(args.samples)

    evaluate_pipeline(
        max_samples=max_samples_val,
        shuffle=args.shuffle,
        random_seed=args.seed,
        mock=args.mock
    )
