import React, { useState, useEffect } from 'react';
import { MOCK_CART_ITEMS } from './menuData';
import { CartContext } from './contexts';

// export const useCart = () => useContext(CartContext);


export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('biryani_box_cart');
    return saved ? JSON.parse(saved) : MOCK_CART_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem('biryani_box_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find((i) => i.id === itemId);
    if (!existing) return;
    if (existing.quantity > 1) {
      setCart(cart.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)));
    } else {
      setCart(cart.filter((i) => i.id !== itemId));
    }
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

