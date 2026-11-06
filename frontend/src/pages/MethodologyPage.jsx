import React from 'react';

export default function MethodologyPage() {
  return (
    <div>
      {/* Intro Card */}
      <div className="card" style={{ padding: '26px 28px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', color: 'var(--navy-primary)', marginBottom: '8px' }}>
          Research Methodology & System Architecture
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.65', margin: 0 }}>
          This page specifies the mathematical, algorithmic, and inference pipelines implemented in the research project. 
          The design contrasts an ungrounded parametric baseline against an unverified naive dense retriever and the proposed 
          multi-stage semantic verification pipeline.
        </p>
      </div>

      {/* SYSTEM A ARCHITECTURE */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-neutral">Baseline Control</span>
            <h3 className="card-title">System A — Baseline Parametric LLM</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="process-diagram-wrapper">
            <div className="process-step-row" style={{ gap: '12px 14px' }}>
              <div className="process-step-node">
                <span>1. User Question</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">
                <span>2. Direct Prompt Formatting</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">
                <span>3. Groq API (openai/gpt-oss-20b)</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">
                <span>4. Defensive Extraction & Bounded Retry</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node" style={{ borderColor: 'var(--navy-primary)' }}>
                <span>5. Generated Answer</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.65', marginTop: '16px', margin: '16px 0 0 0' }}>
            <strong>Mechanism:</strong> System A queries the model directly with no external retrieval (<code style={{ color: 'var(--navy-primary)' }}>run_system_a</code>). 
            It represents the model's closed-book parametric knowledge. Defensive response parsing and token budget limits (600 tokens initial, 
            bounded retry to 1,000) ensure reliability against token exhaustion while preserving raw intrinsic hallucination rates.
          </p>
        </div>
      </div>

      {/* SYSTEM B ARCHITECTURE */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-info">Standard Retriever</span>
            <h3 className="card-title">System B — Naive RAG (Vector Indexing)</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="process-diagram-wrapper">
            <div className="process-step-row" style={{ gap: '12px 14px' }}>
              <div className="process-step-node">
                <span>1. User Question</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">
                <span>2. SentenceTransformer Embedding</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">
                <span>3. FAISS FlatIP Search (Top-2)</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">
                <span>4. Naive Context Injection</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">
                <span>5. Groq LLM Inference</span>
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node" style={{ borderColor: 'var(--navy-primary)' }}>
                <span>6. Unverified Answer + 2 Chunks</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.65', marginTop: '16px', margin: '16px 0 0 0' }}>
            <strong>Mechanism:</strong> System B encodes the query into a 384-dimensional vector using <code style={{ color: 'var(--navy-primary)' }}>all-MiniLM-L6-v2</code> 
            and retrieves the top-2 nearest passages from FAISS FlatIP (<code style={{ color: 'var(--navy-primary)' }}>run_system_b</code>). The retrieved passages are 
            injected blindly into the generation prompt without checking whether they actually answer the question or contain distractor facts.
          </p>
        </div>
      </div>

      {/* SYSTEM C ARCHITECTURE */}
      <div className="card" style={{ marginBottom: '24px', border: '1.5px solid var(--navy-primary)' }}>
        <div className="card-header" style={{ backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-success">Proposed Novel Pipeline</span>
            <h3 className="card-title" style={{ color: 'var(--navy-primary)' }}>System C — Proposed Semantic-Aware RAG</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="process-diagram-wrapper">
            <div className="process-step-row" style={{ gap: '12px 14px' }}>
              <div className="process-step-node">1. Dense Retrieval (k=5)</div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">2. Semantic Relevance Filter</div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">3. Jaccard Deduplication</div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node">4. Grounded Synthesis</div>
            </div>
            
            <div className="process-step-row" style={{ marginTop: '10px', gap: '12px 14px' }}>
              <div className="process-step-node" style={{ backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }}>
                5. Factual Verification Gatekeeper
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node" style={{ color: 'var(--status-success-text)' }}>
                Verified? → Output Answer
              </div>
              <span className="process-step-arrow">or</span>
              <div className="process-step-node" style={{ color: 'var(--status-warning-text)' }}>
                Failed? → Re-Retrieval Loop (k=8)
              </div>
              <span className="process-step-arrow">→</span>
              <div className="process-step-node" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
                Calibrated Abstention
              </div>
            </div>
          </div>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.65', marginTop: '16px' }}>
            <strong>Mechanism:</strong> System C (<code style={{ color: 'var(--navy-primary)' }}>run_system_c</code>) protects against both retrieval noise and generation hallucination:
          </p>
          <ul style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.68', margin: '8px 0 0 0', paddingLeft: '22px' }}>
            <li style={{ marginBottom: '6px' }}>
              <strong>Relevance Filtering:</strong> An evaluator LLM assesses each candidate chunk to confirm it contains properties, definitions, or co-references genuinely relevant to the multi-hop question.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>Jaccard Redundancy Removal:</strong> Eliminates near-duplicate chunks with word-level Jaccard similarity &gt; 0.85 to conserve token budget.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>Factual Verification:</strong> A post-generation verification step assesses whether the synthesized answer directly answers the query and is strictly grounded in the filtered evidence.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>Fallback Expansion:</strong> If verification fails or evidence is insufficient, a second attempt widens the search space to k=8.
            </li>
            <li>
              <strong>Calibrated Abstention:</strong> If evidence across both attempts is missing or rejected, System C outputs: <em>"A reliable answer could not be determined from the available knowledge."</em>
            </li>
          </ul>
        </div>
      </div>

      {/* CORE TECHNOLOGIES SPECIFICATIONS */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Technical Specifications & Dependencies</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            
            <div style={{ padding: '16px 18px', border: '1px solid var(--border-general)', borderRadius: 'var(--radius-sm)', backgroundColor: '#FFFFFF' }}>
              <div style={{ fontWeight: 600, fontSize: '15.5px', color: 'var(--navy-primary)', marginBottom: '6px' }}>
                Dense Embedding Model
              </div>
              <div style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong>sentence-transformers/all-MiniLM-L6-v2</strong>: Maps queries and Wikipedia knowledge snippets into a 384-dimensional dense semantic vector space. Normalized for cosine similarity via inner product.
              </div>
            </div>

            <div style={{ padding: '16px 18px', border: '1px solid var(--border-general)', borderRadius: 'var(--radius-sm)', backgroundColor: '#FFFFFF' }}>
              <div style={{ fontWeight: 600, fontSize: '15.5px', color: 'var(--navy-primary)', marginBottom: '6px' }}>
                Vector Index Engine
              </div>
              <div style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong>FAISS (Facebook AI Similarity Search) FlatIP</strong>: Exact brute-force inner-product index storing 500 passage embeddings with sub-millisecond retrieval latency and zero quantization loss.
              </div>
            </div>

            <div style={{ padding: '16px 18px', border: '1px solid var(--border-general)', borderRadius: 'var(--radius-sm)', backgroundColor: '#FFFFFF' }}>
              <div style={{ fontWeight: 600, fontSize: '15.5px', color: 'var(--navy-primary)', marginBottom: '6px' }}>
                Large Language Model
              </div>
              <div style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong>openai/gpt-oss-20b via Groq API</strong>: Open-weights 20B reasoning model hosted on Groq LPUs. Configured at temperature=0.0 with low reasoning effort and 600 completion tokens.
              </div>
            </div>

            <div style={{ padding: '16px 18px', border: '1px solid var(--border-general)', borderRadius: 'var(--radius-sm)', backgroundColor: '#FFFFFF' }}>
              <div style={{ fontWeight: 600, fontSize: '15.5px', color: 'var(--navy-primary)', marginBottom: '6px' }}>
                Evaluation Dataset
              </div>
              <div style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong>HaluEval QA Benchmark Subset</strong>: 500 multi-hop entity, temporal, and property-based question-answer pairs with associated ground-truth Wikipedia knowledge passages.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
