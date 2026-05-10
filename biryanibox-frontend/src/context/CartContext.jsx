import React, { useState, useEffect, useCallback, useRef } from "react";
import { CartContext } from "./contexts";
import { cartAPI } from "../services/api";

const safeGet = (key, fallback = null) => {
  try { const v = localStorage.getItem(key); return v !== null ? v : fallback; }
  catch { return fallback; }
};
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const safeRemove = (key) => { try { localStorage.removeItem(key); } catch {} };
const safeParseJSON = (str, fallback) => {
  try { return JSON.parse(str || "null") ?? fallback; }
  catch { return fallback; }
};

const isCustomerLoggedIn = () => {
  try {
    const token = safeGet("bb_token");
    const u = safeParseJSON(safeGet("bb_user"), null);
    return !!(token && u?.role === "customer");
  } catch { return false; }
};

const getLocalCart = () => safeParseJSON(safeGet("biryani_box_cart"), []);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(getLocalCart);
  const [tableNumber, setTableNumber] = useState(() => safeGet("biryani_box_table", ""));
  const [syncing, setSyncing] = useState(false);
  const dbLoadAttempted = useRef(false);

  useEffect(() => { safeSet("biryani_box_table", tableNumber); }, [tableNumber]);

  useEffect(() => {
    if (!isCustomerLoggedIn()) safeSet("biryani_box_cart", JSON.stringify(cart));
  }, [cart]);

  const loadCartFromDB = useCallback(async (force = false) => {
    if (!isCustomerLoggedIn()) { setCart(getLocalCart()); return; }
    if (dbLoadAttempted.current && !force) return;
    dbLoadAttempted.current = true;
    try {
      setSyncing(true);
      const res = await cartAPI.get();
      const items = (res.data || []).map(i => ({
        _id: i.menu_item_id?._id || i.menu_item_id,
        id:  i.menu_item_id?._id || i.menu_item_id,
        name: i.menu_item_id?.name || i.name || "Item",
        price: i.menu_item_id?.price || 0,
        image_url: i.menu_item_id?.image_url || "",
        category: i.menu_item_id?.category || "",
        quantity: i.quantity,
        cart_item_id: i._id,
      }));
      setCart(items);
    } catch (err) {
      if (!err?.message?.includes("401") && !err?.message?.includes("403")) {
        console.warn("[CartContext] DB load failed, using local:", err?.message);
      }
      setCart(getLocalCart());
    } finally { setSyncing(false); }
  }, []);

  useEffect(() => { loadCartFromDB(); }, [loadCartFromDB]);

  useEffect(() => {
    const refresh = () => { dbLoadAttempted.current = false; loadCartFromDB(true); };
    window.addEventListener("bb:login", refresh);
    window.addEventListener("bb:logout", refresh);
    window.addEventListener("bb:unauthorized", refresh);
    return () => {
      window.removeEventListener("bb:login", refresh);
      window.removeEventListener("bb:logout", refresh);
      window.removeEventListener("bb:unauthorized", refresh);
    };
  }, [loadCartFromDB]);

  const addToCart = async (item) => {
    const id = item._id || item.id;
    if (isCustomerLoggedIn()) {
      setCart(prev => {
        const ex = prev.find(i => (i._id || i.id) === id);
        if (ex) return prev.map(i => (i._id || i.id) === id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, id, _id: id, quantity: 1 }];
      });
      try { await cartAPI.add(id, 1); }
      catch { await loadCartFromDB(true); }
    } else {
      setCart(prev => {
        const ex = prev.find(i => (i._id || i.id) === id);
        if (ex) return prev.map(i => (i._id || i.id) === id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, id, quantity: 1 }];
      });
    }
  };

  const removeFromCart = async (itemId) => {
    const ex = cart.find(i => (i._id || i.id) === itemId);
    if (!ex) return;
    if (isCustomerLoggedIn()) {
      const newQty = ex.quantity - 1;
      if (newQty <= 0) setCart(prev => prev.filter(i => (i._id || i.id) !== itemId));
      else setCart(prev => prev.map(i => (i._id || i.id) === itemId ? { ...i, quantity: newQty } : i));
      try {
        if (newQty <= 0) await cartAPI.remove(itemId);
        else await cartAPI.update(itemId, newQty);
      } catch { await loadCartFromDB(true); }
    } else {
      if (ex.quantity > 1) setCart(cart.map(i => (i._id || i.id) === itemId ? { ...i, quantity: i.quantity - 1 } : i));
      else setCart(cart.filter(i => (i._id || i.id) !== itemId));
    }
  };

  const clearCart = async () => {
    setCart([]);
    safeRemove("biryani_box_cart");
    if (isCustomerLoggedIn()) { try { await cartAPI.clear(); } catch {} }
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, tableNumber, setTableNumber, syncing }}>
      {children}
    </CartContext.Provider>
  );
};