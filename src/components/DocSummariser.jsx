import React, { useState } from 'react';
import './DocSummariser.css';

const DocSummariser = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Connect to backend API for PDF summarisation
  const handleSummarise = async () => {
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }
    setError('');
    setSummary('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8000/api/summarise-pdf', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to summarise document.');
      }
      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        setError('No summary returned from backend.');
      }
    } catch (err) {
      setError('Failed to summarise document.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSummary('');
    setError('');
  };

  return (
    <div className="summariser-wrapper">
      <div className="summariser-card">
        <div className="summariser-title">Legal Document Summariser</div>
        <div className="summariser-upload">
          <input
            type="file"
            accept="application/pdf"
            className="summariser-input"
            onChange={handleFileChange}
          />
          <button className="summariser-btn" onClick={handleSummarise} disabled={loading}>
            {loading ? 'Summarising...' : 'Summarise PDF'}
          </button>
        </div>
        {error && <div className="summariser-loading" style={{ color: '#d32f2f' }}>{error}</div>}
        {loading && !error && <div className="summariser-loading">Analysing legal document...</div>}
        {summary && (
          <div className="summariser-summary">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocSummariser;
