import React, { useState, useEffect, useCallback } from 'react';
import { CartContext } from './contexts';
import { cartAPI } from '../services/api';

// Cart strategy:
// • Guest / unauthenticated → localStorage only (same as before)
// • Logged-in customer       → synced with /api/cart (DB-backed)
// • Staff (owner/manager/etc)→ localStorage only (POS flow)

const isCustomerLoggedIn = () => {
  try {
    const token = localStorage.getItem('bb_token');
    const u     = JSON.parse(localStorage.getItem('bb_user') || 'null');
    return !!(token && u?.role === 'customer');
  } catch { return false; }
};

const getLocalCart = () => {
  try { return JSON.parse(localStorage.getItem('biryani_box_cart') || '[]'); }
  catch { return []; }
};

export const CartProvider = ({ children }) => {
  const [cart,        setCart]        = useState(getLocalCart);
  const [tableNumber, setTableNumber] = useState(() => localStorage.getItem('biryani_box_table') || '');
  const [syncing,     setSyncing]     = useState(false);

  // Persist table number
  useEffect(() => { localStorage.setItem('biryani_box_table', tableNumber); }, [tableNumber]);

  // Persist local cart for guests/staff
  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      localStorage.setItem('biryani_box_cart', JSON.stringify(cart));
    }
  }, [cart]);

  // ── Load cart from DB on mount (customers only) ──────────────────────────
  const loadCartFromDB = useCallback(async () => {
    if (!isCustomerLoggedIn()) return;
    try {
      setSyncing(true);
      const res = await cartAPI.get();
      const items = (res.data || []).map(i => ({
        _id:      i.menu_item_id?._id  || i.menu_item_id,
        id:       i.menu_item_id?._id  || i.menu_item_id,
        name:     i.menu_item_id?.name || i.name || 'Item',
        price:    i.menu_item_id?.price || 0,
        image_url:i.menu_item_id?.image_url || '',
        category: i.menu_item_id?.category || '',
        quantity: i.quantity,
        cart_item_id: i._id, // DB record id for updates
      }));
      setCart(items);
    } catch {
      // Fall back to localStorage if API fails
      setCart(getLocalCart());
    } finally { setSyncing(false); }
  }, []);

  useEffect(() => { loadCartFromDB(); }, [loadCartFromDB]);

  // ── addToCart ─────────────────────────────────────────────────────────────
  const addToCart = async (item) => {
    const id = item._id || item.id;

    if (isCustomerLoggedIn()) {
      // Optimistic update
      setCart(prev => {
        const existing = prev.find(i => (i._id || i.id) === id);
        if (existing) return prev.map(i => (i._id || i.id) === id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, id, _id: id, quantity: 1 }];
      });
      // Sync to DB
      try { await cartAPI.add(id, 1); } catch { await loadCartFromDB(); }
    } else {
      setCart(prev => {
        const existing = prev.find(i => (i._id || i.id) === id);
        if (existing) return prev.map(i => (i._id || i.id) === id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, id, quantity: 1 }];
      });
    }
  };

  // ── removeFromCart ────────────────────────────────────────────────────────
  const removeFromCart = async (itemId) => {
    const existing = cart.find(i => (i._id || i.id) === itemId);
    if (!existing) return;

    if (isCustomerLoggedIn()) {
      const newQty = existing.quantity - 1;
      // Optimistic update
      if (newQty <= 0) setCart(prev => prev.filter(i => (i._id || i.id) !== itemId));
      else setCart(prev => prev.map(i => (i._id || i.id) === itemId ? { ...i, quantity: newQty } : i));
      // Sync to DB
      try {
        if (newQty <= 0) await cartAPI.remove(itemId);
        else await cartAPI.update(itemId, newQty);
      } catch { await loadCartFromDB(); }
    } else {
      if (existing.quantity > 1) {
        setCart(cart.map(i => (i._id || i.id) === itemId ? { ...i, quantity: i.quantity - 1 } : i));
      } else {
        setCart(cart.filter(i => (i._id || i.id) !== itemId));
      }
    }
  };

  // ── clearCart ─────────────────────────────────────────────────────────────
  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('biryani_box_cart');
    if (isCustomerLoggedIn()) {
      try { await cartAPI.clear(); } catch {}
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, clearCart,
      total, tableNumber, setTableNumber, syncing,
    }}>
      {children}
    </CartContext.Provider>
  );
};