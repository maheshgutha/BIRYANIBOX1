import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useContextHooks';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, authReady } = useAuth();

  // Wait until the initial /me auth verification is done
  // This prevents a flash-redirect to /login while the token is being validated
  if (!authReady) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Verifying session…</p>
        </div>
      </div>
    );
  }

  // Not authenticated → login
  if (!user) return <Navigate to="/login" replace />;

  // Delivery role hitting staff dashboard → rider portal
  if (user.role === 'delivery' && !allowedRoles?.includes('delivery')) {
    return <Navigate to="/rider" replace />;
  }

  // Role not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (allowedRoles.includes('delivery')) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;