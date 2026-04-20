import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useContextHooks';
import Home              from './pages/Home';
import Login             from './pages/Login';
import Dashboard         from './pages/Dashboard';
import Cart              from './pages/Cart';
import Checkout          from './pages/Checkout';
import CustomerAuth      from './pages/CustomerAuth';
import OrderHistory      from './pages/OrderHistory';
import DeliveryDashboard from './pages/DeliveryDashboard';
import GiftCards         from './pages/GiftCards';
import Catering          from './pages/Catering';
import Reservations      from './pages/Reservations';
import Contact           from './pages/Contact';
import ProfileHub        from './pages/ProfileHub';
import ProtectedRoute    from './components/ProtectedRoute';

// Redirect already-logged-in users away from /login to their dashboard
const LoginGuard = ({ children }) => {
  const { user, authReady } = useAuth();

  // Still verifying token — show the login form optimistically (avoids blank flash)
  // Once verified, if already logged in, redirect to the right place
  if (!authReady) return children;

  if (user) {
    // Already logged in — send to the right place
    if (user.role === 'delivery') return <Navigate to="/rider"     replace />;
    if (['owner','manager','captain','chef'].includes(user.role))
                                   return <Navigate to="/dashboard" replace />;
    // Customer logged in — send to profile
    return <Navigate to="/profile" replace />;
  }

  return children;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* ── Public customer routes ── */}
        <Route path="/"             element={<Home />} />
        <Route path="/cart"         element={<Cart />} />
        <Route path="/checkout"     element={<Checkout />} />
        <Route path="/auth"         element={<CustomerAuth />} />
        <Route path="/history"      element={<OrderHistory />} />
        <Route path="/gift-cards"   element={<GiftCards />} />
        <Route path="/catering"     element={<Catering />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/contact"      element={<Contact />} />
        <Route path="/profile"      element={<ProfileHub />} />

        {/* ── Staff login — hidden from already-logged-in users ── */}
        <Route path="/login" element={<LoginGuard><Login /></LoginGuard>} />

        {/* ── Rider portal ── */}
        <Route
          path="/rider"
          element={
            <ProtectedRoute allowedRoles={['delivery']}>
              <DeliveryDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/delivery/hub" element={<Navigate to="/rider" replace />} />

        {/* ── Staff dashboard ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'captain', 'chef']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'captain', 'chef']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;