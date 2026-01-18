import React from "react";
import "../App.css";

export default function InspectionList({
  transformers = [],
  inspections = [],
  setInspections,
  filteredInspections,
  setFilteredInspections,
  searchFieldInspection,
  setSearchFieldInspection,
  searchQueryInspection,
  setSearchQueryInspection,
  openAddInspectionModal,
  onViewInspections,
  deleteInspection,
}) {

  const handleDeleteInspection = (inspectionId) => {
    deleteInspection(inspectionId);
  };

  const handleViewTransformerInspections = (transformer) => {
    if (typeof onViewInspections === "function") {
      onViewInspections(transformer);
    }
  };

  const transformerRows = transformers.map((t) => {
    const tInspections = inspections.filter(i => i.transformer === t.id);

// Prefer latestInspection attached to transformer (from backend) for persisted data
let latestInspectedDate = "-";
let latestMaintenanceDate = "-";
if (t.latestInspection) {
  latestInspectedDate = t.latestInspection.inspectedDate || "-";
  latestMaintenanceDate = t.latestInspection.date || "-";
} else {
  // Fallback to computing from local inspections list
  const completed = tInspections.filter(i => i.inspectedDate);
  latestInspectedDate = completed.length
    ? completed.reduce((latest, curr) =>
        !latest || new Date(curr.inspectedDate) > new Date(latest.inspectedDate) ? curr : latest
      ).inspectedDate
    : "-";

  const pending = tInspections.filter(i => !i.inspectedDate);
  latestMaintenanceDate = pending.length
    ? pending.reduce((latest, curr) =>
        !latest || new Date(curr.date) > new Date(latest.date) ? curr : latest
      ).date
    : "-";
}


    return {
      ...t,
      inspections: tInspections,
      latestMaintenanceDate,
      latestInspectedDate
    };
  });

  return (
    <div style={{ flexGrow: 1, padding: "20px" }}>
      <h1>All Inspections</h1>

      <button className="schedule-btn" onClick={openAddInspectionModal}>
        + Schedule Inspection
      </button>

      <div style={{ marginBottom: "20px", marginTop: "10px" }}>
        <select
          value={searchFieldInspection}
          name="searchFieldInspection"
          onChange={(e) => setSearchFieldInspection(e.target.value)}
          style={{ padding: "8px", marginRight: "10px" }}
        >
          <option value="">Select Field</option>
          <option value="transformer">Transformer Number</option>
          <option value="date">Inspection Date</option>
          <option value="inspector">Inspector Name</option>
          <option value="notes">Notes</option>
        </select>
        <input
          type="text"
          placeholder="Search"
          name="searchQueryInspection"
          value={searchQueryInspection}
          onChange={(e) => setSearchQueryInspection(e.target.value)}
          style={{ padding: "8px", width: "200px" }}
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
        <thead>
          <tr style={{ backgroundColor: "#02090fff", color: "white" }}>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Transformer</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Maintenance Date</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Last Inspected Date</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Total Inspections</th>
            <th style={{ border: "1px solid #ddd", padding: "10px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transformerRows.map((t) => (
            <tr key={t.id || t.number}>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.number}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.latestMaintenanceDate}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.latestInspectedDate}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>{t.inspections.length}</td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                <button
                  className="inspection-btn view-btn"
                  onClick={() => handleViewTransformerInspections(t)}
                >
                  View
                </button>
                <button
                  className="inspection-btn delete-btn"
                  style={{ marginLeft: "5px" }}
                  onClick={() => t.inspections.forEach(i => handleDeleteInspection(i.id))}
                >
                  Delete All
                </button>
              </td>
            </tr>
          ))}
          {transformerRows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: "10px" }}>
                No transformers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
