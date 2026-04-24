import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import { ordersAPI, addressesAPI, feedbackAPI, announcementsAPI, loyaltyAPI } from '../services/api';
import { useAuth } from '../context/useContextHooks';
import { useLocation } from 'react-router-dom';
import {
  Truck, MapPin, Navigation, Package, Clock, CheckCircle,
  ChevronRight, Home, Building, Plus, Loader,
  Megaphone, Star, MessageSquare, Phone, Send, RefreshCw,
  ShoppingBag, ChefHat, Bell, Utensils, CreditCard, X,
  AlertCircle, ChevronDown, CalendarDays, Edit2, Trash2,
  Gift, Award, TrendingUp, Zap, Check, Mail, Ticket, Lock,
} from 'lucide-react';

const ORDER_STEPS = [
  { key: 'placed',     label: 'PLACED',     icon: Package },
  { key: 'confirmed',  label: 'CONFIRMED',  icon: CheckCircle },
  { key: 'preparing',  label: 'PREPARING',  icon: ChefHat },
  { key: 'ready',      label: 'READY',      icon: Utensils },
  { key: 'served',     label: 'SERVED',     icon: Star },
  { key: 'done',       label: 'DONE',       icon: CreditCard },
];

const STATUS_TO_STEP = {
  pending_confirmation: 0,  // dine-in waiting for manager approval
  pending:              1,  // order confirmed, queued for kitchen
  start_cooking:        2,  // chef started
  completed_cooking:    3,  // food ready
  served:               4,  // food served at table
  paid:                 5,  // bill settled
  cancelled:           -1,
};

// Use a ref-based auto-refresh so the callback is always fresh (avoids stale closures)
const useAutoRefresh = (callback, ms = 7000) => {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);
  useEffect(() => {
    const id = setInterval(() => cbRef.current(true), ms);
    return () => clearInterval(id);
  }, [ms]);
};

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)}
        className={`text-3xl transition-all ${n <= value ? 'text-primary' : 'text-white/20 hover:text-primary/50'}`}>
        ★
      </button>
    ))}
  </div>
);

// Delivery-aware step: uses both Order status + Delivery document status.
// Mirrors getDeliveryStep in Cart.jsx so both trackers are consistent.
const getDeliveryStep = (order, delivery) => {
  if (!order) return 0;
  if (order.status === 'paid') return 5;
  if (delivery?.status === 'delivered') return 4;
  if (delivery?.status === 'in_transit' || delivery?.status === 'picked_up') return 3;
  if (delivery?.captain_dispatched || delivery?.status === 'assigned') return 2;
  if (order.status === 'completed_cooking' || order.status === 'served') return 1;
  if (order.status === 'start_cooking') return 1;
  return 0;
};

// Delivery tracking steps for the OrderHistory live card
const DELIVERY_ORDER_STEPS = [
  { key: 'placed',      label: 'PLACED',      icon: Package    },
  { key: 'preparing',   label: 'PREPARING',   icon: ChefHat    },
  { key: 'dispatched',  label: 'DISPATCHED',  icon: Truck      },
  { key: 'delivering',  label: 'DELIVERING',  icon: Navigation },
  { key: 'delivered',   label: 'DELIVERED',   icon: MapPin     },
  { key: 'paid',        label: 'PAID',        icon: CreditCard },
];

