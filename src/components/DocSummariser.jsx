import React, { useState } from 'react';
import './DocSummariser.css';

const DocSummariser = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Format markdown text to JSX
  const formatMarkdown = (text) => {
    if (!text) return null;
    
    // Split by lines
    const lines = text.split('\n');
    
    return lines.map((line, idx) => {
      // Handle bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formatted = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      
      return <div key={idx}>{formatted}</div>;
    });
  };

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
      const response = await fetch('http://localhost:8001/api/summarise-pdf', {
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
            {formatMarkdown(summary)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocSummariser;
