import { Link } from 'react-router-dom';
import ParticleCanvas from '../components/ParticleCanvas';

export default function Landing() {
  return (
    <div className="landing-body">
      {/* Hero Section */}
      <nav className="landing-nav-bar">
        <div className="landing-logo">
          <span className="logo-icon">◆</span>
          <span className="brand-name">Quiz<em>AI</em></span>
        </div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn-ghost-sm">Login</Link>
          <Link to="/signup" className="btn-primary-sm">Get Started Free</Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="hero-content">
          <div className="hero-badge-landing">
            <span className="pulse-dot" />
            Powered by Advanced AI
          </div>

          <h1 className="landing-hero-title">
            Forge your<br /><em>perfect quiz</em>
          </h1>

          <p className="landing-hero-sub">
            Generate beautifully crafted questions on any topic in seconds.
            Test yourself, challenge friends, or prepare for exams — all powered by cutting-edge AI.
          </p>

          <div className="hero-cta-group">
            <Link to="/signup" className="hero-cta-primary">
              Start Learning Free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/login" className="hero-cta-secondary">Welcome Back</Link>
          </div>

          <div className="landing-stats">
            <div className="landing-stat">
              <div className="landing-stat-num">∞</div>
              <div className="landing-stat-label">Topics</div>
            </div>
            <div className="stat-sep" />
            <div className="landing-stat">
              <div className="landing-stat-num">4</div>
              <div className="landing-stat-label">AI Personas</div>
            </div>
            <div className="stat-sep" />
            <div className="landing-stat">
              <div className="landing-stat-num">3</div>
              <div className="landing-stat-label">Difficulties</div>
            </div>
            <div className="stat-sep" />
            <div className="landing-stat">
              <div className="landing-stat-num">98%</div>
              <div className="landing-stat-label">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-header">
          <h2>Why choose QuizAI?</h2>
          <p>Experience the future of learning with our AI-powered platform.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI-Powered Generation</h3>
            <p>Advanced language models craft precise, relevant questions on any topic — from quantum physics to art history.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Smart Analytics</h3>
            <p>Track your performance with beautiful charts, identify weak areas, and get personalized recommendations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎭</div>
            <h3>Unique AI Personas</h3>
            <p>Choose from Professor, Coach, Snarky AI, or Medieval Knight — each brings a distinctive style.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to level up?</h2>
          <p>Join thousands of students already using QuizAI to master any subject.</p>
          <Link to="/signup" className="hero-cta-primary">
            Create Free Account
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-footer-brand">◆ QuizAI</span>
        <span className="landing-footer-copy">© 2024 AI-Powered Learning Platform · Built with Intelligence</span>
      </footer>
    </div>
  );
}
