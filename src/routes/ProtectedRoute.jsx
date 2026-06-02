import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Component/AuthContext';

const ProtectedRoute = ({ children, allowedUserType }) => {
  const { isAuthenticated, loading, userType, currentUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ marginTop: '100px' }}>
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const effectiveUserType = userType || currentUser?.type || localStorage.getItem('user_type') || 'passager';

  if (allowedUserType && effectiveUserType !== allowedUserType) {
    const fallback = effectiveUserType === 'chauffeur' ? '/dashboard' : '/reserver';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
