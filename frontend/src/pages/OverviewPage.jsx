import React from 'react';

export default function OverviewPage({ onNavigate }) {
  return (
    <div>
      {/* Title Hero Banner */}
      <div className="card" style={{ padding: '28px 30px', backgroundColor: '#FFFFFF', marginBottom: '24px' }}>
        <span className="badge badge-neutral" style={{ marginBottom: '12px', fontSize: '12px' }}>
          Final-Year Research Project • Comparative AI Systems Evaluation
        </span>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--navy-primary)', marginBottom: '10px', lineHeight: '1.35' }}>
          Mitigating Hallucinations in Large Language Models via Advanced Retrieval-Augmented Generation Pipelines
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15.5px', maxWidth: '1000px', lineHeight: '1.65', margin: 0 }}>
          This research platform evaluates multi-stage hallucination mitigation techniques in modern language models. 
          By benchmarking direct parametric inference against standard naive vector retrieval and proposed semantic-aware 
          verification pipelines, the project investigates how structured relevance filtering and post-generation consistency 
          checks reduce unsupported factual claims.
        </p>
      </div>

      {/* 2-Column: Problem & RAG Purpose */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">The Research Problem: Hallucination in LLMs</h3>
          </div>
          <div className="card-body" style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
            <p style={{ marginBottom: '12px' }}>
              Autoregressive Large Language Models (LLMs) optimize token likelihood rather than factual truth. Consequently, 
              they frequently exhibit <strong>hallucination</strong>—generating fluent, coherent, and authoritative-sounding 
              statements that directly contradict verifiable evidence or state fabricated entities.
            </p>
            <p style={{ margin: 0 }}>
              In domain-specific and multi-hop question answering, internal parametric memory frequently fails to recall precise 
              chronologies, chemical relationships, or geographical properties, leading to ungrounded completions.
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Retrieval-Augmented Generation (RAG)</h3>
          </div>
          <div className="card-body" style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
            <p style={{ marginBottom: '12px' }}>
              Retrieval-Augmented Generation mitigates parametric hallucination by dynamically decoupling factual storage from 
              model reasoning. An external non-parametric index (FAISS vector store) retrieves verified passages corresponding 
              to user queries.
            </p>
            <p style={{ margin: 0 }}>
              These passages are conditioned directly into the model’s generation context, requiring the model to synthesize 
              answers strictly from verifiable source evidence rather than guessing from latent weights.
            </p>
          </div>
        </div>
      </div>

      {/* The Three Systems Comparison */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Architectural Systems Under Comparison</h3>
            <div className="card-subtitle">Methodological contrast across baseline, naive, and advanced multi-stage pipelines</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
            
            {/* System A */}
            <div style={{ padding: '18px', border: '1px solid var(--border-general)', borderRadius: 'var(--radius-md)', backgroundColor: '#FAFBFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>System A</span>
                <span className="badge badge-neutral">Baseline LLM</span>
              </div>
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px' }}>
                Queries the model directly without external context retrieval. Serves as the parametric control group to measure 
                raw model knowledge and intrinsic hallucination tendencies.
              </p>
              <div style={{ fontSize: '13px', color: 'var(--navy-primary)', fontFamily: 'var(--font-mono)' }}>
                Input: Query only → Output: LLM direct
              </div>
            </div>

            {/* System B */}
            <div style={{ padding: '18px', border: '1px solid var(--border-general)', borderRadius: 'var(--radius-md)', backgroundColor: '#FAFBFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>System B</span>
                <span className="badge badge-info">Naive RAG</span>
              </div>
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px' }}>
                Retrieves the top-2 nearest vector neighbors from FAISS and concatenates them directly into the prompt without 
                relevance verification or redundancy checks.
              </p>
              <div style={{ fontSize: '13px', color: 'var(--navy-primary)', fontFamily: 'var(--font-mono)' }}>
                FAISS (k=2) → Strict Context Prompt → LLM
              </div>
            </div>

            {/* System C */}
            <div style={{ padding: '18px', border: '1.5px solid var(--navy-primary)', borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--navy-primary)' }}>System C</span>
                <span className="badge badge-success">Proposed Advanced RAG</span>
              </div>
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px' }}>
                Integrates multi-hop semantic relevance filtering, Jaccard redundancy removal, grounded synthesis, factual verification, 
                and a re-retrieval loop (k=8) with calibrated abstention.
              </p>
              <div style={{ fontSize: '13px', color: 'var(--navy-primary)', fontFamily: 'var(--font-mono)' }}>
                FAISS → Filter → Jaccard → Verify → Abstain
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Core Technical Distinctions</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Feature / Pipeline Stage</th>
                <th>System A (Baseline)</th>
                <th>System B (Naive RAG)</th>
                <th>System C (Advanced RAG)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Knowledge Retrieval</strong></td>
                <td>None (Parametric weights)</td>
                <td>Dense FAISS (Top-2)</td>
                <td>Dense FAISS (Top-5 initial)</td>
              </tr>
              <tr>
                <td><strong>Chunk Relevance Evaluation</strong></td>
                <td>None</td>
                <td>None (Blind concatenation)</td>
                <td>Semantic AI Relevance Judge</td>
              </tr>
              <tr>
                <td><strong>Redundancy Elimination</strong></td>
                <td>None</td>
                <td>None</td>
                <td>Jaccard Similarity Cutoff (0.85)</td>
              </tr>
              <tr>
                <td><strong>Answer Verification Gate</strong></td>
                <td>None</td>
                <td>None</td>
                <td>Post-Generation Factual Verifier</td>
              </tr>
              <tr>
                <td><strong>Re-Retrieval Fallback Loop</strong></td>
                <td>None</td>
                <td>None</td>
                <td>Widens to k=8 on Verification Failure</td>
              </tr>
              <tr>
                <td><strong>Calibrated Abstention</strong></td>
                <td>No (Guesses or truncates)</td>
                <td>No (Subject to distractor facts)</td>
                <td>Yes (Explicit safe abstention on insufficient context)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div 
          onClick={() => onNavigate('playground')}
          className="card" 
          style={{ padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s ease', marginBottom: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--navy-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-general)'}
        >
          <div style={{ fontWeight: '600', fontSize: '14.5px', color: 'var(--navy-primary)', marginBottom: '5px' }}>
            RAG Playground →
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Execute real-time queries and compare generated outputs across all 3 systems side by side.
          </div>
        </div>

        <div 
          onClick={() => onNavigate('evaluation')}
          className="card" 
          style={{ padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s ease', marginBottom: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--navy-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-general)'}
        >
          <div style={{ fontWeight: '600', fontSize: '14.5px', color: 'var(--navy-primary)', marginBottom: '5px' }}>
            Evaluation Dashboard →
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Inspect saved batch metrics (Exact Match, Token F1, Semantic Similarity) and download reports.
          </div>
        </div>

        <div 
          onClick={() => onNavigate('methodology')}
          className="card" 
          style={{ padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s ease', marginBottom: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--navy-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-general)'}
        >
          <div style={{ fontWeight: '600', fontSize: '14.5px', color: 'var(--navy-primary)', marginBottom: '5px' }}>
            Research Methodology →
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Examine the algorithmic architecture, verification mechanics, and embedding parameters.
          </div>
        </div>

        <div 
          onClick={() => onNavigate('dataset')}
          className="card" 
          style={{ padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s ease', marginBottom: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--navy-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-general)'}
        >
          <div style={{ fontWeight: '600', fontSize: '14.5px', color: 'var(--navy-primary)', marginBottom: '5px' }}>
            Dataset Explorer →
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Browse and search the 500 ground-truth QA entries and Wikipedia knowledge snippets.
          </div>
        </div>
      </div>
    </div>
  );
}
