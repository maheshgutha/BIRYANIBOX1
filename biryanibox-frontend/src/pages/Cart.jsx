import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, useAuth } from '../context/useContextHooks';
import { ordersAPI, tablesAPI, giftCardsAPI, loyaltyAPI, deliveryPricingAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Plus, Minus, ArrowRight, ChevronLeft,
  Tag, CheckCircle, XCircle, Gift, Copy, TrendingUp, Loader, Package,
  MapPin, RefreshCw, Clock, ChefHat, Star, Utensils, CheckSquare, CreditCard,
  UtensilsCrossed, Truck, ChevronsDown, ChevronDown, ChevronUp,
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
  if (item.category === 'Desserts' || item.category === 'Dessert') return rasmalai;
  if (item.category === 'Combos')     return muttonBiryani;
  return heroBiryani;
};

const genCode = (userId, cycle) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand  = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const seg   = (userId || 'USR').toString().slice(-4).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  return `BB-${seg}-C${cycle}-${rand(4)}`;
};

const KEY_HISTORY    = (uid) => `bb_history_${uid}`;
const KEY_ACTIVE_ORDER = 'bb_active_order';
const getHistory = (uid) => {
  try {
    const d = localStorage.getItem(KEY_HISTORY(uid));
    return d ? JSON.parse(d) : { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] };
  } catch { return { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] }; }
};
const saveHistory    = (uid, data) => localStorage.setItem(KEY_HISTORY(uid), JSON.stringify(data));
const saveActiveOrder = (data) => localStorage.setItem(KEY_ACTIVE_ORDER, JSON.stringify(data));
const loadActiveOrder = () => { try { const d = localStorage.getItem(KEY_ACTIVE_ORDER); return d ? JSON.parse(d) : null; } catch { return null; } };
const clearActiveOrder = () => localStorage.removeItem(KEY_ACTIVE_ORDER);

const SERVICE_FEE      = 2;
const REWARD_MILESTONE = 1000;
const REWARD_AMOUNT    = 200;

// ── Order steps — differ by order type ────────────────────────────────────────
const DINEIN_STEPS = [
  { key: 'pending_confirmation', label: 'Confirming', icon: Clock     },
  { key: 'pending',              label: 'Placed',     icon: Package    },
  { key: 'start_cooking',        label: 'Preparing',  icon: ChefHat    },
  { key: 'completed_cooking',    label: 'Ready',      icon: Utensils   },
  { key: 'served',               label: 'Served',     icon: Star       },
  { key: 'paid',                 label: 'Done',       icon: CreditCard },
];
const DELIVERY_STEPS = [
  { key: 'pending',           label: 'Placed',    icon: Package    },
  { key: 'start_cooking',     label: 'Preparing', icon: ChefHat    },
  { key: 'completed_cooking', label: 'Ready',     icon: Utensils   },
  { key: 'dispatched',        label: 'Dispatched',icon: Truck      },
  { key: 'delivered',         label: 'Delivered', icon: MapPin     },
  { key: 'paid',              label: 'Paid',      icon: CreditCard },
];
const PICKUP_STEPS = [
  { key: 'pending',           label: 'Order Placed',   icon: Package    },
  { key: 'start_cooking',     label: 'Preparing',      icon: ChefHat    },
  { key: 'completed_cooking', label: 'Ready to Pickup', icon: Utensils  },
  { key: 'dispatched',        label: 'At Counter',     icon: MapPin     },
  { key: 'paid',              label: 'Completed',      icon: CheckCircle},
];
const DINEIN_STATUS_STEP   = { pending_confirmation:0, pending:1, start_cooking:2, completed_cooking:3, served:4, paid:5 };
const DELIVERY_STATUS_STEP = { pending:0, start_cooking:1, completed_cooking:2, dispatched:3, delivered:4, paid:5 };
const PICKUP_STATUS_STEP   = { pending:0, start_cooking:1, completed_cooking:2, dispatched:3, paid:4 };
const ORDER_STEPS    = DINEIN_STEPS;   // default fallback
const STATUS_TO_STEP = DINEIN_STATUS_STEP;

