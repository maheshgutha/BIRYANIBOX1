import React, { useState, useEffect } from 'react';
import { AuthContext } from './contexts';
import { authAPI } from '../services/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bb_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (token) {
      // Always refresh from /me to get full _id and latest loyalty_points
      authAPI.me().then(res => {
        const u = normalizeUser(res.data);
        setUser(u);
        localStorage.setItem('bb_user', JSON.stringify(u));
      }).catch(() => {
        localStorage.removeItem('bb_token');
        localStorage.removeItem('bb_user');
        setUser(null);
      });
    }
  }, []);

  // Handles both login response shape (id) and /me response shape (_id)
  const normalizeUser = (data) => {
    const id = data._id || data.id;
    return {
      id,
      _id: id,
      name: data.name,
      role: data.role,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name || 'user')}`,
      avatar_url: data.avatar_url,
      loyaltyPoints: data.loyalty_points || 0,
      loyalty_points: data.loyalty_points || 0,
      orderCount: data.order_count || 0,
      vehicleType: data.vehicle_type,
      rating: data.driver_rating,
      deliveries: data.delivery_count || 0,
      is_active: data.is_active,
    };
  };

  const login = async (emailOrRole, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login({ email: emailOrRole, password });
      const u = normalizeUser(res.user);
      localStorage.setItem('bb_token', res.token);
      localStorage.setItem('bb_user', JSON.stringify(u));
      setUser(u);

      // Fetch full profile in background to ensure _id is correct
      authAPI.me().then(meRes => {
        const fullUser = normalizeUser(meRes.data);
        setUser(fullUser);
        localStorage.setItem('bb_user', JSON.stringify(fullUser));
      }).catch(() => {});

      return { success: true, user: u };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, phone, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.register({ name, email, phone, password });
      const u = normalizeUser(res.user);
      localStorage.setItem('bb_token', res.token);
      localStorage.setItem('bb_user', JSON.stringify(u));
      setUser(u);

      authAPI.me().then(meRes => {
        const fullUser = normalizeUser(meRes.data);
        setUser(fullUser);
        localStorage.setItem('bb_user', JSON.stringify(fullUser));
      }).catch(() => {});

      return { success: true, user: u };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    setUser(null);
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    localStorage.removeItem('biryani_box_cart');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};