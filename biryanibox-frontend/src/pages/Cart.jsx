import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, useAuth } from '../context/useContextHooks';
import { ordersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Plus, Minus, ArrowRight, ChevronLeft,
  Tag, CheckCircle, XCircle, Gift, Copy, TrendingUp, Loader, Package,
  MapPin, RefreshCw, Clock, ChefHat, Star, Utensils, CheckSquare, CreditCard,
} from 'lucide-react';

import heroBiryani   from '../assets/hero-biryani.png';
import muttonBiryani from '../assets/mutton-biryani.png';
import chickenTikka  from '../assets/chicken-tikka.png';
import rasmalai      from '../assets/rasmalai.png';
import heroImg       from '../assets/hero.png';

const IMAGE_MAP = { heroBiryani, muttonBiryani, chickenTikka, rasmalai, hero: heroImg };
const getItemImage = (item) => {
  if (item.image_url && item.image_url.startsWith('http')) return item.image_url;
  if (item.image && item.image.startsWith('http')) return item.image;
  if (item.image && IMAGE_MAP[item.image]) return IMAGE_MAP[item.image];
  if (item.category === 'Biryani')    return heroBiryani;
  if (item.category === 'Appetizers') return chickenTikka;
  if (item.category === 'Breads')     return chickenTikka;
  if (item.category === 'Curries')    return chickenTikka;
  if (item.category === 'Desserts')   return rasmalai;
  if (item.category === 'Dessert')    return rasmalai;
  if (item.category === 'Combos')     return muttonBiryani;
  return heroBiryani;
};

const genCode = (userId, cycle) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand  = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const seg   = (userId || 'USR').toString().slice(-4).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  return `BB-${seg}-C${cycle}-${rand(4)}`;
};

const KEY_HISTORY = (uid) => `bb_history_${uid}`;
const KEY_ACTIVE_ORDER = 'bb_active_order'; // persists last placed order for live tracking
const getHistory = (uid) => {
  try {
    const d = localStorage.getItem(KEY_HISTORY(uid));
    return d ? JSON.parse(d) : { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] };
  } catch {
    return { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] };
  }
};
const saveHistory = (uid, data) => localStorage.setItem(KEY_HISTORY(uid), JSON.stringify(data));

const saveActiveOrder = (data) => localStorage.setItem(KEY_ACTIVE_ORDER, JSON.stringify(data));
const loadActiveOrder = () => { try { const d = localStorage.getItem(KEY_ACTIVE_ORDER); return d ? JSON.parse(d) : null; } catch { return null; } };
const clearActiveOrder = () => localStorage.removeItem(KEY_ACTIVE_ORDER);

const SERVICE_FEE     = 2;
const REWARD_MILESTONE = 1000;
const REWARD_AMOUNT    = 200;

// ─── ORDER STATUS CONFIG ─────────────────────────────────────────────────────
const ORDER_STEPS = [
  { key: 'pending',            label: 'Placed',     icon: Package },
  { key: 'start_cooking',      label: 'Confirmed',  icon: CheckSquare },
  { key: 'start_cooking',      label: 'Preparing',  icon: ChefHat },
  { key: 'completed_cooking',  label: 'Ready',      icon: Utensils },
  { key: 'served',             label: 'Served',     icon: Star },
  { key: 'paid',               label: 'Done',       icon: CreditCard },
];

// Map actual status to step index
const STATUS_TO_STEP = {
  pending:           0,
  start_cooking:     2,
  completed_cooking: 3,
  served:            4,
  paid:              5,
};

