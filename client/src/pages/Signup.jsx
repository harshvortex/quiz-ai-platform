import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Signup() {
  const { signup } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
    if (field === 'password') {
      let s = 0;
      if (val.length >= 6) s++;
      if (val.length >= 10) s++;
      if (/[A-Z]/.test(val)) s++;
      if (/[0-9]/.test(val)) s++;
      if (/[^A-Za-z0-9]/.test(val)) s++;
      setStrength(s);
    }
  }

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthClasses = ['', 'weak', 'fair', 'good', 'strong', 'very-strong'];

  async function handleSubmit(e) {
    e.preventDefault();
    const { username, email, password, confirm } = form;

    if (!username || !email || !password || !confirm) {
      addToast('All fields are required.', 'error'); return;
    }
    if (username.length < 3 || username.length > 30) {
      addToast('Username must be 3-30 characters.', 'error'); return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters.', 'error'); return;
    }
    if (password !== confirm) {
      addToast('Passwords do not match.', 'error'); return;
    }

    setLoading(true);
    try {
      await signup(username, email, password);
      addToast(`Welcome to QuizAI, ${username}!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
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
            Free Forever
          </div>
          <h1 className="hero-title">Start your<br /><em>learning</em><br />adventure today</h1>
          <p className="hero-sub">Join thousands of students using AI to ace their exams and expand their knowledge.</p>
          <ul className="feature-list">
            <li><span className="feat-check">✓</span> Unlimited AI-generated quizzes</li>
            <li><span className="feat-check">✓</span> Track your progress over time</li>
            <li><span className="feat-check">✓</span> Any topic, any difficulty level</li>
            <li><span className="feat-check">✓</span> Instant feedback and explanations</li>
          </ul>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create your account</h2>
            <p>It's free and takes less than a minute</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input type="text" id="username" className="form-input" placeholder="Choose a username"
                value={form.username} onChange={e => update('username', e.target.value)}
                minLength="3" maxLength="30" autoComplete="username" required />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input type="email" id="email" className="form-input" placeholder="your@email.com"
                value={form.email} onChange={e => update('email', e.target.value)}
                autoComplete="email" required />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper">
                <input type={showPw ? 'text' : 'password'} id="password" className="form-input"
                  placeholder="At least 6 characters" value={form.password}
                  onChange={e => update('password', e.target.value)} minLength="6" autoComplete="new-password" required />
                <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              <div className="password-strength">
                <div className={`strength-fill ${strengthClasses[strength]}`} style={{ width: `${(strength / 5) * 100}%` }} />
              </div>
              {form.password && <span className="strength-label">{strengthLabels[strength]}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm" className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <input type={showConfirm ? 'text' : 'password'} id="confirm" className="form-input"
                  placeholder="Repeat your password" value={form.confirm}
                  onChange={e => update('confirm', e.target.value)} autoComplete="new-password" required />
                <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              <span>{loading ? 'Creating…' : 'Create Account'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <p className="form-terms">By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
