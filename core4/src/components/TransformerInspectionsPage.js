import React, { useState } from "react";
import InspectionModal from "./InspectionModal";
import RecordHistory from "./RecordHistory";
import "../style/TransformerInspectionsPage.css";

export default function TransformerInspectionsPage({
  transformer,
  inspections = [],
  transformers = [],
  setInspections,
  setFilteredInspections,
  onBack,
  onViewInspection,
  deleteInspection
}) {
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [newInspectionForm, setNewInspectionForm] = useState({
    transformer: transformer.id, // preselect current transformer
    date: "",
    inspector: "",
    notes: ""
  });
  const [showRecordHistoryModal, setShowRecordHistoryModal] = useState(false);
  const [recordHistoryInspection, setRecordHistoryInspection] = useState(null);

  // --- Helper to get current status based on progress ---
  const getInspectionStatus = (inspection) => {
    const progress = inspection.progressStatus;
    if (progress) {
      const { thermalUpload, aiAnalysis, review } = progress;
      if (aiAnalysis === "Completed" && review === "Completed") return "Completed";
      if (thermalUpload === "Completed") return "In Progress";
    } else if (inspection.maintenanceImage) {
      // fallback if progressStatus is not defined
      return "In Progress";
    }
    return "Pending";
  };

  const handleDeleteInspection = (id) => {
    if (window.confirm("Are you sure you want to delete this inspection?")) {
      deleteInspection(id);
    }
  };

  const handleAddInspection = () => {
    if (!newInspectionForm.date || !newInspectionForm.inspector) {
      alert("Please fill in both the Date and Inspector fields.");
      return;
    }

    // Persist the new inspection to the backend so it survives reloads
    (async () => {
      const API_URL = 'http://localhost:8000/api';
      const inspectionPayload = {
        ...newInspectionForm,
        transformer: transformer.id,
        progressStatus: {
          thermalUpload: "Pending",
          aiAnalysis: "Pending",
          review: "Pending"
        }
      };

      try {
        const res = await fetch(`${API_URL}/inspections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inspectionPayload)
        });
        if (!res.ok) throw new Error('Failed to save inspection');
        const savedInspection = await res.json();

        setInspections(prev => [...prev, savedInspection]);
        setFilteredInspections(prev => [...prev, savedInspection]);
        setShowAddInspectionModal(false);
        setNewInspectionForm({ transformer: transformer.id, date: "", inspector: "", notes: "" });
      } catch (err) {
        console.error('Error saving inspection:', err);
        alert('Failed to save inspection to server. Check backend and try again.');
      }
    })();
  };

  const generateInspectionNumber = (transformerNumber, index) => {
    return `${transformerNumber}-INSP${index + 1}`;
  };

  // --- Update an inspection after viewing/modifying in modal ---
  const handleUpdateInspection = (updatedInspection) => {
    setInspections(prev => prev.map(i => i.id === updatedInspection.id ? updatedInspection : i));
    setFilteredInspections(prev => prev.map(i => i.id === updatedInspection.id ? updatedInspection : i));
  };

  return (
    <div style={{ padding: "20px" }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Inspections for {transformer.number}</h2>

      <button
        className="add-inspection-btn"
        onClick={() => setShowAddInspectionModal(true)}
      >
        + Add Inspection
      </button>
      {/* Removed transformer-wide records button; access records per inspection */}

      <table className="inspection-table">
        <thead>
          <tr>
            <th>Inspection No</th>
            <th>Maintenance Date</th>
            <th>Maintenance Info</th>
            <th>Status</th>
            <th>Actions</th>
            <th>Records</th>
          </tr>
        </thead>
        <tbody>
          {inspections.length > 0 ? (
            inspections.map((i, index) => (
              <tr key={i.id}>
                <td>{generateInspectionNumber(transformer.number, index)}</td>
                <td>{i.date}</td>
                <td>{i.notes}</td>
                <td>
                  <span className={`status-label ${getInspectionStatus(i).toLowerCase().replace(" ", "-")}`}>
                    {getInspectionStatus(i)}
                  </span>
                </td>
                <td>
                  <button
                    className="inspection-btn view-btn"
                    onClick={() => onViewInspection && onViewInspection(i, handleUpdateInspection)}
                  >
                    View
                  </button>
                  <button
                    className="inspection-btn delete-btn"
                    onClick={() => handleDeleteInspection(i.id)}
                  >
                    Delete
                  </button>
                </td>
                <td>
                  <button
                    className="inspection-btn view-btn"
                    title="View maintenance records for this inspection"
                    onClick={() => { setRecordHistoryInspection(i); setShowRecordHistoryModal(true); }}
                  >
                    Records
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                No inspections found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showAddInspectionModal && (
        <InspectionModal
          transformers={transformers}
          inspectionForm={newInspectionForm}
          handleInspectionChange={(e) =>
            setNewInspectionForm({ ...newInspectionForm, [e.target.name]: e.target.value })
          }
          handleScheduleInspection={handleAddInspection}
          onClose={() => setShowAddInspectionModal(false)}
          disableTransformerSelect={true}
        />
      )}

      {showRecordHistoryModal && recordHistoryInspection && (
        <RecordHistory
          transformer={transformer}
          inspection={recordHistoryInspection}
          onClose={() => { setShowRecordHistoryModal(false); setRecordHistoryInspection(null); }}
        />
      )}
    </div>
  );
}