// ─── LIVE ORDER TRACKER ───────────────────────────────────────────────────────
const LiveOrderTracker = ({ orderId, orderNumber, placedItems, grandTotal, newCoupon, onNewOrder }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const currentStep = order ? (STATUS_TO_STEP[order.status] ?? 0) : 0;
  const isDone = order?.status === 'paid' || order?.status === 'served';

  const fetchOrder = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await ordersAPI.getOne(orderId);
      if (res?.data) setOrder(res.data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Tracking fetch error:', e);
    } finally {
      if (manual) setRefreshing(false);
    }
  }, [orderId]);

  // Poll every 12 seconds; clear persisted order when done
  useEffect(() => {
    fetchOrder();
    const interval = setInterval(() => {
      if (!isDone) fetchOrder();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchOrder, isDone]);

  // When order completes, clear it from localStorage automatically
  useEffect(() => {
    if (isDone) clearActiveOrder();
  }, [isDone]);

  // Items to display — prefer live data, fall back to placed items snapshot
  const displayItems = (order?.items?.length ? order.items : placedItems) || [];
  const displayTotal = order?.total ?? grandTotal;
  const displayOrderNum = order?.order_number || orderNumber;

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Order Tracking</span>
          </div>
          <button
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="bg-secondary/40 border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between relative">
            {/* Track line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 z-0" />
            <motion.div
              className="absolute top-5 left-0 h-0.5 bg-primary z-0"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            {ORDER_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const done    = idx < currentStep;
              const active  = idx === currentStep;
              const pending = idx > currentStep;

              return (
                <div key={idx} className="flex flex-col items-center gap-2 z-10">
                  <motion.div
                    animate={active ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${done    ? 'bg-primary border-primary'           : ''}
                      ${active  ? 'bg-primary border-primary shadow-lg shadow-primary/40' : ''}
                      ${pending ? 'bg-secondary border-white/20'        : ''}`}
                  >
                    <Icon size={16} className={done || active ? 'text-white' : 'text-text-muted'} />
                  </motion.div>
                  <span className={`text-[9px] font-black uppercase tracking-widest
                    ${active  ? 'text-primary' : ''}
                    ${done    ? 'text-white/60' : ''}
                    ${pending ? 'text-text-muted' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Card */}
        <div className="bg-secondary/40 border border-white/10 rounded-3xl p-6 space-y-4">
          {/* Order ID + time */}
          <div className="flex items-start justify-between">
            <p className="text-primary font-black text-sm tracking-widest">
              {displayOrderNum ? `ORD_${displayOrderNum}` : 'Processing...'}
            </p>
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <Clock size={12} />
              <span>{lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {displayItems.map((item, i) => {
              const name = item.name || item.menu_item_id?.name || 'Item';
              const qty  = item.quantity || 1;
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{name}</span>
                  <span className="text-text-muted font-bold">×{qty}</span>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <span className="text-white/60 font-bold text-sm">Total</span>
            <span className="text-primary font-black text-lg">
              ${typeof displayTotal === 'number' ? displayTotal.toFixed(2) : '—'}
            </span>
          </div>
        </div>

        {/* New reward coupon unlocked */}
        <AnimatePresence>
          {newCoupon && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-gradient-to-br from-primary/20 to-yellow-500/10 border border-primary/40 rounded-3xl p-6 space-y-4"
            >
              <div className="text-3xl text-center">🎉</div>
              <h3 className="text-xl font-black text-white text-center">$200 Reward Unlocked!</h3>
              <p className="text-text-muted text-sm text-center">
                You crossed <span className="text-primary font-bold">${REWARD_MILESTONE}</span> in orders. Use this on your next order:
              </p>
              <div className="bg-bg-main/70 border border-primary/30 rounded-2xl p-4 text-center">
                <p className="text-primary font-black text-lg tracking-widest">{newCoupon.code}</p>
                <p className="text-text-muted text-xs mt-1">Saves up to ${REWARD_AMOUNT} · One-time use</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onNewOrder}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            + New Order
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-4 btn-primary rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            Back to Menu <ArrowRight size={14} />
          </button>
        </div>

        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-2"
          >
            <CheckCircle size={40} className="mx-auto text-green-400" />
            <p className="font-black text-white text-lg">Order Complete!</p>
            <p className="text-text-muted text-sm">Thank you for dining with us 🙏</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN CART COMPONENT ──────────────────────────────────────────────────────
const Cart = () => {
  const { cart, addToCart, removeFromCart, clearCart, total } = useCart();
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const userId    = user?._id || user?.id || user?.email || null;

  const [history,       setHistory]       = useState(() => userId ? getHistory(userId) : { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput,   setCouponInput]   = useState('');
  const [couponError,   setCouponError]   = useState('');
  const [copiedCode,    setCopiedCode]    = useState('');
  const [placing,       setPlacing]       = useState(false);
  const [newCoupon,     setNewCoupon]     = useState(null);

  // Tracking state — persisted to localStorage so user can return to tracker anytime
  const [placedOrderId,    setPlacedOrderId]    = useState(() => { const s = loadActiveOrder(); return s?.orderId    || null; });
  const [placedOrderNum,   setPlacedOrderNum]   = useState(() => { const s = loadActiveOrder(); return s?.orderNum   || ''; });
  const [placedItemsSnap,  setPlacedItemsSnap]  = useState(() => { const s = loadActiveOrder(); return s?.items      || []; });
  const [placedTotal,      setPlacedTotal]      = useState(() => { const s = loadActiveOrder(); return s?.total      || 0; });
  // showTracker: auto-true when returning to cart with an active order
  const [showTracker,      setShowTracker]      = useState(() => !!loadActiveOrder());

  useEffect(() => {
    if (userId) {
      setHistory(getHistory(userId));
    } else {
      setHistory({ runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] });
    }
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  }, [userId]);

  const runningTotal    = parseFloat((history.runningTotal + total).toFixed(2));
  const nextMilestone   = history.nextMilestone || REWARD_MILESTONE;
  const remainingToNext = Math.max(nextMilestone - runningTotal, 0);
  const isUnlocked      = runningTotal >= nextMilestone;
  const activeCoupon    = history.coupons?.find((c) => !c.used) || null;
  const discountAmt     = appliedCoupon ? Math.min(REWARD_AMOUNT, parseFloat(total.toFixed(2))) : 0;
  const grandTotal      = parseFloat((total + SERVICE_FEE - discountAmt).toFixed(2));

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCouponInput(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const input = couponInput.trim().toUpperCase();
    if (!input)        { setCouponError('Please enter a coupon code.'); return; }
    if (!userId)       { setCouponError('Please sign in to use coupons.'); return; }
    if (!activeCoupon) { setCouponError('No active coupon on your account.'); return; }
    if (activeCoupon.code.toUpperCase() !== input) {
      setCouponError('Invalid code. This coupon does not match your account.');
      return;
    }
    setAppliedCoupon(activeCoupon);
    setCouponInput('');
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponError(''); };

  const updateRewards = (orderTotal) => {
    if (!userId || orderTotal <= 0) return null;
    const current = getHistory(userId);
    const newTotal = parseFloat((current.runningTotal + orderTotal).toFixed(2));
    const newEntry = { date: new Date().toLocaleDateString(), amount: parseFloat(orderTotal.toFixed(2)), runningAfter: newTotal };
    let updatedCoupons = [...(current.coupons || [])];
    let newNextMilestone = current.nextMilestone || REWARD_MILESTONE;
    let newlyUnlocked = null;

    if (appliedCoupon) {
      updatedCoupons = updatedCoupons.map((c) =>
        c.code === appliedCoupon.code ? { ...c, used: true, usedAt: new Date().toISOString() } : c
      );
    }

    if (newTotal >= newNextMilestone) {
      while (newTotal >= newNextMilestone) {
        const cycle = Math.floor(newNextMilestone / REWARD_MILESTONE);
        const newCode = genCode(userId, cycle);
        if (!updatedCoupons.find((c) => c.cycle === cycle)) {
          const couponObj = { code: newCode, cycle, used: false, usedAt: null, generatedAt: new Date().toISOString(), rewardAmount: REWARD_AMOUNT };
          updatedCoupons.push(couponObj);
          newlyUnlocked = couponObj;
        }
        newNextMilestone += REWARD_MILESTONE;
      }
    }

    const visibleCoupons = updatedCoupons.filter((c) => !c.used);
    const updated = { runningTotal: newTotal, nextMilestone: newNextMilestone, entries: [...(current.entries || []), newEntry], coupons: visibleCoupons };
    saveHistory(userId, updated);
    setHistory(updated);
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    return newlyUnlocked;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      // Snapshot items before clearing cart
      const snapshot = cart.map(i => ({ name: i.name, quantity: i.quantity, unit_price: i.price }));

      const payload = {
        items: cart.map(i => ({ menu_item_id: i._id || i.id, quantity: i.quantity })),
        order_type: 'dine-in',
        customer_id: user?._id || user?.id,
        total: grandTotal,
      };
      const res = await ordersAPI.create(payload);
      const orderId  = res.data?._id || res.data?.order?._id;
      const orderNum = res.data?.order_number || res.data?.order?.order_number || ('BOX-' + Date.now().toString().slice(-5));

      const unlocked = updateRewards(grandTotal);
      setNewCoupon(unlocked);

      // Save snapshot for display while live order loads
      setPlacedItemsSnap(snapshot);
      setPlacedTotal(grandTotal);
      setPlacedOrderNum(orderNum);
      setPlacedOrderId(orderId);
      setShowTracker(true);

      // Persist so tracker is accessible after navigation/refresh
      saveActiveOrder({ orderId, orderNum, items: snapshot, total: grandTotal, placedAt: Date.now() });

      clearCart();
    } catch (err) {
      alert('Failed to place order: ' + err.message);
    } finally {
      setPlacing(false);
    }
  };

  const handleNewOrder = () => {
    clearActiveOrder(); // clear persisted order
    setPlacedOrderId(null);
    setPlacedOrderNum('');
    setPlacedItemsSnap([]);
    setPlacedTotal(0);
    setNewCoupon(null);
    setShowTracker(false);
  };

  // ── Once order placed → show live tracker ────────────────────────────────
  if (placedOrderId && showTracker) {
    return (
      <LiveOrderTracker
        orderId={placedOrderId}
        orderNumber={placedOrderNum}
        placedItems={placedItemsSnap}
        grandTotal={placedTotal}
        newCoupon={newCoupon}
        onNewOrder={handleNewOrder}
      />
    );
  }

  // ── Cart view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12">
      <div className="container max-w-4xl mx-auto">

        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-10 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Menu
        </button>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left column ── */}
          <div className="flex-1 space-y-8">
            <h1 className="text-4xl font-bold font-heading">Your Flavor Box</h1>

            {/* Spend Tracker */}
            {userId && (
              <div className="bg-secondary/30 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                    <TrendingUp size={14} className="text-primary" />
                    Rewards Tracker — $200 at ${REWARD_MILESTONE}
                  </div>
                  <span className="text-xs font-black text-primary">${history.runningTotal.toFixed(2)} spent</span>
                </div>

                {history.entries.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 text-[10px] font-black text-text-muted uppercase tracking-widest pb-1 border-b border-white/5">
                      <span>Date</span>
                      <span className="text-center">Amount</span>
                      <span className="text-right">Running Total</span>
                    </div>
                    {history.entries.map((e, i) => (
                      <div key={i} className="grid grid-cols-3 text-[11px]">
                        <span className="text-text-muted">{e.date}</span>
                        <span className="text-center text-white font-bold">+${e.amount.toFixed(2)}</span>
                        <span className="text-right text-primary font-bold">${e.runningAfter.toFixed(2)}</span>
                      </div>
                    ))}
                    {total > 0 && (
                      <div className="grid grid-cols-3 text-[11px] border-t border-white/5 pt-2">
                        <span className="text-green-400 font-bold">Now</span>
                        <span className="text-center text-green-400 font-bold">+${total.toFixed(2)}</span>
                        <span className="text-right text-green-400 font-bold">${runningTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {history.entries.length === 0 && total > 0 && (
                  <div className="grid grid-cols-3 text-[11px]">
                    <span className="text-green-400 font-bold">Now</span>
                    <span className="text-center text-green-400 font-bold">+${total.toFixed(2)}</span>
                    <span className="text-right text-green-400 font-bold">${runningTotal.toFixed(2)}</span>
                  </div>
                )}

                {history.entries.length === 0 && total === 0 && (
                  <p className="text-[11px] text-text-muted">Place your first order to start tracking. Earn a <span className="text-primary font-bold">$200 reward</span> at ${REWARD_MILESTONE}!</p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>Next reward at ${nextMilestone.toFixed(0)}</span>
                    <span className={isUnlocked ? 'text-green-400 font-black' : ''}>
                      {isUnlocked ? '✅ Reward unlocked!' : `$${remainingToNext.toFixed(2)} to go`}
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.min(((runningTotal % REWARD_MILESTONE) / REWARD_MILESTONE) * 100, 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${isUnlocked ? 'bg-green-500' : 'bg-gradient-to-r from-primary/60 to-primary'}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Active Coupon Banner */}
            <AnimatePresence>
              {activeCoupon && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-gradient-to-r from-primary/20 to-yellow-500/10 border border-primary/40 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Gift size={24} className="text-primary shrink-0" />
                    <div>
                      <p className="font-black text-white uppercase tracking-widest text-xs">
                        🎉 $200 Reward Ready!
                        <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-[9px] font-black">Milestone #{activeCoupon.cycle}</span>
                      </p>
                      <p className="text-text-muted text-xs mt-0.5">For <span className="text-primary font-bold">{user?.name || 'your account'}</span> · One-time use · Copy and paste below</p>
                    </div>
                  </div>
                  <div className="bg-bg-main/70 border border-primary/30 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">$200 Off Your Order</p>
                      <p className="font-black text-white text-base tracking-widest">{activeCoupon.code}</p>
                      <p className="text-[10px] text-text-muted mt-1">Saves up to ${REWARD_AMOUNT}</p>
                    </div>
                    <button onClick={() => handleCopy(activeCoupon.code)}
                      className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                      {copiedCode === activeCoupon.code ? <CheckCircle size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Not signed in */}
            {!userId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <Gift size={18} className="text-yellow-400 shrink-0" />
                <p className="text-yellow-400 text-xs font-bold flex-1">
                  Sign in to track spend &amp; earn a <strong>$200 reward</strong> when you hit $1,000 in total orders.
                </p>
                <button onClick={() => navigate('/auth')}
                  className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-yellow-500/30 transition-all">
                  Sign In
                </button>
              </motion.div>
            )}

            {/* Cart Items */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Active order banner — show if there's a persisted order to track */}
                    {placedOrderId && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/10 border border-primary/30 rounded-2xl p-5 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shrink-0" />
                          <div>
                            <p className="font-black text-white text-sm">Order in progress</p>
                            <p className="text-text-muted text-xs mt-0.5">
                              {placedOrderNum ? `ORD_${placedOrderNum}` : 'Tracking your order...'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowTracker(true)}
                            className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/80 transition-all"
                          >
                            Track Live
                          </button>
                          <button
                            onClick={() => { clearActiveOrder(); setPlacedOrderId(null); setPlacedOrderNum(""); setPlacedItemsSnap([]); setPlacedTotal(0); setShowTracker(false); }}
                            className="px-3 py-2 bg-white/5 border border-white/10 text-text-muted text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                          >
                            Dismiss
                          </button>
                        </div>
                      </motion.div>
                    )}
                    <div className="py-20 text-center bg-secondary/30 rounded-3xl border-2 border-dashed border-white/5">
                      <ShoppingBag size={48} className="mx-auto mb-4 text-text-muted opacity-20" />
                      <p className="text-text-muted font-bold uppercase tracking-widest text-xs">The box is empty</p>
                      <button onClick={() => navigate('/')} className="mt-6 text-primary font-bold hover:underline">Start adding masterpieces</button>
                    </div>
                  </motion.div>
                ) : cart.map((item) => {
                  const itemId = item._id || item.id;
                  return (
                    <motion.div key={itemId} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-6 bg-secondary/40 p-6 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-bg-main border border-white/10 shrink-0">
                        <img src={getItemImage(item)} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = heroBiryani; }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                        <p className="text-xs text-text-muted uppercase tracking-widest">{item.category}</p>
                        <p className="text-xs text-text-muted mt-1">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className="text-lg font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-3 bg-bg-main/50 p-1.5 rounded-full border border-white/10">
                          <button onClick={() => removeFromCart(itemId)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500 transition-colors"><Minus size={12} /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary transition-colors"><Plus size={12} /></button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: Summary ── */}
          {cart.length > 0 && (
            <div className="w-full lg:w-80 h-fit bg-secondary/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl sticky top-12 space-y-6">
              <h2 className="text-xl font-bold font-heading">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Subtotal</span><span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Service Fee</span><span>${SERVICE_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Delivery</span><span className="text-green-500 font-bold uppercase text-[10px]">Free</span>
                </div>
                {appliedCoupon && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between text-sm text-green-400 font-bold">
                    <span>Reward Coupon (-$200)</span><span>-${discountAmt.toFixed(2)}</span>
                  </motion.div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">${grandTotal.toFixed(2)}</span>
              </div>

              {/* Reward progress in summary */}
              {userId && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Rewards Progress</p>
                  <p className="text-sm font-black text-white">${runningTotal.toFixed(2)} / ${nextMilestone}</p>
                  <p className="text-[10px] text-text-muted">
                    {isUnlocked ? '✅ $200 reward ready!' : `$${remainingToNext.toFixed(2)} until $200 reward`}
                  </p>
                </div>
              )}

              {/* Coupon input */}
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                  <Tag size={14} className="text-primary" /> Coupon Code
                </div>
                {appliedCoupon ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-400 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-green-400 tracking-widest">{appliedCoupon.code}</p>
                        <p className="text-[10px] text-text-muted">$200 discount applied</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-text-muted hover:text-red-400 transition-colors ml-2">
                      <XCircle size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter coupon code..."
                      className="flex-1 bg-bg-main border border-white/10 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all tracking-widest placeholder:tracking-normal placeholder:text-text-muted/50" />
                    <button onClick={handleApplyCoupon}
                      className="px-4 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/80 transition-all">
                      Apply
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-400 text-[11px] font-bold flex items-center gap-1"><XCircle size={12} /> {couponError}</p>
                )}
                {activeCoupon && !appliedCoupon && (
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest animate-pulse">
                    🎉 $200 coupon ready — copy from above!
                  </p>
                )}
                {!activeCoupon && !isUnlocked && userId && (
                  <p className="text-[10px] text-text-muted">${remainingToNext.toFixed(2)} more to unlock $200 reward</p>
                )}
              </div>

              {/* Active order quick-access when cart also has items */}
              {placedOrderId && (
                <button
                  onClick={() => setShowTracker(true)}
                  className="w-full py-3 bg-white/5 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin size={14} /> Track Active Order
                </button>
              )}
              {/* Place Order button */}
              <button onClick={handlePlaceOrder} disabled={placing || cart.length === 0}
                className="btn-primary w-full py-5 flex items-center justify-center gap-3 group disabled:opacity-60">
                {placing
                  ? <><Loader size={20} className="animate-spin" /> Placing Order...</>
                  : <><Package size={20} />Place Order<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;