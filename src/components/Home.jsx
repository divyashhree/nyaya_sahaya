import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      title: "AI Case Intelligence",
      description: "Advanced case analysis with automated risk assessment, strength evaluation, and precedent identification using machine learning algorithms",
      icon: "AI",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      link: "/case-dashboard"
    },
    {
      title: "Risk Assessment Matrix",
      description: "Comprehensive risk visualization displaying legal penalties, financial implications, and case urgency metrics",
      icon: "RA",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      link: "/case-dashboard"
    },
    {
      title: "Case Strength Analysis",
      description: "Quantitative evaluation of case merit with data-driven scoring and vulnerability identification",
      icon: "CS",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      link: "/case-dashboard"
    },
    {
      title: "Precedent Research",
      description: "Intelligent case law matching with similarity analysis and automated verdict reasoning extraction",
      icon: "PR",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      link: "/case-dashboard"
    },
    {
      title: "Document Automation",
      description: "Automated legal document generation with natural language processing and intelligent template population",
      icon: "DA",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      link: "/doc-generator"
    },
    {
      title: "Legal Assistant",
      description: "AI-powered legal consultation system trained on Indian Penal Code and procedural law database",
      icon: "LA",
      gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      link: "/chatbot"
    }
  ];

  const stats = [
    { number: "10K+", label: "Cases Analyzed", icon: "⚖" },
    { number: "95%", label: "Accuracy Rate", icon: "◉" },
    { number: "24/7", label: "System Uptime", icon: "●" },
    { number: "<3min", label: "Response Time", icon: "◆" }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Document Upload",
      description: "Submit FIR, complaints, or legal documents in PDF, DOC, or text format for processing",
      icon: "↑"
    },
    {
      step: "02",
      title: "Automated Analysis",
      description: "AI engine extracts key information, identifies risk factors, and calculates case strength metrics",
      icon: "⟳"
    },
    {
      step: "03",
      title: "Intelligence Report",
      description: "Access comprehensive analytics, relevant precedents, and data-driven strategic recommendations",
      icon: "◈"
    }
  ];

  return (
    <div className="home-wrapper">
      {/* HERO SECTION */}
      <section className={`hero ${isVisible ? 'visible' : ''}`}>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Powered by AI & Machine Learning
          </div>
          <h1 className="hero-title">
            Legal Intelligence
            <br />
            <span className="gradient-text">Platform</span>
          </h1>
          <p className="hero-subtitle">
            Advanced legal analytics platform leveraging artificial intelligence for comprehensive case assessment, 
            risk quantification, precedent research, and strategic decision support
          </p>
          <div className="hero-cta">
            <Link to="/case-dashboard" className="cta-primary">
              <span>Begin Case Analysis</span>
              <span className="cta-arrow">→</span>
            </Link>
            <Link to="/chatbot" className="cta-secondary">
              <span>Legal Assistant</span>
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-icon">◉</div>
            <div className="card-text">Risk Level: <span className="highlight-green">Low</span></div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">▲</div>
            <div className="card-text">Case Strength: <span className="highlight-blue">87%</span></div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">⚖</div>
            <div className="card-text">Precedents: <span className="highlight-purple">12 Matched</span></div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-showcase">
        <div className="section-header">
          <h2 className="section-title">Core Capabilities</h2>
          <p className="section-subtitle">Comprehensive suite of AI-powered legal intelligence tools</p>
        </div>
        <div className="features-grid-modern">
          {features.map((feature, index) => (
            <Link 
              to={feature.link}
              key={index} 
              className="feature-card-modern"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-gradient" style={{ background: feature.gradient }}></div>
              <div className="feature-icon-modern">{feature.icon}</div>
              <h3 className="feature-title-modern">{feature.title}</h3>
              <p className="feature-desc-modern">{feature.description}</p>
              <div className="feature-arrow">→</div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get started in 3 simple steps</p>
        </div>
        <div className="steps-container">
          {howItWorks.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.step}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              {index < howItWorks.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Enhance Your Legal Practice with AI</h2>
          <p className="cta-text">Join legal professionals leveraging artificial intelligence for superior case outcomes</p>
          <Link to="/case-dashboard" className="cta-button-large">
            <span>Access Platform</span>
            <span className="cta-sparkle">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;