import React, { useState, useEffect, useCallback } from 'react';
import { OrderContext } from './contexts';
import { menuAPI, ingredientsAPI, ordersAPI, dashboardAPI, normalizeMenuItem, normalizeIngredient, normalizeOrder } from '../services/api';

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerNotification, setCustomerNotification] = useState(null);

  // Load menu from API on mount
  useEffect(() => {
    menuAPI.getAll().then(res => {
      setMenu(res.data.map(normalizeMenuItem));
    }).catch(console.error);
  }, []);

  // Load ingredients from API
  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    if (!token) return;
    ingredientsAPI.getAll().then(res => {
      setIngredients(res.data.map(normalizeIngredient));
    }).catch(console.error);
  }, []);

  // Load orders from API
  const loadOrders = useCallback(() => {
    const token = localStorage.getItem('bb_token');
    if (!token) return;
    ordersAPI.getAll().then(res => {
      setOrders(res.data.map(normalizeOrder));
    }).catch(console.error);
  }, []);

 useEffect(() => {
  loadOrders();
  // Poll every 10 seconds so all dashboards stay in sync when customer places order
  const interval = setInterval(loadOrders, 10000);
  return () => clearInterval(interval);
}, [loadOrders]);

  // Coupon system (kept local — no backend coupon table)
  const [coupons, setCoupons] = useState(() => {
    const saved = localStorage.getItem('bb_coupons');
    if (saved) return JSON.parse(saved);
    return [
      { code: 'BB-RX1-C1-HZAN', discount: 20, milestone: 1, usedDate: '2/4/2026' },
      { code: 'BB-RX1-C2-LKWH', discount: 20, milestone: 2, usedDate: '2/4/2026' },
      { code: 'BB-RX1-C3-5PFK', discount: 20, milestone: 3, usedDate: '2/4/2026' },
      { code: 'BB-RX1-C4-8TW7', discount: 20, milestone: 4, usedDate: '2/4/2026' },
      { code: 'BB-RX1-C5-VGK3', discount: 20, milestone: 5, usedDate: null },
    ];
  });
  useEffect(() => { localStorage.setItem('bb_coupons', JSON.stringify(coupons)); }, [coupons]);

  const availableCoupons = coupons.filter(c => !c.usedDate);
  const usedCoupons = coupons.filter(c => !!c.usedDate);
  const deleteUsedCoupons = () => setCoupons(prev => prev.filter(c => !c.usedDate));
  const applyCoupon = (code) => {
    const found = coupons.find(c => c.code === code && !c.usedDate);
    if (!found) return { error: 'Invalid or already used coupon.' };
    const today = new Date().toLocaleDateString('en-US');
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, usedDate: today } : c));
    return { success: true, discount: found.discount };
  };

  const dismissCustomerNotification = () => setCustomerNotification(null);

  // Create order via API
  const createOrder = async (cart, table, captain, customerName = null) => {
    try {
      const user = JSON.parse(localStorage.getItem('bb_user') || 'null');
      const payload = {
        items: cart.map(i => ({ menu_item_id: i._id || i.id, quantity: i.quantity })),
        table_number: table,
        captain_id: user?._id,
        order_type: 'dine-in',
        customer_id: user?.role === 'customer' ? user._id : undefined,
      };
      const res = await ordersAPI.create(payload);
      const newOrder = normalizeOrder(res.data);
      newOrder.items = cart;
      newOrder.isNew = true;
      setOrders(prev => [newOrder, ...prev]);
      setCustomerNotification({
        orderId: newOrder.id,
        items: cart,
        total: newOrder.total,
        table,
        captain,
        timestamp: newOrder.timestamp,
      });
      // Refresh ingredients
      ingredientsAPI.getAll().then(r => setIngredients(r.data.map(normalizeIngredient))).catch(() => {});
      return { success: true, orderId: newOrder.id };
    } catch (err) {
      return { error: err.message };
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, isNew: false } : o));
    } catch (err) {
      console.error('updateOrderStatus error:', err.message);
    }
  };

  const acknowledgeOrder = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isNew: false } : o));
  };

  const deleteOrder = async (orderId) => {
    try {
      await ordersAPI.delete(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error('deleteOrder error:', err.message);
    }
  };

  const updateMenuStock = async (itemId, stock) => {
    try {
      await menuAPI.updateStock(itemId, stock);
      setMenu(prev => prev.map(m => m.id === itemId ? { ...m, stock } : m));
    } catch (err) {
      console.error('updateMenuStock error:', err.message);
    }
  };

  const toggleMenuAvailability = async (itemId) => {
    try {
      const res = await menuAPI.toggleAvailability(itemId);
      setMenu(prev => prev.map(m => m.id === itemId ? { ...m, available: res.data.is_available, is_available: res.data.is_available } : m));
    } catch (err) {
      console.error('toggleMenuAvailability error:', err.message);
    }
  };

  const updateIngredientStock = async (ingredientId, amount) => {
    try {
      await ingredientsAPI.updateStock(ingredientId, amount);
      setIngredients(prev => prev.map(ing => ing.id === ingredientId ? { ...ing, stock: amount } : ing));
    } catch (err) {
      console.error('updateIngredientStock error:', err.message);
    }
  };

  const importIngredientsCSV = (data) => setIngredients(data);
  const exportIngredientsCSV = () => ingredients;

  const getFinancialMetrics = async () => {
    try {
      const res = await dashboardAPI.financials();
      return {
        revenue: res.data.revenue,
        costOfGoods: res.data.cost_of_goods,
        profit: res.data.gross_profit,
        profitMargin: res.data.profit_margin,
      };
    } catch {
      const revenue = orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0);
      return { revenue, costOfGoods: 0, profit: revenue, profitMargin: 100 };
    }
  };

  const getReorderForecast = () =>
    ingredients.map(ing => ({
      ...ing,
      needsReorder: ing.stock < ing.minStock,
      avgDailyUsage: 5,
      projectedRunDays: ing.stock / 5,
      daysUntilReorder: (ing.stock / 5) - (ing.reorderLeadDays || 3),
      daysRemaining: ing.stock / 5,
    }));

  return (
    <OrderContext.Provider value={{
      orders, ingredients, menu, coupons,
      availableCoupons, usedCoupons, customerNotification,
      createOrder, updateOrderStatus, acknowledgeOrder, deleteOrder,
      deleteUsedCoupons, applyCoupon, dismissCustomerNotification,
      updateMenuStock, toggleMenuAvailability, updateIngredientStock,
      importIngredientsCSV, exportIngredientsCSV,
      getFinancialMetrics, getReorderForecast,
      loadOrders,
    }}>
      {children}
    </OrderContext.Provider>
  );
};
