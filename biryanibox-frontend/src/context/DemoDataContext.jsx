import React, { useState, useEffect } from 'react';
import { DemoDataContext } from './contexts';
import { reservationsAPI, cateringAPI } from '../services/api';

export const DemoDataProvider = ({ children }) => {
  const [reservations, setReservations] = useState([]);
  const [cateringOrders, setCateringOrders] = useState([]);
  const [giftCards] = useState([]);
  const [deliveries] = useState([]);
  const [orderHistory] = useState([]);

  useEffect(() => {
    reservationsAPI.getAll().then(res => setReservations(res.data)).catch(() => setReservations([]));
    cateringAPI.getAll().then(res => setCateringOrders(res.data)).catch(() => setCateringOrders([]));
  }, []);

  const addReservation = async (data) => {
    try {
      const res = await reservationsAPI.create(data);
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
