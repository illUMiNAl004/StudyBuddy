import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="page" style={{ textAlign: 'center', marginTop: '40px' }}>Loading...</div>;
  }

  // If user is not logged in, redirect them to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes safely!
  return <Outlet />;
}
