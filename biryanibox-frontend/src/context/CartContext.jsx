import React, { useState, useEffect } from 'react';
import { CartContext } from './contexts';

// Cart stays local (localStorage) so guests can add items before logging in.
// When a logged-in customer checks out, we call the checkout API directly.

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('biryani_box_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('biryani_box_table') || '';
  });

  useEffect(() => { localStorage.setItem('biryani_box_table', tableNumber); }, [tableNumber]);
  useEffect(() => { localStorage.setItem('biryani_box_cart', JSON.stringify(cart)); }, [cart]);

  const addToCart = (item) => {
    const id = item._id || item.id;
    const existing = cart.find(i => (i._id || i.id) === id);
    if (existing) {
      setCart(cart.map(i => (i._id || i.id) === id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, id, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(i => (i._id || i.id) === itemId);
    if (!existing) return;
    if (existing.quantity > 1) {
      setCart(cart.map(i => (i._id || i.id) === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setCart(cart.filter(i => (i._id || i.id) !== itemId));
    }
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, tableNumber, setTableNumber }}>
      {children}
    </CartContext.Provider>
  );
};
