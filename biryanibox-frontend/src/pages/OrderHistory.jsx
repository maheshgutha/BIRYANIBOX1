import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import { ordersAPI, addressesAPI, feedbackAPI, announcementsAPI, loyaltyAPI, menuAPI } from '../services/api';
import { useAuth } from '../context/useContextHooks';
import { useLocation } from 'react-router-dom';
import {
  Truck, MapPin, Package, Clock, CheckCircle,
  ChevronRight, Home, Building, Plus, Loader,
  Megaphone, Star, MessageSquare, Phone, Send, RefreshCw,
  ShoppingBag, ChefHat, Bell, Utensils, CreditCard, X,
  AlertCircle, ChevronDown, CalendarDays, Edit2, Trash2,
  Gift, Award, TrendingUp, Zap, Check, Ticket, Tag,
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
  pending:           0,
  start_cooking:     2,
  completed_cooking: 3,
  served:            4,
  paid:              5,
  cancelled:         -1,
};

const useAutoRefresh = (callback, ms = 15000) => {
  useEffect(() => {
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
  }, [callback, ms]);
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

/* ─── Live Order Card ──────────────────────────────────────────── */
const LiveOrderCard = ({ order, onRefresh }) => {
  const stepIdx = STATUS_TO_STEP[order.status] ?? 0;
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-secondary/40 rounded-3xl border border-primary/20 overflow-hidden">
      <div className="bg-black/30 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-primary" />
          <span className="text-xs font-black text-white uppercase tracking-widest">ORDER TRACKING</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">LIVE</span>
          </span>
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
            {ORDER_STEPS.map((step, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const Icon = step.icon;
              return (
                <React.Fragment key={step.key + i}>
                  <div className="flex flex-col items-center gap-2" style={{ minWidth: 0, flex: '0 0 auto' }}>
                    <motion.div
                      animate={active ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                        ${active ? 'bg-primary border-primary shadow-lg shadow-primary/40' :
                          done ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10'}`}>
                      <Icon size={15} className={active ? 'text-white' : done ? 'text-primary/70' : 'text-white/20'} />
                    </motion.div>
                    <span className={`text-[8px] font-black uppercase tracking-widest text-center
                      ${active ? 'text-primary' : done ? 'text-white/40' : 'text-white/20'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-5 mx-1 transition-all duration-700 ${done ? 'bg-primary/40' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-6 mb-6 bg-black/30 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary text-xs font-black">{order.order_number || `ORD_${order._id?.slice(-8)}`}</span>
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
          <span className="text-primary text-base font-black">₹{(order.total || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Announcements ─────────────────────────────────────────────── */
const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [expanded, setExpanded]           = useState(null);
  const [menuItems, setMenuItems]         = useState([]);
  const [error, setError]                 = useState('');

  useEffect(() => {
    announcementsAPI.getPublic()
      .then(res => {
        // backend returns { success: true, data: [...] }
        const list = res?.data ?? res ?? [];
        setAnnouncements(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setError('Could not load announcements.');
        setAnnouncements([]);
      })
      .finally(() => setLoading(false));

    menuAPI.getAll()
      .then(res => setMenuItems(res?.data || []))
      .catch(() => {});
  }, []);

  if (loading) return <div className="flex justify-center py-6"><Loader size={20} className="animate-spin text-primary" /></div>;

  if (error) return (
    <div className="text-center py-12 text-red-400">
      <AlertCircle size={36} className="mx-auto mb-3 opacity-60" />
      <p className="text-sm font-bold">{error}</p>
    </div>
  );

  if (announcements.length === 0) return (
    <div className="text-center py-12 text-text-muted">
      <Megaphone size={40} className="mx-auto mb-3 opacity-20" />
      <p className="text-sm font-bold uppercase tracking-widest">No announcements right now</p>
    </div>
  );

  const priorityBorder = { low: 'border-white/5', normal: 'border-blue-500/20', high: 'border-yellow-500/30', urgent: 'border-red-500/40' };
  const priorityDot    = { low: 'bg-white/20', normal: 'bg-blue-400', high: 'bg-yellow-400', urgent: 'bg-red-400 animate-pulse' };

  return (
    <div className="space-y-4">
      {announcements.map(a => {
        const hasOffer   = a.has_offer && Number(a.offer_discount) > 0;
        const isAllItems = a.offer_scope === 'all' || (a.offer_items && a.offer_items.includes('ALL'));
        const offerItems = !isAllItems && a.offer_items && a.offer_items.length > 0
          ? menuItems.filter(m => a.offer_items.includes(String(m._id || m.id)))
          : null;

        return (
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
                  {hasOffer && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
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
                  <div className="mt-3 ml-5 space-y-3">
                    <p className="text-sm text-white/80">{a.message}</p>
                    {hasOffer && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-green-400" />
                          <p className="text-sm font-black text-green-400">{a.offer_discount}% OFF — Active Offer</p>
                        </div>
                        {isAllItems && (
                          <p className="text-xs text-white/70 font-bold">✅ Applies to <span className="text-green-400">ALL menu items</span></p>
                        )}
                        {offerItems && offerItems.length > 0 && (
                          <div>
                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2">Items on offer:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {offerItems.map(item => (
                                <div key={item._id || item.id} className="bg-black/30 rounded-xl p-3 border border-green-500/20">
                                  <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-text-muted line-through">₹{(item.price || 0).toFixed(2)}</span>
                                    <span className="text-sm font-black text-green-400">
                                      ₹{((item.price || 0) * (1 - a.offer_discount / 100)).toFixed(2)}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-black text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full">
                                    SAVE {a.offer_discount}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!offerItems && !isAllItems && (
                          <p className="text-xs text-white/60">
                            Show this announcement at checkout to redeem {a.offer_discount}% off.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Feedback Form ─────────────────────────────────────────────── */
const InlineFeedbackForm = ({ user, onSuccess }) => {
  const [form, setForm] = useState({
    customer_name: user?.name || '',
    mobile_number: user?.phone || '',
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
    if (!form.mobile_number.trim()) { setError('Mobile number is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await feedbackAPI.create({
        customer_id: user?._id || user?.id || undefined,
        customer_name: form.customer_name || 'Anonymous',
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
          <input type="tel" value={form.mobile_number} onChange={sf('mobile_number')} placeholder="+91 9999 9999" required
            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/30" />
        </div>
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await addressesAPI.getAll();
      setAddresses(res?.data || []);
    } catch { setAddresses([]); }
    finally { setLoading(false); }
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

  const TYPE_ICON  = { home: Home, office: Building, other: MapPin };
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
                    placeholder="e.g. Home, Work"
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
                  rows={2} placeholder="Street, Area, City, Zip"
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
                <div className="flex gap-2">
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

/* ─── Rewards Tab ───────────────────────────────────────────────── */
const REWARD_MILESTONE = 1000;
const REWARD_AMOUNT    = 200;

const getCartHistory = (uid) => {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(`bb_history_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const RewardsTab = ({ user }) => {
  const [loyaltyData, setLoyaltyData]   = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [redeemMsg, setRedeemMsg]       = useState('');
  const [redeemAmt, setRedeemAmt]       = useState('');
  const [redeeming, setRedeeming]       = useState(false);
  const [fetchError, setFetchError]     = useState('');

  const uid = user?._id || user?.id;
  const cartHistory = getCartHistory(uid);
  const cartEntries  = cartHistory?.entries  || [];
  const cartCoupons  = cartHistory?.coupons  || [];
  const cartRunning  = cartHistory?.runningTotal || 0;

  const loadLoyalty = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      setFetchError('Please sign in to view rewards.');
      return;
    }
    setLoading(true);
    setFetchError('');
    try {
      // Fetch loyalty summary
      const res = await loyaltyAPI.getTransactions(uid);
      setLoyaltyData(res?.data || {});

      // Fetch transactions using the same api helper (avoids raw fetch issues)
      try {
        const txRes = await loyaltyAPI.getUserTransactions(uid);
        setTransactions(txRes?.data || []);
      } catch {
        setTransactions([]);
      }
    } catch (err) {
      // Fallback: use user's loyalty_points from auth context
      setLoyaltyData({ points: user?.loyalty_points ?? 0 });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [uid, user?.loyalty_points]);

  useEffect(() => { loadLoyalty(); }, [loadLoyalty]);

  const points = loyaltyData?.points ?? user?.loyalty_points ?? 0;

  const tiers = [
    { name: 'Bronze',   min: 0,    max: 499,      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: '🥉' },
    { name: 'Silver',   min: 500,  max: 1499,     color: 'text-gray-300',   bg: 'bg-white/10 border-white/20',           icon: '🥈' },
    { name: 'Gold',     min: 1500, max: 4999,     color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: '🥇' },
    { name: 'Platinum', min: 5000, max: Infinity, color: 'text-blue-300',   bg: 'bg-blue-500/10 border-blue-500/20',     icon: '💎' },
  ];

  const currentTierName = loyaltyData?.current_tier?.name || null;
  const currentTier = currentTierName
    ? (tiers.find(t => t.name.toLowerCase() === currentTierName.toLowerCase()) || tiers[0])
    : (tiers.find(t => points >= t.min && points <= t.max) || tiers[0]);
  const nextTier  = tiers[tiers.indexOf(currentTier) + 1];
  const pctToNext = nextTier ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

  const txEarned    = transactions.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0);
  const totalSpend  = Math.max(txEarned, cartRunning);
  const couponCount = Math.max(
    Math.floor(txEarned / 1000),
    Math.floor(cartRunning / REWARD_MILESTONE),
  );
  const pctToCoupon = Math.min(100, ((totalSpend % 1000) / 1000) * 100);

  const handleRedeem = async () => {
    const amt = Number(redeemAmt);
    if (!amt || amt <= 0) { setRedeemMsg('Enter a valid amount'); return; }
    if (amt > points) { setRedeemMsg('Not enough points'); return; }
    setRedeeming(true);
    try {
      await loyaltyAPI.redeem({ user_id: uid, points: amt, description: 'Manual redemption' });
      setRedeemMsg(`✓ Redeemed ${amt} points (₹${(amt * 0.1).toFixed(2)} value)`);
      setRedeemAmt('');
      loadLoyalty();
    } catch (e) {
      setRedeemMsg(e.message || 'Redemption failed');
    } finally {
      setRedeeming(false);
      setTimeout(() => setRedeemMsg(''), 4000);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-primary" /></div>;

  if (fetchError && !loyaltyData) return (
    <div className="text-center py-16 text-text-muted">
      <AlertCircle size={40} className="mx-auto mb-3 opacity-30 text-red-400" />
      <p className="text-sm font-bold text-red-400">{fetchError}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* ── Points Card ── */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/40 rounded-3xl border border-primary/30 p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-2">Total Loyalty Points</p>
              <p className="text-6xl font-black text-white">{points.toLocaleString()}</p>
              <p className="text-text-muted text-sm mt-1">≈ ₹{(points * 0.1).toFixed(0)} redeemable value</p>
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

      {/* ── Spend History ── */}
      {cartEntries.length > 0 && (
        <div className="bg-secondary/40 rounded-2xl border border-primary/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Spend History
            </h4>
            <span className="text-xs font-black text-primary">₹{cartRunning.toFixed(2)} total spent</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div className="grid grid-cols-3 text-[10px] font-black text-text-muted uppercase tracking-widest pb-1 border-b border-white/5">
              <span>Date</span><span className="text-center">Amount</span><span className="text-right">Running Total</span>
            </div>
            {cartEntries.map((e, i) => (
              <div key={i} className="grid grid-cols-3 text-[11px]">
                <span className="text-text-muted">{e.date}</span>
                <span className="text-center text-white font-bold">+₹{e.amount.toFixed(2)}</span>
                <span className="text-right text-primary font-bold">₹{e.runningAfter.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>Next ₹200 reward at ₹{(Math.floor(cartRunning / REWARD_MILESTONE) + 1) * REWARD_MILESTONE}</span>
              <span className="text-primary font-black">
                ₹{Math.max(0, (Math.floor(cartRunning / REWARD_MILESTONE) + 1) * REWARD_MILESTONE - cartRunning).toFixed(2)} to go
              </span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-700"
                style={{ width: `${Math.min(((cartRunning % REWARD_MILESTONE) / REWARD_MILESTONE) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Redeem Points ── */}
      <div className="bg-secondary/40 rounded-2xl border border-primary/20 p-5">
        <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <CreditCard size={16} className="text-primary" /> Redeem Points
        </h4>
        <p className="text-text-muted text-xs mb-4">10 points = ₹1.00 discount on your next order</p>
        <div className="flex gap-3">
          <input type="number" min="10" max={points} value={redeemAmt}
            onChange={e => setRedeemAmt(e.target.value)} placeholder="Enter points to redeem"
            className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/30" />
          <button onClick={handleRedeem} disabled={redeeming || points < 10}
            className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-yellow-500 transition-all disabled:opacity-50 flex items-center gap-2">
            {redeeming ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />} Redeem
          </button>
        </div>
        {redeemMsg && <p className={`text-xs font-bold mt-2 ${redeemMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{redeemMsg}</p>}
      </div>

      {/* ── $200 Coupon Cards ── */}
      <div className="bg-secondary/40 rounded-2xl border border-primary/20 p-6">
        <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Ticket size={16} className="text-primary" /> ₹{REWARD_AMOUNT} Reward Coupons
        </h4>
        <p className="text-text-muted text-xs mb-4">Earn a ₹{REWARD_AMOUNT} coupon for every ₹{REWARD_MILESTONE} spent</p>

        <div className="mb-5">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-text-muted font-bold">₹{(totalSpend % 1000).toFixed(0)} / ₹1,000</span>
            <span className="text-text-muted font-bold">₹{(1000 - (totalSpend % 1000)).toFixed(0)} more to next coupon</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${pctToCoupon}%` }} />
          </div>
        </div>

        {cartCoupons.filter(c => !c.used).length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-3">Your Active Coupons</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {cartCoupons.filter(c => !c.used).map((coupon) => (
                <div key={coupon.code}
                  className="relative bg-gradient-to-br from-primary/20 via-yellow-500/10 to-primary/5 border border-primary/40 rounded-2xl p-5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 blur-2xl rounded-full" />
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-bg-main rounded-full border border-white/10" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-bg-main rounded-full border border-white/10" />
                  <div className="border-b border-dashed border-primary/30 pb-3 mb-3">
                    <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-1">Reward Coupon</p>
                    <p className="text-3xl font-black text-white">₹{REWARD_AMOUNT} <span className="text-sm text-primary">OFF</span></p>
                  </div>
                  <p className="text-[9px] text-text-muted uppercase tracking-widest">Earned at ₹{coupon.cycle * REWARD_MILESTONE} spent</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">{coupon.code}</span>
                    <span className="text-[9px] text-green-400 font-bold flex items-center gap-1"><Check size={10} /> Redeemable</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {couponCount > 0 && cartCoupons.filter(c => !c.used).length === 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: couponCount }).map((_, i) => (
              <div key={i}
                className="relative bg-gradient-to-br from-primary/20 via-yellow-500/10 to-primary/5 border border-primary/40 rounded-2xl p-5 overflow-hidden">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-bg-main rounded-full border border-white/10" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-bg-main rounded-full border border-white/10" />
                <div className="border-b border-dashed border-primary/30 pb-3 mb-3">
                  <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-1">Reward Coupon #{i + 1}</p>
                  <p className="text-3xl font-black text-white">₹{REWARD_AMOUNT} <span className="text-sm text-primary">OFF</span></p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
                    BB-REWARD-{String(i + 1).padStart(3, '0')}
                  </span>
                  <span className="text-[9px] text-green-400 font-bold flex items-center gap-1"><Check size={10} /> Redeemable</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {couponCount === 0 && cartCoupons.filter(c => !c.used).length === 0 && (
          <div className="text-center py-6 bg-white/3 rounded-xl border border-white/5">
            <Ticket size={28} className="mx-auto mb-2 text-text-muted opacity-30" />
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest">No coupons yet</p>
            <p className="text-[10px] text-text-muted mt-1">Spend ₹{REWARD_MILESTONE} to earn your first ₹{REWARD_AMOUNT} coupon</p>
          </div>
        )}
      </div>

      {/* ── How to Earn ── */}
      <div className="bg-secondary/40 rounded-2xl border border-white/5 p-6">
        <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Zap size={16} className="text-primary" /> How to Earn Points</h4>
        <div className="space-y-3">
          {[
            { label: 'Every order placed',  pts: '+10 pts', icon: ShoppingBag },
            { label: 'Order above ₹500',    pts: '+25 pts', icon: TrendingUp  },
            { label: 'Submit feedback',     pts: '+5 pts',  icon: MessageSquare },
            { label: 'Refer a friend',      pts: '+50 pts', icon: Gift        },
          ].map(({ label, pts, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Icon size={14} className="text-primary" /></div>
                <span className="text-sm text-white/80 font-medium">{label}</span>
              </div>
              <span className="text-sm font-black text-primary">{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transaction History ── */}
      {transactions.length > 0 ? (
        <div className="bg-secondary/40 rounded-2xl border border-white/5 p-6">
          <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Award size={16} className="text-primary" /> Points History</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.slice(0, 20).map((tx, i) => (
              <div key={tx._id || i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white font-bold capitalize">{tx.type?.replace('_', ' ') || 'Points'}</p>
                  <p className="text-[10px] text-text-muted">
                    {tx.description || (tx.order_id ? `Order #${tx.order_id?.order_number || tx.order_id}` : '—')}
                    {' · '}{new Date(tx.created_at || tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className={`text-sm font-black ${tx.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-text-muted">
          <Award size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest">No loyalty transactions yet</p>
          <p className="text-xs mt-1">Start ordering to earn points!</p>
        </div>
      )}
    </div>
  );
};

/* ─── Main OrderHistory ─────────────────────────────────────────── */
const OrderHistory = () => {
  const { user }   = useAuth();
  const location   = useLocation();

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['active','history','announcements','feedback','addresses','rewards'].includes(tab)) return tab;
    return 'active';
  };

  const [activeTab, setActiveTab]             = useState(getInitialTab);
  const [activeOrders, setActiveOrders]       = useState([]);
  const [historyOrders, setHistoryOrders]     = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [fetchError, setFetchError]           = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['active','history','announcements','feedback','addresses','rewards'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const ACTIVE_STATUSES  = ['pending', 'start_cooking', 'completed_cooking', 'served'];
  const HISTORY_STATUSES = ['paid', 'cancelled', 'delivered'];

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const uid = user._id || user.id;
    if (!uid) return;

    setLoading(true);
    setFetchError('');
    try {
      // Primary: use history endpoint
      const res = await ordersAPI.history(uid);
      const all = res?.data || [];
      setActiveOrders(all.filter(o => ACTIVE_STATUSES.includes(o.status)));
      setHistoryOrders(all.filter(o => HISTORY_STATUSES.includes(o.status)));
    } catch {
      try {
        // Fallback: use getAll with customer_id query param
        const res = await ordersAPI.getAll(`?customer_id=${uid}`);
        const all = res?.data || [];
        setActiveOrders(all.filter(o => ACTIVE_STATUSES.includes(o.status)));
        setHistoryOrders(all.filter(o => HISTORY_STATUSES.includes(o.status)));
      } catch {
        setFetchError('Could not load orders. Please check your connection and try refreshing.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useAutoRefresh(fetchOrders, 15000);

  const tabs = [
    { id: 'active',        label: 'Active',    badge: activeOrders.length },
    { id: 'history',       label: 'History',   badge: historyOrders.length },
    { id: 'announcements', label: 'Updates',   icon: Megaphone },
    { id: 'feedback',      label: 'Feedback',  icon: MessageSquare },
    { id: 'rewards',       label: 'Rewards',   icon: Gift },
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
                {(tab.badge ?? 0) > 0 && (
                  <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {!user && (
          <div className="mb-8 px-5 py-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-400 text-sm font-bold flex items-center gap-3">
            <AlertCircle size={18} />
            Please sign in to view your orders, track deliveries, and access your rewards.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader size={32} className="animate-spin text-primary" />
          </div>
        )}

        {fetchError && !loading && (
          <div className="mb-6 px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3">
            <AlertCircle size={18} />
            {fetchError}
            <button onClick={fetchOrders} className="ml-auto text-xs underline hover:no-underline flex items-center gap-1">
              <RefreshCw size={12} /> Retry
            </button>
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
              ) : (
                activeOrders.map(order => (
                  <LiveOrderCard key={order._id} order={order} onRefresh={fetchOrders} />
                ))
              )}
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
              ) : (
                historyOrders.map(order => (
                  <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary/30 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:bg-primary/20 group-hover:text-primary transition-all shrink-0">
                        {order.status === 'cancelled' ? <AlertCircle size={24} className="text-red-400" /> : <CheckCircle size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold mb-1 truncate">
                          {(order.items || []).slice(0, 2).map(i => i.name || i.menu_item_id?.name).filter(Boolean).join(', ') || 'Order'}
                          {(order.items || []).length > 2 && ` +${(order.items || []).length - 2} more`}
                        </p>
                        <p className="text-xs text-text-muted uppercase tracking-widest">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {order.order_number && ` · ${order.order_number}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(order.items || []).map((item, i) => (
                            <span key={i} className="text-[10px] text-text-muted bg-white/5 px-2 py-1 rounded-lg">
                              {item.name || item.menu_item_id?.name || 'Item'} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary mb-1">₹{(order.total || 0).toFixed(2)}</p>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase
                          ${order.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-text-muted'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </MotionDiv>
          )}

          {/* UPDATES / ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <MotionDiv key="announcements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-1">
                  <Megaphone size={24} className="text-primary" /> Latest Updates
                </h2>
                <p className="text-text-muted text-sm">Announcements, offers &amp; news from the team</p>
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
                <p className="text-text-muted text-sm">Your loyalty points, tier status, coupons &amp; transaction history</p>
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