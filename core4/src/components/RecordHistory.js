import React, { useEffect, useState } from "react";
import "../style/RecordHistory.css";
import ZoomAnnotatedImage from "./ZoomAnnotatedImage";

export default function RecordHistory({ transformer, inspection = null, onClose }) {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inspectionNumber, setInspectionNumber] = useState(null);

  // Fetch records for transformer (and optionally inspection)
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const base = `http://localhost:8000/api/records`;
        const url = inspection ? `${base}?transformer_id=${transformer.id}&inspection_id=${inspection.id}` : `${base}?transformer_id=${transformer.id}`;
        const res = await fetch(url);
        const data = await res.json();
        setRecords(data);
        // Auto-select the latest record for convenience
        if (Array.isArray(data) && data.length > 0) {
          setSelectedRecord(data[0]);
        }
      } catch (e) {
        console.error(e);
        alert('Failed to load maintenance records.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [transformer.id, inspection?.id]);

  // Compute human-friendly inspection number if inspection provided
  useEffect(() => {
    const computeInspectionNumber = async () => {
      if (!inspection) return;
      try {
        const res = await fetch('http://localhost:8000/api/inspections');
        if (!res.ok) throw new Error('Failed fetch inspections');
        const all = await res.json();
        const forTransformer = all.filter(i => i.transformer === transformer.id).sort((a, b) => a.id - b.id);
        const idx = forTransformer.findIndex(i => i.id === inspection.id);
        if (idx >= 0) {
          setInspectionNumber(`${transformer.number}-INSP${idx + 1}`);
        } else {
          setInspectionNumber(`Inspection ${inspection.id}`);
        }
      } catch (e) {
        console.warn('Could not compute inspection number', e);
        setInspectionNumber(`Inspection ${inspection.id}`);
      }
    };
    computeInspectionNumber();
  }, [inspection, transformer.id, transformer.number]);

  const openRecord = (rec) => setSelectedRecord(rec);

  const deleteRecord = async (rec) => {
    if (!window.confirm('Delete this maintenance record? This action cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/records/${rec.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== rec.id));
        if (selectedRecord && selectedRecord.id === rec.id) setSelectedRecord(null);
      } else {
        const err = await res.json();
        alert('Failed to delete: ' + (err.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Delete failed', e);
      alert('Network error deleting record');
    }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'stretch', overflow: 'auto' }}>
      <div className="modal-card record-history-modal">
        <div className="record-history-header">
          <div className="record-history-title">
            <h2>Maintenance Records</h2>
            <div className="record-subtitle">
              <span className="pill">{transformer.number}</span>
              {inspection && (
                <span className="pill pill-muted">{inspectionNumber || '...'}</span>
              )}
            </div>
          </div>
          <div className="record-history-actions">
            {/* JSON/CSV export removed – PDF only */}
            <button
              className="btn-secondary"
              onClick={() => {
                const base = `http://localhost:8000/api/records/export/pdf?transformer_id=${transformer.id}`;
                const url = inspection ? `${base}&inspection_id=${inspection.id}` : base;
                window.open(url, '_blank');
              }}
            >Export PDF</button>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="record-history-body">
            <div className="record-list">
              <div className="section-title">Saved Records</div>
              {records.length === 0 ? (
                <div className="empty-state">No records found{inspection ? ' for this inspection.' : '.'}</div>
              ) : (
                <div className="table-wrap">
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date/Time</th>
                        <th>Saved At</th>
                        <th>Engineer</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Anomalies</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => {
                        const anomaliesArr = Array.isArray(r.anomalies) ? r.anomalies : (r.anomalies && typeof r.anomalies === 'object' ? Object.values(r.anomalies) : []);
                        const anomalyCount = anomaliesArr.filter(a => !a.deleted).length;
                        const savedAtRaw = r.created_at || r.updated_at || r.record_timestamp;
                        let savedAt = savedAtRaw;
                        try {
                          if (savedAtRaw && /\d/.test(savedAtRaw)) {
                            const d = new Date(savedAtRaw);
                            if (!isNaN(d.getTime())) savedAt = d.toLocaleString();
                          }
                        } catch (_) {}

                        const statusClass = (r.status || '').toLowerCase().replace(/\s+/g, '-');
                        return (
                          <tr key={r.id}>
                            <td onClick={() => openRecord(r)} className="cell-link">{r.id}</td>
                            <td onClick={() => openRecord(r)} className="cell-link">{r.record_timestamp}</td>
                            <td onClick={() => openRecord(r)} className="cell-link">{savedAt || '—'}</td>
                            <td onClick={() => openRecord(r)} className="cell-link">{r.engineer_name || 'N/A'}</td>
                            <td onClick={() => openRecord(r)} className="cell-link">{r.location || transformer.location || 'N/A'}</td>
                            <td onClick={() => openRecord(r)} className="cell-link"><span className={`status-badge ${statusClass}`}>{r.status || 'N/A'}</span></td>
                            <td onClick={() => openRecord(r)} className="cell-link">{anomalyCount}</td>
                            <td>
                              <div className="row-actions">
                                <button className="btn-link" onClick={() => openRecord(r)}>View</button>
                                <button className="btn-danger" onClick={() => deleteRecord(r)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="record-details">
              <div className="section-title">Details</div>
              {selectedRecord ? (
                <div className="details-card">
                  <div className="details-header">
                    <div className="details-title">
                      <span className="muted">Record</span> #{selectedRecord.id}
                    </div>
                    <div className="row-actions">
                      <button className="btn-danger" onClick={() => deleteRecord(selectedRecord)}>Delete</button>
                    </div>
                  </div>
                  <div className="details-meta">
                    <div>
                      <div className="label">Saved At</div>
                      <div className="value monospace">{(selectedRecord.created_at && new Date(selectedRecord.created_at).toLocaleString()) || selectedRecord.record_timestamp || '—'}</div>
                    </div>
                    <div>
                      <div className="label">Engineer</div>
                      <div className="value">{selectedRecord.engineer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="label">Location</div>
                      <div className="value">{selectedRecord.location || transformer.location || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="label">Status</div>
                      <div className="value"><span className={`status-badge ${(selectedRecord.status || '').toLowerCase().replace(/\s+/g,'-')}`}>{selectedRecord.status || 'N/A'}</span></div>
                    </div>
                    <div>
                      <div className="label">Anomalies</div>
                      <div className="value monospace">{Array.isArray(selectedRecord.anomalies) ? selectedRecord.anomalies.filter(a => !a.deleted).length : 0}</div>
                    </div>
                  </div>

                  <div className="details-section">
                    <div className="section-subtitle">Anomalies</div>
                    {(() => {
                      const arr = Array.isArray(selectedRecord.anomalies) ? selectedRecord.anomalies : (selectedRecord.anomalies && typeof selectedRecord.anomalies === 'object' ? Object.values(selectedRecord.anomalies) : []);
                      const filtered = arr.filter(a => !a.deleted);
                      return filtered.length > 0 ? (
                      <div className="table-wrap">
                        <table className="records-table compact">
                          <thead>
                            <tr>
                               <th>#</th>
                               <th>Type</th>
                               <th>Severity</th>
                               <th>Comment</th>
                               <th>Position</th>
                               <th>Size</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((a, idx) => (
                              <tr key={a.id || idx}>
                                <td>{idx + 1}</td>
                                <td>{a.classification || 'N/A'}</td>
                                <td><span className={`severity-pill ${(a.severity || '').toLowerCase()}`}>{a.severity || 'N/A'}</span></td>
                                <td>{a.comment ? a.comment : '—'}</td>
                                <td>({Math.round(a.x)}, {Math.round(a.y)})</td>
                                <td>{Math.round(a.w)}x{Math.round(a.h)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      ) : (
                        <div className="empty-sub">No anomalies.</div>
                      );
                    })()}
                  </div>

                  {selectedRecord.annotated_image && (
                    <ZoomAnnotatedImage
                      src={selectedRecord.annotated_image}
                      anomalies={(() => {
                        const arr = Array.isArray(selectedRecord.anomalies)
                          ? selectedRecord.anomalies
                          : (selectedRecord.anomalies && typeof selectedRecord.anomalies === 'object' ? Object.values(selectedRecord.anomalies) : []);
                        return arr.filter(a => !a.deleted);
                      })()}
                    />
                  )}

                  <div className="details-section">
                    <div className="section-subtitle">Readings</div>
                    <pre className="code-block">{JSON.stringify(selectedRecord.readings || {}, null, 2)}</pre>
                  </div>

                  <div className="details-section two-col">
                    <div>
                      <div className="section-subtitle">Recommended Action</div>
                      <div className="text-block">{selectedRecord.recommended_action || '—'}</div>
                    </div>
                    <div>
                      <div className="section-subtitle">Notes</div>
                      <div className="text-block">{selectedRecord.notes || '—'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">Select a record to view details.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ZoomAnnotatedImage has been extracted to ./ZoomAnnotatedImage for reuse.
