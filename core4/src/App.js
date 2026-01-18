import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Tabs from "./components/Tabs";
import TransformerList from "./components/TransformerList"; import TransformerModal from "./components/TransformerModal"; import InspectionList from "./components/InspectionList"; import InspectionModal from "./components/InspectionModal"; import InspectionViewModal from "./components/InspectionViewModal"; import TransformerInspectionsPage from "./components/TransformerInspectionsPage";
import SettingsPage from "./components/SettingsPage";

import "./App.css";

const API_URL = "http://localhost:8000/api";

function App() {
  const [activePage, setActivePage] = useState("page1");
  const [activeTab, setActiveTab] = useState("details");

  const [transformers, setTransformers] = useState([]);
  const [filteredTransformers, setFilteredTransformers] = useState([]);
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [showTransformerModal, setShowTransformerModal] = useState(false);
  const [transformerForm, setTransformerForm] = useState({
    id: null,
    number: "",
    pole: "",
    region: "",
    type: "Bulk",
    baselineImage: null,
    baselineUploadDate: null,
    weather: "",
    location: "",
  });
  const [searchFieldDetails, setSearchFieldDetails] = useState("number");
  const [searchQueryDetails, setSearchQueryDetails] = useState("");

  const [inspections, setInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [showViewInspectionModal, setShowViewInspectionModal] = useState(false);
  const [viewInspectionData, setViewInspectionData] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({
    transformer: "",
    date: "",
    inspector: "",
    notes: "",
    maintenanceImage: null,
    maintenanceUploadDate: null,
    maintenanceWeather: "Sunny",
  });
  const [searchFieldInspection, setSearchFieldInspection] = useState("");
  const [searchQueryInspection, setSearchQueryInspection] = useState("");

  const [showTransformerInspectionsPage, setShowTransformerInspectionsPage] = useState(false);
  const [selectedTransformerForPage, setSelectedTransformerForPage] = useState(null);

  // --- Load all data from backend on startup ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transformersRes, inspectionsRes] = await Promise.all([
          fetch(`${API_URL}/transformers`),
          fetch(`${API_URL}/inspections`),
        ]);
        const transformersData = await transformersRes.json();
        const inspectionsData = await inspectionsRes.json();
        setTransformers(transformersData);
        setInspections(inspectionsData);
      } catch (error) {
        console.error("Failed to fetch data from backend:", error);
        alert("Could not connect to the backend. Please ensure it is running.");
      }
    };
    fetchData();
  }, []);


  // --- Filtering ---
  useEffect(() => {
    setFilteredTransformers(
      transformers.filter(t => {
        if (!searchQueryDetails) return true;
        const value = t[searchFieldDetails]?.toString().toLowerCase() || "";
        return value.includes(searchQueryDetails.toLowerCase());
      })
    );
  }, [searchQueryDetails, searchFieldDetails, transformers]);

  useEffect(() => {
    setFilteredInspections(
      inspections.filter(i => {
        if (!searchQueryInspection) return true;
        const value =
          searchFieldInspection === "transformer"
            ? transformers.find(t => t.id === i.transformer)?.number?.toString().toLowerCase() || ""
            : i[searchFieldInspection]?.toString().toLowerCase() || "";
        return value.includes(searchQueryInspection.toLowerCase());
      })
    );
  }, [searchQueryInspection, searchFieldInspection, inspections, transformers]);

  // --- Transformer handlers ---
  const handleTransformerChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "baselineImage" && files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setTransformerForm({
        ...transformerForm,
        baselineImage: reader.result,
        baselineUploadDate: new Date().toLocaleString(),
      });
      reader.readAsDataURL(files[0]);
    } else { setTransformerForm({ ...transformerForm, [name]: value }); }
  };

  const openTransformerModal = (t = null) => {
    if (t) setTransformerForm({ ...t });
    else setTransformerForm({ id: null, number: "", pole: "", region: "", type: "Bulk", baselineImage: null, baselineUploadDate: null, weather: "", location: "" });
    setShowTransformerModal(true);
  };

  const handleAddTransformer = async () => {
    try {
      const response = await fetch(`${API_URL}/transformers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformerForm),
      });
      const savedTransformer = await response.json();
      setTransformers(prev => {
        const exists = prev.some(t => t.id === savedTransformer.id);
        if (exists) {
          return prev.map(t => t.id === savedTransformer.id ? savedTransformer : t);
        } else {
          return [...prev, savedTransformer];
        }
      });
      setShowTransformerModal(false);
    } catch (error) {
      console.error("Failed to save transformer:", error);
    }
  };

  const handleDeleteTransformer = async (transformerId) => {
    try {
      const response = await fetch(`${API_URL}/transformers/${transformerId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTransformers(prev => prev.filter(t => t.id !== transformerId));
      }
    } catch (error) {
      console.error("Failed to delete transformer:", error);
    }
  };

  // --- Inspection handlers ---
  const handleInspectionChange = (e) => { setInspectionForm({ ...inspectionForm, [e.target.name]: e.target.value }); };

  const handleScheduleInspection = async () => {
    if (!inspectionForm.transformer || !inspectionForm.date || !inspectionForm.inspector) {
      alert("Please select a transformer, and fill in both the Date and Inspector fields.");
      return;
    }

    const transformerId = parseInt(inspectionForm.transformer, 10);
    const newInspectionData = {
      ...inspectionForm,
      transformer: transformerId,
      progressStatus: { thermalUpload: "Pending", aiAnalysis: "Pending", review: "Pending" },
    };

    try {
      const response = await fetch(`${API_URL}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInspectionData),
      });
      const savedInspection = await response.json();
      setInspections(prev => [...prev, savedInspection]);
      setShowAddInspectionModal(false);
      setInspectionForm({ transformer: "", date: "", inspector: "", notes: "", maintenanceImage: null, maintenanceUploadDate: null, maintenanceWeather: "Sunny" });
    } catch (error) {
      console.error("Failed to schedule inspection:", error);
    }
  };

  const handleDeleteInspection = async (inspectionId) => {
    try {
      const response = await fetch(`${API_URL}/inspections/${inspectionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setInspections(prev => prev.filter(i => i.id !== inspectionId));
      }
    } catch (error) {
      console.error("Failed to delete inspection:", error);
    }
  };

  const handleViewInspection = (inspection) => { setViewInspectionData(inspection); setShowViewInspectionModal(true); };
  const handleUpdateInspection = async (updatedInspection) => {
    await fetch(`${API_URL}/inspections/${updatedInspection.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedInspection) });
    setInspections(inspections.map(i => (i.id === updatedInspection.id ? updatedInspection : i)));
  };
  const handleUpdateTransformer = async (updatedTransformer) => {
    await fetch(`${API_URL}/transformers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedTransformer) });
    setTransformers(prev => prev.map(t => (t.id === updatedTransformer.id ? updatedTransformer : t)));
  };

  // --- Full-page inspection handlers ---
  const handleOpenTransformerInspectionsPage = (transformer) => { setSelectedTransformerForPage(transformer); setShowTransformerInspectionsPage(true); };
  const handleBackToMain = () => { setSelectedTransformerForPage(null); setShowTransformerInspectionsPage(false); };
  
  return (
    <div className="app">
      <Sidebar setActivePage={setActivePage} />
      <div className="content">
        {activePage === "page2" ? (
          <SettingsPage />
        ) : showTransformerInspectionsPage && selectedTransformerForPage ? (
          <TransformerInspectionsPage
            transformer={selectedTransformerForPage}
            inspections={inspections.filter(i => i.transformer === selectedTransformerForPage.id)}
            setInspections={setInspections}
            setFilteredInspections={setFilteredInspections}
            transformers={transformers}
            onBack={handleBackToMain}
            onViewInspection={handleViewInspection}
            deleteInspection={handleDeleteInspection}
          />
        ) : (
          <>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === "details" && (
              <TransformerList
                transformers={transformers}
                filteredTransformers={filteredTransformers}
                setTransformers={setTransformers}
                deleteTransformer={handleDeleteTransformer}
                selectedTransformer={selectedTransformer}
                setSelectedTransformer={setSelectedTransformer}
                searchFieldDetails={searchFieldDetails}
                setSearchFieldDetails={setSearchFieldDetails}
                searchQueryDetails={searchQueryDetails}
                setSearchQueryDetails={setSearchQueryDetails}
                setShowModal={openTransformerModal}
                onViewInspections={handleOpenTransformerInspectionsPage}
              />
            )}
            {activeTab === "inspection" && (
              <InspectionList
                filteredInspections={filteredInspections}
                transformers={transformers}
                inspections={inspections}
                setInspections={setInspections}
                setFilteredInspections={setFilteredInspections}
                searchFieldInspection={searchFieldInspection}
                setSearchFieldInspection={setSearchFieldInspection}
                searchQueryInspection={searchQueryInspection}
                setSearchQueryInspection={setSearchQueryInspection}
                openAddInspectionModal={() => setShowAddInspectionModal(true)}
                onViewInspections={handleOpenTransformerInspectionsPage}
                deleteInspection={handleDeleteInspection}
              />
            )}
          </>
        )}
      </div>

      {showTransformerModal && (
        <TransformerModal
          formData={transformerForm}
          handleInputChange={handleTransformerChange}
          handleAddTransformer={handleAddTransformer}
          onClose={() => setShowTransformerModal(false)}
        />
      )}

      {showAddInspectionModal && !showTransformerInspectionsPage && (
        <InspectionModal
          transformers={transformers}
          inspectionForm={inspectionForm}
          handleInspectionChange={handleInspectionChange}
          handleScheduleInspection={handleScheduleInspection}
          onClose={() => setShowAddInspectionModal(false)}
          disableTransformerSelect={false}
        />
      )}

      {showViewInspectionModal && viewInspectionData && (
        <InspectionViewModal
          inspection={viewInspectionData}
          transformers={transformers}
          onClose={() => setShowViewInspectionModal(false)}
          updateInspection={handleUpdateInspection}
          updateTransformer={handleUpdateTransformer}
        />
      )}
    </div>
  );
}

export default App;
