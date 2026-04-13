import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to={user ? '/dashboard' : '/login'} className="nav-brand">
          <span className="brand-icon">◆</span>
          <span className="brand-name">Quiz<em>AI</em></span>
        </Link>

        {user ? (
          <>
            <div className="nav-links">
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/quiz" className={`nav-link ${isActive('/quiz') ? 'active' : ''}`}>New Quiz</Link>
              <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>History</Link>
            </div>
            <div className="nav-user">
              <span className="nav-avatar">{user.username[0].toUpperCase()}</span>
              <span className="nav-username">{user.username}</span>
              <button onClick={logout} className="btn-ghost-sm">Logout</button>
            </div>
          </>
        ) : (
          <div className="nav-links">
            <Link to="/login" className="btn-ghost-sm">Login</Link>
            <Link to="/signup" className="btn-primary-sm">Get Started</Link>
          </div>
        )}

        <button
          className="nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {user && (
        <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
          <Link to="/dashboard" className="mobile-link">Dashboard</Link>
          <Link to="/quiz" className="mobile-link">New Quiz</Link>
          <Link to="/history" className="mobile-link">History</Link>
          <button onClick={logout} className="mobile-link logout-link">Logout</button>
        </div>
      )}
    </nav>
  );
}
