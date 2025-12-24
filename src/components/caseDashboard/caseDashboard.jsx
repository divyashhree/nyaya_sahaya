import React, { useState } from 'react';
import './caseDashboard.css';

const CaseDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [caseText, setCaseText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [strengthData, setStrengthData] = useState(null);
  const [precedents, setPrecedents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

// Add this improved parseAIResponse function at the top of your component
const parseAIResponse = (text) => {
  console.log('🔍 Parsing AI Response:', text);
  console.log('🔍 Response Type:', typeof text);
  
  // If it's already an object, return it
  if (typeof text === 'object' && text !== null) {
    console.log('✅ Already an object:', text);
    return text;
  }
  
  try {
    // Convert to string if needed
    const str = String(text);
    
    // Extract JSON from markdown code blocks
    const jsonMatch = str.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      console.log('📦 Found JSON in code block');
      const parsed = JSON.parse(jsonMatch[1]);
      console.log('✅ Parsed from code block:', parsed);
      return parsed;
    }
    
    // Try direct parsing
    const parsed = JSON.parse(str);
    console.log('✅ Direct parse success:', parsed);
    return parsed;
  } catch (e) {
    console.error('❌ Parse failed:', e);
    console.error('❌ Raw text:', text);
    return null;
  }
};

// Replace your handleCaseUpload function with this one that has better logging
const handleCaseUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log('📤 Starting upload:', file.name);
  setLoading(true);
  setUploadProgress(20);

  try {
    const text = await file.text();
    setCaseText(text);
    setUploadProgress(40);
    console.log('📄 File text extracted, length:', text.length);

    // ANALYZE CASE
    console.log('🔄 Calling /api/analyze-case...');
    const analysisRes = await fetch('http://localhost:8000/api/analyze-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_text: text })
    });
    
    console.log('📊 Analysis response status:', analysisRes.status);
    const analysisData = await analysisRes.json();
    console.log('📊 Analysis raw data:', analysisData);
    
    const parsedAnalysis = parseAIResponse(analysisData.analysis);
    console.log('📊 Parsed analysis:', parsedAnalysis);
    
    setAnalysis(parsedAnalysis || { raw: true, error: 'Parse failed' });
    setUploadProgress(60);

    // CALCULATE RISK
    console.log('🔄 Calling /api/calculate-risk...');
    const riskRes = await fetch('http://localhost:8000/api/calculate-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        case_details: parsedAnalysis || {},
        evidence: evidence 
      })
    });
    
    console.log('⚠️ Risk response status:', riskRes.status);
    const riskResData = await riskRes.json();
    console.log('⚠️ Risk raw data:', riskResData);
    console.log('⚠️ Risk analysis field:', riskResData.risk_analysis);
    console.log('⚠️ Risk analysis type:', typeof riskResData.risk_analysis);
    
    const parsedRisk = parseAIResponse(riskResData.risk_analysis);
    console.log('⚠️ Parsed risk:', parsedRisk);
    
    setRiskData(parsedRisk);
    setUploadProgress(80);

    // CALCULATE STRENGTH
    console.log('🔄 Calling /api/case-strength...');
    const strengthRes = await fetch('http://localhost:8000/api/case-strength', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        case_info: parsedAnalysis || {},
        evidence: evidence 
      })
    });
    
    console.log('💪 Strength response status:', strengthRes.status);
    const strengthResData = await strengthRes.json();
    console.log('💪 Strength raw data:', strengthResData);
    
    const parsedStrength = parseAIResponse(strengthResData.strength_analysis);
    console.log('💪 Parsed strength:', parsedStrength);
    
    setStrengthData(parsedStrength);
    setUploadProgress(90);

    // FIND PRECEDENTS
    if (parsedAnalysis) {
      console.log('🔄 Calling /api/find-precedents...');
      const precedentRes = await fetch('http://localhost:8000/api/find-precedents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          case_description: parsedAnalysis.key_facts?.join(' ') || text.slice(0, 500),
          case_type: parsedAnalysis.case_type || 'General'
        })
      });
      
      console.log('🔍 Precedent response status:', precedentRes.status);
      const precedentData = await precedentRes.json();
      console.log('🔍 Precedent raw data:', precedentData);
      
      const parsedPrecedents = parseAIResponse(precedentData.precedents);
      console.log('🔍 Parsed precedents:', parsedPrecedents);
      
      setPrecedents(Array.isArray(parsedPrecedents) ? parsedPrecedents : []);
    }

    // GENERATE TIMELINE
    console.log('🔄 Calling /api/generate-timeline...');
    const timelineRes = await fetch('http://localhost:8000/api/generate-timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        case_type: parsedAnalysis?.case_type || 'Criminal',
        jurisdiction: parsedAnalysis?.jurisdiction || 'District Court',
        filing_date: new Date().toISOString().split('T')[0]
      })
    });
    
    console.log('📅 Timeline response status:', timelineRes.status);
    const timelineData = await timelineRes.json();
    console.log('📅 Timeline raw data:', timelineData);
    
    const parsedTimeline = parseAIResponse(timelineData.timeline);
    console.log('📅 Parsed timeline:', parsedTimeline);
    
    setTimeline(Array.isArray(parsedTimeline) ? parsedTimeline : []);

    setUploadProgress(100);
    setActiveTab('overview');
    
    console.log('✅ ALL DONE!');
   console.log('Final state:', {
  analysis: parsedAnalysis,
  risk: parsedRisk,
  strength: parsedStrength,
  precedents: Array.isArray(parsedPrecedents) ? parsedPrecedents : precedents,  // ✅ Fixed
  timeline: parsedTimeline
});
    
  } catch (error) {
    console.error('❌ Error analyzing case:', error);
    console.error('❌ Error stack:', error.stack);
    alert('Error analyzing case. Check console for details.');
  } finally {
    setLoading(false);
    setTimeout(() => setUploadProgress(0), 1000);
  }
};

const handleEvidenceUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log('📎 Uploading evidence:', file.name);
  setLoading(true);
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('http://localhost:8000/api/upload-evidence', {
      method: 'POST',
      body: formData
    });
    
    console.log('📎 Evidence response status:', res.status);
    const data = await res.json();
    console.log('📎 Evidence data:', data);
    
    if (data.success) {
      const newEvidence = {
        filename: data.filename,
        analysis: data.analysis,
        uploadDate: new Date().toISOString()
      };
      
      console.log('✅ Adding evidence:', newEvidence);
      setEvidence([...evidence, newEvidence]);
      alert('Evidence uploaded successfully! ✅');
    } else {
      alert('Evidence upload failed ❌');
    }
  } catch (error) {
    console.error('❌ Error uploading evidence:', error);
    alert('Error uploading evidence. Check console.');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="dashboard-wrapper">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyzing with AI...</p>
          {uploadProgress > 0 && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="title-icon">📊</span>
          Case Intelligence Dashboard
        </h1>
        <p className="dashboard-subtitle">AI-Powered Legal Analysis & Insights</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <span className="tab-icon"></span>
          Upload Case
        </button>
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          disabled={!analysis}
        >
          <span className="tab-icon"></span>
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
          disabled={!riskData}
        >
          <span className="tab-icon"></span>
          Risk Analysis
        </button>
        <button 
          className={`tab-btn ${activeTab === 'strength' ? 'active' : ''}`}
          onClick={() => setActiveTab('strength')}
          disabled={!strengthData}
        >
          <span className="tab-icon"></span>
          Case Strength
        </button>
        <button 
          className={`tab-btn ${activeTab === 'precedents' ? 'active' : ''}`}
          onClick={() => setActiveTab('precedents')}
          disabled={precedents.length === 0}
        >
          <span className="tab-icon"></span>
          Precedents
        </button>
        <button 
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
          disabled={timeline.length === 0}
        >
          <span className="tab-icon"></span>
          Timeline
        </button>
        <button 
          className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          <span className="tab-icon">📎</span>
          Evidence ({evidence.length})
        </button>
      </div>

      <div className="dashboard-content">
        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="upload-section">
            <div className="upload-card">
              <div className="upload-icon">📄</div>
              <h2>Upload Case Document</h2>
              <p>Upload FIR, complaint, petition, or any legal document for AI analysis</p>
              <input 
                type="file" 
                id="case-upload" 
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleCaseUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="case-upload" className="upload-btn">
                Choose File
              </label>
              <div className="upload-formats">
                Supported: PDF, TXT, DOC, DOCX
              </div>
            </div>

            {caseText && (
              <div className="text-preview">
                <h3>Document Preview</h3>
                <div className="preview-content">
                  {caseText.slice(0, 500)}...
                </div>
              </div>
            )}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && analysis && (
          <div className="overview-section">
            <div className="info-grid">
              <div className="info-card">
                <div className="info-label">Case Type</div>
                <div className="info-value">{analysis.case_type || 'N/A'}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Jurisdiction</div>
                <div className="info-value">{analysis.jurisdiction || 'N/A'}</div>
              </div>
              <div className="info-card">
                <div className="info-label">Complexity Score</div>
                <div className="info-value">{analysis.complexity_score || 'N/A'}/100</div>
              </div>
              <div className="info-card">
                <div className="info-label">Sections</div>
                <div className="info-value">
                  {analysis.sections?.length || 0} sections
                </div>
              </div>
            </div>

            {analysis.sections && analysis.sections.length > 0 && (
              <div className="detail-card">
                <h3>📜 Applicable Sections</h3>
                <div className="sections-list">
                  {analysis.sections.map((section, i) => (
                    <span key={i} className="section-badge">{section}</span>
                  ))}
                </div>
              </div>
            )}

            {analysis.parties && (
              <div className="detail-card">
                <h3>👥 Parties Involved</h3>
                <div className="parties-grid">
                  <div className="party">
                    <strong>Petitioner:</strong> {analysis.parties.petitioner || 'N/A'}
                  </div>
                  <div className="party">
                    <strong>Respondent:</strong> {analysis.parties.respondent || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {analysis.key_facts && analysis.key_facts.length > 0 && (
              <div className="detail-card">
                <h3>🔑 Key Facts</h3>
                <ul className="facts-list">
                  {analysis.key_facts.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.legal_issues && analysis.legal_issues.length > 0 && (
              <div className="detail-card">
                <h3>⚖️ Legal Issues</h3>
                <ul className="issues-list">
                  {analysis.legal_issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* RISK ANALYSIS TAB */}
        {activeTab === 'risk' && riskData && (
          <div className="risk-section">
            <div className="risk-overview">
              <div className={`risk-badge risk-${riskData.overall_risk?.toLowerCase()}`}>
                {riskData.overall_risk || 'Unknown'} Risk
              </div>
              <p className="risk-explanation">{riskData.risk_explanation}</p>
            </div>

            <div className="risk-meters">
              <div className="risk-meter">
                <div className="meter-header">
                  <span>⚖️ Legal Penalty Probability</span>
                  <span className="meter-value">{riskData.legal_penalty_probability || 0}%</span>
                </div>
                <div className="meter-bar">
                  <div 
                    className="meter-fill penalty"
                    style={{ width: `${riskData.legal_penalty_probability || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="risk-meter">
                <div className="meter-header">
                  <span>💰 Financial Risk</span>
                  <span className="meter-value">{riskData.financial_risk || 0}%</span>
                </div>
                <div className="meter-bar">
                  <div 
                    className="meter-fill financial"
                    style={{ width: `${riskData.financial_risk || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="risk-meter">
                <div className="meter-header">
                  <span>⏰ Urgency Level</span>
                  <span className="meter-value">{riskData.urgency_level || 0}%</span>
                </div>
                <div className="meter-bar">
                  <div 
                    className="meter-fill urgency"
                    style={{ width: `${riskData.urgency_level || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE STRENGTH TAB */}
        {activeTab === 'strength' && strengthData && (
          <div className="strength-section">
            <div className="strength-score-card">
              <div className="score-circle">
                <svg viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" className="score-bg"></circle>
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="90" 
                    className="score-progress"
                    style={{
                      strokeDasharray: `${(strengthData.strength_score || 0) * 5.65} 565`
                    }}
                  ></circle>
                </svg>
                <div className="score-text">
                  <div className="score-number">{strengthData.strength_score || 0}</div>
                  <div className="score-label">Strength Score</div>
                </div>
              </div>
              <div className="win-probability">
                🎯 Win Probability: <strong>{strengthData.win_probability || 0}%</strong>
              </div>
            </div>

            <div className="strength-details">
              {strengthData.strengths && strengthData.strengths.length > 0 && (
                <div className="strength-card positive">
                  <h3>✅ Strengths</h3>
                  <ul>
                    {strengthData.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {strengthData.weaknesses && strengthData.weaknesses.length > 0 && (
                <div className="strength-card negative">
                  <h3>⚠️ Weaknesses</h3>
                  <ul>
                    {strengthData.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {strengthData.missing_evidence && strengthData.missing_evidence.length > 0 && (
                <div className="strength-card warning">
                  <h3>📋 Missing Evidence</h3>
                  <ul>
                    {strengthData.missing_evidence.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {strengthData.recommendations && strengthData.recommendations.length > 0 && (
                <div className="strength-card info">
                  <h3>💡 Recommendations</h3>
                  <ul>
                    {strengthData.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRECEDENTS TAB */}
        {activeTab === 'precedents' && (
          <div className="precedents-section">
            {precedents.length > 0 ? (
              <div className="precedents-grid">
                {precedents.map((precedent, i) => (
                  <div key={i} className="precedent-card">
                    <div className="precedent-header">
                      <h3>{precedent.title || 'Case ' + (i + 1)}</h3>
                      <div className="similarity-badge">
                        {precedent.similarity || 0}% Similar
                      </div>
                    </div>
                    <div className="precedent-citation">{precedent.citation || 'N/A'}</div>
                    <div className="precedent-verdict">
                      <strong>Verdict:</strong> {precedent.verdict || 'N/A'}
                    </div>
                    <div className="precedent-reasoning">
                      <strong>Reasoning:</strong>
                      <p>{precedent.reasoning || 'N/A'}</p>
                    </div>
                    <div className="precedent-relevance">
                      <strong>Relevance:</strong>
                      <p>{precedent.relevance || 'N/A'}</p>
                    </div>
                    <div className="precedent-takeaway">
                      💡 <strong>Key Takeaway:</strong> {precedent.keyTakeaway || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Precedents Found</h3>
                <p>Upload a case document to find similar precedents</p>
              </div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="timeline-section">
            {timeline.length > 0 ? (
              <div className="timeline-container">
                {timeline.map((milestone, i) => (
                  <div key={i} className={`timeline-item ${milestone.status?.toLowerCase()}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-date">{milestone.date || 'TBD'}</div>
                      <div className="timeline-stage">{milestone.stage || 'Stage ' + (i + 1)}</div>
                      <div className="timeline-description">{milestone.description || ''}</div>
                      <div className="timeline-duration">
                        Expected: {milestone.expected_duration || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Timeline Generated</h3>
                <p>Upload a case document to generate timeline</p>
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="evidence-section">
            <div className="evidence-upload-card">
              <h3>Upload Evidence</h3>
              <p>Add supporting documents, FIRs, statements, or agreements</p>
              <input 
                type="file" 
                id="evidence-upload"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleEvidenceUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="evidence-upload" className="upload-btn">
                Add Evidence
              </label>
            </div>

            {evidence.length > 0 ? (
              <div className="evidence-list">
                {evidence.map((item, i) => (
                  <div key={i} className="evidence-item">
                    <div className="evidence-header">
                      <span className="evidence-icon">📎</span>
                      <span className="evidence-name">{item.filename}</span>
                      <span className={`evidence-impact ${item.analysis?.impact?.toLowerCase()}`}>
                        {item.analysis?.impact || 'Unknown'} Impact
                      </span>
                    </div>
                    {item.analysis && (
                      <>
                        <div className="evidence-type">
                          Type: {item.analysis.document_type || 'N/A'}
                        </div>
                        <div className="evidence-weight">
                          Weight: {item.analysis.weight || 0}/100
                        </div>
                        <div className="evidence-summary">
                          {item.analysis.summary || 'No summary available'}
                        </div>
                        {item.analysis.key_points && item.analysis.key_points.length > 0 && (
                          <div className="evidence-points">
                            <strong>Key Points:</strong>
                            <ul>
                              {item.analysis.key_points.map((point, j) => (
                                <li key={j}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📎</div>
                <h3>No Evidence Uploaded</h3>
                <p>Upload evidence documents to strengthen your case analysis</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDashboard;