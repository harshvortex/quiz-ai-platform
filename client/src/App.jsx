import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ParticleCanvas from './components/ParticleCanvas';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import History from './pages/History';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner-ring" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner-ring" /></div>;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loading-spinner">
          <div className="spinner-ring" />
          <div className="spinner-dot">✦</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ParticleCanvas />
      <Routes>
        {/* Landing - standalone layout */}
        <Route path="/" element={
          <GuestRoute><Landing /></GuestRoute>
        } />

        {/* Auth pages */}
        <Route path="/login" element={
          <GuestRoute>
            <Navbar />
            <main className="main-content"><Login /></main>
            <Footer />
          </GuestRoute>
        } />
        <Route path="/signup" element={
          <GuestRoute>
            <Navbar />
            <main className="main-content"><Signup /></main>
            <Footer />
          </GuestRoute>
        } />

        {/* Protected pages */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Navbar />
            <main className="main-content"><Dashboard /></main>
            <Footer />
          </ProtectedRoute>
        } />
        <Route path="/quiz" element={
          <ProtectedRoute>
            <Navbar />
            <main className="main-content"><Quiz /></main>
            <Footer />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <Navbar />
            <main className="main-content"><History /></main>
            <Footer />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={
          <>
            <Navbar />
            <main className="main-content"><NotFound /></main>
            <Footer />
          </>
        } />
      </Routes>
    </>
  );
}
