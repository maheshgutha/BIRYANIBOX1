import React, { useState, useEffect } from 'react';
import { DemoDataContext } from './contexts';
import { reservationsAPI, cateringAPI } from '../services/api';

export const DemoDataProvider = ({ children }) => {
  const [reservations, setReservations] = useState([]);
  const [cateringOrders, setCateringOrders] = useState([]);
  const [giftCards] = useState([]);
  const [deliveries] = useState([]);
  const [orderHistory] = useState([]);

  // FIX 5A: guard with token check — GET /reservations requires auth (protect middleware).
  // Without this, every page load fires a 401 before login and spams the console.
  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (!token) return;
    reservationsAPI.getAll()
      .then(res => setReservations(res.data || []))
      .catch(() => setReservations([]));
    cateringAPI.getAll()
      .then(res => setCateringOrders(res.data || []))
      .catch(() => setCateringOrders([]));
  }, []);

  // FIX 5B: normalize date to ISO string before sending to backend.
  // Mongoose Reservation schema declares date as { type: Date, required: true }.
  // Sending a raw "2026-04-10" string causes a cast/validation error → 400.
  const addReservation = async (data) => {
    try {
      const payload = {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : undefined,
        guests: Number(data.guests || data.party_size || 1),
      };
      const res = await reservationsAPI.create(payload);
      setReservations(prev => [res.data, ...prev]);
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
      return { error: err.message };
    }
  };

  return (
    <DemoDataContext.Provider value={{
      reservations, cateringOrders, giftCards, deliveries, orderHistory,
      addReservation, addCateringOrder,
    }}>
      {children}
    </DemoDataContext.Provider>
  );
};