// InspectionViewModalWithAI.jsx
import React, { useState, useEffect, useRef } from "react";
import MaintenanceRecordForm from "./MaintenanceRecordForm";
import ZoomAnnotatedImage from "./ZoomAnnotatedImage";
import '../style/InspectionViewModal.css';

export default function InspectionViewModal({
  inspection,
  transformers,
  onClose,
  updateInspection,
  updateTransformer
}) {
  const transformer = transformers.find(t => t.id === inspection.transformer);
  const uploader = "Admin";
  const weatherOptions = ["Sunny", "Rainy", "Cloudy"];

  // --- Baseline state ---
  const [baselineImage, setBaselineImage] = useState(inspection.baselineImage || transformer?.baselineImage || null);
  const [baselineWeather, setBaselineWeather] = useState(inspection.baselineWeather || transformer?.weather || "Sunny");
  const [baselineUploadDate, setBaselineUploadDate] = useState(inspection.baselineUploadDate || transformer?.baselineUploadDate || null);
  const [localBaselineChanged, setLocalBaselineChanged] = useState(false);
  useEffect(() => {
    if (!localBaselineChanged) {
      setBaselineImage(transformer?.baselineImage || null);
      setBaselineWeather(transformer?.weather || "Sunny");
      setBaselineUploadDate(transformer?.baselineUploadDate || null);
    }
  }, [transformer, localBaselineChanged]);

  const [baselineImageURL, setBaselineImageURL] = useState(null);
  useEffect(() => {
    if (!baselineImage) { setBaselineImageURL(null); return; }
    if (baselineImage instanceof File || baselineImage instanceof Blob) {
      const url = URL.createObjectURL(baselineImage);
      setBaselineImageURL(url);
      return () => URL.revokeObjectURL(url);
    } else { setBaselineImageURL(baselineImage); }
  }, [baselineImage]);

  // --- Maintenance state ---
  const [maintenanceImage, setMaintenanceImage] = useState(inspection.maintenanceImage || null);
  const [maintenanceWeather, setMaintenanceWeather] = useState(inspection.maintenanceWeather || "Sunny");
  const [maintenanceUploadDate, setMaintenanceUploadDate] = useState(inspection.maintenanceUploadDate || null);
  const [localMaintenanceChanged, setLocalMaintenanceChanged] = useState(false);
  useEffect(() => {
    if (!localMaintenanceChanged && transformer?.maintenanceImage) {
      setMaintenanceImage(transformer.maintenanceImage);
      setMaintenanceWeather(transformer?.maintenanceWeather || "Sunny");
      setMaintenanceUploadDate(transformer?.maintenanceUploadDate || null);
    }
  }, [transformer, localMaintenanceChanged]);

  const [maintenanceImageURL, setMaintenanceImageURL] = useState(null);
  useEffect(() => {
    if (!maintenanceImage) { setMaintenanceImageURL(null); return; }
    if (maintenanceImage instanceof File || maintenanceImage instanceof Blob) {
      const url = URL.createObjectURL(maintenanceImage);
      setMaintenanceImageURL(url);
      return () => URL.revokeObjectURL(url);
    } else { setMaintenanceImageURL(maintenanceImage); }
  }, [maintenanceImage]);

  const [showBaselinePreview, setShowBaselinePreview] = useState(false);

  // --- Progress status ---
  const [progressStatus, setProgressStatus] = useState(
    inspection.progressStatus || {
      thermalUpload: inspection.maintenanceImage ? "Completed" : "Pending",
      aiAnalysis: inspection.maintenanceImage ? "In Progress" : "Pending",
      review: inspection.maintenanceImage ? "In Progress" : "Pending"
    }
  );

  // --- Completion ---
  const [isCompleted, setIsCompleted] = useState(false);
  const handleComplete = async () => {
    const updatedInspection = {
      ...inspection,
      maintenanceImage,
      annotatedImage,
      baselineWeather,
      baselineUploadDate,
      maintenanceWeather,
      maintenanceUploadDate,
      anomalies,
      // Then update status to complete
      status: "Completed",
      inspectedDate: inspection.date,
      date: null,
      progressStatus: {
        thermalUpload: "Completed",
        aiAnalysis: "Completed",
        review: "Completed",
      },
    };
    if (updateInspection) updateInspection(updatedInspection);
    // Now close the modal
    onClose();
  };

  // ---------------- AI Analysis + Annotations ----------------
  const [annotatedImage, setAnnotatedImage] = useState(inspection.annotatedImage || null); // data-uri or url
  const [anomalies, setAnomalies] = useState(inspection.anomalies || []); // {id,x,y,w,h,confidence,comment,source,deleted}
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [aiThreshold, setAiThreshold] = useState(0.5); // New state for AI threshold
  const [zoomLevel, setZoomLevel] = useState(1); // Re-add state for zoom slider
  const [imageLoaded, setImageLoaded] = useState(0); // State to trigger re-render on image load
  const [hoveredAnomalyId, setHoveredAnomalyId] = useState(null); // For highlighting
  const [selectedAnomalyId, setSelectedAnomalyId] = useState(null); // For editing/resizing
  const [isResizing, setIsResizing] = useState(false); // Track if user is resizing
  const [resizeHandle, setResizeHandle] = useState(null); // Which handle is being dragged
  const [isDragging, setIsDragging] = useState(false); // Track if user is dragging to reposition
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [viewMode, setViewMode] = useState('zoom'); // 'edit' | 'zoom' — default to zoom for better clarity

  // When annotated image becomes available, prefer zoom view by default
  useEffect(() => {
    if (annotatedImage) {
      setViewMode('zoom');
      setIsAddingBox(false);
      setNewBoxStart(null);
    }
  }, [annotatedImage]);

  // Auto-save annotations when they change
  useEffect(() => {
    const autoSave = async () => {
      if (anomalies.length > 0 && inspection.id) {
        try {
          await fetch(`http://localhost:8000/api/annotations/${inspection.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              annotations: anomalies,
              user_id: uploader,
              transformer_id: inspection.transformer
            })
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    };
    
    // Debounce auto-save
    const timeoutId = setTimeout(autoSave, 1000);
    return () => clearTimeout(timeoutId);
  }, [anomalies, inspection.id, inspection.transformer]);

  // Load saved annotations when component mounts
  useEffect(() => {
    const loadAnnotations = async () => {
      if (inspection.id) {
        try {
          const response = await fetch(`http://localhost:8000/api/annotations/${inspection.id}`);
          if (response.ok) {
            const savedAnnotations = await response.json();
            if (savedAnnotations.length > 0) {
              // Convert from database format to UI format
              const convertedAnnotations = savedAnnotations.map(a => ({
                id: a.annotation_id,
                x: a.x,
                y: a.y,
                w: a.w,
                h: a.h,
                confidence: a.confidence,
                severity: a.severity,
                classification: a.classification,
                comment: a.comment || '',
                source: a.source,
                deleted: a.deleted === 1,
                created_at: a.created_at,
                updated_at: a.updated_at,
                user_id: a.user_id
              }));
              setAnomalies(convertedAnnotations);
            }
          }
        } catch (error) {
          console.error('Failed to load annotations:', error);
        }
      }
    };
    
    loadAnnotations();
  }, [inspection.id]);

  // Filter out deleted anomalies for display
  const visibleAnomalies = anomalies.filter(a => !a.deleted);

  // Canvas / image refs for adding boxes
  const annotatedImgRef = useRef(null);
  const annotLayerRef = useRef(null);
  const [isAddingBox, setIsAddingBox] = useState(false);
  const [newBoxStart, setNewBoxStart] = useState(null);

  // Helper: convert dataURL to File for upload
  function dataURLtoFile(dataurl, filename) {
    if (!dataurl) return null;
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  // Edit comment for anomaly
  const handleCommentChange = (id, text) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, comment: text } : a));
  };

  // Delete (mark deleted) or restore
  const handleDeleteAnomaly = (id) => {
    const anomalyToDelete = anomalies.find(a => a.id === id);
    if (!anomalyToDelete) return;

    if (anomalyToDelete.source === 'ai') {
      // For AI anomalies, a comment (reason) is required for deletion.
      if (!anomalyToDelete.comment || anomalyToDelete.comment.trim() === '') {
        alert('Please provide a reason in the "Comment" field before deleting an AI-detected anomaly.');
        return;
      }
    }
    // For both AI (with reason) and Manual anomalies, mark as deleted.
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, deleted: true } : a));
  };
  
  const handleRestoreAnomaly = (id) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, deleted: false } : a));
  };

  // Handle resize/reposition of annotations
  const handleAnnotationMouseDown = (e, anomalyId, handle = null) => {
    e.stopPropagation();
    setSelectedAnomalyId(anomalyId);
    
    if (handle) {
      // Resizing
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      // Dragging/repositioning
      setIsDragging(true);
    }
  };

  const handleAnnotationDrag = (e) => {
    if (!isDragging && !isResizing) return;
    if (!selectedAnomalyId) return;

    const { x: mouseX, y: mouseY } = getMousePos(e);
    
    setAnomalies(prev => prev.map(a => {
      if (a.id !== selectedAnomalyId) return a;
      
      if (isDragging) {
        // Reposition - move the entire box
        const newX = mouseX - a.w / 2;
        const newY = mouseY - a.h / 2;
        return { ...a, x: Math.max(0, newX), y: Math.max(0, newY) };
      } else if (isResizing && resizeHandle) {
        // Resize based on which handle is being dragged
        const newAnnot = { ...a };
        
        switch(resizeHandle) {
          case 'nw': // top-left
            newAnnot.w = a.x + a.w - mouseX;
            newAnnot.h = a.y + a.h - mouseY;
            newAnnot.x = mouseX;
            newAnnot.y = mouseY;
            break;
          case 'ne': // top-right
            newAnnot.w = mouseX - a.x;
            newAnnot.h = a.y + a.h - mouseY;
            newAnnot.y = mouseY;
            break;
          case 'sw': // bottom-left
            newAnnot.w = a.x + a.w - mouseX;
            newAnnot.h = mouseY - a.y;
            newAnnot.x = mouseX;
            break;
          case 'se': // bottom-right
            newAnnot.w = mouseX - a.x;
            newAnnot.h = mouseY - a.y;
            break;
        }
        
        // Ensure minimum size
        if (newAnnot.w < 10) newAnnot.w = 10;
        if (newAnnot.h < 10) newAnnot.h = 10;
        
        return newAnnot;
      }
      
      return a;
    }));
  };

  const handleAnnotationMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Add mouse move and mouse up listeners for drag/resize
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleAnnotationDrag);
      window.addEventListener('mouseup', handleAnnotationMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleAnnotationDrag);
        window.removeEventListener('mouseup', handleAnnotationMouseUp);
      };
    }
  }, [isDragging, isResizing, selectedAnomalyId, resizeHandle]);
  
  // --- Save handler (will also save annotations if present) ---
  const handleManualSeverityChange = (id, newSeverity) => {
    setAnomalies(prev => prev.map(a =>
        (a.id === id && a.source === 'user')
            ? { ...a, severity: newSeverity }
            : a
    ));
  };
  const handleManualClassificationChange = (id, newClassification) => {
    setAnomalies(prev => prev.map(a =>
        (a.id === id && a.source === 'user')
            ? { ...a, classification: newClassification }
            : a
    ));
  };
  const manualSeverityOptions = ["Faulty", "Potentially Faulty", "Normal"];
  const manualClassificationOptions = ["Loose Joint", "Point Overload", "Full Wire Overload", "Other"];

  const handleSave = async () => {
    // Persist inspection info (images & status)
    if (updateInspection) {
      updateInspection({
        ...inspection,
        maintenanceImage,
        annotatedImage, // Persist the annotated image
        baselineWeather,
        baselineUploadDate,
        maintenanceWeather,
        maintenanceUploadDate,
        progressStatus,
        anomalies, // Save anomalies
        inspectedDate: isCompleted ? inspection.date : inspection.inspectedDate,
        status: progressStatus.thermalUpload === "Completed" && isCompleted ? "Completed" : inspection.status
      });
    }

    // Save annotations to backend
    if (anomalies && anomalies.length > 0 && inspection.id) {
      try {
        await fetch(`http://localhost:8000/api/annotations/${inspection.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annotations: anomalies,
            user_id: uploader,
            transformer_id: inspection.transformer
          })
        });
      } catch (error) {
        console.error('Failed to save annotations:', error);
        alert('Failed to save annotations. Please try again.');
      }
    }

    onClose();
  };

  // --- Upload handlers ---
  const handleBaselineUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const now = new Date().toLocaleString();
        setBaselineImage(reader.result);
        setBaselineUploadDate(now);
        setLocalBaselineChanged(true);
        if (updateTransformer && transformer) {
          updateTransformer({
            ...transformer,
            baselineImage: reader.result,
            baselineUploadDate: now,
            weather: baselineWeather
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleDeleteBaseline = () => {
    setBaselineImage(null);
    setBaselineUploadDate(null);
    setBaselineWeather("Sunny");
    setLocalBaselineChanged(false);
    if (updateTransformer && transformer) {
      updateTransformer({
        ...transformer,
        baselineImage: null,
        baselineUploadDate: null,
        weather: "Sunny",
      });
    }
  };
  const handleMaintenanceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const now = new Date().toLocaleString();
        setMaintenanceImage(reader.result);
        setLocalMaintenanceChanged(true);
        setMaintenanceUploadDate(now); // Set the upload date
        setProgressStatus({
          thermalUpload: "Completed",
          aiAnalysis: "Pending",
          review: "Pending"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI: POST baseline + maintenance to /analyze
  const handleRunAI = async () => {
    if (!baselineImage || !maintenanceImage) {
      alert("Upload both baseline and maintenance images before running AI analysis.");
      return;
    }
    setIsRunningAI(true);
    setProgressStatus(prev => ({ ...prev, aiAnalysis: "In Progress" }));

    try {
      const form = new FormData();
      // backend expects files; convert dataURI to File if necessary
      const bfile = baselineImage instanceof File ? baselineImage : dataURLtoFile(baselineImage, 'baseline.png');
      const mfile = maintenanceImage instanceof File ? maintenanceImage : dataURLtoFile(maintenanceImage, 'maintenance.png');
      form.append('baseline', bfile);
      form.append('maintenance', mfile);
      form.append('inspection_id', inspection.id);
      form.append('threshold', aiThreshold); // Send threshold to backend

      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: form
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`AI analyze failed: ${txt}`);
      }

      const j = await res.json();
      // Expect: { annotatedImage: <data-uri or url>, anomalies: [{id,x,y,w,h,confidence,severity}] }
      // Use the image data URI sent directly from the backend. This is crucial.
      setAnnotatedImage(j.annotatedImage);

      // map anomalies, ensure ids exist
      const mapped = (j.anomalies || []).map(a => ({
        id: a.id ?? `${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        x: a.x, y: a.y, w: a.w, h: a.h,
        confidence: a.confidence ?? null,
        classification: a.classification ?? 'Unknown',
        severity: a.severity ?? null,
        comment: a.comment ?? '',
        source: 'ai',
        deleted: false
      }));
      setAnomalies(mapped);
      setProgressStatus(prev => ({ ...prev, aiAnalysis: "Completed", review: "In Progress", thermalUpload: "Completed" }));
    } catch (err) {
      console.error(err);
      alert("AI analysis failed. See console for details.");
      setProgressStatus(prev => ({ ...prev, aiAnalysis: "Failed" }));
    } finally {
      setIsRunningAI(false);
    }
  };

  // Add manual box (click-drag on annotated image)
  const getElementOffset = (el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left + window.scrollX, top: rect.top + window.scrollY };
  };

  const onAnnotatedMouseDown = (e) => {
    if (!isAddingBox) return;
    e.preventDefault(); // This is the key fix: prevent default browser drag behavior.
    const img = annotatedImgRef.current;
    if (!img) return;

    const { x, y } = getMousePos(e);
    setNewBoxStart({ x, y });
  };

  // Helper to get true mouse position on the image, accounting for object-fit
  const getMousePos = (e) => {
    const img = annotatedImgRef.current;
    if (!img || !img.naturalWidth) return { x: 0, y: 0 }; // Guard against no image
    const rect = img.getBoundingClientRect();

    // Calculate the scale of the image within its container due to object-fit: contain
    const scale = Math.min(
      rect.width / img.naturalWidth,
      rect.height / img.naturalHeight
    );

    // Calculate the actual rendered dimensions of the image
    const renderedWidth = img.naturalWidth * scale;
    const renderedHeight = img.naturalHeight * scale;

    // Calculate the offset (letterboxing) from the top-left of the container
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;

    // Get mouse position relative to the actual rendered image
    const imageX = e.clientX - rect.left - offsetX;
    const imageY = e.clientY - rect.top - offsetY;

    // Scale the mouse position back to the natural image dimensions
    return { x: imageX / scale, y: imageY / scale };
  };

  const onAnnotatedMouseUp = (e) => {
    if (!isAddingBox || !newBoxStart) return;
    const img = annotatedImgRef.current;
    if (!img) { setIsAddingBox(false); setNewBoxStart(null); return; }

    const { x: finalX, y: finalY } = getMousePos(e);

    const width = Math.abs(finalX - newBoxStart.x);
    const height = Math.abs(finalY - newBoxStart.y);

    if (width > 5 && height > 5) {
      const x = Math.min(newBoxStart.x, finalX);
      const y = Math.min(newBoxStart.y, finalY);
      const newAnom = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        x, y, w: width, h: height,
        severity: '', // Default empty severity for dropdown
        classification: '', // Default empty classification for dropdown
        severity: null,
        comment: '',
        source: 'user',
        deleted: false
      };
      setAnomalies(prev => [...prev, newAnom]);
    }
    setIsAddingBox(false);
    setNewBoxStart(null);
  };

  // Remove all annotations (utility)
  const handleClearAnnotations = () => {
    if (!window.confirm("Clear all annotations?")) return;
    setAnomalies([]);
  };

  // ---------------- UI Render helpers ----------------
  const renderStep = (label, state) => {
    const color = state === "Completed" ? "green" : state === "In Progress" ? "orange" : state === "Failed" ? "red" : "grey";
    return (
      <div className="progress-step" key={label}>
        <div className="progress-circle" style={{ backgroundColor: color }}></div>
        <span className="progress-label"><strong>{label}</strong></span>
        <span className="progress-status"><strong>{state}</strong></span>
      </div>
    );
  };

  // Map anomalies to rendered overlay boxes using absolute positioned divs
  // Note: we assume backend coordinates are in image pixel coordinates of the annotatedImage
  const renderAnomalyOverlays = (key) => { // Add key to ensure re-render when image loads
    if (!annotatedImage) return null;
    // We use the naturalWidth/naturalHeight of the <img> to calculate scaling if the displayed size differs
    const imgEl = annotatedImgRef.current;
    return visibleAnomalies.map((a, index) => {
      // This robust logic correctly scales natural coordinates to display coordinates, accounting for object-fit
      if (!imgEl || !imgEl.naturalWidth) return null;

      const imgScale = Math.min(
        imgEl.clientWidth / imgEl.naturalWidth,
        imgEl.clientHeight / imgEl.naturalHeight
      );

      const offsetX = (imgEl.clientWidth - (imgEl.naturalWidth * imgScale)) / 2;
      const offsetY = (imgEl.clientHeight - (imgEl.naturalHeight * imgScale)) / 2;

      const left = (a.x * imgScale) + offsetX;
      const top = (a.y * imgScale) + offsetY;
      const width = a.w * imgScale;
      const height = a.h * imgScale;

      const borderColor = a.severity === 'Faulty' ? 'rgba(220, 53, 69, 0.9)' : (a.severity === 'Potentially Faulty' ? 'rgba(253, 126, 20, 0.9)' : 'rgba(255, 200, 0, 0.95)');
      const isSelected = selectedAnomalyId === a.id;
      
      return (
        // The parent div for an annotation box and its label
        <div
          key={a.id}
          className="annotation-box"
          style={{
            position: 'absolute',
            left: `${left}px`, // Scaled coordinates
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            boxSizing: 'border-box',
            pointerEvents: 'auto', // Enable hover events
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseEnter={() => setHoveredAnomalyId(a.id)}
          onMouseLeave={() => setHoveredAnomalyId(null)}
          onMouseDown={(e) => handleAnnotationMouseDown(e, a.id)}
        >
          {/* The visible box */}
          <div style={{ 
            width: '100%', 
            height: '100%', 
            border: `${isSelected ? '3px' : '2px'} solid ${borderColor}`,
            boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.5)' : 'none'
          }} />
          
          {/* The number label */}
          <div className="annotation-tag" style={{ backgroundColor: borderColor }}>
            {index + 1}
          </div>
          
          {/* Resize handles - only show when selected */}
          {isSelected && (
            <>
              <div 
                className="resize-handle resize-nw" 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '-4px',
                  width: '8px',
                  height: '8px',
                  background: 'white',
                  border: '2px solid ' + borderColor,
                  cursor: 'nw-resize',
                  borderRadius: '50%'
                }}
                onMouseDown={(e) => handleAnnotationMouseDown(e, a.id, 'nw')}
              />
              <div 
                className="resize-handle resize-ne"
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  background: 'white',
                  border: '2px solid ' + borderColor,
                  cursor: 'ne-resize',
                  borderRadius: '50%'
                }}
                onMouseDown={(e) => handleAnnotationMouseDown(e, a.id, 'ne')}
              />
              <div 
                className="resize-handle resize-sw"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '-4px',
                  width: '8px',
                  height: '8px',
                  background: 'white',
                  border: '2px solid ' + borderColor,
                  cursor: 'sw-resize',
                  borderRadius: '50%'
                }}
                onMouseDown={(e) => handleAnnotationMouseDown(e, a.id, 'sw')}
              />
              <div 
                className="resize-handle resize-se"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  background: 'white',
                  border: '2px solid ' + borderColor,
                  cursor: 'se-resize',
                  borderRadius: '50%'
                }}
                onMouseDown={(e) => handleAnnotationMouseDown(e, a.id, 'se')}
              />
            </>
          )}
          
          {/* Display metadata when hovered */}
          {hoveredAnomalyId === a.id && a.user_id && (
            <div style={{
              position: 'absolute',
              bottom: '-60px',
              left: '0',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 1000
            }}>
              <div><strong>User:</strong> {a.user_id}</div>
              {a.updated_at && <div><strong>Modified:</strong> {new Date(a.updated_at).toLocaleString()}</div>}
              {a.source === 'ai' && <div><strong>Source:</strong> AI Detection</div>}
              {a.source === 'user' && <div><strong>Source:</strong> Manual</div>}
            </div>
          )}
        </div>
      );
    });
  };

  // ---------------- JSX ----------------
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h1 className="modal-title">Thermal Image</h1>

        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>Transformer Info</h3>
            <p><strong>Number:</strong> {transformer?.number || "N/A"}</p>
            <p><strong>Pole:</strong> {transformer?.pole || "N/A"}</p>
            <p><strong>Region:</strong> {transformer?.region || "N/A"}</p>
            <p><strong>Location:</strong> {transformer?.location || "N/A"}</p>
            <p><strong>Type:</strong> {transformer?.type || "N/A"}</p>
            <p><strong>Inspector:</strong> {inspection.inspector || "N/A"}</p>
            <p><strong>Inspection Date:</strong> {inspection.date || "N/A"}</p>
          </div>

          <div className="modal-section">
            <h3>Inspection Progress</h3>
            <div className="progress-bar-container">
              {renderStep("Thermal Image Upload", progressStatus.thermalUpload)}
              {renderStep("AI Analysis", progressStatus.aiAnalysis)}
              {renderStep("Thermal Image Review", progressStatus.review)}
            </div>
          </div>
        </div>

        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>Baseline Image</h3>
            <div className="weather-select">
              <label>
                Weather:
                <select value={baselineWeather} onChange={e => setBaselineWeather(e.target.value)} disabled={!baselineImage}>
                  {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
            </div>
            {baselineImageURL ? (
              <div className="image-actions">
                <span>🖼️ Baseline Image uploaded</span>
                <button onClick={() => setShowBaselinePreview(true)}>👁️</button>
                <button onClick={handleDeleteBaseline} className="danger-btn">🗑️</button>
              </div>
            ) : (
              <>
                <input type="file" id="baselineUpload" onChange={handleBaselineUpload} style={{ display: "none" }} />
                <label htmlFor="baselineUpload" className="upload-btn">📤 Upload Baseline Image</label>
              </>
            )}
          </div>

          <div className="modal-section">
            <h3>Thermal Image</h3>
            <input type="file" id="maintenanceUpload" onChange={handleMaintenanceUpload} style={{ display: "none" }} />
            <label htmlFor="maintenanceUpload" className="upload-btn">Upload Thermal Image</label>
            <label style={{ display: 'block', marginTop: 8 }}>
              Weather:
              <select value={maintenanceWeather} onChange={e => setMaintenanceWeather(e.target.value)} style={{ marginLeft: 8 }}>
                {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>

            <div style={{ marginTop: 12 }}>
              <div className="threshold-slider">
                <label htmlFor="ai-threshold">Anomaly Detection Threshold: {Math.round(aiThreshold * 100)}%</label>
                <input
                  type="range"
                  id="ai-threshold"
                  min="0" max="1" step="0.05"
                  value={aiThreshold}
                  onChange={e => setAiThreshold(parseFloat(e.target.value))} />
              </div>
              <button
                className="analysis-btn"
                onClick={handleRunAI}
                disabled={isRunningAI || !baselineImage || !maintenanceImage}
              >
                {isRunningAI ? "Running AI..." : "Run AI Analysis"}
              </button>
              {annotatedImage && (
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => setViewMode(v => v === 'edit' ? 'zoom' : 'edit')}
                >
                  {viewMode === 'edit' ? 'View (Zoom/Pan)' : 'Edit Annotations'}
                </button>
              )}
              <button
                className={isAddingBox ? "cancel-draw-btn" : ""}
                style={{ marginLeft: 8 }}
                onClick={() => {
                  if (isAddingBox) {
                    setIsAddingBox(false);
                    setNewBoxStart(null);
                  } else {
                    setIsAddingBox(true);
                  }
                }}
                disabled={!annotatedImage || viewMode !== 'edit'}
              >
                {isAddingBox ? "Cancel Drawing" : "Add Manual Box"}
              </button>
              <button style={{ marginLeft: 8 }} onClick={handleClearAnnotations}>Clear Annotations</button>
            </div>
          </div>
        </div>

        {maintenanceImageURL && (
          <div className="modal-section comparison">
            <h3 className="center-text">{annotatedImage ? "AI Annotated Image Comparison" : "Thermal Image Comparison"}</h3>
            <div className="comparison-flex">
              <div className="image-card">
                <h4>Baseline Image</h4> 
                <div className="image-box"><img src={baselineImageURL} alt="Baseline" style={{ maxWidth: '100%' }} /></div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {baselineUploadDate || "N/A"}</p>
                  <p><strong>Weather:</strong> {baselineWeather}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> Baseline</p>
                </div>
              </div>

              <div className="image-card">
                <h4>{annotatedImage ? "AI Annotated Image" : "Thermal Image"}</h4>
                <div className="image-box" style={{ overflow: 'hidden' }}>
                  {annotatedImage ? (
                    viewMode === 'zoom' ? (
                      <ZoomAnnotatedImage src={annotatedImage} anomalies={visibleAnomalies} height={380} />
                    ) : (
                      <div
                        className="annotation-container"
                        style={{
                          position: 'relative',
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <img
                          ref={annotatedImgRef}
                          src={annotatedImage}
                          alt="Annotated"
                          onLoad={() => setImageLoaded(Date.now())}
                          onMouseDown={onAnnotatedMouseDown}
                          onMouseUp={onAnnotatedMouseUp}
                          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        <div
                          ref={annotLayerRef}
                          style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
                        >
                          {renderAnomalyOverlays(imageLoaded)}
                        </div>
                      </div>
                    )
                  ) : (
                    <img src={maintenanceImageURL} alt="Thermal" style={{ maxWidth: '100%', objectFit: 'contain' }} />
                  )}
                </div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {maintenanceUploadDate || inspection.date || "N/A"}</p>
                  <p><strong>Weather:</strong> {maintenanceWeather || "N/A"}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> {annotatedImage ? 'AI Annotated' : 'Maintenance'}</p>
                </div>
                {annotatedImage && viewMode === 'edit' && (
                  <div className="zoom-slider-container">
                    <label htmlFor="zoom-slider">Zoom: {Math.round(zoomLevel * 100)}%</label>
                    <input
                      type="range"
                      id="zoom-slider"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoomLevel}
                      onChange={e => setZoomLevel(parseFloat(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Annotated AI results & editable overlays */}
        

        {/* Analysis Log */}
        {anomalies.length > 0 && (
          <div className="modal-section">
            <h3>Analysis Log</h3>
            <table className="log-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Source</th>
                  <th>Severity</th>
                  <th>Classification</th>
                  <th>Details</th>
                  <th>Comment</th>
                  <th>User/Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAnomalies.map((a, index) => (
                  <tr key={a.id} className={a.id === hoveredAnomalyId ? 'log-row-highlight' : ''}>
                    <td>{index + 1}</td>
                    <td>{a.source === 'ai' ? 'AI' : 'Manual'}</td>
                    <td>
                      {a.source === 'ai' ? (
                        <span className={`severity-badge ${a.severity?.toLowerCase()}`}>
                          {a.severity || 'N/A'}
                        </span>
                      ) : (
                        <select
                          value={a.severity || ''}
                          onChange={(e) => handleManualSeverityChange(a.id, e.target.value)}
                          className="log-classification-select"
                        >
                          <option value="" disabled>Select...</option>
                          {manualSeverityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      {a.source === 'ai' ? (
                        <span>{a.classification || 'N/A'}</span>
                      ) : (
                        <select
                          value={a.classification || ''}
                          onChange={(e) => handleManualClassificationChange(a.id, e.target.value)}
                          className="log-classification-select"
                        >
                          <option value="" disabled>Select...</option>
                          {manualClassificationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      <div style={{ lineHeight: '1.4' }}>
                        <div><strong>Pos:</strong> ({Math.round(a.x)}, {Math.round(a.y)})</div>
                        <div><strong>Size:</strong> {Math.round(a.w)}x{Math.round(a.h)} px</div>
                        {a.source === 'ai' && (
                          <div>
                            <strong>Conf:</strong> {a.confidence ? `${Math.round(a.confidence * 100)}%` : 'N/A'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <textarea
                        placeholder="Add comment..."
                        value={a.comment || ''}
                        onChange={(e) => handleCommentChange(a.id, e.target.value)}
                        className="log-comment-textarea"
                      />
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
                        {a.user_id && <div><strong>User:</strong> {a.user_id}</div>}
                        {a.created_at && <div><strong>Created:</strong> {new Date(a.created_at).toLocaleString()}</div>}
                        {a.updated_at && <div><strong>Updated:</strong> {new Date(a.updated_at).toLocaleString()}</div>}
                      </div>
                    </td>
                    <td>
                      <button className="danger-btn" onClick={() => handleDeleteAnomaly(a.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showBaselinePreview && baselineImageURL && (
          <div className="modal-overlay">
            <div className="modal-card preview-card">
              <h3>Baseline Image Preview</h3>
              <img src={baselineImageURL} alt="Baseline Preview" className="preview-image" />
              <button onClick={() => setShowBaselinePreview(false)} className="inspection-cancel-btn">Close</button>
            </div>
          </div>
        )}

        <div className="inspection-modal-buttons" style={{ marginTop: 12 }}>
          <button onClick={() => setShowRecordForm(true)} disabled={!annotatedImage} title={!annotatedImage ? 'Run AI to generate annotated image first' : 'Generate a maintenance record'}>
            Generate Maintenance Record
          </button>
          {progressStatus.aiAnalysis === "Completed" && (
            <button className="inspection-complete-btn" onClick={handleComplete}>Complete Reviewing</button>
          )}
          <button onClick={handleSave} className="inspection-save-btn">Save</button>
          <button onClick={onClose} className="inspection-cancel-btn">Close</button>
        </div>
      </div>
      {showRecordForm && (
        <MaintenanceRecordForm
          transformer={transformer}
          inspection={inspection}
          anomalies={anomalies}
          annotatedImage={annotatedImage}
          onSaved={() => { /* optional post-save hook */ }}
          onClose={() => setShowRecordForm(false)}
        />
      )}
    </div>
  );
}
