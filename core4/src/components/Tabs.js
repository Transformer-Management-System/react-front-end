import React from "react";
import "../style/Tabs.css";

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="tabs-container">
      <h2 className="tabs-title">Dashboard</h2>
      <div className="tabs-button-row">
        <button
          onClick={() => setActiveTab("details")}
          className={`tab-button ${activeTab === "details" ? "active" : ""}`}
        >
          Transformers
        </button>
        <button
          onClick={() => setActiveTab("inspection")}
          className={`tab-button ${activeTab === "inspection" ? "active" : ""}`}
        >
          Inspection
        </button>
      </div>
    </div>
  );
}
