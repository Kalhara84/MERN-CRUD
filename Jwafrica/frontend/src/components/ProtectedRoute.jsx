import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border" /></div>;
  }

  // Not logged in -> login page, and come back to this page after login
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  if (admin && !user.is_admin) {
    return <div className="alert alert-danger m-4"><b>Admin only.</b> You do not have permission to open this page.</div>;
  }
  return <Outlet />;
}
