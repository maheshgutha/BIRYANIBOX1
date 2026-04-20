import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import { useOrders } from '../context/useContextHooks';
import { tablesAPI } from '../services/api';
import {
  ShoppingCart, Plus, Minus, CheckCircle, Bell, X,
  Package, User, Clock, DollarSign, MapPin, Truck,
  AlertCircle, Navigation, ArrowLeft, Phone, Mail,
  CreditCard, Banknote, Smartphone, ChevronRight,
} from 'lucide-react';

import heroBiryani   from '../assets/hero-biryani.png';
import muttonBiryani from '../assets/mutton-biryani.png';
import chickenTikka  from '../assets/chicken-tikka.png';
import rasmalai      from '../assets/rasmalai.png';

/* ─── Customer Notification Toast ────────────────────────────────────────── */
const CustomerNotificationToast = ({ notification, onDismiss }) => {
  if (!notification) return null;
  const totalItems = notification.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <AnimatePresence>
      <MotionDiv
        key="customer-notif"
        initial={{ opacity: 0, y: -80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -80, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed top-6 right-6 z-[9999] w-[420px] bg-[#1a1a0e] border border-primary/40 rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary via-yellow-400 to-primary animate-pulse" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary animate-bounce">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.25em]">🎉 Order Confirmed!</p>
                <h3 className="text-white font-black text-lg leading-tight">Your order is placed</h3>
              </div>
            </div>
            <button onClick={onDismiss} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-all">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: Package, label: 'Order ID', value: `#${notification.orderId.slice(-6).toUpperCase()}` },
              { icon: User,    label: 'Captain',  value: notification.captain },
              { icon: Clock,   label: 'Table',    value: notification.table },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <Icon size={12} className="text-primary mb-1" />
                <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">{label}</p>
                <p className="text-xs text-white font-bold truncate">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-2xl border border-white/5 divide-y divide-white/5 mb-4 max-h-40 overflow-y-auto">
            {notification.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 text-primary text-[10px] font-black rounded-full flex items-center justify-center">{item.quantity}</span>
                  <span className="text-xs text-white/90 font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest">
              <DollarSign size={14} className="text-primary" />
              Total — {totalItems} item{totalItems > 1 ? 's' : ''}
            </div>
            <span className="text-primary text-xl font-black">${notification.total.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-text-muted text-center mt-3 uppercase tracking-widest">Sent to Owner & Manager Dashboards</p>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
};

/* ─── POS Component ────────────────────────────────────────────────────────── */
const POS = ({ user, onBack }) => {
  const { menu, createOrder, customerNotification, dismissCustomerNotification } = useOrders();

  const [cart,                  setCart]                = useState([]);
  const [orderMode,             setOrderMode]           = useState('dinein'); // 'dinein' | 'pickup' | 'delivery'
  const [selectedTable,         setSelectedTable]       = useState('');
  const [availableTables,       setAvailableTables]     = useState([]);
  const [loadingTables,         setLoadingTables]       = useState(false);
  const [showSuccess,           setShowSuccess]         = useState(false);
  const [showPlaceOrderConfirm, setShowPlaceOrderConfirm] = useState(false);
  const [activeTab,             setActiveTab]           = useState('ALL');
  const [paymentMethod,         setPaymentMethod]       = useState(''); // mandatory — 'cash'|'card'|'upi'

  // Delivery fields
  const [customerName,    setCustomerName]    = useState('');
  const [customerEmail,   setCustomerEmail]   = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone,   setCustomerPhone]   = useState('');
  const [deliveryNotes,   setDeliveryNotes]   = useState('');
  const [distanceMiles,   setDistanceMiles]   = useState('');
  const [deliveryError,   setDeliveryError]   = useState('');

  const isDeliveryOrder = orderMode === 'delivery';
  const isPickupOrder   = orderMode === 'pickup';
  const RATE_PER_MILE   = 3;
  const dist            = parseFloat(distanceMiles) || 0;
  const deliveryFee     = isDeliveryOrder && dist > 0 ? Math.round(dist * RATE_PER_MILE) : 0;

  // Load available tables from API
  const loadTables = async () => {
    setLoadingTables(true);
    try {
      const res = await tablesAPI.getAvailable();
      const tables = res.data || [];
      setAvailableTables(tables);
      if (tables.length > 0 && !selectedTable) setSelectedTable(tables[0].label);
    } catch { setAvailableTables([]); }
    finally { setLoadingTables(false); }
  };

  useEffect(() => { loadTables(); }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(menu.map(i => i.category).filter(Boolean))];
    return cats;
  }, [menu]);

  // Reset delivery fields when mode changes
  useEffect(() => {
    if (!isDeliveryOrder) {
      setDeliveryAddress('');
      setDeliveryNotes('');
      setDistanceMiles('');
      setDeliveryError('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerName('');
    }
  }, [orderMode]);

  const getCategoryImage = (item) => {
    if (item.image_url && item.image_url.startsWith('http')) return item.image_url;
    if (item.image && item.image.startsWith('http')) return item.image;
    const imageMap = { heroBiryani, muttonBiryani, chickenTikka, rasmalai };
    if (item.image && imageMap[item.image]) return imageMap[item.image];
    if (item.category === 'Biryani')    return heroBiryani;
    if (item.category === 'Appetizers') return chickenTikka;
    if (item.category === 'Breads')     return chickenTikka;
    if (item.category === 'Curries')    return chickenTikka;
    if (item.category === 'Dessert' || item.category === 'Desserts') return rasmalai;
    if (item.category === 'Combos')     return muttonBiryani;
    return heroBiryani;
  };

  // ALL tab shows entire menu; otherwise filter by category
  const filteredMenu = activeTab === 'ALL'
    ? menu
    : menu.filter(i => (i.category || '').toLowerCase() === activeTab.toLowerCase());

  const isItemAvailable = (item) =>
    (item.is_available ?? item.available ?? true) && (item.stock == null || item.stock > 0);

  const addToCart = (item) => {
    if (!isItemAvailable(item)) return;
    const existing = cart.find(i => i.id === item.id);
    if (existing) setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    else setCart([...cart, { ...item, quantity: 1 }]);
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(i => i.id === itemId);
    if (!existing) return;
    if (existing.quantity > 1) setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    else setCart(cart.filter(i => i.id !== itemId));
  };

  const rawTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total    = rawTotal + deliveryFee;

  // ── Validation + open confirm modal ─────────────────────────────────────────
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    setDeliveryError('');

    // Payment method mandatory
    if (!paymentMethod) {
      setDeliveryError('Please select a payment method before placing the order.');
      return;
    }

    // Delivery-specific validation
    if (isDeliveryOrder) {
      if (!customerName.trim()) { setDeliveryError('Customer name is required for delivery.'); return; }
      if (!customerEmail.trim() || !/\S+@\S+\.\S+/.test(customerEmail)) { setDeliveryError('Valid email is required for delivery.'); return; }
      if (!deliveryAddress.trim()) { setDeliveryError('Delivery address is required.'); return; }
      if (!customerPhone.trim()) { setDeliveryError('Phone number is required for delivery.'); return; }
      const d = parseFloat(distanceMiles);
      if (!distanceMiles || isNaN(d) || d <= 0) { setDeliveryError('Please enter the delivery distance in miles.'); return; }
      if (d > 6) { setDeliveryError(`We only deliver within 6 miles. Entered distance (${d} mi) exceeds limit.`); return; }
    }

    setShowPlaceOrderConfirm(true);
  };

  const confirmPlaceOrder = async () => {
    setShowPlaceOrderConfirm(false);
    const tableForOrder = (isPickupOrder || isDeliveryOrder) ? 'Takeaway' : selectedTable;

    // ── FIX: include order_type inside deliveryParams so OrderContext picks it up ──
    const deliveryParams = {
      order_type:       isDeliveryOrder ? 'delivery' : isPickupOrder ? 'pickup' : 'dine-in',
      payment_method:   paymentMethod,
      ...(isDeliveryOrder ? {
        delivery_address: deliveryAddress.trim(),
        delivery_notes:   deliveryNotes.trim(),
        distance_km:      dist * 1.609, // convert miles → km for backend
        customer_email:   customerEmail.trim(),
        customer_phone:   customerPhone.trim(),
        customer_name:    customerName.trim(),
      } : {}),
    };

    const result = await createOrder(cart, tableForOrder, user.name, null, deliveryParams);
    if (!result || result.error) {
      setDeliveryError(result?.error || 'Failed to place order');
      return;
    }
    setCart([]);
    setPaymentMethod('');
    setDeliveryAddress('');
    setDeliveryNotes('');
    setDistanceMiles('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerName('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // ── Confirm modal color scheme per order type ────────────────────────────────
  const confirmColors = isDeliveryOrder
    ? { border: 'border-blue-500/40', bg: 'bg-blue-500/10', iconBg: 'bg-blue-500/20 text-blue-400', btn: 'bg-blue-600 hover:bg-blue-500', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
    : isPickupOrder
    ? { border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', iconBg: 'bg-yellow-500/20 text-yellow-400', btn: 'bg-yellow-500 hover:bg-yellow-400 text-black', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
    : { border: 'border-primary/30', bg: 'bg-primary/10', iconBg: 'bg-primary/20 text-primary', btn: 'bg-primary hover:bg-primary-hover', badge: 'bg-primary/20 text-primary border-primary/30' };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'upi',  label: 'UPI',  icon: Smartphone },
  ];

  return (
    <>
      <CustomerNotificationToast notification={customerNotification} onDismiss={dismissCustomerNotification} />

      {/* ── Confirm Modal ── */}
      <AnimatePresence>
        {showPlaceOrderConfirm && (
          <MotionDiv
            key="confirm-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
            onClick={() => setShowPlaceOrderConfirm(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-md bg-[#1a1a0e] border ${confirmColors.border} rounded-3xl p-8 shadow-2xl`}
            >
              {/* Colored top strip */}
              <div className={`h-1.5 w-full rounded-full mb-6 ${isDeliveryOrder ? 'bg-blue-500' : isPickupOrder ? 'bg-yellow-400' : 'bg-primary'}`} />

              {/* Header */}
              <div className="flex items-center gap-4 mb-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmColors.iconBg}`}>
                  {isDeliveryOrder ? <Truck size={24} /> : isPickupOrder ? <Package size={24} /> : <ShoppingCart size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {isPickupOrder ? '📦 Confirm Pickup Order' : isDeliveryOrder ? '🚚 Confirm Delivery Order' : '🍽 Confirm Dine-In Order'}
                  </h3>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${confirmColors.badge}`}>
                    {isDeliveryOrder ? `${dist} mi · $${deliveryFee} delivery fee` : isPickupOrder ? 'Counter pickup' : `Table ${selectedTable}`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-text-muted mb-5 ml-16">
                {isPickupOrder
                  ? 'Are you sure to confirm this pickup order? Customer will collect from counter.'
                  : isDeliveryOrder
                  ? `Are you sure to confirm this delivery order to ${deliveryAddress.slice(0, 40)}…?`
                  : `Are you sure to confirm this dine-in order for ${selectedTable}?`}
              </p>

              {/* Items */}
              <div className="bg-white/5 rounded-2xl border border-white/5 divide-y divide-white/5 mb-4 max-h-44 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 text-xs font-black rounded-full flex items-center justify-center ${confirmColors.iconBg}`}>{item.quantity}</span>
                      <span className="text-sm text-white font-medium">{item.name}</span>
                    </div>
                    <span className="text-primary font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery info */}
              {isDeliveryOrder && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 mb-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-text-muted">Name:</span> <span className="text-white font-bold ml-1">{customerName}</span></div>
                    <div><span className="text-text-muted">Phone:</span> <span className="text-white font-bold ml-1">{customerPhone}</span></div>
                    <div className="col-span-2"><span className="text-text-muted">Email:</span> <span className="text-white font-bold ml-1">{customerEmail}</span></div>
                    <div className="col-span-2 flex items-start gap-2">
                      <MapPin size={12} className="text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-white/80">{deliveryAddress}</span>
                    </div>
                    <div><span className="text-text-muted">Distance:</span> <span className="text-blue-400 font-bold ml-1">{dist} mi</span></div>
                    <div><span className="text-text-muted">Delivery fee:</span> <span className="text-blue-400 font-bold ml-1">${deliveryFee}</span></div>
                  </div>
                </div>
              )}

              {/* Payment method badge */}
              <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl">
                <CreditCard size={14} className="text-green-400" />
                <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Payment:</span>
                <span className="text-xs font-black text-white uppercase">{paymentMethod}</span>
              </div>

              {/* Total */}
              <div className={`flex justify-between items-center px-4 py-3 ${confirmColors.bg} border ${confirmColors.border} rounded-2xl mb-6`}>
                <span className="text-text-muted font-bold uppercase tracking-widest text-xs">Grand Total</span>
                <span className="text-white text-2xl font-black">${total.toFixed(2)}</span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowPlaceOrderConfirm(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-bold uppercase tracking-widest text-text-muted hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={confirmPlaceOrder}
                  className={`flex-1 py-3 ${confirmColors.btn} text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl transition-all`}>
                  ✓ Confirm Order
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-4 gap-8 h-[calc(100vh-160px)]">
        {/* ── Menu Area ── */}
        <div className="lg:col-span-3 space-y-5 overflow-y-auto pr-4 scrollbar-hide">

          {/* Header with back button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              {onBack && (
                <button onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-text-muted hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <div>
                <h2 className="text-3xl font-bold font-heading mb-0.5 text-white">Gourmet Selection</h2>
                <p className="text-text-muted text-sm font-medium">Add premium boxes to the active booking.</p>
              </div>
            </div>

            {/* Category tabs — with ALL option */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide w-full md:w-auto">
              {/* ALL tab */}
              <button onClick={() => setActiveTab('ALL')}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveTab(cat)}
                  className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Order Mode toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted shrink-0">Order Type:</span>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
                {[
                  { mode: 'dinein',   label: 'Dine-In',  icon: ShoppingCart },
                  { mode: 'pickup',   label: 'Pickup',   icon: Package      },
                  { mode: 'delivery', label: 'Delivery', icon: Truck        },
                ].map(({ mode, label, icon: Icon }) => (
                  <button key={mode}
                    onClick={() => { setOrderMode(mode); setDeliveryError(''); if (mode !== 'dinein') setSelectedTable('Takeaway'); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${orderMode === mode ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
              {orderMode === 'dinein' && (
                <button onClick={loadTables} className="text-white/30 hover:text-primary transition-colors" title="Refresh tables">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                </button>
              )}
            </div>

            {/* Pickup banner */}
            {isPickupOrder && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
                <Package size={16} className="text-yellow-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">Pickup Order</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Customer will collect from restaurant counter. No address needed.</p>
                </div>
              </div>
            )}

            {/* Table selector — Dine-In only */}
            {orderMode === 'dinein' && (
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted shrink-0">Table:</span>
                {loadingTables ? (
                  <span className="text-xs text-text-muted">Loading tables…</span>
                ) : availableTables.length === 0 ? (
                  <span className="text-xs text-red-400 font-bold">No tables available</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTables.map(t => (
                      <button key={t._id} onClick={() => setSelectedTable(t.label)}
                        className={`px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition-all border whitespace-nowrap font-bold ${selectedTable === t.label ? 'bg-primary text-white border-primary' : 'bg-transparent text-text-muted border-white/10 hover:border-white/30'}`}>
                        <span className={`inline-flex items-center gap-1.5 ${t.type === 'vip' ? 'text-yellow-400' : ''}`}>
                          {t.type === 'vip' && '⭐'} {t.label}
                          {t.captain_id && <span className="text-[9px] text-white/30 ml-1">({t.captain_id.name?.split(' ')[0]})</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Delivery Form ── */}
          <AnimatePresence>
            {isDeliveryOrder && (
              <MotionDiv
                key="delivery-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest mb-2">
                    <Truck size={15} /> Delivery Details
                    <span className="text-red-400 ml-1">— All fields required</span>
                  </div>

                  {/* Error */}
                  {deliveryError && (
                    <div className="flex items-start gap-2 bg-red-500/10 border-2 border-red-500/50 rounded-xl px-4 py-3 animate-pulse">
                      <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-400 font-bold">{deliveryError}</p>
                    </div>
                  )}

                  {/* Row 1: Name + Email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                        <User size={10} /> Customer Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={customerName}
                        onChange={e => { setCustomerName(e.target.value); setDeliveryError(''); }}
                        placeholder="Full name…"
                        className={`w-full bg-bg-main border p-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${!customerName && deliveryError ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 focus:border-blue-400'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                        <Mail size={10} /> Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={e => { setCustomerEmail(e.target.value); setDeliveryError(''); }}
                        placeholder="customer@email.com"
                        className={`w-full bg-bg-main border p-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${!customerEmail && deliveryError ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 focus:border-blue-400'}`}
                      />
                    </div>
                  </div>

                  {/* Row 2: Address (full width) */}
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                      <MapPin size={10} /> Delivery Address <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={e => { setDeliveryAddress(e.target.value); setDeliveryError(''); }}
                      placeholder="House No., Street, Area, Landmark, City…"
                      rows={2}
                      className={`w-full bg-bg-main border p-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none resize-none transition-colors ${!deliveryAddress && deliveryError ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 focus:border-blue-400'}`}
                    />
                  </div>

                  {/* Row 3: Phone + Distance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                        <Phone size={10} /> Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={e => { setCustomerPhone(e.target.value); setDeliveryError(''); }}
                        placeholder="+1 555 000 0000"
                        className={`w-full bg-bg-main border p-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${!customerPhone && deliveryError ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 focus:border-blue-400'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">
                        Distance (miles) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number" min="0.1" max="6" step="0.1"
                        value={distanceMiles}
                        onChange={e => { setDistanceMiles(e.target.value); setDeliveryError(''); }}
                        placeholder="e.g. 2.5"
                        className={`w-full bg-bg-main border p-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${dist > 6 ? 'border-red-500/50 bg-red-500/5' : !distanceMiles && deliveryError ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 focus:border-blue-400'}`}
                      />
                    </div>
                  </div>

                  {/* Delivery fee calc */}
                  {dist > 0 && (
                    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold border ${dist > 6 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                      <span className="flex items-center gap-1.5">
                        <Navigation size={11} />
                        {dist > 6 ? `${dist} mi exceeds 6 mi limit ✗` : `${dist} mi × $${RATE_PER_MILE}/mi`}
                      </span>
                      {dist <= 6 && <span>Delivery fee: ${deliveryFee}</span>}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Notes (optional)</label>
                    <input
                      value={deliveryNotes}
                      onChange={e => setDeliveryNotes(e.target.value)}
                      placeholder="Gate code, flat number, landmark…"
                      className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>

          {/* Menu grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {filteredMenu.map(item => {
                const available = isItemAvailable(item);
                return (
                  <MotionDiv
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={available ? { y: -8 } : {}}
                    onClick={() => available && addToCart(item)}
                    className={`rounded-3xl border p-5 flex flex-col gap-4 relative overflow-hidden transition-all ${available ? 'bg-secondary/40 border-white/5 cursor-pointer group hover:border-primary/50' : 'bg-white/3 border-white/5 cursor-not-allowed opacity-60'}`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary filter blur-3xl opacity-0 group-hover:opacity-10 transition-opacity" />
                    {!available && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span className="bg-red-600/90 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-red-500/50 shadow-lg rotate-[-10deg]">Unavailable</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="aspect-video bg-bg-main rounded-2xl mb-4 overflow-hidden relative border border-white/5">
                        <img src={getCategoryImage(item)} alt={item.name} className={`w-full h-full object-cover transition-transform duration-500 ${available ? 'group-hover:scale-110' : 'grayscale'}`} />
                        <div className="absolute bottom-2 right-2 bg-primary/20 backdrop-blur-md text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20">{item.category}</div>
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-lg font-bold leading-tight ${available ? 'text-white group-hover:text-primary transition-colors' : 'text-white/50'}`}>{item.name}</h3>
                        <p className="text-lg font-bold text-white">${item.price}</p>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">Authentic recipe crafted with premium saffron and heritage spices.</p>
                    </div>
                    <button disabled={!available}
                      className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${available ? 'bg-white/5 border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:border-primary' : 'bg-red-500/10 border border-red-500/20 text-red-400 cursor-not-allowed'}`}>
                      {available ? <><Plus size={16} /> Add to Box</> : 'Currently Unavailable'}
                    </button>
                  </MotionDiv>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Cart Sidebar ── */}
        <div className="lg:col-span-1 bg-secondary/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold font-heading text-white">Cart Summary</h3>
              <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-1">
                {isDeliveryOrder ? '🚴 Delivery Order' : isPickupOrder ? '📦 Pickup Order' : '🍽 Dine-In'}
              </p>
            </div>
            <span className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner relative">
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </span>
          </div>

          {/* Cart items */}
          <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-30 space-y-4">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center"><Plus size={32} /></div>
                <p className="text-xs font-bold uppercase tracking-widest">The Box is Empty</p>
              </div>
            ) : (
              cart.map(item => (
                <MotionDiv key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 group hover:border-primary/20 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-bg-main overflow-hidden border border-white/10 shrink-0">
                    <img src={getCategoryImage(item)} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    <p className="text-[10px] text-primary font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-bg-main/50 p-1 rounded-full border border-white/10">
                    <button onClick={e => { e.stopPropagation(); removeFromCart(item.id); }}
                      className="w-6 h-6 text-white flex items-center justify-center rounded-full hover:bg-red-500 transition-colors"><Minus size={11} /></button>
                    <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                    <button onClick={e => { e.stopPropagation(); addToCart(item); }}
                      className="w-6 h-6 text-white flex items-center justify-center rounded-full hover:bg-primary transition-colors"><Plus size={11} /></button>
                  </div>
                </MotionDiv>
              ))
            )}
          </div>

          {/* ── Mandatory Payment Method ── */}
          {cart.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1">
                <CreditCard size={10} /> Payment Method <span className="text-red-400">*</span>
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === id ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/30'}`}>
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
              {!paymentMethod && deliveryError?.includes('payment') && (
                <p className="text-red-400 text-[10px] font-bold mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> Select a payment method
                </p>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-text-muted font-bold uppercase tracking-wider">
                <span>Table / Type</span>
                <span className="text-white">{isDeliveryOrder ? 'Delivery' : isPickupOrder ? 'Pickup' : selectedTable}</span>
              </div>
              {isDeliveryOrder && dist > 0 && dist <= 6 && (
                <div className="flex justify-between items-center text-xs text-blue-400 font-bold">
                  <span className="flex items-center gap-1"><Truck size={10} /> Delivery ({dist} mi)</span>
                  <span>+${deliveryFee}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold text-white font-heading">
                <span>Settlement</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Error (non-delivery) */}
            {deliveryError && !isDeliveryOrder && (
              <div className="flex items-start gap-2 bg-red-500/10 border-2 border-red-500/50 rounded-xl px-3 py-2">
                <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-red-400 font-bold">{deliveryError}</p>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || (isDeliveryOrder && dist > 6)}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all shadow-xl text-sm ${cart.length === 0 || (isDeliveryOrder && dist > 6) ? 'bg-white/5 text-text-muted cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-primary to-yellow-500 text-white hover:shadow-primary/30 hover:scale-[1.02] active:scale-100'}`}>
              {isDeliveryOrder ? <Truck size={20} /> : isPickupOrder ? <Package size={20} /> : <CheckCircle size={20} />}
              {isDeliveryOrder ? 'PLACE DELIVERY ORDER' : isPickupOrder ? 'PLACE PICKUP ORDER' : 'PLACE AN ORDER'}
            </button>
          </div>

          {/* Success toast */}
          <AnimatePresence>
            {showSuccess && (
              <MotionDiv
                initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-x-4 bottom-6 bg-green-500 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-4 z-50 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/50 animate-pulse" />
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><CheckCircle size={24} /></div>
                <div className="flex-1">
                  <p className="font-bold text-sm tracking-tight">{isDeliveryOrder ? 'Delivery Order Placed!' : isPickupOrder ? 'Pickup Order Placed!' : 'Order Placed!'}</p>
                  <p className="text-[10px] font-medium opacity-90 uppercase tracking-widest">
                    {isDeliveryOrder ? 'Rider notified when owner marks Paid' : isPickupOrder ? 'Ready at counter when prepared' : 'Sent to Owner & Manager Dashboards'}
                  </p>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default POS;