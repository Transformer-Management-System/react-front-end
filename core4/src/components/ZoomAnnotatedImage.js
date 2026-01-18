import React, { useRef, useState } from "react";
import "../style/RecordHistory.css";

export default function ZoomAnnotatedImage({ src, anomalies = [], height = 460 }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // On image load, compute natural size and fit-to-width
  const onImgLoad = () => {
    const w = imgRef.current?.naturalWidth || 0;
    const h = imgRef.current?.naturalHeight || 0;
    setNatural({ w, h });
    fitToWidth(w);
  };

  const fitToWidth = (natW = natural.w) => {
    const cw = containerRef.current?.clientWidth || natW || 1;
    const fit = Math.max(0.1, Math.min(3, cw / (natW || 1)));
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomBy = (delta, pivot = null) => {
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    if (!pivot) {
      setZoom(newZoom);
      return;
    }
    // Keep pivot point stable while zooming
    const rect = containerRef.current.getBoundingClientRect();
    const px = pivot.clientX - rect.left - pan.x;
    const py = pivot.clientY - rect.top - pan.y;
    const k = newZoom / zoom;
    const nx = pan.x - (px * (k - 1));
    const ny = pan.y - (py * (k - 1));
    setPan({ x: nx, y: ny });
    setZoom(newZoom);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    zoomBy(delta, e);
  };

  const onMouseDown = (e) => {
    setPanning(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!panning) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onMouseUp = () => setPanning(false);
  const onMouseLeave = () => setPanning(false);

  // Compute severity color
  const colorFor = (sev) => {
    const s = (sev || '').toLowerCase();
    if (s.includes('urgent') || s.includes('faulty')) return '#e53935';
    if (s.includes('potential')) return '#fb8c00';
    if (s.includes('ok') || s.includes('normal')) return '#43a047';
    return '#1976d2';
  };

  return (
    <div className="annotated-wrap">
      <div className="zoom-toolbar">
        <button className="btn" onClick={() => zoomBy(1/1.1)}>−</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button className="btn" onClick={() => zoomBy(1.1)}>+</button>
        <div className="spacer" />
        <button className="btn" onClick={resetView}>Reset</button>
        <button className="btn" onClick={() => fitToWidth()}>Fit</button>
      </div>
      <div
        className="zoom-viewer"
        ref={containerRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        style={{ height }}
      >
        <div
          className="zoom-inner"
          style={{
            width: natural.w || 'auto',
            height: natural.h || 'auto',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          <img ref={imgRef} src={src} alt="Annotated" onLoad={onImgLoad} style={{ width: natural.w || 'auto', height: 'auto', display: 'block' }} />
          <div className="overlay-layer" style={{ width: natural.w, height: natural.h }}>
            {anomalies.map((a, idx) => (
              <div
                key={(a.id || 'ann') + '_' + idx}
                className="bbox"
                title={`#${idx + 1} ${a.classification || ''} • ${a.severity || ''}${a.comment ? ' • ' + a.comment : ''}`}
                style={{
                  left: a.x,
                  top: a.y,
                  width: a.w,
                  height: a.h,
                  borderColor: colorFor(a.severity)
                }}
              >
                <span className="bbox-label" style={{ backgroundColor: colorFor(a.severity) }}>
                  {a.classification || 'Anomaly'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hint">Tip: Scroll to zoom, drag to pan.</div>
    </div>
  );
}
