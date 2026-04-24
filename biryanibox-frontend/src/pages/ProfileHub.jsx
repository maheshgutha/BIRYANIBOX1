import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User, ShoppingBag, Star, MapPin, Bell, MessageSquare,
  Save, Plus, Trash2, Loader, CheckCircle,
  Lock, Eye, EyeOff, Phone, Mail, Package,
  RefreshCw, Zap, Gift, Navigation, Truck,
  ChevronDown, ChevronUp, Award, TrendingUp,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ordersAPI, addressesAPI, announcementsAPI, feedbackAPI, loyaltyAPI, usersAPI } from '../services/api';

const MotionDiv = motion.div;

// Silent auto-refresh: background refresh never shows loading spinner
const useAutoRefresh = (callback, intervalMs = 30000) => {
  const savedCallback = React.useRef(callback);
  React.useEffect(() => { savedCallback.current = callback; }, [callback]);
  React.useEffect(() => {
    const id = setInterval(() => savedCallback.current(true), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};


const STATUS_STYLES = {
  pending:           'bg-yellow-500/20 text-yellow-400',
  start_cooking:     'bg-orange-500/20 text-orange-400',
  completed_cooking: 'bg-blue-500/20 text-blue-400',
  served:            'bg-green-500/20 text-green-400',
  paid:              'bg-primary/20 text-primary',
  cancelled:         'bg-red-500/20 text-red-400',
};

const TABS = [
  { id: 'live',          label: 'Track Order',   icon: Navigation   },
  { id: 'orders',        label: 'Order History', icon: ShoppingBag  },
  { id: 'rewards',       label: 'Rewards',       icon: Star         },
  { id: 'feedback',      label: 'Feedback',      icon: MessageSquare },
  { id: 'announcements', label: 'Announcements', icon: Bell         },
  { id: 'addresses',     label: 'Addresses',     icon: MapPin       },
  { id: 'profile',       label: 'Edit Profile',  icon: User         },
];

// Dine-in tracker steps
const DINEIN_STEPS = [
  { key: 'pending',           label: 'Placed',    emoji: '🛒' },
  { key: 'start_cooking',     label: 'Preparing', emoji: '🔥' },
  { key: 'completed_cooking', label: 'Ready',     emoji: '✅' },
  { key: 'served',            label: 'Served',    emoji: '🍽' },
  { key: 'paid',              label: 'Done',      emoji: '✓'  },
];
// Delivery tracker steps
const DELIVERY_STEPS = [
  { key: 'pending',           label: 'Placed',     emoji: '🛒' },
  { key: 'start_cooking',     label: 'Preparing',  emoji: '🔥' },
  { key: 'completed_cooking', label: 'Ready',      emoji: '✅' },
  { key: 'dispatched',        label: 'Dispatched', emoji: '🚗' },
  { key: 'delivered',         label: 'Delivered',  emoji: '📦' },
  { key: 'paid',              label: 'Paid',       emoji: '✓'  },
];
// Pickup tracker steps
const PICKUP_STEPS = [
  { key: 'pending',           label: 'Placed',     emoji: '🛒' },
  { key: 'start_cooking',     label: 'Preparing',  emoji: '🔥' },
  { key: 'completed_cooking', label: 'Ready',      emoji: '✅' },
  { key: 'dispatched',        label: 'At Counter', emoji: '🏪' },
  { key: 'paid',              label: 'Picked Up',  emoji: '✓'  },
];

const DINEIN_STEP_IDX   = { pending:0, start_cooking:1, completed_cooking:2, served:3, paid:4 };
const DELIVERY_STEP_IDX = { pending:0, start_cooking:1, completed_cooking:2, dispatched:3, in_transit:3, delivered:4, paid:5 };
const PICKUP_STEP_IDX   = { pending:0, start_cooking:1, completed_cooking:2, dispatched:3, paid:4 };

function getStepsForOrder(order) {
  const ot = order?.order_type || 'dine-in';
  if (ot === 'delivery') return { steps: DELIVERY_STEPS, idx: DELIVERY_STEP_IDX };
  if (ot === 'pickup')   return { steps: PICKUP_STEPS,   idx: PICKUP_STEP_IDX   };
  return { steps: DINEIN_STEPS, idx: DINEIN_STEP_IDX };
}

const POINTS_RULES = [
  { label: 'Every order placed', pts: '+10 pts', icon: Package },
  { label: 'Order above $500',   pts: '+25 pts', icon: Zap     },
  { label: 'Submit feedback',    pts: '+5 pts',  icon: MessageSquare },
  { label: 'Refer a friend',     pts: '+50 pts', icon: Gift    },
];

const TIER_CONFIG = {
  Bronze:   { color: 'text-amber-700',  bg: 'bg-amber-700/20',  border: 'border-amber-700/40',  emoji: '🥉' },
  Silver:   { color: 'text-slate-400',  bg: 'bg-slate-400/20',  border: 'border-slate-400/40',  emoji: '🥈' },
  Gold:     { color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/40', emoji: '🥇' },
  Platinum: { color: 'text-cyan-400',   bg: 'bg-cyan-400/20',   border: 'border-cyan-400/40',   emoji: '💎' },
};

// ─── Spend Tracker helpers (mirrors Cart.jsx) ─────────────────────────────
const REWARD_MILESTONE = 1000;
const REWARD_AMOUNT    = 200;
const getSpendHistory = (uid) => {
  try {
    const d = localStorage.getItem(`bb_history_${uid}`);
    return d ? JSON.parse(d) : { runningTotal: 0, nextMilestone: REWARD_MILESTONE, entries: [], coupons: [] };
  } catch { return { runningTotal: 0, nextMilestone: REWARD_MILESTONE, entries: [], coupons: [] }; }
};

// Single order tracker card

const OrderTracker = ({ order }) => {
  const { steps, idx } = getStepsForOrder(order);
  const curStepIdx = idx[order.status] ?? 0;
  const isDone = order.status === 'paid' || order.status === 'served' || order.status === 'delivered';

  const statusMsg = {
    pending:           'Your order has been placed and is waiting to be prepared.',
    start_cooking:     'Your order is being prepared by our kitchen team.',
    completed_cooking: 'Your order is ready! Waiting to be dispatched.',
    served:            'Your order has been served. Enjoy your meal! 🍽',
    paid:              'Thank you! Your order is complete. See you soon! 😊',
    dispatched:        'Your order has been dispatched and is on the way! 🚗',
    in_transit:        'Your rider is on the way — almost there! 🛵',
    delivered:         'Your order has been delivered! Enjoy your meal! 🎉',
  };

  return (
    <div className="bg-secondary/40 border border-white/10 rounded-3xl p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Order Number</p>
          <p className="text-2xl font-black text-primary">#{order.order_number}</p>
          <p className="text-sm text-white/40 mt-1 capitalize">
            {order.order_type}
            {order.table_number ? ' · Table ' + order.table_number : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Total</p>
          <p className="text-2xl font-black text-primary">${(order.total || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary z-0 transition-all duration-700"
          style={{ width: `${(curStepIdx / (steps.length - 1)) * 100}%` }}
        />
        <div className="flex items-start justify-between relative z-10">
          {steps.map((step, i) => {
            const done   = i <= curStepIdx;
            const active = i === curStepIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm transition-all duration-500
                  ${done ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                         : 'bg-secondary border-white/20 text-white/20'}`}>
                  {step.emoji}
                </div>
                <p className={`text-[9px] font-black uppercase tracking-widest text-center leading-tight
                  ${active ? 'text-primary' : done ? 'text-white/60' : 'text-white/20'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white/5 rounded-2xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Items</p>
        <div className="space-y-2">
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-white/70">{item.name || item.menu_item_id?.name}</span>
              <span className="text-primary font-black">x{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-[9px] text-white/30 font-bold uppercase mb-1">Placed At</p>
          <p className="text-sm font-black text-white">
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {order.captain_id && (
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[9px] text-white/30 font-bold uppercase mb-1">Captain</p>
            <p className="text-sm font-black text-white">{order.captain_id.name || '—'}</p>
          </div>
        )}
      </div>

      {/* Status message */}
      <div className={`rounded-2xl p-4 text-sm font-bold text-center border
        ${isDone
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-primary/10 border-primary/20 text-primary'}`}>
        {statusMsg[order.status] || 'Processing your order...'}
      </div>
    </div>
  );
};

const ProfileHub = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read ?tab= from URL to deep-link into a specific tab (e.g. /profile?tab=rewards)
  const urlTab = new URLSearchParams(location.search).get('tab');
  const storedTab = (() => {
    try { return localStorage.getItem('bb_profile_tab') || 'live'; } catch { return 'live'; }
  })();
  const [activeTab, setActiveTab] = useState(urlTab || storedTab);

  // Sync tab when URL changes
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) setActiveTab(urlTab);
  }, [urlTab]);

  // Live tracking
  const [liveOrders,  setLiveOrders]  = useState([]);
  const [liveLoading, setLiveLoading] = useState(true);

  // Orders
  const [orders,   setOrders]   = useState([]);
  const [oLoading, setOLoading] = useState(false);

  // Rewards
  const [loyalty, setLoyalty] = useState(null);
  const [txns,    setTxns]    = useState([]);
  const [allTiers, setAllTiers] = useState([]);

  // Addresses
  const [addresses,  setAddresses]  = useState([]);
  const [addForm,    setAddForm]    = useState({ label: '', street: '', city: '', state: '', pincode: '' });
  const [addingAddr, setAddingAddr] = useState(false);
  const [addrMsg,    setAddrMsg]    = useState('');

  // Feedback
  const [fbForm,       setFbForm]      = useState({ subject: '', message: '', rating: 5 });
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbDone,       setFbDone]      = useState(false);
  const [fbError,      setFbError]     = useState('');

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [expandedAnn,   setExpandedAnn]   = useState(null);

  // Profile
  const [profileForm,   setProfileForm]  = useState({ name: '', phone: '' });
  const [passForm,      setPassForm]     = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPass,      setShowPass]     = useState(false);
  const [profileMsg,    setProfileMsg]   = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth');
    else setProfileForm({ name: user.name || '', phone: user.phone || '' });
  }, [user, navigate]);

  // Live order polling — get ALL active orders
  const loadLiveOrders = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLiveLoading(true);
    try {
      const r = await ordersAPI.liveOrder(user.id);
      // Backend now returns { data: first, all: [] }
      const all = r.all || (r.data ? [r.data] : []);
      setLiveOrders(all);
    } catch {
      setLiveOrders([]);
    } finally {
      if (!silent) setLiveLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'live') {
      loadLiveOrders(false); // initial load with spinner
    }
  }, [activeTab, loadLiveOrders]);

  // Auto-refresh live orders silently every 20s
  useAutoRefresh(loadLiveOrders, 20000);

  const loadTab = useCallback(async (tab, silent = false) => {
    if (!user) return;
    try {
      if (tab === 'orders') {
        if (!silent) setOLoading(true);
        const r = await ordersAPI.history(user.id);
        setOrders(r.data || []);
        if (!silent) setOLoading(false);
      }
      if (tab === 'rewards') {
        try {
          const r = await loyaltyAPI.get(user.id);
          setLoyalty(r.data);
        } catch {}
        try {
          const t = await loyaltyAPI.transactions(user.id);
          setTxns(t.data || []);
        } catch {}
        // Load all tiers for tier progress display
        try {
          const { request } = await import('../services/api');
          const tiersRes = await fetch(
            (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/loyalty/tiers'
          );
          if (tiersRes.ok) {
            const td = await tiersRes.json();
            setAllTiers(td.data || []);
          }
        } catch {}
      }
      if (tab === 'addresses') {
        const r = await addressesAPI.getAll();
        setAddresses(r.data || []);
      }
      if (tab === 'announcements') {
        const r = await announcementsAPI.getPublic();
        setAnnouncements(r.data || []);
      }
    } catch {}
  }, [user]);

  useEffect(() => { loadTab(activeTab, false); }, [activeTab, loadTab]);

  // Auto-refresh current tab data silently every 30s
  const silentRefreshTab = useCallback(() => {
    if (activeTab !== 'live') loadTab(activeTab, true);
  }, [activeTab, loadTab]);
  useAutoRefresh(silentRefreshTab, 30000);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddrMsg('');
    try {
      await addressesAPI.create(addForm);
      setAddForm({ label: '', street: '', city: '', state: '', pincode: '' });
      setAddingAddr(false);
      setAddrMsg('Address saved!');
      loadTab('addresses');
    } catch (err) {
      setAddrMsg(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try { await addressesAPI.delete(id); loadTab('addresses'); } catch {}
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    setFbSubmitting(true);
    setFbError('');
    try {
      await feedbackAPI.create({
        subject:       fbForm.subject,
        message:       fbForm.message,
        rating:        fbForm.rating,
        customer_id:   user.id || user._id,
        customer_name: user.name,
        customer_email: user.email || '',
      });
      try { await loyaltyAPI.earn({ user_id: user.id, rule: 'feedback', description: 'Feedback submitted' }); } catch {}
      setFbDone(true);
      setFbForm({ subject: '', message: '', rating: 5 });
    } catch (err) {
      setFbError(err.message || 'Failed to submit. Please try again.');
    }
    setFbSubmitting(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.phone.trim()) { setProfileMsg('Mobile number is required.'); return; }
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await usersAPI.updateMe({ name: profileForm.name, phone: profileForm.phone });
      if (updateUser) updateUser({ name: profileForm.name, phone: profileForm.phone });
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileMsg(err.message || 'Update failed. Please try again.');
    }
    setProfileSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm) {
      setProfileMsg('Passwords do not match');
      return;
    }
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await usersAPI.changeMyPassword({
        current_password: passForm.current_password,
        new_password: passForm.new_password,
      });
      setProfileMsg('Password updated!');
      setPassForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setProfileMsg(err.message || 'Failed to change password');
    }
    setProfileSaving(false);
  };

  if (!user) return null;

  const userPoints = loyalty?.points ?? user.loyaltyPoints ?? 0;
  const currentTierName = loyalty?.current_tier?.name || (userPoints >= 3000 ? 'Gold' : userPoints >= 1000 ? 'Silver' : 'Bronze');
  const tierCfg = TIER_CONFIG[currentTierName] || TIER_CONFIG.Bronze;

  return (
    <div className="min-h-screen bg-bg-main text-white">
      <Navbar />
      <div className="pt-32 pb-20 container max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-6 mb-10 mt-32">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 shrink-0">
            <img src={'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name} alt="Avatar" className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-3xl font-black">{user.name}</h1>
            <p className="text-white/40 text-sm">{user.email}</p>
            <p className={`text-xs font-black mt-1 ${tierCfg.color}`}>{tierCfg.emoji} {currentTierName} Member · {userPoints} pts</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-red-500/20 transition-all">
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => {
                setActiveTab(t.id);
                try { localStorage.setItem('bb_profile_tab', t.id); } catch {}
              }}
                className={'flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ' +
                  (activeTab === t.id ? 'bg-primary border-primary text-white shadow-lg' : 'border-white/10 text-white/40 hover:text-white bg-white/5')}>
                <Icon size={12} />{t.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* LIVE TRACKING — all active orders */}
          {activeTab === 'live' && (
            <MotionDiv key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">Live Order Tracking</h2>
                <button onClick={loadLiveOrders} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
              {liveLoading ? (
                <div className="flex justify-center py-16"><Loader size={28} className="animate-spin text-primary" /></div>
              ) : liveOrders.length === 0 ? (
                <div className="text-center py-16 bg-secondary/40 border border-white/10 rounded-3xl">
                  <Package size={40} className="mx-auto mb-4 text-white/20" />
                  <p className="text-white/40 font-bold text-lg">No active orders</p>
                  <p className="text-white/20 text-sm mt-2">Your in-progress orders will appear here.</p>
                  <button onClick={() => navigate('/')} className="mt-5 px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full">
                    Order Now
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {liveOrders.length > 1 && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-bold">
                      <Package size={13} /> {liveOrders.length} active orders being tracked
                    </div>
                  )}
                  {liveOrders.map(order => (
                    <OrderTracker key={order._id} order={order} />
                  ))}
                </div>
              )}
            </MotionDiv>
          )}

          {/* ORDER HISTORY */}
          {activeTab === 'orders' && (
            <MotionDiv key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-black mb-5">Order History</h2>
              {oLoading ? (
                <div className="flex justify-center py-16"><Loader size={30} className="animate-spin text-primary" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-secondary/40 border border-white/10 rounded-3xl">
                  <Package size={40} className="mx-auto mb-4 text-white/20" />
                  <p className="text-white/40 font-bold">No orders yet.</p>
                  <button onClick={() => navigate('/')} className="mt-4 px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full">Order Now</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(o => (
                    <div key={o._id} className="bg-secondary/40 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap hover:border-primary/20 transition-all">
                      <div>
                        <p className="font-black text-primary">#{o.order_number}</p>
                        <p className="text-sm text-white/50 mt-0.5">{new Date(o.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-white/30 mt-1 capitalize">{o.order_type} · {(o.items || []).length} items</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-black text-primary">${(o.total || 0).toFixed(2)}</span>
                        <span className={'text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ' + (STATUS_STYLES[o.status] || 'bg-white/10 text-white/40')}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </MotionDiv>
          )}

          {/* REWARDS — points + tiers */}
          {activeTab === 'rewards' && (
            <MotionDiv key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-black mb-5">My Rewards</h2>

              {/* ── $200 Spend Reward Tracker ── */}
              {(() => {
                const hist = user ? getSpendHistory(user.id || user._id) : { runningTotal: 0, nextMilestone: REWARD_MILESTONE, entries: [], coupons: [] };
                const spent = hist.runningTotal || 0;
                const nextMs = hist.nextMilestone || REWARD_MILESTONE;
                const prevMs = nextMs - REWARD_MILESTONE;
                const pct = Math.min(100, ((spent - prevMs) / REWARD_MILESTONE) * 100);
                const remaining = Math.max(0, nextMs - spent);
                const unusedCoupons = (hist.coupons || []).filter(c => !c.used);
                return (
                  <div className="bg-secondary/40 border border-primary/20 rounded-3xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-black flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Spend Reward Tracker</p>
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">$200 at $1000</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-white/40 font-bold">${spent.toFixed(2)} spent</span>
                        <span className="text-white/40 font-bold">${remaining.toFixed(2)} to go</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-white/30 mt-1.5">Next reward at ${nextMs.toLocaleString()}</p>
                    </div>
                    {/* Unlocked coupons */}
                    {unusedCoupons.length > 0 && (
                      <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-2xl">
                        <p className="text-xs font-black text-primary mb-2">🎉 $200 Coupon{unusedCoupons.length > 1 ? 's' : ''} Ready!</p>
                        {unusedCoupons.map(c => (
                          <div key={c.code} className="flex items-center justify-between bg-black/20 rounded-xl px-4 py-2 mb-2">
                            <span className="text-sm font-black text-white tracking-widest">{c.code}</span>
                            <button onClick={() => navigator.clipboard?.writeText(c.code)}
                              className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase">Copy</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Recent entries */}
                    {(hist.entries || []).length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Recent Spend</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {[...(hist.entries || [])].reverse().slice(0,5).map((e, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-white/40">{e.date}</span>
                              <span className="text-primary font-bold">+${Number(e.amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Points + Tier cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className={`${tierCfg.bg} border ${tierCfg.border} rounded-3xl p-6`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Total Points</p>
                  <p className={`text-5xl font-black ${tierCfg.color}`}>{userPoints}</p>
                  {loyalty?.points_to_next && (
                    <p className="text-xs text-white/40 mt-2">{loyalty.points_to_next} pts to {loyalty.next_tier?.name}</p>
                  )}
                  <p className={`text-sm font-black mt-3 ${tierCfg.color}`}>{tierCfg.emoji} {currentTierName} Member</p>
                </div>

                {/* Current tier progress bar */}
                <div className="bg-secondary/40 border border-white/10 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Tier Progress</p>
                  {/* Tiers ladder */}
                  {[
                    { name: 'Bronze',   min: 0,    max: 999,  color: 'bg-amber-700'  },
                    { name: 'Silver',   min: 1000, max: 2999, color: 'bg-slate-400'  },
                    { name: 'Gold',     min: 3000, max: null, color: 'bg-yellow-400' },
                  ].map(tier => {
                    const isCurrent = currentTierName === tier.name;
                    const pct = tier.max
                      ? Math.min(100, ((userPoints - tier.min) / (tier.max - tier.min)) * 100)
                      : Math.min(100, ((userPoints - tier.min) / 1000) * 100);
                    return (
                      <div key={tier.name} className={`mb-3 p-3 rounded-xl border ${isCurrent ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-white/3'}`}>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className={isCurrent ? 'text-primary' : 'text-white/40'}>{TIER_CONFIG[tier.name]?.emoji} {tier.name}</span>
                          <span className="text-white/30">{tier.min}{tier.max ? `–${tier.max}` : '+'} pts</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${tier.color} rounded-full`} style={{ width: `${Math.max(0, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tier benefits */}
              <div className="bg-secondary/40 border border-white/10 rounded-3xl p-6 mb-6">
                <p className="text-sm font-black mb-4 flex items-center gap-2"><Award size={16} className="text-primary" /> Tier Benefits</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: 'Bronze',   emoji: '🥉', benefits: ['5% off all orders', 'Birthday bonus points', 'Early access to deals'] },
                    { name: 'Silver',   emoji: '🥈', benefits: ['10% off all orders', 'Priority seating', 'Monthly bonus points'] },
                    { name: 'Gold',     emoji: '🥇', benefits: ['15% off all orders', 'Free delivery always', 'VIP table access'] },
                  ].map(tier => {
                    const isCurrent = currentTierName === tier.name;
                    const cfg = TIER_CONFIG[tier.name];
                    return (
                      <div key={tier.name} className={`rounded-2xl p-4 border ${isCurrent ? `${cfg.bg} ${cfg.border}` : 'bg-white/5 border-white/10'}`}>
                        <p className={`font-black text-sm mb-3 ${isCurrent ? cfg.color : 'text-white/40'}`}>{tier.emoji} {tier.name}</p>
                        <ul className="space-y-1.5">
                          {tier.benefits.map(b => (
                            <li key={b} className={`text-xs flex items-center gap-2 ${isCurrent ? 'text-white/70' : 'text-white/30'}`}>
                              <span className="text-primary">✓</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* How to earn */}
              <div className="bg-secondary/40 border border-white/10 rounded-3xl p-6 mb-6">
                <p className="text-sm font-black mb-4 flex items-center gap-2"><Zap size={16} className="text-primary" /> How to Earn Points</p>
                {POINTS_RULES.map((rule, i) => {
                  const Icon = rule.icon;
                  return (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                          <Icon size={15} className="text-primary" />
                        </div>
                        <span className="text-sm font-bold text-white/80">{rule.label}</span>
                      </div>
                      <span className="font-black text-primary text-sm">{rule.pts}</span>
                    </div>
                  );
                })}
              </div>

              {/* Points history */}
              {txns.length > 0 && (
                <div className="bg-secondary/40 border border-white/10 rounded-3xl p-6">
                  <p className="text-sm font-black mb-4">Points History</p>
                  {txns.slice(0, 10).map(t => (
                    <div key={t._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm font-bold">{t.description}</p>
                        <p className="text-xs text-white/30">{new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={'font-black ' + (t.type === 'earn' ? 'text-green-400' : 'text-red-400')}>
                        {t.type === 'earn' ? '+' : ''}{t.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </MotionDiv>
          )}

          {/* FEEDBACK */}
          {activeTab === 'feedback' && (
            <MotionDiv key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-black mb-5">Submit Feedback</h2>
              {fbDone ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-10 text-center">
                  <CheckCircle size={40} className="mx-auto mb-4 text-green-400" />
                  <p className="font-black text-xl mb-2">Thank you for your feedback!</p>
                  <p className="text-white/40 text-sm mb-4">You earned +5 loyalty points.</p>
                  <button onClick={() => setFbDone(false)} className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full">
                    Submit Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedback} className="bg-secondary/40 border border-white/10 rounded-3xl p-8 space-y-5">
                  {fbError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs font-bold">{fbError}</div>
                  )}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setFbForm(p => ({ ...p, rating: n }))}
                          className={'w-10 h-10 rounded-xl border font-black transition-all text-lg ' + (fbForm.rating >= n ? 'bg-primary border-primary text-white' : 'border-white/10 text-white/30 hover:border-primary/50')}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Subject</label>
                    <input value={fbForm.subject} onChange={e => setFbForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="What is your feedback about?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Message</label>
                    <textarea value={fbForm.message} onChange={e => setFbForm(p => ({ ...p, message: e.target.value }))} rows={4}
                      placeholder="Tell us about your experience..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 resize-none" />
                  </div>
                  <button type="submit" disabled={fbSubmitting || !fbForm.message.trim()}
                    className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-primary-hover transition-all">
                    {fbSubmitting ? <Loader size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                    {fbSubmitting ? 'Submitting...' : 'Submit Feedback (+5 pts)'}
                  </button>
                </form>
              )}
            </MotionDiv>
          )}

          {/* ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <MotionDiv key="announcements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-black mb-5">Announcements</h2>
              {announcements.length === 0 ? (
                <div className="text-center py-16 bg-secondary/40 border border-white/10 rounded-3xl">
                  <Bell size={40} className="mx-auto mb-4 text-white/20" />
                  <p className="text-white/40 font-bold">No announcements right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map(a => {
                    const isExpanded = expandedAnn === a._id;
                    const hasOffer = a.has_offer && a.offer_discount > 0;
                    const isScheduled = a.is_scheduled && a.scheduled_date;
                    return (
                      <div key={a._id} className="bg-secondary/40 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/20 transition-all">
                        <button className="w-full text-left p-5" onClick={() => setExpandedAnn(isExpanded ? null : a._id)}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* badges row */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/50">{a.priority || 'normal'}</span>
                                {a.is_festival && a.festival_name && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🎊 {a.festival_name}</span>
                                )}
                                {hasOffer && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                    🏷 {a.offer_discount}% OFF · {a.offer_scope === 'all' ? 'All Items' : `${(a.offer_items || []).length} items`}
                                  </span>
                                )}
                                {isScheduled && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    🕐 {new Date(a.scheduled_date).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-black text-white text-base">{a.title}</h3>
                              <p className="text-sm text-white/60 mt-1">{a.message}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className="text-[10px] text-white/30 font-bold whitespace-nowrap">
                                {new Date(a.created_at).toLocaleDateString()}
                              </span>
                              {isExpanded ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
                            </div>
                          </div>
                        </button>

                        {/* Expanded offer details */}
                        {isExpanded && hasOffer && (
                          <div className="px-5 pb-5 border-t border-white/5 pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Offer Applies To</p>
                            {a.offer_scope === 'all' ? (
                              <div className="bg-white/5 rounded-xl p-3 mb-3">
                                <p className="text-xs text-white/60 font-bold">🍽 All menu items — {a.offer_discount}% discount applied at checkout</p>
                              </div>
                            ) : (
                              <div className="space-y-2 mb-3">
                                {(a.offer_items || []).map((item, i) => (
                                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                                    <span className="text-sm text-white font-bold">{item}</span>
                                    <span className="text-xs font-black text-green-400">{a.offer_discount}% OFF</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                              <span className="text-lg font-black text-green-400">{a.offer_discount}% OFF</span>
                              <span className="text-xs text-white/40 font-bold">on qualifying items</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </MotionDiv>
          )}

          {/* ADDRESSES */}
          {activeTab === 'addresses' && (
            <MotionDiv key="addresses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black">My Addresses</h2>
                <button onClick={() => setAddingAddr(p => !p)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-primary-hover transition-all">
                  <Plus size={13} /> {addingAddr ? 'Cancel' : 'Add Address'}
                </button>
              </div>
              {addrMsg && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-xs font-bold ${addrMsg.includes('saved') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {addrMsg}
                </div>
              )}
              {addingAddr && (
                <form onSubmit={handleAddAddress} className="bg-secondary/40 border border-white/10 rounded-3xl p-6 mb-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      ['Label',   'label',   'Home / Work / Other'],
                      ['Street',  'street',  '123 Main Street'    ],
                      ['City',    'city',    'Hyderabad'          ],
                      ['State',   'state',   'Telangana'          ],
                      ['Pincode', 'pincode', '500001'             ],
                    ].map(([label, field, ph]) => (
                      <div key={field}>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">{label}</label>
                        <input required={field === 'street' || field === 'city'}
                          value={addForm[field]} onChange={e => setAddForm(p => ({ ...p, [field]: e.target.value }))} placeholder={ph}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50" />
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all">
                    Save Address
                  </button>
                </form>
              )}
              {addresses.length === 0 && !addingAddr ? (
                <div className="text-center py-16 bg-secondary/40 border border-white/10 rounded-3xl">
                  <MapPin size={40} className="mx-auto mb-4 text-white/20" />
                  <p className="text-white/40 font-bold">No addresses saved.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map(a => (
                    <div key={a._id} className="bg-secondary/40 border border-white/10 rounded-2xl p-5 flex items-start justify-between gap-4 hover:border-primary/20 transition-all">
                      <div>
                        <p className="font-black text-sm text-primary mb-1">{a.label || 'Address'}</p>
                        <p className="text-sm text-white/60">{a.street}, {a.city}, {a.state}{a.pincode ? ' - ' + a.pincode : ''}</p>
                      </div>
                      <button onClick={() => handleDeleteAddress(a._id)} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </MotionDiv>
          )}

          {/* EDIT PROFILE */}
          {activeTab === 'profile' && (
            <MotionDiv key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-xl font-black mb-5">Edit Profile</h2>
              {profileMsg && (
                <div className={`mb-5 px-4 py-3 rounded-xl text-xs font-bold ${profileMsg.includes('updated') || profileMsg.includes('!') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {profileMsg}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal info */}
                <form onSubmit={handleSaveProfile} className="bg-secondary/40 border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="font-black text-white">Personal Info</h3>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-1"><User size={10} /> Full Name</label>
                    <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-1"><Phone size={10} /> Mobile Number *</label>
                    <input required value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-1"><Mail size={10} /> Email (read-only)</label>
                    <input value={user.email} disabled
                      className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/30 cursor-not-allowed" />
                  </div>
                  <button type="submit" disabled={profileSaving}
                    className="w-full py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-primary-hover transition-all">
                    {profileSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                  </button>
                </form>

                {/* Change password */}
                <form onSubmit={handleChangePassword} className="bg-secondary/40 border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="font-black text-white">Change Password</h3>
                  {[
                    { label: 'Current Password', field: 'current_password' },
                    { label: 'New Password',      field: 'new_password'      },
                    { label: 'Confirm New Password', field: 'confirm'        },
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">{label}</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={passForm[field]}
                          onChange={e => setPassForm(p => ({ ...p, [field]: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 pr-10"
                        />
                        {field === 'confirm' && (
                          <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="submit" disabled={profileSaving}
                    className="w-full py-3 bg-secondary border border-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                    {profileSaving ? <Loader size={14} className="animate-spin" /> : <Lock size={14} />}
                    Update Password
                  </button>
                </form>
              </div>
            </MotionDiv>
          )}

        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default ProfileHub;