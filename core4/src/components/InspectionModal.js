import React from "react";

export default function InspectionModal({
  transformers,
  inspectionForm,
  handleInspectionChange,
  handleScheduleInspection,
  onClose,
  disableTransformerSelect = false, // <-- new prop to control dropdown
}) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Schedule Inspection</h2>

        <label>
          Transformer:
          <select
            name="transformer"
            value={inspectionForm.transformer}
            onChange={handleInspectionChange}
            disabled={disableTransformerSelect} // <-- controlled by prop
          >
            <option value="">Select Transformer</option>
            {transformers.map((t) => (
              <option key={t.id} value={t.id}>{t.number}</option>
            ))}
          </select>
        </label>

        <label>
          Date:
          <input
            type="date"
            name="date"
            value={inspectionForm.date}
            onChange={handleInspectionChange}
          />
        </label>

        <label>
          Inspector:
          <input
            type="text"
            name="inspector"
            value={inspectionForm.inspector}
            onChange={handleInspectionChange}
          />
        </label>

        <label>
          Notes:
          <textarea
            name="notes"
            value={inspectionForm.notes}
            onChange={handleInspectionChange}
          />
        </label>

        <div className="modal-buttons">
          <button className="inspection-save-btn" onClick={handleScheduleInspection}>
            Add Inspection
          </button>
          <button className="inspection-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
