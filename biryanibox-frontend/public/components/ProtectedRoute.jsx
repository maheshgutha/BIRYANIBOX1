import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useContextHooks';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user reaches /login while authenticated, redirect to Dashboard
  if (window.location.pathname === '/login' || window.location.pathname === '/auth') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
