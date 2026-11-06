import React, { useState, useEffect } from 'react';

export default function DatasetPage() {
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected item for full knowledge modal inspection
  const [selectedItem, setSelectedItem] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch paginated dataset from backend API
  useEffect(() => {
    setLoading(true);
    setError('');

    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      page_size: pageSize.toString(),
      search: debouncedSearch
    });

    fetch(`http://127.0.0.1:8000/api/dataset?${queryParams}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setRecords(data.items || []);
        setTotalRecords(data.total_records || 500);
        setFilteredRecords(data.filtered_records || 0);
        setTotalPages(data.total_pages || 1);
      })
      .catch((err) => {
        console.error("Dataset fetch error:", err);
        setError("Failed to load dataset records from FastAPI backend. Verify server is running.");
      })
      .finally(() => setLoading(false));
  }, [currentPage, pageSize, debouncedSearch]);

  return (
    <div>
      {/* Dataset Summary Cards */}
      <div className="metrics-stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Benchmark Records</div>
          <div className="stat-value">{totalRecords}</div>
          <div className="stat-sub">Ground-truth QA pairs</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Knowledge Source</div>
          <div className="stat-value" style={{ fontSize: '18px', color: 'var(--navy-primary)', paddingTop: '4px' }}>
            HaluEval QA
          </div>
          <div className="stat-sub">Wikipedia-grounded passages</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Filtered Results</div>
          <div className="stat-value">{filteredRecords}</div>
          <div className="stat-sub">Matching search criteria</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Current Page View</div>
          <div className="stat-value" style={{ fontSize: '18px', color: 'var(--navy-primary)', paddingTop: '4px' }}>
            {currentPage} of {totalPages}
          </div>
          <div className="stat-sub">{pageSize} records per page</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 className="card-title">Benchmark Knowledge Base Explorer</h3>
            <div className="card-subtitle">
              Inspect questions, reference answers, and knowledge passages loaded in the FAISS index
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search question, reference, or passage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '9px 14px',
                fontSize: '14.5px',
                border: '1.5px solid var(--border-general)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-input)',
                outline: 'none',
                minWidth: '300px'
              }}
            />

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '9px 12px',
                fontSize: '14px',
                border: '1.5px solid var(--border-general)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFFFF',
                outline: 'none'
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ padding: '18px 24px', color: 'var(--status-danger-text)', backgroundColor: 'var(--status-danger-bg)', fontSize: '14.5px' }}>
            {error}
          </div>
        )}

        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>ID</th>
                <th style={{ width: '34%' }}>Question</th>
                <th style={{ width: '18%' }}>Reference Answer</th>
                <th style={{ width: '38%' }}>Knowledge Snippet</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)', fontSize: '15px' }}>
                    Loading dataset records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)', fontSize: '15px' }}>
                    No dataset records match the search term "{debouncedSearch}".
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}>
                      #{item.id}
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '15px', lineHeight: '1.55' }}>
                      {item.question}
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '13.5px', padding: '4px 8px', fontWeight: 600 }}>
                        {item.right_answer}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.58' }}>
                      {item.knowledge.length > 150 ? `${item.knowledge.substring(0, 150)}...` : item.knowledge}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setSelectedItem(item)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Showing {records.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredRecords)} of {filteredRecords} entries
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '13.5px', padding: '0 8px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Full Knowledge Text Inspection */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">Dataset Record #{selectedItem.id}</h4>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Question:
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {selectedItem.question}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Reference Target (Ground Truth):
                </div>
                <span className="badge badge-success" style={{ fontSize: '14px', padding: '5px 10px', fontWeight: 600 }}>
                  {selectedItem.right_answer}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Complete Wikipedia Knowledge Passage (Indexed in FAISS):
                </div>
                <div style={{ padding: '16px', backgroundColor: '#F8FAFC', border: '1px solid var(--border-general)', borderRadius: 'var(--radius-sm)', fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: '1.68', whiteSpace: 'pre-wrap' }}>
                  {selectedItem.knowledge}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
