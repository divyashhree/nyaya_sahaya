import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "AI Case Intelligence",
      description: "Analyze cases with AI-powered risk assessment, strength scoring, and precedent matching",
      icon: "🧠",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      link: "/case-dashboard"
    },
    {
      title: "Risk Heatmap",
      description: "Visual analytics showing legal penalties, financial risks, and urgency levels in real-time",
      icon: "📊",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      link: "/case-dashboard"
    },
    {
      title: "Case Strength Analyzer",
      description: "Get 0-100 scores on case strength with AI-powered weak point detection",
      icon: "💪",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      link: "/case-dashboard"
    },
    {
      title: "Precedent Explorer",
      description: "Find similar cases with AI similarity matching and verdict reasoning",
      icon: "🔍",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      link: "/case-dashboard"
    },
    {
      title: "Smart Document Generator",
      description: "Auto-fill legal documents from plain English with AI assistance",
      icon: "📝",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      link: "/doc-generator"
    },
    {
      title: "Legal AI Assistant",
      description: "Chat with AI trained on Indian legal corpus for instant answers",
      icon: "💬",
      gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      link: "/chatbot"
    }
  ];

  const stats = [
    { number: "10K+", label: "Cases Analyzed", icon: "⚖️" },
    { number: "95%", label: "Accuracy Rate", icon: "🎯" },
    { number: "24/7", label: "Available", icon: "🌐" },
    { number: "<3min", label: "Avg Response", icon: "⚡" }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Upload Your Case",
      description: "Upload FIR, complaint, or case documents in any format",
      icon: "📤"
    },
    {
      step: "02",
      title: "AI Analysis",
      description: "Our AI extracts key info, identifies risks, and calculates strength",
      icon: "🤖"
    },
    {
      step: "03",
      title: "Get Insights",
      description: "Receive visual analytics, precedents, and actionable recommendations",
      icon: "💡"
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
            <span className="gradient-text">Reimagined</span>
          </h1>
          <p className="hero-subtitle">
            Transform complex legal cases into clear, data-driven insights with AI-powered 
            risk analysis, precedent matching, and case strength evaluation
          </p>
          <div className="hero-cta">
            <Link to="/case-dashboard" className="cta-primary">
              <span>Start Analysis</span>
              <span className="cta-arrow">→</span>
            </Link>
            <Link to="/chatbot" className="cta-secondary">
              <span>Try AI Assistant</span>
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-icon">📊</div>
            <div className="card-text">Risk: <span className="highlight-green">Low</span></div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">💪</div>
            <div className="card-text">Strength: <span className="highlight-blue">87%</span></div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">⚖️</div>
            <div className="card-text">Precedents: <span className="highlight-purple">12 Found</span></div>
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
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">Everything you need for intelligent legal analysis</p>
        </div>
        <div className="features-grid-modern">
          {features.map((feature, index) => (
            <Link 
              to={feature.link}
              key={index} 
              className={`feature-card-modern ${activeFeature === index ? 'active' : ''}`}
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
          <h2 className="cta-title">Ready to Transform Your Legal Workflow?</h2>
          <p className="cta-text">Join thousands of lawyers and citizens using AI-powered legal intelligence</p>
          <Link to="/case-dashboard" className="cta-button-large">
            <span>Get Started Now</span>
            <span className="cta-sparkle">✨</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;