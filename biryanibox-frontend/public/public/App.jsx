import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CustomerAuth from './pages/CustomerAuth';
import OrderHistory from './pages/OrderHistory';
import DeliveryDashboard from './pages/DeliveryDashboard';
import GiftCards from './pages/GiftCards';
import Catering from './pages/Catering';
import Reservations from './pages/Reservations';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Staff Portal Login */}
        <Route path="/login" element={<Login />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/auth" element={<CustomerAuth />} />
        <Route path="/history" element={<OrderHistory />} />
        <Route path="/delivery/hub" element={<DeliveryDashboard />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/catering" element={<Catering />} />
        <Route path="/reservations" element={<Reservations />} />

        {/* Management Dashboard Hub */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
