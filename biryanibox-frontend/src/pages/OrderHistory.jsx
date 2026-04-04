import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import { ordersAPI, addressesAPI, feedbackAPI, announcementsAPI } from '../services/api';
import { useAuth } from '../context/useContextHooks';
import {
  Truck, MapPin, Package, Clock, CheckCircle,
  ChevronRight, Home, Building, Plus, Loader,
  Megaphone, Star, MessageSquare, Phone, Send, RefreshCw,
  ShoppingBag, ChefHat, Bell, Utensils, CreditCard, X,
  AlertCircle, ChevronDown, CalendarDays,
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

const LiveOrderCard = ({ order, onRefresh }) => {
  const stepIdx = STATUS_TO_STEP[order.status] ?? 0;
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-secondary/40 rounded-3xl border border-primary/20 overflow-hidden">
      <div className="bg-black/30 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-primary" />
          <span className="text-xs font-black text-white uppercase tracking-widest">ORDER TRACKING</span>
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
                  {i < ORDER_STEPS.length - 1 && (
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
          <span className="text-primary text-base font-black">₹{(order.total || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    announcementsAPI.getPublic()
      .then(res => setAnnouncements(res.data || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
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
          <input type="tel" value={form.mobile_number} onChange={sf('mobile_number')} placeholder="+91 98765 43210" required
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

const OrderHistory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [activeOrders, setActiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const uid = user._id || user.id;
    if (!uid) return;
    setLoading(true);
    try {
      const res = await ordersAPI.history(uid);
      const all = res.data || [];
      setActiveOrders(all.filter(o => ['pending', 'start_cooking', 'completed_cooking', 'served'].includes(o.status)));
      setHistoryOrders(all.filter(o => ['paid', 'cancelled', 'delivered'].includes(o.status)));
    } catch {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    if (user) {
      addressesAPI.getAll().then(r => setAddresses(r.data || [])).catch(() => {});
    }
  }, [fetchOrders]);

  useAutoRefresh(fetchOrders, 15000);

  const tabs = [
    { id: 'active',        label: 'Active',      badge: activeOrders.length },
    { id: 'history',       label: 'History' },
    { id: 'announcements', label: 'Updates',      icon: Megaphone },
    { id: 'feedback',      label: 'Feedback',     icon: MessageSquare },
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
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {order.order_number && ` · ${order.order_number}`}
                    </p>
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
              ))}
            </MotionDiv>
          )}

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

          {activeTab === 'addresses' && (
            <MotionDiv key="addresses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-6">
              {addresses.map(addr => (
                <div key={addr._id} className="bg-secondary/40 p-8 rounded-3xl border border-white/5 relative group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      {addr.type === 'home' ? <Home size={22} /> : <Building size={22} />}
                    </div>
                    <h3 className="text-lg font-bold">{addr.label || addr.type}</h3>
                  </div>
                  <p className="text-sm text-text-muted">{addr.address_line || addr.street}</p>
                </div>
              ))}
              <div className="min-h-[160px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-text-muted hover:border-primary/50 hover:text-primary transition-all cursor-pointer">
                <Plus size={32} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Add New Address</span>
              </div>
            </MotionDiv>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderHistory;