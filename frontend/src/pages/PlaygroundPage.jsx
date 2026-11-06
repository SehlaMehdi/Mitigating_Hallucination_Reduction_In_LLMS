import React, { useState } from 'react';

const CURATED_SAMPLES = [
  "Cadmium Chloride is slightly soluble in this chemical, it is also called what?",
  "Which magazine was started first Arthur's Magazine or First for Women?",
  "What nationality was James Henry Miller's wife?",
  "The Oberoi family is part of a hotel company that has a head office in what city?",
  "Which genus of moth in the world's seventh-largest country contains only one species?"
];

// Formats literal Markdown bold (**text**) cleanly without heavy external dependencies
function renderFormattedAnswer(text) {
  if (!text || typeof text !== 'string') return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function PlaygroundPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [showKnowledge, setShowKnowledge] = useState(false);

  // Auto-fill query when a sample chip is clicked
  const handleSelectSample = (sampleText) => {
    setQuery(sampleText);
  };

  const handleRunComparison = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError('');
    setResults(null);
    setShowKnowledge(false);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ask", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: Failed to reach FastAPI backend`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Inference execution error:", err);
      setError("Unable to connect to the FastAPI inference server. Verify that 'python -m uvicorn backend.main:app' is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine status styling for System answers
  const renderStatusBadge = (answerText, isSystemC = false) => {
    if (!answerText) {
      return <span className="badge badge-danger">Empty Output</span>;
    }
    const clean = answerText.trim();
    if (clean.startsWith("Error:") || clean === "No response generated.") {
      return <span className="badge badge-danger">Runtime Error</span>;
    }
    if (isSystemC && clean.toLowerCase().includes("a reliable answer could not be determined")) {
      return <span className="badge badge-warning">Calibrated Abstention</span>;
    }
    return <span className="badge badge-success">Topical Generation</span>;
  };

  return (
    <div>
      {/* Question Input Container */}
      <div className="playground-input-card">
        <form onSubmit={handleRunComparison}>
          <div className="prompt-label-wrapper">
            <label htmlFor="rag-query-input" className="prompt-label">
              Ask a question
            </label>
            <span className="prompt-hint">
              Input a single- or multi-hop factual question for comparative inference
            </span>
          </div>

          <textarea
            id="rag-query-input"
            className="prompt-textarea"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Which magazine was started first Arthur's Magazine or First for Women?"
            rows={3}
            disabled={loading}
          />

          <div className="playground-actions-bar">
            {/* Clickable Quick Sample Chips */}
            <div className="sample-queries-box">
              <span className="sample-tag-label">Sample queries:</span>
              {CURATED_SAMPLES.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  className="sample-chip"
                  onClick={() => handleSelectSample(sample)}
                  title={sample}
                >
                  Query {idx + 1}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <>
                  <svg className="nav-icon" style={{ animation: 'spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                  </svg>
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Run Comparison</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="card" style={{ padding: '16px 20px', backgroundColor: 'var(--status-danger-bg)', borderColor: 'var(--status-danger-border)', color: 'var(--status-danger-text)', marginBottom: '22px', fontSize: '14.5px' }}>
          <strong>Connection Error:</strong> {error}
        </div>
      )}

      {/* Dataset Reference Answer Callout */}
      {results && results.reference && (
        <div className="reference-banner">
          <div className="reference-header">
            <div className="reference-title-tag">
              <svg style={{ width: '15px', height: '15px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Dataset Reference Evaluation Target</span>
            </div>
            {results.reference.matched ? (
              <span className="badge badge-success">
                Matched Row #{results.reference.dataset_index} in prototype_qa_data.csv
              </span>
            ) : (
              <span className="badge badge-neutral">Ad-hoc query (No dataset match)</span>
            )}
          </div>

          {results.reference.matched ? (
            <>
              <div className="reference-answer-text">
                {results.reference.right_answer}
              </div>
              {results.reference.knowledge && (
                <>
                  <button 
                    type="button" 
                    className="reference-knowledge-toggle"
                    onClick={() => setShowKnowledge(!showKnowledge)}
                  >
                    <span>{showKnowledge ? "Hide expected ground-truth passage" : "View expected ground-truth passage"}</span>
                    <span>{showKnowledge ? "▲" : "▼"}</span>
                  </button>
                  {showKnowledge && (
                    <div className="reference-knowledge-box">
                      {results.reference.knowledge}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              No reference answer available for this question. The benchmark dataset does not contain an exact matching target for this ad-hoc input.
            </div>
          )}
        </div>
      )}

      {/* 3-System Output Comparison Cards */}
      {results && (
        <div className="systems-grid">
          
          {/* SYSTEM A: BASELINE */}
          <div className="system-card">
            <div className="system-card-header">
              <div>
                <h4 className="system-heading">System A — Baseline LLM</h4>
                <p className="system-subheading">Direct Parametric Generation</p>
              </div>
              {renderStatusBadge(results.system_a?.answer, false)}
            </div>
            
            <div className="system-card-body">
              <div className="answer-section">
                <div className="answer-label">Generated Answer:</div>
                <div className="answer-content">
                  {results.system_a?.answer ? (
                    renderFormattedAnswer(results.system_a.answer)
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No answer generated.</span>
                  )}
                </div>
              </div>

              <div className="evidence-section">
                <div className="evidence-header">
                  <span>Retrieved Knowledge:</span>
                  <span className="badge badge-neutral">None</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>
                  System A does not access external vector indices or knowledge chunks. Answers are generated solely from the model's internal pre-trained parameters.
                </div>
              </div>
            </div>
          </div>

          {/* SYSTEM B: NAIVE RAG */}
          <div className="system-card">
            <div className="system-card-header">
              <div>
                <h4 className="system-heading">System B — Naive RAG</h4>
                <p className="system-subheading">Dense FAISS Retrieval (k=2)</p>
              </div>
              {renderStatusBadge(results.system_b?.answer, false)}
            </div>

            <div className="system-card-body">
              <div className="answer-section">
                <div className="answer-label">Generated Answer:</div>
                <div className="answer-content">
                  {results.system_b?.answer ? (
                    renderFormattedAnswer(results.system_b.answer)
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No answer generated.</span>
                  )}
                </div>
              </div>

              <div className="evidence-section">
                <div className="evidence-header">
                  <span>Retrieved Passages:</span>
                  <span className="badge badge-info">
                    {results.system_b?.retrieved_chunks?.length || 0} Chunks
                  </span>
                </div>

                <div className="chunk-list">
                  {results.system_b?.retrieved_chunks && results.system_b.retrieved_chunks.length > 0 ? (
                    results.system_b.retrieved_chunks.map((chunk, idx) => (
                      <div key={idx} className="chunk-card">
                        <span className="chunk-score-pill">Passage {idx + 1}</span>
                        {chunk}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      No passages retrieved.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SYSTEM C: ADVANCED RAG */}
          <div className="system-card system-card-c">
            <div className="system-card-header">
              <div>
                <h4 className="system-heading" style={{ color: 'var(--navy-primary)' }}>
                  System C — Proposed Advanced RAG
                </h4>
                <p className="system-subheading">Filtered, Verified, Fallback-Gated</p>
              </div>
              {renderStatusBadge(results.system_c?.answer, true)}
            </div>

            <div className="system-card-body">
              <div className="answer-section">
                <div className="answer-label">Generated Answer:</div>
                <div className="answer-content" style={{ fontWeight: 500 }}>
                  {results.system_c?.answer ? (
                    renderFormattedAnswer(results.system_c.answer)
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No answer generated.</span>
                  )}
                </div>
              </div>

              <div className="evidence-section">
                <div className="evidence-header">
                  <span>Filtered Relevant Evidence:</span>
                  <span className="badge badge-success">
                    {results.system_c?.filtered_chunks?.length || 0} Chunks Passed
                  </span>
                </div>

                <div className="chunk-list">
                  {results.system_c?.filtered_chunks && results.system_c.filtered_chunks.length > 0 ? (
                    results.system_c.filtered_chunks.map((item, idx) => (
                      <div key={idx} className="chunk-card">
                        <span className="chunk-score-pill">
                          Sim: {typeof item.score === 'number' ? item.score.toFixed(3) : item.score}
                        </span>
                        {item.text}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      All initial retrieval hits were filtered out as irrelevant or redundant.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