/* ─── Status badge helper ──────────────────────────────────────── */
const STATUS_BADGE = {
  pending_confirmation: { label: 'Awaiting Confirmation', color: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' },
  pending:              { label: 'Order Placed',          color: 'bg-white/10 border-white/20 text-white/60' },
  start_cooking:        { label: '🔥 Preparing',          color: 'bg-orange-500/20 border-orange-500/40 text-orange-400' },
  completed_cooking:    { label: '✅ Ready to Serve',     color: 'bg-blue-500/20 border-blue-500/40 text-blue-400' },
  served:               { label: '🍽️ Served — Pay Bill', color: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
  paid:                 { label: '✅ Paid',               color: 'bg-green-500/20 border-green-500/40 text-green-400' },
  cancelled:            { label: '❌ Cancelled',          color: 'bg-red-500/20 border-red-500/40 text-red-400' },
};

/* ─── Live Order Card ──────────────────────────────────────────── */
const LiveOrderCard = ({ order, onRefresh }) => {
  const isDelivery  = order.order_type === 'delivery';
  const delivery    = order.delivery || null;  // bundled by backend
  const isCancelled = order.status === 'cancelled';
  const badge       = STATUS_BADGE[order.status] || { label: order.status, color: 'bg-white/10 border-white/20 text-white/50' };

  // Use delivery-aware steps for delivery orders, standard steps for dine-in
  const steps   = isDelivery ? DELIVERY_ORDER_STEPS : ORDER_STEPS;
  const stepIdx = isDelivery
    ? getDeliveryStep(order, delivery)
    : (STATUS_TO_STEP[order.status] ?? 0);

  return (
    <div className="bg-secondary/40 rounded-3xl border border-primary/20 overflow-hidden">
      <div className="bg-black/30 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-primary" />
          <div>
            <span className="text-xs font-black text-white uppercase tracking-widest">ORDER TRACKING</span>
            <div className="mt-1">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onRefresh} className="text-xs text-primary font-bold flex items-center gap-1 hover:text-yellow-400 transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="px-6 pt-6 pb-4">
        {isCancelled ? (
          <div className="text-center py-4">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
            <p className="text-red-400 font-bold text-sm uppercase tracking-widest">Order Cancelled</p>
          </div>
        ) : (
          <div className="flex items-center">
            {steps.map((step, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const Icon = step.icon;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center gap-2" style={{ minWidth: 0, flex: '0 0 auto' }}>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                      ${active ? 'bg-primary border-primary shadow-lg shadow-primary/40' :
                        done ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10'}`}>
                      <Icon size={15} className={active ? 'text-white' : done ? 'text-primary/70' : 'text-white/20'} />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest text-center
                      ${active ? 'text-primary' : done ? 'text-white/40' : 'text-white/20'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-5 mx-1 ${done ? 'bg-primary/40' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-6 mb-6 bg-black/30 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary text-xs font-black">{order.order_number || `ORD_${order._id?.slice(-13)}`}</span>
          <span className="text-text-muted text-xs flex items-center gap-1">
            <Clock size={10} />
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="space-y-1.5 mb-4">
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-white/80">{item.name || item.menu_item_id?.name || 'Item'}</span>
              <span className="text-text-muted text-xs">×{item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center border-t border-white/10 pt-3">
          <span className="text-text-muted text-sm font-bold">Total</span>
          <span className="text-primary text-base font-black">${(order.total || 0).toFixed(2)}</span>
        </div>
      </div>

      {order.status === 'served' && (
        <div className="mx-6 mb-6 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 animate-pulse">
          <span className="text-xl">🍽️</span>
          <div>
            <p className="text-sm font-black text-amber-300">Your food has been served!</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Please ask your captain for the bill to complete your order.</p>
          </div>
        </div>
      )}

      {order.status === 'completed_cooking' && (
        <div className="mx-6 mb-6 flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-4 py-3">
          <span className="text-xl">🍛</span>
          <div>
            <p className="text-sm font-black text-blue-300">Your order is ready!</p>
            <p className="text-xs text-blue-400/70 mt-0.5">The captain will serve your food shortly.</p>
          </div>
        </div>
      )}

      {order.status === 'start_cooking' && (
        <div className="mx-6 mb-6 flex items-start gap-2 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3">
          <span className="text-xl">🔥</span>
          <div>
            <p className="text-sm font-black text-orange-300">Chef is preparing your order!</p>
            <p className="text-xs text-orange-400/70 mt-0.5">Your food is being freshly cooked. Won't be long!</p>
          </div>
        </div>
      )}

      {order.status === 'pending_confirmation' && (
        <div className="mx-6 mb-6 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 animate-pulse">
          <span className="text-xl">⏳</span>
          <div>
            <p className="text-sm font-black text-yellow-300">Waiting for confirmation</p>
            <p className="text-xs text-yellow-400/70 mt-0.5">The restaurant is reviewing your order. Up to 10 minutes.</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Announcements ─────────────────────────────────────────────── */
const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    announcementsAPI.getPublic()
      .then(res => setAnnouncements(res.data || []))
      .catch(() => setAnnouncements([]))
      .finally(() => { if (!silent) setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-6"><Loader size={20} className="animate-spin text-primary" /></div>;
  if (announcements.length === 0) return (
    <div className="text-center py-12 text-text-muted">
      <Megaphone size={40} className="mx-auto mb-3 opacity-20" />
      <p className="text-sm font-bold uppercase tracking-widest">No announcements right now</p>
    </div>
  );

  const priorityBorder = { low: 'border-white/5', normal: 'border-blue-500/20', high: 'border-yellow-500/30', urgent: 'border-red-500/40' };
  const priorityDot = { low: 'bg-white/20', normal: 'bg-blue-400', high: 'bg-yellow-400', urgent: 'bg-red-400 animate-pulse' };

  return (
    <div className="space-y-3">
      {announcements.map(a => (
        <div key={a._id} className={`bg-secondary/40 rounded-2xl border p-5 ${priorityBorder[a.priority] || 'border-white/5'}`}>
          <button className="w-full flex items-start gap-3 text-left" onClick={() => setExpanded(expanded === a._id ? null : a._id)}>
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${priorityDot[a.priority] || 'bg-blue-400'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white">{a.title}</h4>
                {a.is_festival && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    🎉 {a.festival_name || 'Festival Offer'}
                  </span>
                )}
                {a.has_offer && a.offer_discount > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    🏷 {a.offer_discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">By {a.created_by?.name || 'Team'} · {new Date(a.created_at).toLocaleDateString()}</p>
            </div>
            <ChevronDown size={14} className={`text-text-muted shrink-0 transition-transform mt-0.5 ${expanded === a._id ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expanded === a._id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <p className="text-sm text-white/80 mt-3 ml-5">{a.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

/* ─── Feedback Form ─────────────────────────────────────────────── */
const InlineFeedbackForm = ({ user, onSuccess }) => {
  const [form, setForm] = useState({
    customer_name: user?.name || '',
    mobile_number: user?.phone || '',
    customer_email: user?.email || '',
    rating: 0,
    category: 'general',
    message: '',
    suggestion: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) { setError('Please select a star rating.'); return; }
    if (!form.customer_email.trim()) { setError('Email address is required.'); return; }
    if (!form.mobile_number.trim()) { setError('Mobile number is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await feedbackAPI.create({
        customer_id: user?._id || user?.id || undefined,
        customer_name: form.customer_name || 'Anonymous',
        customer_email: form.customer_email,
        mobile_number: form.mobile_number,
        rating: form.rating,
        category: form.category,
        message: form.message,
        suggestion: form.suggestion,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-3 block">Your Rating *</label>
        <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Your Name</label>
          <input type="text" value={form.customer_name} onChange={sf('customer_name')} placeholder="Your name"
            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/30" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">📱 Mobile *</label>
          <input type="tel" value={form.mobile_number} onChange={sf('mobile_number')} placeholder="+1 555 000 0000" required
            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/30" />
        </div>
      </div>
      {/* Email — mandatory */}
      <div>
        <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block flex items-center gap-1.5">
          <Mail size={10} className="text-primary" /> Email Address *
          <span className="text-primary text-[9px] normal-case font-normal ml-1">(owner may reply here)</span>
        </label>
        <input
          type="email"
          required
          value={form.customer_email}
          onChange={sf('customer_email')}
          placeholder="you@example.com"
          className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/30"
        />
      </div>
      <div>
        <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Category</label>
        <div className="flex gap-2 flex-wrap">
          {['food', 'service', 'ambience', 'general'].map(c => (
            <button key={c} type="button" onClick={() => setForm(p => ({ ...p, category: c }))}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all
                ${form.category === c ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Your Review</label>
        <textarea value={form.message} onChange={sf('message')} rows={3} placeholder="Tell us about your experience..."
          className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm resize-none placeholder:text-white/30" />
      </div>
      <div>
        <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Suggestions (optional)</label>
        <textarea value={form.suggestion} onChange={sf('suggestion')} rows={2} placeholder="Any suggestions to improve our service?"
          className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm resize-none placeholder:text-white/30" />
      </div>
      {error && <p className="text-red-400 text-sm font-bold bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}
      <button type="submit" disabled={submitting}
        className="w-full py-4 bg-primary hover:bg-yellow-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20">
        {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
        Submit Feedback
      </button>
    </form>
  );
};

/* ─── Addresses Tab ─────────────────────────────────────────────── */
const AddressesTab = () => {
  const [addresses, setAddresses]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [msg, setMsg]                 = useState({ text: '', type: '' });
  const [form, setForm]               = useState({ label: '', address_line: '', type: 'home', is_default: false });

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await addressesAPI.getAll();
      setAddresses(res.data || []);
    } catch { setAddresses([]); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ label: '', address_line: '', type: 'home', is_default: false });
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditTarget(addr);
    setForm({ label: addr.label || '', address_line: addr.address_line || '', type: addr.type || 'home', is_default: addr.is_default || false });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.address_line.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await addressesAPI.update(editTarget._id, form);
        flash('Address updated!');
      } else {
        await addressesAPI.create(form);
        flash('Address added!');
      }
      setShowForm(false);
      setEditTarget(null);
      load();
    } catch (err) { flash(err.message || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    setDeletingId(id);
    try {
      await addressesAPI.delete(id);
      setAddresses(a => a.filter(x => x._id !== id));
      flash('Address removed');
    } catch (err) { flash(err.message || 'Failed to delete', 'error'); }
    finally { setDeletingId(null); }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressesAPI.setDefault(id);
      load();
      flash('Default address updated');
    } catch (err) { flash(err.message || 'Failed', 'error'); }
  };

  const TYPE_ICON = { home: Home, office: Building, other: MapPin };
  const TYPE_COLOR = { home: 'text-blue-400 bg-blue-500/10', office: 'text-purple-400 bg-purple-500/10', other: 'text-teal-400 bg-teal-500/10' };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {msg.text && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`px-5 py-3 rounded-xl text-sm font-bold border ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-secondary/40 rounded-3xl border border-primary/30 p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editTarget ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => { setShowForm(false); setEditTarget(null); }}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-text-muted hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Label</label>
                  <input type="text" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Home, Work, Dad's place"
                    className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm">
                    <option value="home">🏠 Home</option>
                    <option value="office">🏢 Office</option>
                    <option value="other">📍 Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Full Address *</label>
                <textarea required value={form.address_line} onChange={e => setForm(p => ({ ...p, address_line: e.target.value }))}
                  rows={2} placeholder="Street, Area, City, ZIP"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))}
                  className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm text-white font-bold">Set as default address</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setEditTarget(null); }}
                  className="flex-1 py-3 border border-white/20 rounded-2xl text-sm font-bold text-white/60 hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-primary hover:bg-yellow-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader size={15} className="animate-spin" /> : <Check size={15} />}
                  {editTarget ? 'Update' : 'Save Address'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {addresses.map(addr => {
            const Icon = TYPE_ICON[addr.type] || MapPin;
            const colorClass = TYPE_COLOR[addr.type] || 'text-teal-400 bg-teal-500/10';
            return (
              <div key={addr._id}
                className={`relative bg-secondary/40 p-7 rounded-3xl border group transition-all ${addr.is_default ? 'border-primary/40' : 'border-white/5 hover:border-white/15'}`}>
                {addr.is_default && (
                  <span className="absolute top-4 right-4 text-[9px] font-black px-2 py-1 rounded-full bg-primary/20 text-primary uppercase">Default</span>
                )}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass} shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white">{addr.label || addr.type}</h3>
                    <p className="text-sm text-text-muted mt-1 leading-relaxed">{addr.address_line}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr._id)}
                      className="flex-1 py-2 text-[10px] font-black uppercase border border-white/10 rounded-xl text-text-muted hover:text-primary hover:border-primary/30 transition-all">
                      Set Default
                    </button>
                  )}
                  <button onClick={() => openEdit(addr)}
                    className="py-2 px-4 text-[10px] font-black uppercase bg-primary/10 border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-1">
                    <Edit2 size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(addr._id)} disabled={deletingId === addr._id}
                    className="py-2 px-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    {deletingId === addr._id ? <Loader size={11} className="animate-spin" /> : <Trash2 size={11} />}
                  </button>
                </div>
              </div>
            );
          })}

          <button onClick={openAdd}
            className="min-h-[160px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-text-muted hover:border-primary/50 hover:text-primary transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-primary/10 flex items-center justify-center transition-all">
              <Plus size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Add New Address</span>
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Coupon Card ─────────────────────────────────────────────── */
const CouponCard = ({ coupon, index }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        coupon.is_used || isExpired
          ? 'bg-white/5 border-white/10 opacity-60'
          : 'bg-gradient-to-br from-primary/15 via-yellow-500/5 to-transparent border-primary/30'
      }`}
    >
      {/* Dashed divider circles */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-bg-main border border-white/10" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-bg-main border border-white/10" />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={14} className={coupon.is_used || isExpired ? 'text-white/30' : 'text-primary'} />
            <span className={`text-2xl font-black ${coupon.is_used || isExpired ? 'text-white/40' : 'text-primary'}`}>
              ${coupon.amount} OFF
            </span>
          </div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
            {coupon.is_used ? '✓ Used' : isExpired ? '⏱ Expired' : 'Valid coupon'}
          </p>
          {coupon.expires_at && !coupon.is_used && !isExpired && (
            <p className="text-[9px] text-text-muted mt-0.5">
              Expires {new Date(coupon.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className={`font-mono text-sm font-black px-3 py-1.5 rounded-xl mb-2 border ${
            coupon.is_used || isExpired ? 'border-white/10 text-white/30 bg-white/5' : 'border-primary/30 text-primary bg-primary/10'
          }`}>
            {coupon.code}
          </div>
          {!coupon.is_used && !isExpired && (
            <button onClick={handleCopy}
              className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline transition-all">
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Rewards Tab ───────────────────────────────────────────────── */
const RewardsTab = ({ user }) => {
  const [loyalty, setLoyalty] = useState(null);
  const [paidOrders, setPaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user._id || user.id;
    if (!uid) { setLoading(false); return; }

    Promise.all([
      loyaltyAPI.getTransactions(uid).then(r => r.data || null).catch(() => null),
      ordersAPI.history(uid).then(r => r.data || []).catch(() => []),
    ]).then(([loyaltyData, allOrders]) => {
      setLoyalty(loyaltyData);
      // Only paid orders count toward coupon spend
      const paid = allOrders
        .filter(o => o.status === 'paid')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setPaidOrders(paid);
    }).finally(() => { if (!silent) setLoading(false); });
  }, [user]);

  const points = loyalty?.points ?? user?.loyalty_points ?? 0;
  const rewardCoupons = user?.reward_coupons ?? [];

  // Build running total from real paid order history
  const MILESTONE = 1000;
  const COUPON_VALUE = 200;

  const orderRows = paidOrders.map((order, i) => {
    const runningTotal = paidOrders.slice(0, i + 1).reduce((sum, o) => sum + (o.total || 0), 0);
    return { order, runningTotal };
  });

  const totalSpent = orderRows.length > 0 ? orderRows[orderRows.length - 1].runningTotal : (user?.total_spent ?? 0);
  const earnedMilestones = Math.floor(totalSpent / MILESTONE);
  const spentTowardNext = totalSpent % MILESTONE;
  const pctToNextCoupon = Math.min(100, (spentTowardNext / MILESTONE) * 100);

  // Tier thresholds
  const tiers = [
    { name: 'Bronze',   min: 0,    max: 499,  color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20', icon: '🥉' },
    { name: 'Silver',   min: 500,  max: 1499, color: 'text-gray-300',    bg: 'bg-white/10 border-white/20',            icon: '🥈' },
    { name: 'Gold',     min: 1500, max: 4999, color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20',  icon: '🥇' },
    { name: 'Platinum', min: 5000, max: Infinity, color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20',     icon: '💎' },
  ];
  const currentTier = tiers.find(t => points >= t.min && points <= t.max) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const pctToNext = nextTier ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

  if (loading) return <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-primary" /></div>;

  const activeCoupons = rewardCoupons.filter(c => !c.is_used && (!c.expires_at || new Date(c.expires_at) >= new Date()));
  const usedOrExpiredCoupons = rewardCoupons.filter(c => c.is_used || (c.expires_at && new Date(c.expires_at) < new Date()));

  // Milestone crossings: which orders pushed the running total past a $1000 mark
  const milestoneCrossings = new Set();
  orderRows.forEach(({ runningTotal }) => {
    const ms = Math.floor(runningTotal / MILESTONE);
    for (let m = 1; m <= ms; m++) milestoneCrossings.add(m);
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Points card */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/40 rounded-3xl border border-primary/30 p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">Total Loyalty Points</p>
              <p className="text-6xl font-black text-white">{points.toLocaleString()}</p>
              <p className="text-text-muted text-sm mt-1">≈ ${(points * 0.1).toFixed(0)} redeemable value</p>
            </div>
            <div className={`px-4 py-2 rounded-2xl border text-sm font-black flex items-center gap-2 ${currentTier.bg} ${currentTier.color}`}>
              <span>{currentTier.icon}</span> {currentTier.name}
            </div>
          </div>

          {nextTier && (
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-text-muted font-bold">{points} pts</span>
                <span className="text-text-muted font-bold">{nextTier.min} pts for {nextTier.name}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pctToNext}%` }} />
              </div>
              <p className="text-[10px] text-text-muted mt-1.5 font-bold">
                {nextTier.min - points} more points to reach {nextTier.icon} {nextTier.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Coupon Milestone Tracker (from real order history) ────── */}
      <div className="bg-gradient-to-br from-yellow-500/10 via-primary/5 to-secondary/40 rounded-3xl border border-yellow-500/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-2xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white">
              Rewards Tracker — ${COUPON_VALUE} at ${MILESTONE.toLocaleString()}
            </span>
          </div>
          <span className="text-primary font-black text-sm">${totalSpent.toFixed(2)} spent</span>
        </div>

        {/* Order rows table */}
        <div className="relative z-10 px-6 pt-4">
          {orderRows.length === 0 ? (
            <p className="text-[11px] text-text-muted py-4 text-center">
              No paid orders yet — start ordering to build your spend tracker.
            </p>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-3 mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Date</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Amount</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Running Total</span>
              </div>

              {/* Order rows */}
              <div className="space-y-0 max-h-52 overflow-y-auto">
                {orderRows.map(({ order, runningTotal }, idx) => {
                  const prevTotal = idx > 0 ? orderRows[idx - 1].runningTotal : 0;
                  const crossedMs = Math.floor(prevTotal / MILESTONE) < Math.floor(runningTotal / MILESTONE);
                  return (
                    <React.Fragment key={order._id}>
                      {crossedMs && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 py-2 my-1"
                        >
                          <div className="flex-1 h-px bg-primary/40" />
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/10 border border-primary/30 rounded-full flex items-center gap-1">
                            <Ticket size={9} /> ${COUPON_VALUE} Coupon Unlocked!
                          </span>
                          <div className="flex-1 h-px bg-primary/40" />
                        </motion.div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="grid grid-cols-3 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-lg px-1 transition-colors"
                      >
                        <span className="text-xs text-white/60">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs font-black text-white text-center">
                          +${(order.total || 0).toFixed(2)}
                        </span>
                        <span className="text-xs font-black text-primary text-right">
                          ${runningTotal.toFixed(2)}
                        </span>
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Progress toward next coupon */}
        <div className="relative z-10 px-6 pb-6 pt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-text-muted font-bold">
              Next reward at ${((earnedMilestones + 1) * MILESTONE).toLocaleString()}
            </span>
            <span className="text-[10px] text-text-muted font-bold">
              ${(MILESTONE - spentTowardNext).toFixed(2)} to go
            </span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pctToNextCoupon}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-yellow-500 to-primary rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-text-muted">Total coupons earned from spend</span>
            <span className="text-xl font-black text-primary">{earnedMilestones}</span>
          </div>
        </div>
      </div>

      {/* Active Coupons */}
      {activeCoupons.length > 0 && (
        <div className="bg-secondary/40 rounded-2xl border border-white/5 p-6">
          <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Ticket size={16} className="text-primary" /> Active Coupons
            <span className="text-[10px] font-black px-2 py-0.5 bg-primary/20 text-primary rounded-full">{activeCoupons.length}</span>
          </h4>
          <div className="space-y-3">
            {activeCoupons.map((coupon, i) => (
              <CouponCard key={coupon.code || i} coupon={coupon} index={i} />
            ))}
          </div>
        </div>
      )}

      {activeCoupons.length === 0 && (
        <div className="bg-secondary/40 rounded-2xl border border-white/5 p-6 text-center">
          <Lock size={28} className="mx-auto mb-3 text-white/20" />
          <p className="text-sm font-bold text-white/60 uppercase tracking-widest">No active coupons yet</p>
          <p className="text-xs text-text-muted mt-1">
            Spend ${(MILESTONE - spentTowardNext).toFixed(0)} more to unlock a ${COUPON_VALUE} coupon!
          </p>
        </div>
      )}

      {/* How to earn */}
      <div className="bg-secondary/40 rounded-2xl border border-white/5 p-6">
        <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Zap size={16} className="text-primary" />How to Earn Points</h4>
        <div className="space-y-3">
          {[
            { label: 'Every order placed',    pts: '+10 pts',  icon: ShoppingBag },
            { label: 'Order above $500',      pts: '+25 pts',  icon: TrendingUp  },
            { label: 'Submit feedback',        pts: '+5 pts',   icon: MessageSquare },
            { label: 'Refer a friend',         pts: '+50 pts',  icon: Gift        },
          ].map(({ label, pts, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon size={14} className="text-primary" />
                </div>
                <span className="text-sm text-white/80 font-medium">{label}</span>
              </div>
              <span className="text-sm font-black text-primary">{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Points Transaction history */}
      {loyalty?.transactions?.length > 0 && (
        <div className="bg-secondary/40 rounded-2xl border border-white/5 p-6">
          <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Award size={16} className="text-primary" />Points History</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loyalty.transactions.slice(0, 20).map(tx => (
              <div key={tx._id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white font-bold capitalize">{tx.type?.replace('_', ' ') || 'Points'}</p>
                  <p className="text-[10px] text-text-muted">{tx.description || '—'} · {new Date(tx.created_at || tx.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className={`text-sm font-black ${tx.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used / Expired Coupons */}
      {usedOrExpiredCoupons.length > 0 && (
        <div className="bg-secondary/40 rounded-2xl border border-white/5 p-6">
          <h4 className="text-base font-bold text-white/40 mb-4 flex items-center gap-2">
            <Ticket size={16} className="text-white/20" /> Used / Expired Coupons
          </h4>
          <div className="space-y-3">
            {usedOrExpiredCoupons.map((coupon, i) => (
              <CouponCard key={coupon.code || i} coupon={coupon} index={i} />
            ))}
          </div>
        </div>
      )}

      {!loyalty?.transactions?.length && activeCoupons.length === 0 && paidOrders.length === 0 && (
        <div className="text-center py-10 text-text-muted">
          <Award size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest">No transactions yet</p>
          <p className="text-xs mt-1">Start ordering to earn points & unlock coupons!</p>
        </div>
      )}
    </div>
  );
};

/* ─── Main OrderHistory ─────────────────────────────────────────── */
const OrderHistory = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['active','history','announcements','feedback','addresses','rewards'].includes(tab)) return tab;
    return 'active';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [activeOrders, setActiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['active','history','announcements','feedback','addresses','rewards'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!user) return;
    const uid = user._id || user.id;
    if (!uid) return;
    if (!silent) setLoading(true);
    try {
      const res = await ordersAPI.history(uid);
      const all = res.data || [];
      setActiveOrders(all.filter(o => ['pending_confirmation', 'pending', 'start_cooking', 'completed_cooking', 'served'].includes(o.status)));
      setHistoryOrders(all.filter(o => ['paid', 'cancelled', 'delivered'].includes(o.status)));
    } catch {}
    finally { if (!silent) setLoading(false); }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useAutoRefresh(fetchOrders, 15000);

  const tabs = [
    { id: 'active',        label: 'Active',      badge: activeOrders.length },
    { id: 'history',       label: 'History' },
    { id: 'announcements', label: 'Updates',     icon: Megaphone },
    { id: 'feedback',      label: 'Feedback',    icon: MessageSquare },
    { id: 'rewards',       label: 'Rewards',     icon: Gift },
    { id: 'addresses',     label: 'Addresses' },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="container max-w-5xl mx-auto relative z-10">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold font-heading mb-2">Your Movement Hub</h1>
            <p className="text-text-muted font-medium">Tracking your flavors across the city.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl flex-wrap gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl transition-all text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5
                  ${activeTab === tab.id ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
                {tab.icon && <tab.icon size={12} />}
                {tab.label}
                {tab.badge > 0 && (
                  <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader size={32} className="animate-spin text-primary" />
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ACTIVE ORDERS */}
          {activeTab === 'active' && !loading && (
            <MotionDiv key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {activeOrders.length === 0 ? (
                <div className="text-center py-24 text-text-muted">
                  <Package size={56} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Active Orders</p>
                  <p className="text-xs mt-2 text-text-muted/60">Place an order from our menu to track it here</p>
                </div>
              ) : activeOrders.map(order => (
                <LiveOrderCard key={order._id} order={order} onRefresh={fetchOrders} />
              ))}
            </MotionDiv>
          )}

          {/* ORDER HISTORY */}
          {activeTab === 'history' && !loading && (
            <MotionDiv key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              {historyOrders.length === 0 ? (
                <div className="text-center py-24 text-text-muted">
                  <CheckCircle size={56} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Order History Yet</p>
                  <p className="text-xs mt-2 text-text-muted/60">Your completed orders will appear here</p>
                </div>
              ) : historyOrders.map(order => (
                <div key={order._id} className="flex items-center gap-6 bg-secondary/30 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:bg-primary/20 group-hover:text-primary transition-all shrink-0">
                    {order.status === 'cancelled' ? <AlertCircle size={24} className="text-red-400" /> : <CheckCircle size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold mb-1 truncate">
                      {(order.items || []).slice(0, 2).map(i => i.name || i.menu_item_id?.name).filter(Boolean).join(', ') || 'Order'}
                      {(order.items || []).length > 2 && ` +${(order.items || []).length - 2} more`}
                    </p>
                    <p className="text-xs text-text-muted uppercase tracking-widest">
                      {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {order.order_number && ` · ${order.order_number}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary mb-1">${(order.total || 0).toFixed(2)}</p>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase
                      ${order.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-text-muted'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </MotionDiv>
          )}

          {/* ANNOUNCEMENTS / UPDATES */}
          {activeTab === 'announcements' && (
            <MotionDiv key="announcements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                  <Megaphone size={24} className="text-primary" /> Latest Updates
                </h2>
                <p className="text-text-muted text-sm">Announcements, offers & news from the team</p>
              </div>
              <AnnouncementsSection />
            </MotionDiv>
          )}

          {/* FEEDBACK */}
          {activeTab === 'feedback' && (
            <MotionDiv key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="max-w-lg mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={28} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Share Your Experience</h2>
                  <p className="text-text-muted text-sm">Your feedback helps us serve you better</p>
                </div>

                {feedbackSuccess ? (
                  <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 bg-green-500/10 border border-green-500/30 rounded-3xl">
                    <CheckCircle size={56} className="mx-auto mb-4 text-green-400" />
                    <h3 className="text-xl font-black text-white mb-2">Thank You!</h3>
                    <p className="text-text-muted text-sm mb-6">Your feedback has been submitted successfully.</p>
                    <button onClick={() => setFeedbackSuccess(false)}
                      className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-yellow-500 transition-all">
                      Submit Another
                    </button>
                  </MotionDiv>
                ) : (
                  <div className="bg-secondary/40 rounded-3xl border border-white/5 p-8">
                    <InlineFeedbackForm user={user} onSuccess={() => setFeedbackSuccess(true)} />
                  </div>
                )}
              </div>
            </MotionDiv>
          )}

          {/* REWARDS */}
          {activeTab === 'rewards' && (
            <MotionDiv key="rewards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                  <Gift size={24} className="text-primary" /> My Rewards
                </h2>
                <p className="text-text-muted text-sm">Your loyalty points, tier status, coupons & transaction history</p>
              </div>
              <RewardsTab user={user} />
            </MotionDiv>
          )}

          {/* ADDRESSES */}
          {activeTab === 'addresses' && (
            <MotionDiv key="addresses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                  <MapPin size={24} className="text-primary" /> My Addresses
                </h2>
                <p className="text-text-muted text-sm">Manage your saved delivery addresses</p>
              </div>
              <AddressesTab />
            </MotionDiv>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderHistory;