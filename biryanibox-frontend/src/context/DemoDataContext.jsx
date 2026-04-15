import React, { useState, useEffect } from 'react';
import { DemoDataContext } from './contexts';
import { reservationsAPI, cateringAPI } from '../services/api';

// ── Helper: get role from localStorage (avoids dependency on AuthContext) ──
const getStoredRole = () => {
  try {
    const u = JSON.parse(localStorage.getItem('bb_user') || 'null');
    return u?.role || null;
  } catch { return null; }
};

export const DemoDataProvider = ({ children }) => {
  const [reservations, setReservations]     = useState([]);
  const [cateringOrders, setCateringOrders] = useState([]);
  const [giftCards]                         = useState([]);
  const [deliveries]                        = useState([]);
  const [orderHistory]                      = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (!token) return;

    const role = getStoredRole();

    // Reservations — customers can view their own; staff see all
    // GET /api/reservations has `protect` but no authorize → safe for all roles
    reservationsAPI.getAll()
      .then(res => setReservations(res.data || []))
      .catch(() => setReservations([]));

    // Catering — GET /api/catering has authorize('owner','manager')
    // Do NOT call this for customers or non-admin roles to avoid 403
    if (role === 'owner' || role === 'manager') {
      cateringAPI.getAll()
        .then(res => setCateringOrders(res.data || []))
        .catch(() => setCateringOrders([]));
    }
  }, []);

  const addReservation = async (data) => {
    try {
      const payload = {
        ...data,
        date:   data.date ? new Date(data.date).toISOString() : undefined,
        guests: Number(data.guests || data.party_size || 1),
      };
      const res = await reservationsAPI.create(payload);
      setReservations(prev => [res.data, ...prev]);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const updateReservationStatus = async (id, status) => {
    try {
      await reservationsAPI.patch(id, { status });
      setReservations(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  const addCateringOrder = async (data) => {
    try {
      const res = await cateringAPI.create(data);
      setCateringOrders(prev => [res.data, ...prev]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <DemoDataContext.Provider value={{
      reservations, cateringOrders, giftCards, deliveries, orderHistory,
      addReservation, updateReservationStatus, addCateringOrder,
    }}>
      {children}
    </DemoDataContext.Provider>
  );
};