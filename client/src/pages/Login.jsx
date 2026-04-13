import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier || !password) {
      addToast('Please fill in all fields.', 'error');
      return;
    }
    setLoading(true);
    try {
      await login(identifier, password, remember);
    } catch (err) {
      addToast(err.message || 'Invalid credentials.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-decoration">
          <div className="deco-circle deco-1" />
          <div className="deco-circle deco-2" />
          <div className="deco-circle deco-3" />
        </div>
        <div className="auth-hero">
          <div className="hero-badge">
            <span style={{ display: 'inline-block', width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
            AI-Powered
          </div>
          <h1 className="hero-title">Master any<br /><em>subject</em> with<br />intelligent quizzes</h1>
          <p className="hero-sub">Generate personalized quizzes on any topic, at any difficulty — powered by advanced AI.</p>
          <div className="hero-stats">
            <div className="hstat"><strong>10K+</strong><span>Quizzes Generated</span></div>
            <div className="hstat-divider" />
            <div className="hstat"><strong>50+</strong><span>Topics Covered</span></div>
            <div className="hstat-divider" />
            <div className="hstat"><strong>98%</strong><span>Satisfaction</span></div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue your learning journey</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">Username or Email</label>
              <input type="text" id="identifier" className="form-input" placeholder="Enter your username or email"
                autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper">
                <input type={showPw ? 'text' : 'password'} id="password" className="form-input"
                  placeholder="Enter your password" autoComplete="current-password" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="form-check">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <span className="checkbox-custom" />
                Remember me for 30 days
              </label>
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
