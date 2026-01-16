import React, { useState, useEffect } from 'react';
import './caseDashboard.css';
import html2pdf from 'html2pdf.js';
import toast, { Toaster } from 'react-hot-toast';

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
  const [caseHistory, setCaseHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDeadlineCalc, setShowDeadlineCalc] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [caseNotes, setCaseNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [bookmarked, setBookmarked] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonCase, setComparisonCase] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [showLegalDict, setShowLegalDict] = useState(false);
  const [legalTerm, setLegalTerm] = useState('');

  // Load case history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('caseHistory');
    if (saved) {
      setCaseHistory(JSON.parse(saved));
    }
    const savedNotes = localStorage.getItem(`notes_${caseName}`);
    if (savedNotes) {
      setCaseNotes(savedNotes);
    }
    const savedBookmarks = localStorage.getItem('bookmarked');
    if (savedBookmarks) {
      setBookmarked(JSON.parse(savedBookmarks));
    }
  }, [caseName]);

  // Load case history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('caseHistory');
    if (saved) {
      setCaseHistory(JSON.parse(saved));
    }
  }, []);

  // Save case to history
  const saveCaseToHistory = (caseData) => {
    const newCase = {
      id: Date.now(),
      name: caseName || 'Untitled Case',
      timestamp: new Date().toISOString(),
      analysis: caseData.analysis,
      risk: caseData.risk,
      strength: caseData.strength,
      precedents: caseData.precedents,
      timeline: caseData.timeline,
      caseText: caseText.slice(0, 500)
    };
    
    const updated = [newCase, ...caseHistory].slice(0, 10);
    setCaseHistory(updated);
    localStorage.setItem('caseHistory', JSON.stringify(updated));
    toast.success('Case saved to history!');
  };

  // Load case from history
  const loadFromHistory = (historyCase) => {
    setAnalysis(historyCase.analysis);
    setRiskData(historyCase.risk);
    setStrengthData(historyCase.strength);
    setPrecedents(historyCase.precedents || []);
    setTimeline(historyCase.timeline || []);
    setCaseText(historyCase.caseText);
    setCaseName(historyCase.name);
    setShowHistory(false);
    setActiveTab('overview');
    toast.success('Case loaded from history!');
  };

  // Delete from history
  const deleteFromHistory = (caseId) => {
    const updated = caseHistory.filter(c => c.id !== caseId);
    setCaseHistory(updated);
    localStorage.setItem('caseHistory', JSON.stringify(updated));
    toast.success('Case deleted from history');
  };

  // Export PDF
  const exportPDF = () => {
    toast.loading('Generating PDF report...');
    const element = document.getElementById('pdf-report-content');
    const opt = {
      margin: 0.5,
      filename: `${caseName || 'case-report'}-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      toast.dismiss();
      toast.success('PDF downloaded successfully!');
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Search within document
  useEffect(() => {
    if (searchQuery && caseText) {
      const lines = caseText.split('\n');
      const results = [];
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ line: index + 1, text: line });
        }
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, caseText]);

  // Auto-save notes
  useEffect(() => {
    if (caseNotes && caseName) {
      const debounce = setTimeout(() => {
        localStorage.setItem(`notes_${caseName}`, caseNotes);
        toast.success('Notes auto-saved', { duration: 1000 });
      }, 2000);
      return () => clearTimeout(debounce);
    }
  }, [caseNotes, caseName]);

  // Generate AI Summary
  const generateAISummary = () => {
    if (!analysis) return;
    
    const summary = `
📋 CASE SUMMARY: ${caseName || 'Untitled Case'}

📌 Case Type: ${analysis.case_type || 'N/A'}
⚖️ Jurisdiction: ${analysis.jurisdiction || 'N/A'}
📊 Complexity: ${analysis.complexity_score || 0}/100

🔑 KEY FACTS:
${analysis.key_facts?.map((f, i) => `${i + 1}. ${f}`).join('\n') || 'None'}

⚠️ RISK LEVEL: ${riskData?.overall_risk || 'Unknown'}
- Legal Penalty: ${riskData?.legal_penalty_probability || 0}%
- Financial Risk: ${riskData?.financial_risk || 0}%
- Urgency: ${riskData?.urgency_level || 0}%

💪 CASE STRENGTH: ${strengthData?.strength_score || 0}/100
🎯 Win Probability: ${strengthData?.win_probability || 0}%

📜 APPLICABLE SECTIONS:
${analysis.sections?.join(', ') || 'None'}

✅ TOP STRENGTHS:
${strengthData?.strengths?.slice(0, 3).map((s, i) => `${i + 1}. ${typeof s === 'string' ? s : s.aspect || s.description}`).join('\n') || 'None'}

⚠️ KEY WEAKNESSES:
${strengthData?.weaknesses?.slice(0, 3).map((w, i) => `${i + 1}. ${typeof w === 'string' ? w : w.aspect || w.description}`).join('\n') || 'None'}

💡 RECOMMENDATIONS:
${strengthData?.recommendations?.slice(0, 3).map((r, i) => `${i + 1}. ${typeof r === 'string' ? r : r.action}`).join('\n') || 'None'}
    `;
    
    setAiSummary(summary);
    toast.success('Summary generated!');
  };

  // Bookmark case
  const toggleBookmark = () => {
    const currentCase = {
      id: Date.now(),
      name: caseName,
      timestamp: new Date().toISOString(),
      analysis,
      risk: riskData,
      strength: strengthData
    };
    
    const isBookmarked = bookmarked.some(b => b.name === caseName);
    let updated;
    
    if (isBookmarked) {
      updated = bookmarked.filter(b => b.name !== caseName);
      toast.success('Bookmark removed');
    } else {
      updated = [...bookmarked, currentCase];
      toast.success('Case bookmarked!');
    }
    
    setBookmarked(updated);
    localStorage.setItem('bookmarked', JSON.stringify(updated));
  };

  // Legal Dictionary
  const legalTerms = {
    'petitioner': 'The person who files a petition in court seeking legal remedy',
    'respondent': 'The person against whom a petition is filed; the defendant in civil cases',
    'plaintiff': 'The party who initiates a lawsuit',
    'defendant': 'The party being sued or accused in a court case',
    'bail': 'Temporary release of an accused person awaiting trial, on condition of security',
    'cognizable': 'An offense for which police can arrest without warrant',
    'non-cognizable': 'An offense for which police cannot arrest without warrant',
    'ipc': 'Indian Penal Code - the main criminal code of India',
    'crpc': 'Code of Criminal Procedure - procedural law for criminal cases',
    'cpc': 'Code of Civil Procedure - procedural law for civil cases',
    'fir': 'First Information Report - initial report filed with police',
    'chargesheet': 'Formal document filed by police containing charges against accused',
    'summons': 'Official order requiring appearance in court',
    'warrant': 'Court order authorizing arrest or search',
    'injunction': 'Court order requiring a party to do or refrain from doing specific acts',
    'affidavit': 'Written statement confirmed by oath for use as evidence',
    'appeal': 'Request to higher court to review decision of lower court',
    'revision': 'Power of higher court to review proceedings of lower court',
    'anticipatory bail': 'Bail granted before arrest in anticipation of arrest',
    'quash': 'To set aside or nullify a legal proceeding',
    'suo moto': 'Action taken by court on its own initiative',
    'habeas corpus': 'Writ to produce a person before court to examine lawfulness of detention',
    'mandamus': 'Writ commanding performance of specific act',
    'certiorari': 'Writ to quash order of lower court or tribunal',
    'contempt': 'Disobedience or disrespect towards court',
    'pleading': 'Formal written statement in a lawsuit',
    'evidence': 'Information presented to prove or disprove facts',
    'testimony': 'Oral evidence given by witness under oath',
    'cross-examination': 'Questioning of witness by opposing party'
  };

  const lookupTerm = () => {
    const term = legalTerm.toLowerCase().trim();
    const definition = legalTerms[term];
    
    if (definition) {
      toast.success((t) => (
        <div style={{ maxWidth: '300px' }}>
          <strong>{term.toUpperCase()}</strong>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{definition}</p>
        </div>
      ), { duration: 6000 });
    } else {
      toast.error('Term not found in dictionary');
    }
  };

  // Generate case checklist
  const generateChecklist = () => {
    if (!analysis) return [];
    
    const caseType = analysis.case_type?.toLowerCase() || '';
    let checklist = [];
    
    if (caseType.includes('criminal')) {
      checklist = [
        'File FIR at police station',
        'Collect and preserve all evidence',
        'Get medical examination done if applicable',
        'Engage criminal lawyer',
        'Prepare list of witnesses',
        'Apply for bail if required',
        'Attend all court hearings',
        'File reply to chargesheet',
        'Prepare defense strategy'
      ];
    } else if (caseType.includes('civil')) {
      checklist = [
        'Draft and file plaint/petition',
        'Pay court fees',
        'Serve notice to defendant',
        'File affidavit with supporting documents',
        'Attend mediation/arbitration if ordered',
        'Prepare witness statements',
        'File written statement',
        'Attend all hearings',
        'Prepare for trial'
      ];
    } else {
      checklist = [
        'Gather all relevant documents',
        'Consult with lawyer',
        'Draft legal notice',
        'File appropriate petition',
        'Pay required fees',
        'Serve notice to opposing party',
        'Prepare evidence and witnesses',
        'Attend all hearings',
        'Follow court orders'
      ];
    }
    
    return checklist;
  };

  // Email report (opens mailto)
  const emailReport = () => {
    const subject = encodeURIComponent(`Legal Case Report: ${caseName || 'Untitled'}`);
    const body = encodeURIComponent(aiSummary || 'Please generate summary first');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Print view
  const printReport = () => {
    window.print();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + S = Save notes
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (caseNotes && caseName) {
          localStorage.setItem(`notes_${caseName}`, caseNotes);
          toast.success('Notes saved!');
        }
      }
      // Ctrl/Cmd + P = Print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printReport();
      }
      // Ctrl/Cmd + K = Quick actions
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickActions(!showQuickActions);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [caseNotes, caseName, showQuickActions]);

  // Deadline Calculator Component
  const DeadlineCalculator = () => {
    const [deadlineType, setDeadlineType] = useState('appeal');
    const [fromDate, setFromDate] = useState('');
    const [calculatedDate, setCalculatedDate] = useState('');

    const calculateDeadline = () => {
      if (!fromDate) return;
      
      const date = new Date(fromDate);
      const deadlines = {
        appeal: 30, // 30 days for appeal
        reply: 15,  // 15 days for reply
        rejoinder: 7, // 7 days for rejoinder
        civil_revision: 90, // 90 days for civil revision
        criminal_revision: 60, // 60 days for criminal revision
        limitation_contract: 1095, // 3 years
        limitation_tort: 1095 // 3 years
      };
      
      const days = deadlines[deadlineType] || 30;
      date.setDate(date.getDate() + days);
      setCalculatedDate(date.toISOString().split('T')[0]);
      toast.success(`Deadline calculated: ${date.toLocaleDateString()}`);
    };

    return (
      <div className="deadline-calculator">
        <h3>⏰ Deadline Calculator</h3>
        <div className="deadline-form">
          <div className="form-group">
            <label>From Date:</label>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Type:</label>
            <select value={deadlineType} onChange={(e) => setDeadlineType(e.target.value)}>
              <option value="appeal">Appeal (30 days)</option>
              <option value="reply">Reply to Notice (15 days)</option>
              <option value="rejoinder">Rejoinder (7 days)</option>
              <option value="civil_revision">Civil Revision (90 days)</option>
              <option value="criminal_revision">Criminal Revision (60 days)</option>
              <option value="limitation_contract">Limitation Period - Contract (3 years)</option>
              <option value="limitation_tort">Limitation Period - Tort (3 years)</option>
            </select>
          </div>
          <button className="calc-btn" onClick={calculateDeadline}>Calculate</button>
          {calculatedDate && (
            <div className="deadline-result">
              <strong>Deadline:</strong> {new Date(calculatedDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

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
    const analysisRes = await fetch('http://localhost:8001/api/analyze-case', {
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
    const riskRes = await fetch('http://localhost:8001/api/calculate-risk', {
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
    const strengthRes = await fetch('http://localhost:8001/api/case-strength', {
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
    let parsedPrecedents = [];
    if (parsedAnalysis) {
      console.log('🔄 Calling /api/find-precedents...');
      const precedentRes = await fetch('http://localhost:8001/api/find-precedents', {
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
      
      parsedPrecedents = parseAIResponse(precedentData.precedents);
      console.log('🔍 Parsed precedents:', parsedPrecedents);
      
      setPrecedents(Array.isArray(parsedPrecedents) ? parsedPrecedents : []);
    }

    // GENERATE TIMELINE
    console.log('🔄 Calling /api/generate-timeline...');
    const timelineRes = await fetch('http://localhost:8001/api/generate-timeline', {
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
    
    // Save to history
    saveCaseToHistory({
      analysis: parsedAnalysis,
      risk: parsedRisk,
      strength: parsedStrength,
      precedents: Array.isArray(parsedPrecedents) ? parsedPrecedents : [],
      timeline: parsedTimeline
    });
    
    setActiveTab('overview');
    toast.success('Case analysis completed!');
    
    console.log('✅ ALL DONE!');
    console.log('Final state:', {
      analysis: parsedAnalysis,
      risk: parsedRisk,
      strength: parsedStrength,
      precedents: Array.isArray(parsedPrecedents) ? parsedPrecedents : [],
      timeline: parsedTimeline
    });
    
  } catch (error) {
    console.error('❌ Error analyzing case:', error);
    console.error('❌ Error stack:', error.stack);
    toast.error('Error analyzing case. Please try again.');
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
    const res = await fetch('http://localhost:8001/api/upload-evidence', {
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
      toast.success('Evidence uploaded successfully!');
    } else {
      toast.error('Evidence upload failed');
    }
  } catch (error) {
    console.error('❌ Error uploading evidence:', error);
    toast.error('Error uploading evidence');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="dashboard-wrapper">
      <Toaster position="top-right" />
      
      {/* Case History Sidebar */}
      {showHistory && (
        <div className="history-sidebar">
          <div className="history-header">
            <h3>📚 Case History</h3>
            <button className="close-btn" onClick={() => setShowHistory(false)}>×</button>
          </div>
          <div className="history-list">
            {caseHistory.length > 0 ? (
              caseHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-header">
                    <strong>{item.name}</strong>
                    <button 
                      className="delete-history-btn"
                      onClick={() => deleteFromHistory(item.id)}
                    >×</button>
                  </div>
                  <div className="history-item-date">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                  <div className="history-item-preview">
                    {item.caseText?.slice(0, 80)}...
                  </div>
                  <button 
                    className="load-history-btn"
                    onClick={() => loadFromHistory(item)}
                  >Load Case</button>
                </div>
              ))
            ) : (
              <div className="empty-history">No case history yet</div>
            )}
          </div>
        </div>
      )}

      {/* Hidden PDF Report Content */}
      <div id="pdf-report-content" style={{ position: 'absolute', left: '-9999px', width: '800px' }}>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ textAlign: 'center', color: '#2563EB' }}>Legal Case Analysis Report</h1>
          <h2 style={{ textAlign: 'center' }}>{caseName || 'Untitled Case'}</h2>
          <p style={{ textAlign: 'center', color: '#666' }}>
            Generated on {new Date().toLocaleDateString()}
          </p>
          <hr />
          
          {analysis && (
            <>
              <h2>Case Overview</h2>
              <p><strong>Case Type:</strong> {analysis.case_type}</p>
              <p><strong>Jurisdiction:</strong> {analysis.jurisdiction}</p>
              <p><strong>Complexity Score:</strong> {analysis.complexity_score}/100</p>
              <h3>Applicable Sections</h3>
              <p>{analysis.sections?.join(', ')}</p>
              <h3>Key Facts</h3>
              <ul>
                {analysis.key_facts?.map((fact, i) => <li key={i}>{fact}</li>)}
              </ul>
            </>
          )}
          
          {riskData && (
            <>
              <h2>Risk Analysis</h2>
              <p><strong>Overall Risk:</strong> {riskData.overall_risk}</p>
              <p><strong>Legal Penalty Probability:</strong> {riskData.legal_penalty_probability}%</p>
              <p><strong>Financial Risk:</strong> {riskData.financial_risk}%</p>
              <p>{riskData.risk_explanation}</p>
            </>
          )}
          
          {strengthData && (
            <>
              <h2>Case Strength</h2>
              <p><strong>Strength Score:</strong> {strengthData.strength_score}/100</p>
              <p><strong>Win Probability:</strong> {strengthData.win_probability}%</p>
              <h3>Strengths</h3>
              <ul>
                {strengthData.strengths?.map((s, i) => (
                  <li key={i}>{typeof s === 'string' ? s : s.aspect || s.description}</li>
                ))}
              </ul>
              <h3>Weaknesses</h3>
              <ul>
                {strengthData.weaknesses?.map((w, i) => (
                  <li key={i}>{typeof w === 'string' ? w : w.aspect || w.description}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

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
        <div className="header-left">
          <h1 className="dashboard-title">
            <span className="title-icon">📊</span>
            Case Intelligence Dashboard
          </h1>
          <p className="dashboard-subtitle">AI-Powered Legal Analysis & Insights</p>
        </div>
        <div className="header-actions">
          <button className="action-btn" onClick={() => setShowQuickActions(!showQuickActions)} title="Quick Actions (Ctrl+K)">
            ⚡ Actions
          </button>
          <button className="action-btn" onClick={() => setShowHistory(!showHistory)} title="Case History">
            📚 History ({caseHistory.length})
          </button>
          <button className="action-btn" onClick={() => setShowDeadlineCalc(!showDeadlineCalc)} title="Deadline Calculator">
            ⏰ Deadlines
          </button>
          {analysis && (
            <>
              <button 
                className={`action-btn ${bookmarked.some(b => b.name === caseName) ? 'bookmarked' : ''}`}
                onClick={toggleBookmark}
                title="Bookmark Case"
              >
                {bookmarked.some(b => b.name === caseName) ? '⭐' : '☆'} Bookmark
              </button>
              <button className="action-btn primary" onClick={exportPDF} title="Export PDF">
                📄 Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="quick-actions-panel">
          <div className="quick-actions-header">
            <h3>⚡ Quick Actions</h3>
            <button className="close-btn" onClick={() => setShowQuickActions(false)}>×</button>
          </div>
          <div className="quick-actions-grid">
            <button className="quick-action-item" onClick={generateAISummary} disabled={!analysis}>
              <span className="qa-icon">📝</span>
              <span className="qa-label">Generate Summary</span>
              <span className="qa-hint">AI-powered</span>
            </button>
            <button className="quick-action-item" onClick={() => setShowNotes(!showNotes)}>
              <span className="qa-icon">📋</span>
              <span className="qa-label">Case Notes</span>
              <span className="qa-hint">Auto-save</span>
            </button>
            <button className="quick-action-item" onClick={() => setShowLegalDict(!showLegalDict)}>
              <span className="qa-icon">📖</span>
              <span className="qa-label">Legal Dictionary</span>
              <span className="qa-hint">30+ terms</span>
            </button>
            <button className="quick-action-item" onClick={emailReport} disabled={!aiSummary}>
              <span className="qa-icon">📧</span>
              <span className="qa-label">Email Report</span>
              <span className="qa-hint">Via mailto</span>
            </button>
            <button className="quick-action-item" onClick={printReport} disabled={!analysis}>
              <span className="qa-icon">🖨️</span>
              <span className="qa-label">Print</span>
              <span className="qa-hint">Ctrl+P</span>
            </button>
            <button className="quick-action-item" onClick={() => {
              const checklist = generateChecklist();
              toast((t) => (
                <div style={{ maxWidth: '400px' }}>
                  <h4 style={{ margin: '0 0 0.5rem' }}>✅ Case Checklist</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                    {checklist.map((item, i) => (
                      <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ), { duration: 10000 });
            }} disabled={!analysis}>
              <span className="qa-icon">✅</span>
              <span className="qa-label">Checklist</span>
              <span className="qa-hint">Based on case type</span>
            </button>
          </div>
          <div className="keyboard-shortcuts">
            <p><strong>Keyboard Shortcuts:</strong></p>
            <p>• Ctrl/Cmd + S = Save notes</p>
            <p>• Ctrl/Cmd + P = Print</p>
            <p>• Ctrl/Cmd + K = Quick actions</p>
          </div>
        </div>
      )}

      {/* Legal Dictionary Panel */}
      {showLegalDict && (
        <div className="legal-dict-panel">
          <div className="dict-header">
            <h3>📖 Legal Dictionary</h3>
            <button className="close-btn" onClick={() => setShowLegalDict(false)}>×</button>
          </div>
          <div className="dict-search">
            <input
              type="text"
              placeholder="Enter legal term (e.g., 'bail', 'fir', 'plaintiff')"
              value={legalTerm}
              onChange={(e) => setLegalTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && lookupTerm()}
            />
            <button onClick={lookupTerm}>🔍 Lookup</button>
          </div>
          <div className="popular-terms">
            <p><strong>Popular Terms:</strong></p>
            <div className="term-tags">
              {['bail', 'fir', 'ipc', 'plaintiff', 'defendant', 'warrant', 'injunction', 'appeal', 'cognizable', 'affidavit'].map(term => (
                <button 
                  key={term} 
                  className="term-tag"
                  onClick={() => { setLegalTerm(term); lookupTerm(); }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Case Notes Panel */}
      {showNotes && (
        <div className="notes-panel">
          <div className="notes-header">
            <h3>📋 Case Notes</h3>
            <div className="notes-actions">
              <button className="save-btn" onClick={() => {
                if (caseName && caseNotes) {
                  localStorage.setItem(`notes_${caseName}`, caseNotes);
                  toast.success('Notes saved!');
                }
              }}>💾 Save (Ctrl+S)</button>
              <button className="close-btn" onClick={() => setShowNotes(false)}>×</button>
            </div>
          </div>
          <textarea
            className="notes-textarea"
            placeholder="Add your notes here... (auto-saves every 2 seconds)"
            value={caseNotes}
            onChange={(e) => setCaseNotes(e.target.value)}
          />
          <div className="notes-footer">
            <span>{caseNotes.length} characters</span>
            <span>Auto-save enabled ✓</span>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {aiSummary && (
        <div className="summary-modal-overlay" onClick={() => setAiSummary('')}>
          <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="summary-header">
              <h3>📄 AI Generated Summary</h3>
              <div className="summary-actions">
                <button onClick={() => {
                  navigator.clipboard.writeText(aiSummary);
                  toast.success('Summary copied!');
                }}>📋 Copy</button>
                <button onClick={emailReport}>📧 Email</button>
                <button className="close-btn" onClick={() => setAiSummary('')}>×</button>
              </div>
            </div>
            <pre className="summary-content">{aiSummary}</pre>
          </div>
        </div>
      )}

      {showDeadlineCalc && (
        <div className="deadline-panel">
          <DeadlineCalculator />
        </div>
      )}

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
              
              <div className="case-name-input">
                <label>Case Name/Title:</label>
                <input 
                  type="text"
                  placeholder="Enter case name (e.g., ABC vs XYZ)"
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  className="case-name-field"
                />
              </div>
              
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
                <div className="preview-header">
                  <h3>Document Preview</h3>
                  <div className="search-box">
                    <input 
                      type="text"
                      placeholder="Search in document..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    {searchResults.length > 0 && (
                      <span className="search-count">{searchResults.length} results</span>
                    )}
                  </div>
                </div>
                <div className="preview-content">
                  {searchResults.length > 0 ? (
                    <div className="search-results">
                      {searchResults.slice(0, 10).map((result, i) => (
                        <div key={i} className="search-result-item">
                          <span className="line-num">Line {result.line}:</span>
                          <span className="line-text">{result.text}</span>
                        </div>
                      ))}
                      {searchResults.length > 10 && (
                        <div className="more-results">+ {searchResults.length - 10} more results</div>
                      )}
                    </div>
                  ) : (
                    <>
                      {caseText.slice(0, 500)}...
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && analysis && (
          <div className="overview-section">
            {/* Animated Stats Cards */}
            <div className="stats-showcase">
              <div className="stat-card stat-primary">
                <div className="stat-icon">⚖️</div>
                <div className="stat-content">
                  <div className="stat-value">{analysis.case_type || 'N/A'}</div>
                  <div className="stat-label">Case Type</div>
                </div>
                <div className="stat-sparkle"></div>
              </div>
              
              <div className="stat-card stat-secondary">
                <div className="stat-icon">🏛️</div>
                <div className="stat-content">
                  <div className="stat-value">{analysis.jurisdiction || 'N/A'}</div>
                  <div className="stat-label">Jurisdiction</div>
                </div>
                <div className="stat-sparkle"></div>
              </div>
              
              <div className="stat-card stat-accent">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{analysis.complexity_score || 0}</div>
                  <div className="stat-label">Complexity Score</div>
                  <div className="mini-progress">
                    <div className="mini-progress-fill" style={{ width: `${analysis.complexity_score || 0}%` }}></div>
                  </div>
                </div>
                <div className="stat-sparkle"></div>
              </div>
              
              <div className="stat-card stat-success">
                <div className="stat-icon">📜</div>
                <div className="stat-content">
                  <div className="stat-value">{analysis.sections?.length || 0}</div>
                  <div className="stat-label">Legal Sections</div>
                </div>
                <div className="stat-sparkle"></div>
              </div>
            </div>

            {analysis.sections && analysis.sections.length > 0 && (
              <div className="detail-card">
                <div className="card-header-with-copy">
                  <h3>📜 Applicable Sections</h3>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(analysis.sections.join(', '), 'Sections')}
                    title="Copy sections"
                  >
                    📋 Copy
                  </button>
                </div>
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
                <div className="card-header-with-copy">
                  <h3>🔑 Key Facts</h3>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(analysis.key_facts.join('\n'), 'Key Facts')}
                    title="Copy key facts"
                  >
                    📋 Copy
                  </button>
                </div>
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
            <div className="risk-overview-enhanced">
              <div className="risk-score-circle">
                <svg viewBox="0 0 200 200" className="risk-chart">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(147, 51, 234, 0.1)" strokeWidth="20"/>
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="80" 
                    fill="none"
                    stroke={
                      riskData.overall_risk?.toLowerCase() === 'high' || riskData.overall_risk?.toLowerCase() === 'critical' ? '#ef4444' :
                      riskData.overall_risk?.toLowerCase() === 'medium' ? '#f59e0b' : '#10b981'
                    }
                    strokeWidth="20"
                    strokeDasharray={`${((riskData.legal_penalty_probability || 50) / 100) * 502} 502`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                    className="risk-progress-circle"
                  />
                </svg>
                <div className="risk-center-text">
                  <div className={`risk-badge-large risk-${riskData.overall_risk?.toLowerCase()}`}>
                    {riskData.overall_risk || 'Unknown'}
                  </div>
                  <div className="risk-label">Risk Level</div>
                </div>
              </div>
              <div className="risk-explanation-box">
                <h3>📋 Risk Assessment</h3>
                <p>{riskData.risk_explanation}</p>
              </div>
            </div>

            <div className="risk-meters-grid">
              <div className="risk-meter-card">
                <div className="meter-icon">⚖️</div>
                <div className="meter-content">
                  <div className="meter-header">
                    <span>Legal Penalty</span>
                    <span className="meter-value-large">{riskData.legal_penalty_probability || 0}%</span>
                  </div>
                  <div className="meter-bar-enhanced">
                    <div 
                      className="meter-fill-animated penalty"
                      style={{ width: `${riskData.legal_penalty_probability || 0}%` }}
                    >
                      <span className="meter-shimmer"></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="risk-meter-card">
                <div className="meter-icon">💰</div>
                <div className="meter-content">
                  <div className="meter-header">
                    <span>Financial Risk</span>
                    <span className="meter-value-large">{riskData.financial_risk || 0}%</span>
                  </div>
                  <div className="meter-bar-enhanced">
                    <div 
                      className="meter-fill-animated financial"
                      style={{ width: `${riskData.financial_risk || 0}%` }}
                    >
                      <span className="meter-shimmer"></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="risk-meter-card">
                <div className="meter-icon">⏰</div>
                <div className="meter-content">
                  <div className="meter-header">
                    <span>Urgency Level</span>
                    <span className="meter-value-large">{riskData.urgency_level || 0}%</span>
                  </div>
                  <div className="meter-bar-enhanced">
                    <div 
                      className="meter-fill-animated urgency"
                      style={{ width: `${riskData.urgency_level || 0}%` }}
                    >
                      <span className="meter-shimmer"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Risk Comparison Chart */}
            <div className="risk-comparison-chart">
              <h3>📊 Risk Factors Comparison</h3>
              <div className="bar-chart">
                <div className="chart-bar">
                  <div className="bar-label">Legal Penalty</div>
                  <div className="bar-container">
                    <div className="bar-fill bar-legal" style={{ width: `${riskData.legal_penalty_probability || 0}%` }}>
                      <span className="bar-value">{riskData.legal_penalty_probability || 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="chart-bar">
                  <div className="bar-label">Financial</div>
                  <div className="bar-container">
                    <div className="bar-fill bar-financial" style={{ width: `${riskData.financial_risk || 0}%` }}>
                      <span className="bar-value">{riskData.financial_risk || 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="chart-bar">
                  <div className="bar-label">Urgency</div>
                  <div className="bar-container">
                    <div className="bar-fill bar-urgency" style={{ width: `${riskData.urgency_level || 0}%` }}>
                      <span className="bar-value">{riskData.urgency_level || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE STRENGTH TAB */}
        {activeTab === 'strength' && (
          <>
            {strengthData ? (
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
                          <li key={i}>
                            {typeof s === 'string' ? s : (
                              <>
                                <strong>{s.aspect || 'Aspect'}</strong>: {s.description || ''}
                                {s.legal_weight && <span className="meta"> (Weight: {s.legal_weight})</span>}
                                {s.supports && <span className="meta"> - Supports: {s.supports}</span>}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {strengthData.weaknesses && strengthData.weaknesses.length > 0 && (
                    <div className="strength-card negative">
                      <h3>⚠️ Weaknesses</h3>
                      <ul>
                        {strengthData.weaknesses.map((w, i) => (
                          <li key={i}>
                            {typeof w === 'string' ? w : (
                              <>
                                <strong>{w.aspect || 'Aspect'}</strong>: {w.description || ''}
                                {w.legal_impact && <div className="meta">Impact: {w.legal_impact}</div>}
                                {w.how_to_address && <div className="meta">How to address: {w.how_to_address}</div>}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {strengthData.missing_evidence && strengthData.missing_evidence.length > 0 && (
                    <div className="strength-card warning">
                      <h3>📋 Missing Evidence</h3>
                      <ul>
                        {strengthData.missing_evidence.map((e, i) => (
                          <li key={i}>
                            {typeof e === 'string' ? e : (
                              <>
                                <strong>{e.item || 'Item'}</strong>
                                {e.importance && <div className="meta">Importance: {e.importance}</div>}
                                {e.how_to_obtain && <div className="meta">How to obtain: {e.how_to_obtain}</div>}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {strengthData.recommendations && strengthData.recommendations.length > 0 && (
                    <div className="strength-card info">
                      <h3>💡 Recommendations</h3>
                      <ul>
                        {strengthData.recommendations.map((r, i) => (
                          <li key={i}>
                            {typeof r === 'string' ? r : (
                              <>
                                <strong>{r.action || 'Action'}</strong>
                                {r.priority && <span className="meta badge"> Priority: {r.priority}</span>}
                                {r.timeline && <div className="meta">Timeline: {r.timeline}</div>}
                                {r.reason && <div className="meta">Reason: {r.reason}</div>}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⚖️</div>
                <h3>No Strength Analysis Available</h3>
                <p>Upload a case file to see strength analysis</p>
              </div>
            )}
          </>
        )}

        {/* PRECEDENTS TAB */}
        {activeTab === 'precedents' && (
          <div className="precedents-section">
            {precedents.length > 0 ? (
              <>
                <div className="section-header-enhanced">
                  <h2>⚖️ Similar Case Precedents</h2>
                  <div className="precedent-count-badge">{precedents.length} Cases Found</div>
                </div>
                <div className="precedents-grid-enhanced">
                  {precedents.map((precedent, i) => (
                    <div key={i} className="precedent-card-enhanced" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="precedent-rank">#{i + 1}</div>
                      <div className="precedent-similarity-circle">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(147, 51, 234, 0.2)" strokeWidth="8"/>
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="none"
                            stroke="#9333ea"
                            strokeWidth="8"
                            strokeDasharray={`${(precedent.similarity || 0) * 2.51} 251`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            className="similarity-progress"
                          />
                        </svg>
                        <div className="similarity-text">
                          <div className="similarity-value">{precedent.similarity || 0}%</div>
                          <div className="similarity-label">Match</div>
                        </div>
                      </div>
                      <div className="precedent-content-enhanced">
                        <h3 className="precedent-title-enhanced">{precedent.title || 'Case ' + (i + 1)}</h3>
                        <div className="precedent-citation-enhanced">
                          <span className="citation-icon">📜</span>
                          {precedent.citation || 'N/A'}
                        </div>
                        <div className="precedent-verdict-box">
                          <strong>⚖️ Verdict:</strong>
                          <p>{precedent.verdict || 'N/A'}</p>
                        </div>
                        <div className="precedent-reasoning-box">
                          <strong>💡 Court Reasoning:</strong>
                          <p>{precedent.reasoning || 'N/A'}</p>
                        </div>
                        <div className="precedent-relevance-box">
                          <strong>🔗 Relevance to Your Case:</strong>
                          <p>{precedent.relevance || 'N/A'}</p>
                        </div>
                        <div className="precedent-takeaway-box">
                          <div className="takeaway-icon">💎</div>
                          <div>
                            <strong>Key Takeaway:</strong>
                            <p>{precedent.keyTakeaway || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
              <>
                <div className="section-header-enhanced">
                  <h2>📅 Case Progress Timeline</h2>
                  <div className="timeline-count-badge">{timeline.length} Milestones</div>
                </div>
                <div className="timeline-container-enhanced">
                  <div className="timeline-line"></div>
                  {timeline.map((milestone, i) => (
                    <div 
                      key={i} 
                      className={`timeline-item-enhanced ${milestone.status?.toLowerCase()}`}
                      style={{ animationDelay: `${i * 0.15}s` }}
                    >
                      <div className="timeline-dot-enhanced">
                        <div className="dot-inner"></div>
                        <div className="dot-pulse"></div>
                      </div>
                      <div className="timeline-content-enhanced">
                        <div className="timeline-date-badge">{milestone.date || 'TBD'}</div>
                        <div className="timeline-stage-title">{milestone.stage || 'Stage ' + (i + 1)}</div>
                        <div className="timeline-description">{milestone.description || ''}</div>
                        <div className="timeline-duration-box">
                          <span className="duration-icon">⏱️</span>
                          <span>Expected: {milestone.expected_duration || 'N/A'}</span>
                        </div>
                        <div className={`timeline-status-badge status-${milestone.status?.toLowerCase()}`}>
                          {milestone.status || 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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