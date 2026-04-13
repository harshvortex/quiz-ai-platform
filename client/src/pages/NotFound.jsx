import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-code">404</div>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn-primary">Go Home</Link>
    </div>
  );
}
