import React, { useState } from "react";
import "../style/SettingsPage.css";

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  
  const downloadFile = (filename, content, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAnnotationLogsJSON = async () => {
    setIsExporting(true);
    setExportStatus(null);
    try {
      const response = await fetch('http://localhost:8000/api/annotation-logs/export/json');
      if (!response.ok) {
        throw new Error('Failed to export annotation logs');
      }
      const jsonData = await response.text();
      downloadFile('annotation_logs.json', jsonData, 'application/json');
      setExportStatus({ type: 'success', message: 'JSON export completed successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus({ type: 'error', message: 'Export failed. Please ensure the backend is running.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAnnotationLogsCSV = async () => {
    setIsExporting(true);
    setExportStatus(null);
    try {
      const response = await fetch('http://localhost:8000/api/annotation-logs/export/csv');
      if (!response.ok) {
        throw new Error('Failed to export annotation logs');
      }
      const csvData = await response.text();
      downloadFile('annotation_logs.csv', csvData, 'text/csv');
      setExportStatus({ type: 'success', message: 'CSV export completed successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus({ type: 'error', message: 'Export failed. Please ensure the backend is running.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="settings-title">⚙️ Settings</h1>
        <p className="settings-subtitle">Manage your annotation data and export options</p>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">📊</div>
            <div className="card-title-section">
              <h3 className="card-title">Annotation Logs Export</h3>
              <p className="card-description">
                Export annotation feedback logs for model training and improvement. 
                Includes AI predictions, user modifications, and complete metadata.
              </p>
            </div>
          </div>

          <div className="card-content">
            <div className="export-options">
              <div className="export-option">
                <div className="export-option-info">
                  <div className="export-icon json-icon">{ }</div>
                  <div>
                    <h4>JSON Format</h4>
                    <p>Structured data format ideal for machine learning pipelines and programmatic access</p>
                  </div>
                </div>
                <button 
                  className="export-btn json-btn" 
                  onClick={handleExportAnnotationLogsJSON}
                  disabled={isExporting}
                >
                  <span className="btn-icon">⬇</span>
                  {isExporting ? 'Exporting...' : 'Export JSON'}
                </button>
              </div>

              <div className="export-option">
                <div className="export-option-info">
                  <div className="export-icon csv-icon">📈</div>
                  <div>
                    <h4>CSV Format</h4>
                    <p>Spreadsheet-compatible format perfect for data analysis in Excel or similar tools</p>
                  </div>
                </div>
                <button 
                  className="export-btn csv-btn" 
                  onClick={handleExportAnnotationLogsCSV}
                  disabled={isExporting}
                >
                  <span className="btn-icon">⬇</span>
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            </div>

            {exportStatus && (
              <div className={`status-message ${exportStatus.type}`}>
                <span className="status-icon">
                  {exportStatus.type === 'success' ? '✓' : '✗'}
                </span>
                {exportStatus.message}
              </div>
            )}
          </div>
        </div>

        <div className="settings-info-card">
          <h4>📝 Export Information</h4>
          <ul>
            <li><strong>Included Data:</strong> All annotation actions, timestamps, user IDs, and metadata</li>
            <li><strong>AI Predictions:</strong> Original AI detection results for comparison</li>
            <li><strong>User Modifications:</strong> Final human-verified annotations</li>
            <li><strong>Use Case:</strong> Model retraining, performance analysis, and quality assurance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
