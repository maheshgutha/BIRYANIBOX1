import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useContextHooks';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // Not authenticated at all → login
  if (!user) return <Navigate to="/login" replace />;

  // Delivery role trying to reach staff dashboard → redirect to rider portal
  if (user.role === 'delivery' && !allowedRoles?.includes('delivery')) {
    return <Navigate to="/rider" replace />;
  }

  // Role restriction check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Non-delivery trying to reach rider portal
    if (allowedRoles.includes('delivery')) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;