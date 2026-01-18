import React, { useState, useEffect } from "react";

export default function MaintenanceRecordForm({
  transformer,
  inspection,
  anomalies = [],
  annotatedImage = null,
  onClose,
  onSaved
}) {
  const [engineerName, setEngineerName] = useState(inspection?.inspector || "");
  const [status, setStatus] = useState("OK");
  const toLocalDateTimeInput = (d) => {
    if (!d) return new Date().toISOString().slice(0,16);
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        const yr = parsed.getFullYear();
        const mo = pad(parsed.getMonth()+1);
        const da = pad(parsed.getDate());
        const hr = pad(parsed.getHours());
        const mi = pad(parsed.getMinutes());
        return `${yr}-${mo}-${da}T${hr}:${mi}`;
      }
    } catch (_) {}
    return new Date().toISOString().slice(0,16);
  };
  const [recordTimestamp, setRecordTimestamp] = useState(toLocalDateTimeInput(inspection?.date));
  const [readings, setReadings] = useState({ voltage: "", current: "" });
  const [recommendedAction, setRecommendedAction] = useState("");
  const [notes, setNotes] = useState(inspection?.notes || "");
  const [location, setLocation] = useState(transformer?.location || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inspectionNumber, setInspectionNumber] = useState(null);

  const statusOptions = ["OK", "Needs Maintenance", "Urgent Attention"]; 

  // Compute human-readable inspection number (e.g., T1-INSP3) by fetching all inspections
  useEffect(() => {
    const computeInspectionNumber = async () => {
      if (!inspection?.id || !transformer?.id) return;
      try {
        const res = await fetch('http://localhost:8000/api/inspections');
        if (!res.ok) throw new Error('Failed to fetch inspections');
        const all = await res.json();
        const forTransformer = all.filter(i => i.transformer === transformer.id).sort((a, b) => a.id - b.id);
        const idx = forTransformer.findIndex(i => i.id === inspection.id);
        if (idx >= 0) {
          setInspectionNumber(`${transformer.number}-INSP${idx + 1}`);
        } else {
          setInspectionNumber(`Inspection ${inspection.id}`);
        }
      } catch (e) {
        console.warn('Could not derive inspection number', e);
        setInspectionNumber(`Inspection ${inspection.id}`);
      }
    };
    computeInspectionNumber();
  }, [inspection?.id, transformer?.id, transformer?.number]);

  const handleChangeReading = (name, value) => {
    setReadings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveRecord = async () => {
    if (!transformer?.id || !inspection?.id) {
      alert("Missing transformer or inspection context.");
      return;
    }
    if (!engineerName.trim()) {
      alert("Engineer name is required.");
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        transformer_id: transformer.id,
        inspection_id: inspection.id,
        record_timestamp: recordTimestamp,
        engineer_name: engineerName.trim(),
        status,
        readings,
        recommended_action: recommendedAction,
        notes,
        annotated_image: annotatedImage || inspection?.annotatedImage || null,
        location: location || transformer?.location || '',
        anomalies: (anomalies && anomalies.length ? anomalies : (inspection?.anomalies || [])).map(a => ({
          id: a.id,
          x: a.x,
          y: a.y,
          w: a.w,
          h: a.h,
          severity: a.severity,
          classification: a.classification,
          comment: a.comment || a.notes || '',
          source: a.source || (a.confidence !== undefined ? 'ai' : 'user'),
          deleted: !!a.deleted
        }))
      };
      const res = await fetch('http://localhost:8000/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setSaveSuccess(true);
      if (onSaved) onSaved(saved);
      // Keep modal open to allow printing immediately
    } catch (e) {
      console.error(e);
      alert('Failed to save maintenance record. See console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 11000 }}>
    <div className="modal-card" style={{ maxWidth: 980, zIndex: 11010 }}>
  <h2>Maintenance Record {inspectionNumber ? `- ${inspectionNumber}` : ''}</h2>
        {saveSuccess && (
          <div style={{background:'#d4edda', color:'#155724', padding:'8px 12px', borderRadius:4, marginBottom:10}}>
            ✓ Record saved successfully. You can print or close.
          </div>
        )}

        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>System Data</h3>
            <p><strong>ID:</strong> {transformer?.number} (#{transformer?.id})</p>
            <p><strong>Location:</strong> {transformer?.location || 'N/A'}</p>
            <p><strong>Capacity/Type:</strong> {transformer?.type || 'N/A'}</p>
          </div>
          <div className="modal-section">
            <h3>Engineer Inputs</h3>
            {inspectionNumber && (
              <p><strong>Inspection No:</strong> {inspectionNumber}</p>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                <span>Record Date/Time</span>
                <input type="datetime-local" value={recordTimestamp} onChange={e => setRecordTimestamp(e.target.value)} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                <span>Engineer Name *</span>
                <input type="text" value={engineerName} placeholder="e.g. J. Perera" onChange={e => setEngineerName(e.target.value)} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                <span>Status of Transformer</span>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                <span>Transformer Location</span>
                <input type="text" value={location} placeholder="e.g. Substation 12A" onChange={e => setLocation(e.target.value)} />
              </label>
            </div>
          </div>
        </div>

        <div className="modal-flex-horizontal">
          <div className="modal-section" style={{ flex: 2 }}>
            <h3>Thermal Image (Annotated)</h3>
            { (annotatedImage || inspection?.annotatedImage) ? (
              <img src={annotatedImage || inspection?.annotatedImage} alt="Annotated" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 6 }} />
            ) : (
              <div style={{ padding: 12, color: '#888' }}>No annotated image found. Run AI and review in the previous step.</div>
            )}
          </div>
          <div className="modal-section" style={{ flex: 1 }}>
            <h3>Readings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label style={{display:'flex', flexDirection:'column', fontSize:13}}>Voltage (V)<input type="text" value={readings.voltage} placeholder="e.g. 230" onChange={e => handleChangeReading('voltage', e.target.value)} /></label>
              <label style={{display:'flex', flexDirection:'column', fontSize:13}}>Current (A)<input type="text" value={readings.current} placeholder="e.g. 15" onChange={e => handleChangeReading('current', e.target.value)} /></label>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize:13 }}>Recommended Action</label>
              <textarea value={recommendedAction} placeholder="e.g. Schedule tightening of terminal joints." onChange={e => setRecommendedAction(e.target.value)} rows={3} style={{ width: '100%' }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize:13 }}>Additional Remarks</label>
              <textarea value={notes} placeholder="Optional contextual notes..." onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        <div className="modal-section">
          <h3>Anomalies</h3>
          { (anomalies && anomalies.length) || (inspection?.anomalies && inspection.anomalies.length) ? (
            <table className="log-table">
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
                { (anomalies && anomalies.length ? anomalies : inspection.anomalies).filter(a => !a.deleted).map((a, idx) => (
                  <tr key={(a.id || 'row') + '_' + idx}>
                    <td>{idx + 1}</td>
                    <td>{a.classification || 'N/A'}</td>
                    <td>{a.severity || 'N/A'}</td>
                    <td>{a.comment ? a.comment : '—'}</td>
                    <td>({Math.round(a.x)}, {Math.round(a.y)})</td>
                    <td>{Math.round(a.w)}x{Math.round(a.h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 12, color: '#888' }}>No anomalies recorded.</div>
          )}
        </div>

        <div className="inspection-modal-buttons" style={{ marginTop: 12 }}>
          <button onClick={handlePrint}>Print</button>
          <button className="inspection-save-btn" onClick={handleSaveRecord} disabled={isSaving || !engineerName.trim()}>{isSaving ? 'Saving...' : 'Save Record'}</button>
          <button className="inspection-cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