// ── Live Order Tracker ─────────────────────────────────────────────────────────
// inline=true → compact banner inside cart page; inline=false → full-page view
const LiveOrderTracker = ({ orderId, orderNumber, placedItems, grandTotal, newCoupon, onNewOrder, orderType, knockBell = true, inline = false, onGoToBooking }) => {
  const navigate  = useNavigate();
  const [order,      setOrder]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh,setLastRefresh]= useState(new Date());
  const [collapsed,  setCollapsed]  = useState(false);

  // Pick correct step config based on order type
  const ot = order?.order_type || orderType || 'dine-in';
  const steps    = ot === 'delivery' ? DELIVERY_STEPS : ot === 'pickup' ? PICKUP_STEPS : DINEIN_STEPS;
  const stepMap  = ot === 'delivery' ? DELIVERY_STATUS_STEP : ot === 'pickup' ? PICKUP_STATUS_STEP : DINEIN_STATUS_STEP;
  const currentStep = order ? (stepMap[order.status] ?? 0) : 0;
  const isDone      = order?.status === 'paid' || order?.status === 'served' || order?.status === 'delivered';

  const fetchOrder = useCallback(async (manual = false) => {
    if (!orderId) return;
    if (manual) setRefreshing(true);
    try {
      const res = await ordersAPI.getOne(orderId);
      if (res?.data) setOrder(res.data);
      setLastRefresh(new Date());
    } catch {}
    finally { if (manual) setRefreshing(false); }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const id = setInterval(() => { if (!isDone) fetchOrder(); }, 12000);
    return () => clearInterval(id);
  }, [fetchOrder, isDone]);

  useEffect(() => { if (isDone) clearActiveOrder(); }, [isDone]);

  const displayItems   = (order?.items?.length ? order.items : placedItems) || [];
  // Pickup-specific status message (delivery style)
  const pickupStatusMsg = {
    pending:           '⏳ Order received — kitchen will start shortly',
    start_cooking:     '🔥 Chef is preparing your order',
    completed_cooking: '✅ Your order is ready at the counter!',
    dispatched:        '📦 Order is packed and waiting at the counter',
    paid:              '🎉 Picked up! Thank you for choosing Biryani Box',
  };
  const displayTotal   = order?.total ?? grandTotal;
  const displayOrderNum = order?.order_number || orderNumber;

  // ── INLINE mode: compact tracker banner shown inside the cart page ──────────
  if (inline) {
    return (
      <div className="bg-secondary/40 border border-primary/30 rounded-3xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
              <MapPin size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Live Order Tracking</p>
              <p className="text-xs text-white/60 font-bold">{displayOrderNum ? `#${displayOrderNum}` : 'Processing…'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchOrder(true)} disabled={refreshing}
              className="text-primary/60 hover:text-primary transition-colors">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setCollapsed(c => !c)}
              className="text-white/30 hover:text-white transition-colors">
              {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Progress bar */}
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10 z-0" />
                  <motion.div className="absolute top-4 left-0 h-0.5 bg-primary z-0"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8 }} />
                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const done   = idx < currentStep;
                    const active = idx === currentStep;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5 z-10">
                        <motion.div animate={active ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-primary border-primary' : active ? 'bg-primary border-primary shadow-lg shadow-primary/40' : 'bg-secondary border-white/20'}`}>
                          <Icon size={13} className={done || active ? 'text-white' : 'text-text-muted'} />
                        </motion.div>
                        <span className={`text-[8px] font-black uppercase tracking-wider ${active ? 'text-primary' : done ? 'text-white/50' : 'text-text-muted'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Items summary */}
                <div className="bg-white/5 rounded-2xl p-3 space-y-1.5">
                  {displayItems.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-white/70">{item.name || 'Item'}</span>
                      <span className="text-text-muted font-bold">×{item.quantity || 1}</span>
                    </div>
                  ))}
                  {displayItems.length > 3 && (
                    <p className="text-[10px] text-text-muted">+{displayItems.length - 3} more items</p>
                  )}
                  <div className="border-t border-white/10 pt-1.5 flex justify-between font-black text-xs">
                    <span className="text-white/50">Total</span>
                    <span className="text-primary">${typeof displayTotal === 'number' ? displayTotal.toFixed(2) : '—'}</span>
                  </div>
                </div>

                {/* Pickup/Delivery status message */}
                {order && ot === 'pickup' && order.status && pickupStatusMsg[order.status] && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-primary font-bold text-center">
                    {pickupStatusMsg[order.status]}
                  </div>
                )}

                {/* Order type color badge */}
                {(() => {
                  const ts = { 'dine-in': { label: '🍽 Dine-In', cls: 'bg-purple-500/20 border-purple-500/40 text-purple-300' }, pickup: { label: '📦 Pickup', cls: 'bg-amber-500/20 border-amber-500/40 text-amber-300' }, delivery: { label: '🚗 Delivery', cls: 'bg-blue-500/20 border-blue-500/40 text-blue-300' } };
                  const style = ts[ot] || ts['dine-in'];
                  return (
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${style.cls}`}>{style.label}</span>
                    </div>
                  );
                })()}

                {/* Delivery door instruction */}
                {ot === 'delivery' && (
                  <div className={`rounded-xl px-3 py-2 border text-[11px] font-bold text-center ${knockBell ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/20 text-white/60'}`}>
                    {knockBell ? '🔔 Rider will ring bell / knock on door' : '🤫 Rider will leave at door — Do Not Disturb'}
                  </div>
                )}

                {/* Pending confirmation banner */}
                {order?.status === 'pending_confirmation' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-400 font-bold text-center animate-pulse">
                    ⏰ Waiting for restaurant confirmation — up to 10 minutes. Please hold on!
                  </div>
                )}

                {isDone && (
                  <div className="flex items-center gap-2 text-green-400 text-xs font-black">
                    <CheckCircle size={14} /> Order Complete! Thank you 🙏
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {onGoToBooking && (
                    <button onClick={onGoToBooking}
                      className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-primary/80 transition-all">
                      <ChevronsDown size={13} /> Go to Booking
                    </button>
                  )}
                  {/* <button onClick={() => navigate('/menu/')}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5">
                    + Add Items <ArrowRight size={12} />
                  </button> */}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── FULL PAGE mode (when cart is empty and only tracking is shown) ──────────
  return (
    <div className="min-h-screen bg-bg-main text-white pt-28 px-6 pb-12 md:px-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Order Tracking</span>
          </div>
          <button onClick={() => fetchOrder(true)} disabled={refreshing}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Progress */}
        <div className="bg-secondary/40 border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 z-0" />
            <motion.div className="absolute top-5 left-0 h-0.5 bg-primary z-0"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.8 }} />
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const done    = idx < currentStep;
              const active  = idx === currentStep;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 z-10">
                  <motion.div animate={active ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-primary border-primary' : active ? 'bg-primary border-primary shadow-lg shadow-primary/40' : 'bg-secondary border-white/20'}`}>
                    <Icon size={16} className={done || active ? 'text-white' : 'text-text-muted'} />
                  </motion.div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-primary' : done ? 'text-white/60' : 'text-text-muted'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
         
        {/* Pickup status message (full page) */}
        {order && ot === 'pickup' && order.status && pickupStatusMsg[order.status] && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 text-sm text-primary font-black text-center">
            {pickupStatusMsg[order.status]}
          </div>
        )}

        {/* Order type color badge (full page) */}
        {(() => {
          const ts = { 'dine-in': { label: '🍽 Dine-In', cls: 'bg-purple-500/20 border-purple-500/40 text-purple-300' }, pickup: { label: '📦 Pickup', cls: 'bg-amber-500/20 border-amber-500/40 text-amber-300' }, delivery: { label: '🚗 Delivery', cls: 'bg-blue-500/20 border-blue-500/40 text-blue-300' } };
          const style = ts[ot] || ts['dine-in'];
          return (
            <div className="flex justify-center">
              <span className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${style.cls}`}>{style.label}</span>
            </div>
          );
        })()}

        {/* Delivery door instruction (full page) */}
        {ot === 'delivery' && (
          <div className={`rounded-2xl px-5 py-3 border text-sm font-bold text-center ${knockBell ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/20 text-white/60'}`}>
            {knockBell ? '🔔 Rider will ring bell / knock on door' : '🤫 Rider will leave at door — Do Not Disturb'}
          </div>
        )}

        {/* Order card */}
        <div className="bg-secondary/40 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <p className="text-primary font-black text-sm tracking-widest">{displayOrderNum ? `ORD_${displayOrderNum}` : 'Processing...'}</p>
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <Clock size={12} />
              <span>{lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <div className="space-y-2">
            {displayItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white/80">{item.name || item.menu_item_id?.name || 'Item'}</span>
                <span className="text-text-muted font-bold">×{item.quantity || 1}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <span className="text-white/60 font-bold text-sm">Total</span>
            <span className="text-primary font-black text-lg">${typeof displayTotal === 'number' ? displayTotal.toFixed(2) : '—'}</span>
          </div>
        </div>

        <AnimatePresence>
          {newCoupon && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-gradient-to-br from-primary/20 to-yellow-500/10 border border-primary/40 rounded-3xl p-6 space-y-4">
              <div className="text-3xl text-center">🎉</div>
              <h3 className="text-xl font-black text-white text-center">$200 Reward Unlocked!</h3>
              <p className="text-text-muted text-sm text-center">You crossed <span className="text-primary font-bold">${REWARD_MILESTONE}</span> in orders!</p>
              <div className="bg-bg-main/70 border border-primary/30 rounded-2xl p-4 text-center">
                <p className="text-primary font-black text-lg tracking-widest">{newCoupon.code}</p>
                <p className="text-text-muted text-xs mt-1">Saves up to ${REWARD_AMOUNT} · One-time use</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isDone && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-2">
            <CheckCircle size={40} className="mx-auto text-green-400" />
            <p className="font-black text-white text-lg">Order Complete!</p>
            <p className="text-text-muted text-sm">Thank you for dining with us 🙏</p>
          </motion.div>
        )}

        <div className="flex gap-4">
          <button onClick={onNewOrder} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            + New Order
          </button>
          <button onClick={() => navigate('/')} className="flex-1 py-4 btn-primary rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
            Back to Menu <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Order Success Banner ───────────────────────────────────────────────────────
const ORDER_TYPE_STYLES = {
  dinein:   { label: '🍽 Dine-In',   bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300' },
  pickup:   { label: '📦 Pickup',    bg: 'bg-amber-500/20',  border: 'border-amber-500/40',  text: 'text-amber-300'  },
  delivery: { label: '🚗 Delivery',  bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   text: 'text-blue-300'   },
};

const OrderSuccessBanner = ({ orderNum, orderType = 'dinein', knockBell = true, onTrack, onNewOrder }) => {
  const typeStyle = ORDER_TYPE_STYLES[orderType] || ORDER_TYPE_STYLES.dinein;
  return (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-green-500/10 border border-green-500/30 rounded-3xl p-8 text-center space-y-4">
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
      <CheckCircle size={56} className="mx-auto text-green-400" />
    </motion.div>
    <h2 className="text-2xl font-black text-white">Order Placed Successfully!</h2>
    <p className="text-white/60">Your order <span className="text-primary font-black">#{orderNum}</span> is confirmed and is being processed.</p>

    {/* Order type color badge */}
    <div className="flex justify-center">
      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${typeStyle.bg} ${typeStyle.border} ${typeStyle.text}`}>
        {typeStyle.label}
      </span>
    </div>

    {/* Delivery: show door instruction */}
    {orderType === 'delivery' && (
      <div className={`rounded-xl px-4 py-3 border text-xs font-bold text-center ${knockBell ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/20 text-white/60'}`}>
        {knockBell ? '🔔 Rider will ring bell / knock on door' : '🤫 Rider will leave at door — Do Not Disturb'}
      </div>
    )}

    <div className="flex gap-3 justify-center mt-4">
      <button onClick={onTrack} className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-primary-hover transition-all">
        Track Order
      </button>
      <button onClick={onNewOrder} className="px-8 py-3 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-white/10 transition-all">
        New Order
      </button>
    </div>
  </motion.div>
  );
};

// ── Main Cart ─────────────────────────────────────────────────────────────────
const Cart = () => {
  const { cart, addToCart, removeFromCart, clearCart, total } = useCart();
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const userId    = user?._id || user?.id || user?.email || null;
  const bookingRef = useRef(null);

  const [history,       setHistory]       = useState(() => userId ? getHistory(userId) : { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput,   setCouponInput]   = useState('');
  const [couponError,   setCouponError]   = useState('');
  const [placing,       setPlacing]       = useState(false);
  const [newCoupon,     setNewCoupon]     = useState(null);
  const [orderMode,     setOrderMode]     = useState('dinein'); // 'dinein' | 'takeaway'
  const [selectedTable, setSelectedTable] = useState(null);
  const [availTables,   setAvailTables]   = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [deliveryAddr,  setDeliveryAddr]  = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [knockBell,     setKnockBell]     = useState(true);  // true = ring bell, false = do not disturb
  const [orderError,    setOrderError]    = useState('');
  const [pickupExtraItems, setPickupExtraItems] = useState(''); // extra items for pickup confirmation
  const [paymentMethod, setPaymentMethod] = useState('');   // 'cash' | 'card' | 'upi'

  // ── Delivery pricing (dynamic) ────────────────────────────────────────────
  const [pricingData,    setPricingData]    = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError,   setPricingError]   = useState('');
  const pricingTimerRef = useRef(null);

  // Gift card state
  const [giftInput,      setGiftInput]      = useState('');
  const [giftError,      setGiftError]      = useState('');
  const [appliedGift,    setAppliedGift]    = useState(null); // { code, balance, applied }
  const [giftLoading,    setGiftLoading]    = useState(false);
  const [giftAmountInput,setGiftAmountInput]= useState(''); // partial amount user wants to use

  // Loyalty tier discount
  const [loyaltyTier,   setLoyaltyTier]   = useState(null); // 'Bronze'|'Silver'|'Gold'
  const [tierPct,       setTierPct]       = useState(0);

  // Success state
  const [showSuccess,      setShowSuccess]      = useState(false);
  const [placedOrderId,    setPlacedOrderId]    = useState(() => { const s = loadActiveOrder(); return s?.orderId  || null; });
  const [placedOrderNum,   setPlacedOrderNum]   = useState(() => { const s = loadActiveOrder(); return s?.orderNum || ''; });
  const [placedItemsSnap,  setPlacedItemsSnap]  = useState(() => { const s = loadActiveOrder(); return s?.items   || []; });
  const [placedTotal,      setPlacedTotal]      = useState(() => { const s = loadActiveOrder(); return s?.total   || 0; });
  // showTracker always starts false — user must explicitly click "Track Order" on the success banner
  // This prevents auto-redirecting to tracker when user just navigates to /cart
  const [showTracker, setShowTracker] = useState(false);
  const [placedOrderType,  setPlacedOrderType]  = useState('dinein');
  const [placedKnockBell,  setPlacedKnockBell]  = useState(true);

  useEffect(() => {
    if (userId) setHistory(getHistory(userId));
    setAppliedCoupon(null); setCouponInput(''); setCouponError('');
  }, [userId]);

  // Load loyalty tier for discount
  useEffect(() => {
    if (!user) return;
    const uid = user._id || user.id;
    loyaltyAPI.get(uid).then(r => {
      const tier = r?.current_tier?.name || (r?.points >= 3000 ? 'Gold' : r?.points >= 1000 ? 'Silver' : 'Bronze');
      setLoyaltyTier(tier);
      const pct = tier === 'Gold' ? 15 : tier === 'Silver' ? 10 : 5;
      setTierPct(pct);
    }).catch(() => { setLoyaltyTier(null); setTierPct(0); });
  }, [user]);

  // ── Auto-calculate delivery fee when address changes (debounced 800ms) ─────
  useEffect(() => {
    if (orderMode !== 'delivery') { setPricingData(null); setPricingError(''); return; }
    if (!deliveryAddr || deliveryAddr.trim().length < 8) { setPricingData(null); setPricingError(''); return; }
    clearTimeout(pricingTimerRef.current);
    pricingTimerRef.current = setTimeout(async () => {
      setPricingLoading(true); setPricingError('');
      try {
        const res = await deliveryPricingAPI.calculate(deliveryAddr.trim(), total);
        setPricingData(res.data);
      } catch (err) {
        setPricingError(err.message || 'Could not calculate delivery fee.');
        setPricingData(null);
      } finally { setPricingLoading(false); }
    }, 800);
    return () => clearTimeout(pricingTimerRef.current);
  }, [deliveryAddr, orderMode, total]);

  // Reset pricing when switching away from delivery mode
  useEffect(() => {
    if (orderMode !== 'delivery') { setPricingData(null); setPricingError(''); }
  }, [orderMode]);

  // Load available tables when dine-in is selected
  useEffect(() => {
    if (orderMode === 'dinein') {
      setTablesLoading(true);
      tablesAPI.getAvailable()
        .then(r => { setAvailTables(r.data || []); setSelectedTable(null); })
        .catch(() => setAvailTables([]))
        .finally(() => setTablesLoading(false));
    } else {
      setSelectedTable('Takeaway');
      setAvailTables([]);
    }
  }, [orderMode]);

  const runningTotal    = parseFloat((history.runningTotal + total).toFixed(2));
  const nextMilestone   = history.nextMilestone || REWARD_MILESTONE;
  const remainingToNext = Math.max(nextMilestone - runningTotal, 0);
  const isUnlocked      = runningTotal >= nextMilestone;
  const activeCoupon    = history.coupons?.find(c => !c.used) || null;
  const couponDiscAmt   = appliedCoupon ? Math.min(REWARD_AMOUNT, parseFloat(total.toFixed(2))) : 0;
  const giftDiscAmt     = appliedGift   ? Math.min(appliedGift.applied, parseFloat((total - couponDiscAmt).toFixed(2))) : 0;
  const tierDiscAmt     = tierPct > 0   ? parseFloat(((total - couponDiscAmt - giftDiscAmt) * tierPct / 100).toFixed(2)) : 0;
  const discountAmt     = couponDiscAmt; // keep for legacy coupon display
  const deliveryFee     = (orderMode === 'delivery' && pricingData) ? (pricingData.deliveryFee || 0) : 0;
  const grandTotal      = parseFloat((total + SERVICE_FEE + deliveryFee - couponDiscAmt - giftDiscAmt - tierDiscAmt).toFixed(2));

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCouponInput(code);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const input = couponInput.trim().toUpperCase();
    if (!input) { setCouponError('Please enter your reward code.'); return; }
    if (!userId) { setCouponError('Please sign in to use rewards.'); return; }
    if (!activeCoupon) { setCouponError('No active reward found on your account.'); return; }
    if (activeCoupon.code.toUpperCase() !== input) { setCouponError('Invalid reward code — check your Rewards Tracker.'); return; }
    setAppliedCoupon(activeCoupon);
    setCouponInput('');
  };

  const handleApplyGift = async () => {
    setGiftError(''); setGiftLoading(true);
    const code = giftInput.trim().toUpperCase();
    if (!code) { setGiftError('Enter a gift card code.'); setGiftLoading(false); return; }
    try {
      const r = await giftCardsAPI.validate(code);
      const balance = r?.balance || r?.data?.balance || 0;
      if (balance <= 0) { setGiftError('Gift card has no balance or is invalid.'); setGiftLoading(false); return; }
      // Default amount = min(balance, grandTotal) — user can change it
      const suggested = parseFloat(Math.min(balance, grandTotal).toFixed(2));
      setAppliedGift({ code, balance, applied: suggested });
      setGiftAmountInput(suggested.toFixed(2));
      setGiftInput('');
    } catch {
      setGiftError('Invalid or expired gift card.');
    } finally { setGiftLoading(false); }
  };

  // Update the applied gift amount when user changes the amount input
  const handleGiftAmountChange = (val) => {
    setGiftAmountInput(val);
    const amt = parseFloat(val);
    if (!isNaN(amt) && amt > 0 && appliedGift) {
      const clamped = parseFloat(Math.min(amt, appliedGift.balance).toFixed(2));
      setAppliedGift(prev => ({ ...prev, applied: clamped }));
    }
  };

  const updateRewards = (orderTotal) => {
    if (!userId || orderTotal <= 0) return null;
    const current = getHistory(userId);
    const newTotal = parseFloat((current.runningTotal + orderTotal).toFixed(2));
    const newEntry = { date: new Date().toLocaleDateString(), amount: parseFloat(orderTotal.toFixed(2)), runningAfter: newTotal };
    let updatedCoupons = [...(current.coupons || [])];
    let newNextMilestone = current.nextMilestone || REWARD_MILESTONE;
    let newlyUnlocked = null;
    if (appliedCoupon) {
      updatedCoupons = updatedCoupons.map(c => c.code === appliedCoupon.code ? { ...c, used: true, usedAt: new Date().toISOString() } : c);
    }
    if (newTotal >= newNextMilestone) {
      while (newTotal >= newNextMilestone) {
        const cycle = Math.floor(newNextMilestone / REWARD_MILESTONE);
        const newCode = genCode(userId, cycle);
        if (!updatedCoupons.find(c => c.cycle === cycle)) {
          const couponObj = { code: newCode, cycle, used: false, usedAt: null, generatedAt: new Date().toISOString(), rewardAmount: REWARD_AMOUNT };
          updatedCoupons.push(couponObj);
          newlyUnlocked = couponObj;
        }
        newNextMilestone += REWARD_MILESTONE;
      }
    }
    const visibleCoupons = updatedCoupons.filter(c => !c.used);
    const updated = { runningTotal: newTotal, nextMilestone: newNextMilestone, entries: [...(current.entries || []), newEntry], coupons: visibleCoupons };
    saveHistory(userId, updated);
    setHistory(updated);
    setAppliedCoupon(null); setCouponInput(''); setCouponError('');
    return newlyUnlocked;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setOrderError('');

    // Validate login
    if (!user) { navigate('/auth'); return; }

    // Validate table for dine-in
    if (orderMode === 'dinein' && !selectedTable) { setOrderError('Please select a table.'); return; }

    // Validate address for takeaway
    if (orderMode === 'delivery' && !deliveryAddr.trim()) { setOrderError('Delivery address is required for home delivery.'); return; }

    // Validate payment method
    if (!paymentMethod) { setOrderError('Please select a payment method to continue.'); return; }

    setPlacing(true);
    try {
      const snapshot = cart.map(i => ({ name: i.name, quantity: i.quantity, unit_price: i.price }));
      const payload = {
        items: cart.map(i => ({ menu_item_id: i._id || i.id, quantity: i.quantity })),
        order_type:      orderMode === 'dinein' ? 'dine-in' : orderMode,
        table_number:    orderMode === 'dinein' ? selectedTable : undefined,
        customer_id:     user?._id || user?.id,
        total:           grandTotal,
        payment_method:  paymentMethod,
        // ── Discount fields so backend saves correct final total ──────────
        coupon_discount:    couponDiscAmt  > 0 ? couponDiscAmt  : undefined,
        gift_card_discount: giftDiscAmt    > 0 ? giftDiscAmt    : undefined,
        coupon_code:        appliedCoupon  ? appliedCoupon.code  : undefined,
        ...(orderMode === 'delivery' ? {
          delivery_address: deliveryAddr.trim(),
          delivery_notes:   deliveryNotes.trim() || undefined,
          knock_bell:       knockBell,
          distance_km:      pricingData?.distanceKm || undefined,
        } : {}),
        ...(orderMode === 'pickup' ? {
          delivery_notes: deliveryNotes.trim() || undefined,
          pickup_extra_items: pickupExtraItems.trim() || undefined,
        } : {}),
      };

      const res = await ordersAPI.create(payload);
      const orderId  = res.data?._id || res.data?.order?._id;
      const orderNum = res.data?.order_number || res.data?.order?.order_number || ('BOX-' + Date.now().toString().slice(-5));

      // ── GIFT CARD: redeem only the applied partial amount ────────────────
      if (appliedGift && orderId) {
        try {
          await giftCardsAPI.redeem({
            code: appliedGift.code,
            amount_to_use: appliedGift.applied,
            order_id: orderId,
          });
        } catch (e) {
          console.warn('[GiftCard] Redeem failed:', e.message);
        }
        setAppliedGift(null);
        setGiftAmountInput('');
      }

      const unlocked = updateRewards(grandTotal);
      setNewCoupon(unlocked);
      setPlacedItemsSnap(snapshot);
      setPlacedTotal(grandTotal);
      setPlacedOrderNum(orderNum);
      setPlacedOrderId(orderId);
      setPlacedOrderType(orderMode);
      setPlacedKnockBell(knockBell);
      saveActiveOrder({ orderId, orderNum, items: snapshot, total: grandTotal, placedAt: Date.now() });
      clearCart();

      // Show success banner first, then allow tracking
      setShowSuccess(true);
    } catch (err) {
      setOrderError('Failed to place order: ' + (err.message || 'Please try again.'));
    } finally {
      setPlacing(false);
    }
  };

  const handleNewOrder = () => {
    clearActiveOrder();
    setPlacedOrderId(null); setPlacedOrderNum(''); setPlacedItemsSnap([]); setPlacedTotal(0);
    setNewCoupon(null); setShowTracker(false); setShowSuccess(false);
    setPlacedOrderType('dinein'); setPlacedKnockBell(true); setPickupExtraItems('');
  };

  const handleGoToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Full-page tracker: ONLY show when user explicitly clicked "Track Order"
  // (showTracker starts false; it's set true only when user clicks the Track button on success banner)
  // This prevents the tracker from hijacking the cart page when the user just wants to add items.
  if (placedOrderId && showTracker && cart.length === 0) {
    return (
      <LiveOrderTracker orderId={placedOrderId} orderNumber={placedOrderNum}
        placedItems={placedItemsSnap} grandTotal={placedTotal}
        newCoupon={newCoupon} onNewOrder={handleNewOrder}
        orderType={placedOrderType} knockBell={placedKnockBell} />
    );
  }

  // Show success banner immediately after placing order
  if (showSuccess && placedOrderNum) {
    return (
      <div className="min-h-screen bg-bg-main text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <OrderSuccessBanner
            orderNum={placedOrderNum}
            orderType={placedOrderType}
            knockBell={placedKnockBell}
            onTrack={() => { setShowSuccess(false); setShowTracker(true); }}
            onNewOrder={handleNewOrder}
          />
        </div>
      </div>
    );
  }

  // ── Cart view ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-main text-white pt-28 px-6 pb-12 md:px-12">
      <div className="container max-w-4xl mx-auto">

        {/* Top navigation row */}
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => navigate('/menu/')} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Menu
          </button>
         
        </div>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left: Cart items + tracker ── */}
          <div className="flex-1 space-y-8">
            <h1 className="text-4xl font-bold font-heading">Your Flavor Box</h1>

            {/* ── Inline Live Tracker: shown when cart has items + active order ── */}
            {placedOrderId && showTracker && cart.length > 0 && (
              <LiveOrderTracker
                inline
                orderId={placedOrderId}
                orderNumber={placedOrderNum}
                placedItems={placedItemsSnap}
                grandTotal={placedTotal}
                newCoupon={newCoupon}
                onNewOrder={handleNewOrder}
                onGoToBooking={handleGoToBooking}
              />
            )}

            {/* Rewards Tracker */}
            {userId && (
              <div className="bg-secondary/30 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                    <TrendingUp size={14} className="text-primary" />
                    Rewards Tracker — $200 at ${REWARD_MILESTONE}
                  </div>
                  <span className="text-xs font-black text-primary">${history.runningTotal.toFixed(2)} spent</span>
                </div>

                {(history.entries.length > 0 || total > 0) && (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 text-[10px] font-black text-text-muted uppercase tracking-widest pb-1 border-b border-white/5">
                      <span>Date</span><span className="text-center">Amount</span><span className="text-right">Running Total</span>
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

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-text-muted font-bold">
                    <span>Next reward at ${nextMilestone}</span>
                    <span>${remainingToNext.toFixed(2)} to go</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (runningTotal / nextMilestone) * 100)}%` }}
                      transition={{ duration: 0.8 }} />
                  </div>
                </div>
                
                {isUnlocked && activeCoupon && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-gradient-to-r from-primary/20 to-yellow-500/10 border border-primary/30 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">🎉 $200 Reward Unlocked!</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-black tracking-widest">{activeCoupon.code}</span>
                      <button onClick={() => handleCopy(activeCoupon.code)} className="text-[10px] font-black text-white/60 hover:text-primary transition-colors flex items-center gap-1">
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-text-muted">Apply this at checkout</p>
                  </motion.div>
                )}
              </div>
            )}
           <button
            onClick={() => {
              navigate('/');
              setTimeout(() => {
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all group"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            Add Items
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
            {/* Cart items */}
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-6 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <ShoppingBag size={56} className="mx-auto text-text-muted opacity-30" />
                <div>
                  <p className="text-lg font-bold">Your cart is empty</p>
                  <p className="text-text-muted text-sm mt-1">Add some flavors to get started</p>
                </div>
                <button onClick={() => navigate('/')} className="mt-6 btn-primary px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
                  Browse Menu <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {cart.map(item => (
                    <motion.div key={item._id || item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-5 bg-secondary/30 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                      <img src={getItemImage(item)} alt={item.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-white text-base truncate">{item.name}</h3>
                        <p className="text-text-muted text-xs font-bold uppercase tracking-widest">{item.category}</p>
                        <p className="text-text-muted text-xs mt-1">${item.price?.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right mr-2">
                          <p className="text-primary font-black">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
                          <button onClick={() => removeFromCart(item._id || item.id)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all text-text-muted hover:text-white">
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-lg hover:bg-primary/20 flex items-center justify-center transition-all text-text-muted hover:text-primary">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Right: Order summary ── */}
          {cart.length > 0 && (
            <div ref={bookingRef} className="lg:w-[360px] space-y-5 shrink-0">
              <h2 className="text-xl font-black">Order Summary</h2>

              <div className="bg-secondary/30 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-text-muted">Subtotal</span><span className="font-bold">${total.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Service Fee</span><span className="font-bold">${SERVICE_FEE.toFixed(2)}</span></div>
                {orderMode === 'delivery' && (
                  <div className="flex justify-between text-sm text-primary">
                    <span className="flex items-center gap-1"><Truck size={12} /> Delivery Fee{pricingData ? ` (${pricingData.distance})` : ''}</span>
                    <span className="font-bold">
                      {pricingLoading ? '…' : pricingData?.freeDelivery ? '🎉 Free' : pricingData ? `+₹${pricingData.deliveryFee}` : '—'}
                    </span>
                  </div>
                )}
                {appliedCoupon && <div className="flex justify-between text-sm text-green-400"><span>🎟 Reward Code ({appliedCoupon.code.slice(-8)})</span><span>-${couponDiscAmt.toFixed(2)}</span></div>}
                {appliedGift && <div className="flex justify-between text-sm text-blue-400"><span>🎁 Gift Card ({appliedGift.code}) — using ${appliedGift.applied.toFixed(2)}</span><span>-${giftDiscAmt.toFixed(2)}</span></div>}
                {tierDiscAmt > 0 && <div className="flex justify-between text-sm text-amber-400"><span>⭐ {loyaltyTier} Discount ({tierPct}%)</span><span>-${tierDiscAmt.toFixed(2)}</span></div>}
                <div className="border-t border-white/10 pt-3 flex justify-between font-black text-lg">
                  <span>Total</span><span className="text-primary">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* ── Rewards Code ── */}
              {userId && (
                <div className="bg-secondary/20 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                      <TrendingUp size={14} className="text-primary" /> Rewards Progress
                    </div>
                    <span className="text-[10px] font-black text-primary">${runningTotal.toFixed(2)} / ${nextMilestone}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (runningTotal / nextMilestone) * 100)}%` }}
                      transition={{ duration: 0.8 }} />
                  </div>
                  <p className="text-[10px] text-text-muted">${remainingToNext.toFixed(2)} more to unlock $200 reward</p>

                  {/* Reward code input */}
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-green-400 text-xs font-black">{appliedCoupon.code}</span>
                        <span className="text-green-300 text-xs">-${couponDiscAmt.toFixed(2)}</span>
                      </div>
                      <button onClick={() => { setAppliedCoupon(null); setCouponInput(''); setCouponError(''); }} className="text-text-muted hover:text-white"><XCircle size={14} /></button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Apply Reward Code</p>
                      <div className="flex gap-2">
                        <input type="text" value={couponInput}
                          onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="e.g. BB-USER-C1-XXXX"
                          className="flex-1 bg-bg-main border border-white/10 px-3 py-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all tracking-widest placeholder:tracking-normal placeholder:text-text-muted/40" />
                        <button onClick={handleApplyCoupon}
                          className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/80 transition-all">
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-red-400 text-[11px] font-bold flex items-center gap-1"><XCircle size={12} /> {couponError}</p>}
                      {/* Quick-apply if unlocked */}
                      {activeCoupon && !appliedCoupon && (
                        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
                          <span className="text-primary text-[10px] font-black">🎉 {activeCoupon.code}</span>
                          <button onClick={() => { setCouponInput(activeCoupon.code); handleApplyCoupon(); }}
                            className="text-[10px] font-black text-white bg-primary px-3 py-1 rounded-lg hover:bg-primary/80 transition-all">
                            Use Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Gift Card ── */}
              <div className="bg-secondary/30 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                  <Gift size={14} /> Gift Card
                </div>
                {appliedGift ? (
                  <div className="space-y-3">
                    {/* Applied card info */}
                    <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Gift size={14} className="text-blue-400" />
                        <span className="text-blue-400 text-xs font-black">{appliedGift.code}</span>
                        <span className="text-white/40 text-xs">Balance: ${appliedGift.balance.toFixed(2)}</span>
                      </div>
                      <button onClick={() => { setAppliedGift(null); setGiftAmountInput(''); }} className="text-text-muted hover:text-white"><XCircle size={14} /></button>
                    </div>

                    {/* Partial amount selector */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">How much to use this order?</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max={appliedGift.balance}
                          step="0.01"
                          value={giftAmountInput}
                          onChange={e => handleGiftAmountChange(e.target.value)}
                          className="flex-1 bg-bg-main border border-white/10 px-3 py-2 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all"
                        />
                        <span className="text-xs text-text-muted self-center font-bold">USD</span>
                      </div>
                      {/* Quick-pick buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {[25, 50, 100, 200].filter(v => v <= appliedGift.balance).map(v => (
                          <button key={v} onClick={() => handleGiftAmountChange(String(v))}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${appliedGift.applied === v ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/30'}`}>
                            ${v}
                          </button>
                        ))}
                        <button onClick={() => handleGiftAmountChange(String(appliedGift.balance))}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${appliedGift.applied === appliedGift.balance ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/30'}`}>
                          Full (${appliedGift.balance})
                        </button>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-white/5">
                        <span className="text-text-muted">Using this order:</span>
                        <span className="text-blue-400 font-black">-${appliedGift.applied.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted">Remaining on card:</span>
                        <span className="text-white/60 font-bold">${(appliedGift.balance - appliedGift.applied).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={giftInput}
                      onChange={e => { setGiftInput(e.target.value.toUpperCase()); setGiftError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyGift()}
                      placeholder="Gift card code..."
                      className="flex-1 bg-bg-main border border-white/10 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all tracking-widest placeholder:tracking-normal placeholder:text-text-muted/50" />
                    <button onClick={handleApplyGift} disabled={giftLoading}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50">
                      {giftLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {giftError && <p className="text-red-400 text-[11px] font-bold flex items-center gap-1"><XCircle size={12} /> {giftError}</p>}
                {!appliedGift && (
                  <p className="text-[10px] text-text-muted">💡 Use any amount — remaining balance stays on your card</p>
                )}
              </div>

              {/* Loyalty Tier Discount */}
              {loyaltyTier && userId && (
                <div className="bg-secondary/30 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest text-text-muted">Loyalty Discount</span>
                    </div>
                    <span className="text-xs font-black text-primary">{loyaltyTier} · {tierPct}% OFF</span>
                  </div>
                  {tierDiscAmt > 0 && (
                    <p className="text-xs text-green-400 font-bold mt-2">✓ -${tierDiscAmt.toFixed(2)} auto-applied</p>
                  )}
                </div>
              )}

              {/* Order mode: Dine-In / Pickup / Delivery */}
              <div className="bg-secondary/30 border border-white/10 rounded-2xl p-4 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Order Type</p>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
                  <button onClick={() => setOrderMode('dinein')}
                    className={'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ' + (orderMode === 'dinein' ? 'bg-primary text-white' : 'text-text-muted hover:text-white')}>
                    <UtensilsCrossed size={13} /> Dine-In
                  </button>
                  <button onClick={() => setOrderMode('pickup')}
                    className={'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ' + (orderMode === 'pickup' ? 'bg-primary text-white' : 'text-text-muted hover:text-white')}>
                    <Package size={13} /> Pickup
                  </button>
                  <button onClick={() => setOrderMode('delivery')}
                    className={'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ' + (orderMode === 'delivery' ? 'bg-primary text-white' : 'text-text-muted hover:text-white')}>
                    <Truck size={13} /> Delivery
                  </button>
                </div>

                {/* Table selection for dine-in */}
                {orderMode === 'dinein' && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Select Table *</p>
                    {tablesLoading ? (
                      <div className="flex items-center gap-2 text-text-muted text-xs">
                        <Loader size={13} className="animate-spin" /> Loading tables...
                      </div>
                    ) : availTables.length === 0 ? (
                      <p className="text-red-400 text-xs font-bold">No tables available right now.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availTables.map(t => (
                          <button key={t._id} onClick={() => setSelectedTable(t.label)}
                            className={'px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ' + (selectedTable === t.label ? 'bg-primary border-primary text-white' : 'bg-transparent border-white/10 text-text-muted hover:border-white/30 hover:text-white')}>
                            {t.type === 'vip' && '⭐ '}{t.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {!selectedTable && !tablesLoading && availTables.length > 0 && (
                      <p className="text-[10px] text-yellow-400 font-bold">Please select a table to continue</p>
                    )}
                  </div>
                )}

                {/* Pickup — no address needed */}
                {orderMode === 'pickup' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={14} className="text-primary" />
                      <p className="text-xs font-black text-primary uppercase tracking-widest">Restaurant Pickup</p>
                    </div>
                    <p className="text-xs text-text-muted">Your order will be ready at the counter. Show this order number when you arrive.</p>
                    <input value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
                      placeholder="Do you want any extra spoons or extra raita?"
                      className="w-full mt-3 bg-bg-main border border-white/10 px-3 py-2 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50" />
                    {/* Extra items for pickup */}
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Need Extra Items?</p>
                      <div className="flex flex-wrap gap-2">
                        {['Spoons', 'Sambar', 'Chutney', 'Extra Raita', 'Curry', 'Napkins'].map(item => {
                          const selected = pickupExtraItems.split(',').map(s => s.trim()).filter(Boolean).includes(item);
                          return (
                            <button key={item} type="button"
                              onClick={() => {
                                const current = pickupExtraItems.split(',').map(s => s.trim()).filter(Boolean);
                                const updated = selected ? current.filter(i => i !== item) : [...current, item];
                                setPickupExtraItems(updated.join(', '));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${selected ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/20'}`}>
                              {item}
                            </button>
                          );
                        })}
                      </div>
                      <input value={pickupExtraItems} onChange={e => setPickupExtraItems(e.target.value)}
                        placeholder="Or type custom extras (e.g. extra spoons, sambar)..."
                        className="w-full bg-bg-main border border-white/10 px-3 py-2 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-text-muted/50" />
                    </div>
                  </div>
                )}

                {/* Delivery — address mandatory */}
                {orderMode === 'delivery' && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Delivery Address *</p>
                    <textarea value={deliveryAddr} onChange={e => setDeliveryAddr(e.target.value)} rows={2}
                      placeholder="Enter your full delivery address..."
                      className="w-full bg-bg-main border border-white/10 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all resize-none placeholder:text-text-muted/50" />
                    <input value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
                      placeholder="Landmark, floor, gate number... (optional)"
                      className="w-full bg-bg-main border border-white/10 px-4 py-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all placeholder:text-text-muted/50" />
                    {/* Knock bell preference */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Arrival Preference</p>
                      <div className="flex gap-2">
                        <label className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${knockBell ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/40'}`}>
                          <input type="radio" name="knockBell" checked={knockBell} onChange={() => setKnockBell(true)} className="accent-orange-500 shrink-0" />
                          <span className="text-xs font-bold">🔔 Ring Bell / Knock</span>
                        </label>
                        <label className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${!knockBell ? 'bg-secondary border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                          <input type="radio" name="knockBell" checked={!knockBell} onChange={() => setKnockBell(false)} className="accent-orange-500 shrink-0" />
                          <span className="text-xs font-bold">🤫 Do Not Disturb</span>
                        </label>
                      </div>
                    </div>
                    {/* ── Live Delivery Pricing Breakdown ─────────────────── */}
                    <div className="rounded-xl border border-primary/20 overflow-hidden">
                      {pricingLoading && (
                        <div className="flex items-center gap-2 p-3 bg-primary/5 text-text-muted text-xs animate-pulse">
                          <Truck size={13} className="text-primary shrink-0" />
                          Calculating delivery fee…
                        </div>
                      )}
                      {pricingError && !pricingLoading && (
                        <div className="p-3 bg-red-500/10 text-red-400 text-xs font-bold">{pricingError}</div>
                      )}
                      {pricingData && !pricingLoading && (
                        <div className="bg-primary/5 p-3 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                            <Truck size={11} /> Delivery Details
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-black/20 rounded-lg p-2">
                              <p className="text-text-muted text-[10px]">Distance</p>
                              <p className="text-white font-bold">{pricingData.distance}</p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-2">
                              <p className="text-text-muted text-[10px]">Est. Time</p>
                              <p className="text-white font-bold">{pricingData.duration}</p>
                            </div>
                          </div>
                          {pricingData.freeDelivery ? (
                            <p className="text-green-400 text-xs font-bold text-center">🎉 Free delivery on this order!</p>
                          ) : (
                            <div className="space-y-1 text-xs text-text-muted">
                              <div className="flex justify-between">
                                <span>Base (first {3} km)</span>
                                <span className="text-white">₹{pricingData.breakdown?.base}</span>
                              </div>
                              {(pricingData.breakdown?.distanceCharge || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>Distance charge</span>
                                  <span className="text-white">₹{pricingData.breakdown.distanceCharge}</span>
                                </div>
                              )}
                              {(pricingData.breakdown?.timeCharge || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>{pricingData.breakdown.timeLabel}</span>
                                  <span className="text-yellow-400">₹{pricingData.breakdown.timeCharge}</span>
                                </div>
                              )}
                              {(pricingData.breakdown?.smallOrderFee || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>Small order fee</span>
                                  <span className="text-orange-400">₹{pricingData.breakdown.smallOrderFee}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-white/10 pt-1 font-bold text-primary">
                                <span>Delivery Fee</span>
                                <span>₹{pricingData.deliveryFee}</span>
                              </div>
                            </div>
                          )}
                          {pricingData.source === 'estimated' && (
                            <p className="text-[9px] text-text-muted italic">* Estimated — configure Google Maps API for exact routing</p>
                          )}
                        </div>
                      )}
                      {!pricingData && !pricingLoading && !pricingError && (
                        <div className="flex items-center gap-2 p-3 bg-primary/5 text-text-muted text-xs">
                          <Truck size={13} className="text-primary shrink-0" />
                          Enter your address above to see delivery fee
                        </div>
                      )}
                    </div>

                    {!deliveryAddr.trim() && (
                      <p className="text-[10px] text-yellow-400 font-bold">⚠ Delivery address is required</p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Payment Method (required) ── */}
              <div className="bg-secondary/30 border border-white/10 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <CreditCard size={13} className="text-primary" /> Payment Method <span className="text-red-400">*</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash',  emoji: '💵' },
                    { id: 'card', label: 'Card',  emoji: '💳' },
                    { id: 'upi',  label: 'UPI',   emoji: '📱' },
                  ].map(({ id, label, emoji }) => (
                    <button key={id} type="button"
                      onClick={() => { setPaymentMethod(id); setOrderError(''); }}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${
                        paymentMethod === id
                          ? 'bg-primary/15 border-primary text-primary'
                          : 'bg-white/5 border-white/10 text-text-muted hover:border-white/30 hover:text-white'
                      }`}>
                      <span className="text-lg">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
                {!paymentMethod && (
                  <p className="text-[10px] text-yellow-400 font-bold">⚠ Select a payment method to place your order</p>
                )}
              </div>

              {/* Error */}
              {orderError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-xs font-bold flex items-center gap-2">
                  <XCircle size={14} /> {orderError}
                </div>
              )}

              {/* Place order button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing || cart.length === 0 || !paymentMethod || (orderMode === 'dinein' && !selectedTable) || (orderMode === 'delivery' && !deliveryAddr.trim())}
                className="relative w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 24px rgba(245,158,11,0.35)' }}
              >
                {/* Shine effect */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
                <span className="relative flex items-center justify-center gap-3 text-white">
                  {placing ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Place Order</span>
                      <span className="flex items-center justify-center w-7 h-7 bg-white/20 rounded-full group-hover:translate-x-1 transition-transform">
                        <ArrowRight size={14} />
                      </span>
                    </>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;