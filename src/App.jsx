import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import DocSummariser from './components/DocSummariser';
import AboutUs from './components/AboutUs/AboutUs';
import Chatbot from './components/Chatbot/Chatbot';
import Home from './components/Home';
import ParticlesComponent from './components/particles/particles';
import CaseDashboard from './components/caseDashboard/caseDashboard';

const NotFound = () => (
  <div className="not-found">
    <h2>404 - Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
    <Link to="/" className="back-home-btn">Go Back to Home</Link>
  </div>
);

const DocGenerator = () => {
  return (
    <div className="doc-generator-wrapper">
      <h2>Legal Document Generator</h2>
      <iframe
        src="http://localhost:8501"
        width="100%"
        height="675px"
        style={{ border: 'none', borderRadius: '12px' }}
        title="DocGenerator"
      ></iframe>
    </div>
  );
};

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/case-dashboard', label: 'Case Intelligence', icon: '📊', highlight: true },
    { path: '/chatbot', label: 'AI Assistant', icon: '💬' },
    { path: '/doc-generator', label: 'Doc Generator', icon: '📝' },
    { path: '/doc-summariser', label: 'Summarizer', icon: '📄' },
    { path: '/about', label: 'About', icon: 'ℹ️' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">⚖️</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="brand-text">
                Nyaya<span className="brand-highlight">Sahaya</span>
              </span>
            </div>
          </Link>
          <span className="brand-tagline">AI LEGAL INTELLIGENCE</span>
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link 
                to={item.path} 
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

const App = () => {
  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', () => {
      window.history.pushState(null, null, window.location.pathname);
    });
  }, []);

  return (
    <Router>
      <div className="app">
        <ParticlesComponent />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/doc-generator" element={<DocGenerator />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/doc-summariser" element={<DocSummariser />} />
            <Route path="/case-dashboard" element={<CaseDashboard />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>© 2024 NyayaSahaya - AI-Powered Legal Intelligence Platform</p>
          <p>Empowering justice through technology ⚡</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;