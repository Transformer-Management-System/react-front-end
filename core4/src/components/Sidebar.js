import React from "react";
import corefourLogo from "../assets/corefour.jpg";
import "../style/Sidebar.css"

export default function Sidebar({ setActivePage }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={corefourLogo} alt="CoreFour Logo" />
        <h2>CoreFour</h2>
      </div>

      <button onClick={() => setActivePage("page1")}>Transformers</button>
      <button onClick={() => setActivePage("page2")}>Settings</button>
    </div>
  );
}
