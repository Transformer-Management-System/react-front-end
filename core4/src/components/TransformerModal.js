import React from "react";

export default function TransformerModal({
  formData,
  handleInputChange,
  handleAddTransformer,
  onClose,
}) {
  if (!formData) return null;

  const isFormValid =
    formData.number &&
    formData.pole &&
    formData.region &&
    formData.type &&
    (formData.id ? true : formData.baselineImage) && // baselineImage is only required for new transformers
    formData.weather &&
    formData.location;

  const isEditing = formData.id !== null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add Transformer</h2>

        <label>Transformer Number</label>
        <input
          name="number"
          placeholder="Transformer Number"
          value={formData.number}
          onChange={handleInputChange}
        />

        <label>Pole Number</label>
        <input
          name="pole"
          placeholder="Pole Number"
          value={formData.pole}
          onChange={handleInputChange}
        />

        <label>Region</label>
        <input
          name="region"
          placeholder="Region"
          value={formData.region}
          onChange={handleInputChange}
        />

        <label>Type</label>
        <select name="type" value={formData.type} onChange={handleInputChange}>
          <option value="Bulk">Bulk</option>
          <option value="Distribution">Distribution</option>
        </select>

        <label>Baseline Image</label>
        {isEditing && formData.baselineImage ? (
          <span>Baseline image already exists.</span>
        ) : (
          <input type="file" name="baselineImage" onChange={handleInputChange} />
        )}

        <label>Weather</label>
        <select
          name="weather"
          value={formData.weather || ""}
          onChange={handleInputChange}
        >
          <option value="">Select Weather</option>
          <option value="Sunny">Sunny</option>
          <option value="Rainy">Rainy</option>
          <option value="Cloudy">Cloudy</option>
        </select>

        <label>
          Location
        </label>
        <input
          type="text"
          name="location"
          placeholder="Enter transformer location"
          value={formData.location || ""}
          onChange={handleInputChange}
        />

        {!isFormValid && (
          <p style={{ color: "red", marginTop: "10px" }}>
            Please fill in all required fields.
          </p>
        )}
        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="save-btn"
            onClick={handleAddTransformer}
            disabled={!isFormValid}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
