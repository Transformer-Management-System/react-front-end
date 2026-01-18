import React, { useEffect, useState } from "react";
import placeholderImage from "../assets/transformer.jpg";
import "../style/TransformerList.css";

export default function TransformerList({
  filteredTransformers = [],
  selectedTransformer,
  setSelectedTransformer,
  searchFieldDetails,
  setSearchFieldDetails,
  searchQueryDetails,
  setSearchQueryDetails,
  setShowModal,
  transformers,
  setTransformers,
  deleteTransformer,
}) {
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    if (selectedTransformer?.baselineImage) {
      const file = selectedTransformer.baselineImage;
      if (typeof file === "string") {
        setImageURL(file);
      } else {
        const url = URL.createObjectURL(file);
        setImageURL(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setImageURL(null);
    }
  }, [selectedTransformer]);

  const handleEdit = (t) => {
    setSelectedTransformer(t);
    setShowModal(t);
  };

  const handleDelete = (t) => {
    if (window.confirm("Are you sure you want to delete this transformer?")) {
      if (selectedTransformer?.id === t.id) setSelectedTransformer(null);
      deleteTransformer(t.id);
    }
  };

  return (
    <div className="transformer-container">
      <h1 className="page-title">Transformers</h1>

      <button className="add-transformer-btn" onClick={() => setShowModal()}>
        + Add Transformer
      </button>

      {/* Search */}
      <div className="search-bar">
        <select
          value={searchFieldDetails}
          name="searchFieldDetails"
          onChange={(e) => setSearchFieldDetails(e.target.value)}
          className="search-select"
        >
          <option value="number">Transformer #</option>
          <option value="pole">Pole #</option>
          <option value="region">Region</option>
          <option value="type">Type</option>
        </select>
        <input
          type="text"
          placeholder="Enter search value..."
          name="searchQueryDetails"
          value={searchQueryDetails}
          onChange={(e) => setSearchQueryDetails(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Selected Transformer */}
      {selectedTransformer && (
        <div className="selected-transformer">
          {/* Transformer Info */}
          <div className="selected-info">
            {["number", "pole", "region", "type"].map((field) => (
              <div key={field} className="info-card">
                <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>
                <div>{selectedTransformer[field]}</div>
              </div>
            ))}

            <button className="danger-btn" onClick={() => setSelectedTransformer(null)}>
              Close
            </button>
          </div>

          {/* Image Section */}
          <div className="selected-image-container">
            <strong className="image-title">Baseline Image</strong>
            <img src={imageURL || placeholderImage} alt="Transformer" className="selected-image" />
          </div>
        </div>
      )}

      {/* Transformer Table */}
      <table className="transformer-table">
        <thead>
          <tr className="table-header">
            <th>Transformer #</th>
            <th>Pole #</th>
            <th>Region</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransformers.map((t) => (
            <tr key={t.id}>
              <td>{t.number}</td>
              <td>{t.pole}</td>
              <td>{t.region}</td>
              <td>{t.type}</td>
              <td className="transformer-actions">
                <button className="view-btn" onClick={() => setSelectedTransformer(t)}>View</button>
                <button className="edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(t)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
