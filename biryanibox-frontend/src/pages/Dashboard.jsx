import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import {
  ShoppingCart, Users, LogOut, ChevronRight, TrendingUp, Clock,
  AlertCircle, FileText, Trash2, Bell, ChevronDown, Monitor, Command,
  PieChart, ShoppingBag as OrderIcon, Zap, Target, Award, BarChart3,
  Calendar, DollarSign, Flame, Eye, CheckCircle2, Package, ChefHat,
  Ticket, Loader, Plus, Edit2, X, Save, RefreshCw, MessageSquare,
  Megaphone, CreditCard, UserCheck, ClipboardList, Star, Filter,
  Search, LayoutDashboard, TrendingDown, Coffee, MapPin, Phone,
  Mail, User, Shield, AlertTriangle, Play, CheckSquare, Utensils,
  Timer, ToggleLeft, ToggleRight, Hash, Briefcase, CheckCircle, XCircle,
  Activity, BarChart2, TrendingUp as Trend, Truck,
} from 'lucide-react';
import { useAuth, useOrders } from '../context/useContextHooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  usersAPI, ordersAPI, ingredientsAPI, reservationsAPI, tablesAPI,
  feedbackAPI, announcementsAPI, shiftsAPI, notificationsAPI, normalizeOrder,
  menuAPI, cateringAPI, leavesAPI, deliveryAPI, budgetAPI, wasteAPI,
} from '../services/api';
import POS from '../components/POS';

// ─── Auto-refresh hook ───────────────────────────────────────────────────────
// silent=true means background auto-refresh — never shows loading spinner
const useAutoRefresh = (callback, intervalMs = 30000) => {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    const id = setInterval(() => savedCallback.current(true), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending_confirmation: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
  pending:           'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  start_cooking:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  completed_cooking: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  served:            'bg-green-500/10 text-green-400 border-green-500/20',
  paid:              'bg-primary/20 text-primary border-primary/30',
  cancelled:         'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_LABELS = {
  pending_confirmation: '⏰ Awaiting Confirm',
  pending:           'Pending',
  start_cooking:     'Cooking',
  completed_cooking: 'Ready',
  served:            'Served',
  paid:              'Paid',
  cancelled:         'Cancelled',
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = React.memo(({ activeTab, setActiveTab, user, unreadAnnouncements, onLogout, captainTableNumbers, open, onClose }) => {
  // No hooks that subscribe to external contexts — keeps memo effective
  // logout and navigate are passed in as a stable callback from Dashboard

  // A captain with no assigned tables is a delivery/pickup captain
  const isDeliveryCaptain = user.role === 'captain' && (!captainTableNumbers || captainTableNumbers.length === 0);

  const allItems = [
    { id: 'overview',      label: 'Command Hub',      icon: PieChart,        roles: ['owner', 'manager'] },
    { id: 'pos',           label: 'Order Booking',    icon: OrderIcon,       roles: ['owner', 'manager', 'captain'] },
    { id: 'orders',        label: 'Orders',      icon: Monitor,         roles: ['owner', 'manager', 'captain', 'chef'] },
    { id: 'kitchen',       label: 'My Kitchen',       icon: ChefHat,         roles: ['chef'] },
    { id: 'menu',          label: 'Menu Master',      icon: FileText,        roles: ['owner', 'manager'] },
    { id: 'tables',        label: 'Table Status',     icon: LayoutDashboard, roles: ['owner', 'manager', 'captain'] },
    { id: 'reservations',  label: 'Reservations',     icon: Calendar,        roles: ['owner', 'manager', 'captain'] },
    { id: 'catering',      label: 'Catering Orders',  icon: Utensils,        roles: ['owner', 'manager'] },
    { id: 'feedback',      label: 'Feedback Box',     icon: MessageSquare,   roles: ['owner', 'manager'] },
    { id: 'announcements', label: 'Announcements',    icon: Megaphone,       roles: ['owner', 'manager', 'chef', 'captain'] },
    { id: 'leaves',        label: 'Leave Module',     icon: Briefcase,       roles: ['owner', 'manager', 'chef', 'captain'] },
    { id: 'shifts',        label: 'Shift Logs',       icon: UserCheck,       roles: ['owner', 'manager'] },
    { id: 'staffmgmt',     label: 'Staff Mgmt',       icon: Users,           roles: ['owner', 'manager'] },
    { id: 'riders',        label: 'Riders Hub',       icon: Truck,           roles: ['owner', 'manager', 'captain'] },
    { id: 'customers',     label: 'Customers',        icon: Users,           roles: ['owner'] },
    { id: 'finance',       label: 'Finance Center',   icon: DollarSign,      roles: ['owner', 'manager'] },
    { id: 'my_orders',     label: 'My Orders',        icon: ClipboardList,   roles: ['captain'] },
    { id: 'captain_bonus', label: 'My Bonus',          icon: Award,           roles: ['captain'] },
    { id: 'chef_orders',   label: 'Order History',    icon: ClipboardList,   roles: ['chef'] },
    { id: 'waste_chef',    label: 'Waste Log',        icon: Trash2,          roles: ['chef'] },
    { id: 'staff',         label: 'My Profile',       icon: User,            roles: ['owner', 'manager', 'captain', 'chef'] },
  ];

  // Hide Riders Hub from dine-in captains (those with assigned tables)
  const items = allItems.filter(i => {
    if (!i.roles.includes(user.role)) return false;
    if (i.id === 'riders' && user.role === 'captain' && !isDeliveryCaptain) return false;
    return true;
  });

  const handleNav = (id) => { setActiveTab(id); onClose && onClose(); };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />
      )}
      <div className={`w-64 bg-bg-main border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-50 overflow-y-auto scrollbar-hide shrink-0 transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-xl border border-primary/20">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Command size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">BIRYANI BOX</p>
              <p className="text-primary text-[10px] font-bold uppercase tracking-widest">SYSTEM.v2</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-1">
          {items.map(item => (
            <button key={item.id} onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <item.icon size={16} className={activeTab === item.id ? 'text-white' : 'text-primary'} />
                {item.label}
              </div>
              {item.id === 'announcements' && unreadAnnouncements > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unreadAnnouncements}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <div className="bg-white/5 rounded-xl p-3 mb-2 text-xs text-text-muted">
            <p className="font-bold text-white truncate">{user.name}</p>
            <p className="text-primary uppercase tracking-wider text-[10px]">{user.role}</p>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 p-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
});

// ─── Header ──────────────────────────────────────────────────────────────────
// ─── Notification Bell ──────────────────────────────────────────────────────
const NotificationBell = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    try {
      const r = await notificationsAPI.getAll();
      setNotifs(r.data || []);
      setUnread(r.unreadCount || 0);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, 15000);

  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try { await notificationsAPI.markAllRead(); setUnread(0); setNotifs(prev => prev.map(n => ({ ...n, is_read: true }))); } catch {}
  };

  const markOne = async (id) => {
    try { await notificationsAPI.markRead(id); setNotifs(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n)); setUnread(p => Math.max(0, p - 1)); } catch {}
  };

  const NOTIF_ICON = { new_order: '🛒', order_ready: '✅', cooking: '🔥', delivery: '🚴', reservation: '📅', catering: '🍽️', info: '🔔' };
  const NOTIF_COLOR = { new_order: 'border-primary/40 bg-primary/5', order_ready: 'border-green-500/30 bg-green-500/5', cooking: 'border-orange-500/30 bg-orange-500/5', delivery: 'border-blue-500/30 bg-blue-500/5', reservation: 'border-purple-500/30 bg-purple-500/5', catering: 'border-yellow-500/30 bg-yellow-500/5', info: 'border-white/10 bg-white/5' };

  return (
    <div className="relative" ref={bellRef}>
      <button onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-primary transition-all">
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-bg-main">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <MotionDiv initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute right-0 top-full mt-3 w-72 sm:w-80 bg-secondary border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-primary hover:underline font-bold">Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-10 text-center text-text-muted text-xs font-bold">No notifications</div>
              ) : (
                notifs.slice(0, 20).map(n => (
                  <div key={n._id} onClick={() => markOne(n._id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${!n.is_read ? 'bg-primary/3' : ''}`}>
                    <span className="text-base mt-0.5 flex-shrink-0">{NOTIF_ICON[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black ${!n.is_read ? 'text-white' : 'text-white/60'}`}>{n.title}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[9px] text-white/20 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                  </div>
                ))
              )}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

const Header = ({ title, onRefresh, loading, onMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-bg-main/95 backdrop-blur-xl sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button onClick={onMenuToggle}
          className="md:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-primary transition-all shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <h2 className="text-sm md:text-lg font-bold text-white truncate max-w-[140px] sm:max-w-none">{title}</h2>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <NotificationBell userId={user?.id} />
        <button onClick={onRefresh}
          className={`w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-primary transition-all ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={14} />
        </button>
        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white uppercase tracking-wider">{user.name}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mt-1">{user.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/40 shrink-0 shadow-md shadow-primary/20">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.role}`} alt="Profile" className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Flash message ───────────────────────────────────────────────────────────
const Flash = ({ msg }) => msg.text ? (
  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className={`px-5 py-3 rounded-xl text-sm font-bold border ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
    {msg.text}
  </motion.div>
) : null;

// ─── Shift Check-in/out Badge (shown on every module page) ──────────────────
const ShiftCheckinBadge = () => {
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async (silent = false) => {
    try { const r = await shiftsAPI.getMyActive(); setActiveShift(r.data || null); } catch { setActiveShift(null); }
  }, []);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 60000);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const handleCheckIn = async () => {
    setLoading(true);
    try { await shiftsAPI.checkIn(); flash('Checked in!'); load(false); } catch (e) { flash(e.message); }
    finally { setLoading(false); }
  };
  const handleCheckOut = async () => {
    if (!activeShift) return;
    setLoading(true);
    try { await shiftsAPI.checkOut(activeShift._id); flash('Checked out!'); load(false); } catch (e) { flash(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-bold ${activeShift ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-text-muted'}`}>
      <div className={`w-2 h-2 rounded-full ${activeShift ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
      {activeShift ? (
        <>
          <span>On Shift · {new Date(activeShift.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={handleCheckOut} disabled={loading}
            className="ml-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase">
            {loading ? '...' : 'Check Out'}
          </button>
        </>
      ) : (
        <>
          <span>Not Checked In</span>
          <button onClick={handleCheckIn} disabled={loading}
            className="ml-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all text-[10px] font-black uppercase">
            {loading ? '...' : 'Check In'}
          </button>
        </>
      )}
      {msg && <span className="text-primary text-[10px]">{msg}</span>}
    </div>
  );
};

// ─── Kitchen Flow Bar (mini live kitchen status for all modules) ─────────────
const KitchenFlowBar = ({ orders }) => {
  const pending   = orders.filter(o => o.status === 'pending').length;
  const cooking   = orders.filter(o => o.status === 'start_cooking').length;
  const ready     = orders.filter(o => o.status === 'completed_cooking').length;

  if (pending + cooking + ready === 0) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-secondary/40 rounded-2xl border border-white/5 mb-6">
      <div className="flex items-center gap-2 shrink-0">
        <ChefHat size={16} className="text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Kitchen Flow</span>
      </div>
      <div className="flex-1 flex items-center gap-3 overflow-x-auto">
        {[
          { label: 'Pending',  count: pending, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
          { label: 'Cooking',  count: cooking, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
          { label: 'Ready',    count: ready,   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${color} shrink-0`}>
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            <span className="text-sm font-black">{count}</span>
          </div>
        ))}
        {/* Show ready-to-serve order numbers */}
        {ready > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] text-text-muted font-bold">Ready:</span>
            {orders.filter(o => o.status === 'completed_cooking').slice(0, 4).map(o => (
              <span key={o._id} className="text-[10px] font-black px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                {o.order_number || `#${(o._id || '').slice(-4).toUpperCase()}`}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ORDER TABLE (with role-based status controls) ───────────────────────────
// Live cooking timer hook — ticks every second
const useCookTimer = (order) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (order.status !== 'start_cooking' || !order.cooking_started_at) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(order.cooking_started_at)) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order.status, order.cooking_started_at]);
  return elapsed;
};

const CookDurationCell = ({ order }) => {
  const elapsed = useCookTimer(order);
  if (order.status === 'start_cooking' && order.cooking_started_at) {
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    return (
      <span className="flex items-center gap-1 text-orange-400 font-black text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
        {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </span>
    );
  }
  if ((order.status === 'completed_cooking' || order.status === 'served' || order.status === 'paid')
      && order.cooking_started_at && order.cooking_completed_at) {
    const mins = Math.round((new Date(order.cooking_completed_at) - new Date(order.cooking_started_at)) / 60000);
    return <span className="text-green-400 font-bold text-[11px]">✓ {mins}m</span>;
  }
  return <span className="text-text-muted text-[11px]">—</span>;
};

// ─── Universal Confirm Dialog ─────────────────────────────────────────────────
// Usage: <ConfirmDialog open={open} title="..." message="..." onConfirm={fn} onCancel={fn} danger />
const ConfirmDialog = ({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger = true }) => {
  if (!open) return null;
  return (
    <AnimatePresence>
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4"
        onClick={onCancel}>
        <MotionDiv initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
          onClick={e => e.stopPropagation()}
          className={`bg-[#1a1a1a] border ${danger ? 'border-red-500/40' : 'border-yellow-500/40'} rounded-3xl p-8 max-w-sm w-full shadow-2xl`}>
          <div className={`w-14 h-14 rounded-2xl ${danger ? 'bg-red-500/10' : 'bg-yellow-500/10'} flex items-center justify-center mx-auto mb-5`}>
            <AlertTriangle size={28} className={danger ? 'text-red-400' : 'text-yellow-400'} />
          </div>
          <h3 className="text-xl font-black text-white text-center mb-2">{title}</h3>
          <p className="text-text-muted text-sm text-center mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest text-text-muted hover:bg-white/5 transition-all">
              {cancelText}
            </button>
            <button onClick={onConfirm}
              className={`flex-1 py-3 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-400 text-black'} text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg`}>
              {confirmText}
            </button>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
};


const OrderTable = ({ orders, user, onStatusUpdate, onConfirmOrder, onDelete, statusColors, captainTableNumbers }) => {
  const chefStatuses     = ['start_cooking', 'completed_cooking'];
  const captainStatuses  = ['served', 'paid'];
  // Manager/owner cannot start or complete cooking — that's chef/captain only
  const managerStatuses  = ['dispatched', 'served', 'paid', 'cancelled'];

  // Delivery captain = captain with no assigned tables
  const isDeliveryCaptain = user.role === 'captain' && (!captainTableNumbers || captainTableNumbers.length === 0);

  // Extract numeric table number from any format: "1" → 1, "Table 1" → 1, "Table 7" → 7
  const parseTableNum = (raw) => {
    if (!raw) return NaN;
    const match = String(raw).match(/\d+/);
    return match ? parseInt(match[0]) : NaN;
  };

  // Is this order in the captain's zone?
  const isCaptainOrderInZone = (order) => {
    if (user.role !== 'captain') return true; // non-captains always in zone
    if (isDeliveryCaptain) {
      // Delivery captain: delivery/pickup/takeaway orders are their zone
      return ['delivery', 'pickup', 'takeaway'].includes(order.order_type);
    }
    // Dine-in captain: compare table numbers
    const orderTNum = parseTableNum(order.table_number);
    return !isNaN(orderTNum) && captainTableNumbers.includes(orderTNum);
  };

  // Order-type-aware transitions:
  // Dine-in:  pending → cooking → ready → served → paid
  // Delivery: pending → cooking → ready → dispatched → paid  (rider delivers)
  // Pickup:   pending → cooking → ready → paid               (customer picks up, no dispatch)
  const getNextStatus = (order) => {
    const isDelivery = order.order_type === 'delivery';
    const isPickup   = ['pickup', 'takeaway'].includes(order.order_type);

    if (isDelivery) {
      const map = {
        pending:           'start_cooking',
        start_cooking:     'completed_cooking',
        completed_cooking: 'dispatched',
        dispatched:        'paid',
        delivered:         'paid',
      };
      return map[order.status] || null;
    }
    if (isPickup) {
      // Pickup flow: pending → cooking → ready → At Counter (dispatched) → Completed (paid)
      const map = {
        pending:           'start_cooking',
        start_cooking:     'completed_cooking',
        completed_cooking: 'dispatched',  // "At Counter" step
        dispatched:        'paid',        // "Completed" step
      };
      return map[order.status] || null;
    }
    // Dine-in / default
    const map = {
      pending:           'start_cooking',
      start_cooking:     'completed_cooking',
      completed_cooking: 'served',
      served:            'paid',
    };
    return map[order.status] || null;
  };

  // Keep TRANSITIONS as a static map for any code that reads it directly (e.g. button color check)
  const TRANSITIONS = {
    pending:           'start_cooking',
    start_cooking:     'completed_cooking',
    completed_cooking: 'dispatched',
    dispatched:        'served',
    served:            'paid',
  };

  const canAdvance = (order) => {
    if (order.status === 'pending_confirmation') return false;
    const next = getNextStatus(order);
    if (!next) return false;
    const isDelivery = order.order_type === 'delivery';
    const isPickup   = ['pickup', 'takeaway'].includes(order.order_type);
    if (user.role === 'chef') return chefStatuses.includes(next);
    if (user.role === 'captain') {
      if (isDeliveryCaptain) {
        // Delivery captain: ONLY dispatch + paid actions — chef handles cooking
        if (isDelivery) return ['dispatched'].includes(next); // delivery orders: dispatch only (rider marks paid)
        if (isPickup)   return ['dispatched', 'paid'].includes(next); // pickup: at counter + completed
        return false;
      }
      // Dine-in captain: served + paid only (chef handles cooking)
      return captainStatuses.includes(next);
    }
    if (['manager', 'owner'].includes(user.role)) {
      // For delivery orders: managers/owners can dispatch; rider handles paid
      if (isDelivery) return ['dispatched', 'served', 'cancelled'].includes(next);
      return managerStatuses.includes(next);
    }
    return false;
  };

  // Button labels per next status
  const getActionLabel = (order) => {
    const next = getNextStatus(order);
    if (!next) return '';
    const isDelivery = order.order_type === 'delivery';
    const isPickup   = ['pickup', 'takeaway'].includes(order.order_type);
    if (next === 'dispatched' && isDelivery) return '🚗 Dispatch';
    if (next === 'dispatched' && isPickup)   return '🏪 At Counter';
    if (next === 'paid' && isDelivery)       return '💰 Mark Collected';
    if (next === 'paid' && isPickup)         return '✅ Completed';
    const labels = { start_cooking: '▶ Start', completed_cooking: '✓ Done', served: '🍽️ Serve', paid: 'Paid ✓' };
    return labels[next] || next;
  };

  return (
    <div className="overflow-x-auto rounded-2xl -mx-1 md:mx-0">
      <table className="w-full text-xs min-w-[640px]">
        <thead>
          <tr className="text-text-muted uppercase tracking-widest border-b border-white/5">
            <th className="text-left px-4 py-3 font-bold">Order</th>
            <th className="text-left px-4 py-3 font-bold">Table</th>
            <th className="text-left px-4 py-3 font-bold">Items</th>
            <th className="text-left px-4 py-3 font-bold">Total</th>
            <th className="text-left px-4 py-3 font-bold">Status</th>
            <th className="text-left px-4 py-3 font-bold">Served By</th>
            <th className="text-left px-4 py-3 font-bold">Spice</th>
            <th className="text-left px-4 py-3 font-bold">Customer Req.</th>
            <th className="text-left px-4 py-3 font-bold">Time</th>
            <th className="text-left px-4 py-3 font-bold">Cook Duration</th>
            <th className="text-right px-4 py-3 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map(ord => {
            const id = ord._id || ord.id;
            const items = ord.items || [];
            const total = typeof ord.total === 'number' ? ord.total : 0;
            const inZone = isCaptainOrderInZone(ord);
            return (
              <tr key={id} className={`hover:bg-white/3 transition-all group ${user.role === 'captain' && !inZone ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-bold text-white">{ord.order_number || `#${id?.slice(-6).toUpperCase()}`}</p>
                  <p className="text-text-muted text-[10px]">{ord.customerName || 'Walk-in'}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-1 bg-white/5 rounded text-white border border-white/10">
                      {(() => {
                        const raw = String(ord.table_number || '');
                        const n = parseInt(raw);
                        // If table_number is a plain number → "Table N"
                        if (!isNaN(n) && String(n) === raw) return `Table ${n}`;
                        // If table_number already has text (e.g. "Takeaway") → show as-is
                        if (raw && raw !== '—') return raw;
                        // Fallback: derive label from order_type (customer delivery/pickup)
                        if (ord.order_type === 'delivery')                         return '🚴 Home Delivery';
                        if (ord.order_type === 'pickup' || ord.order_type === 'takeaway') return '📦 Takeaway';
                        return '—';
                      })()}
                    </span>
                    {/* Zone indicator for captains */}
                    {user.role === 'captain' && (
                      inZone
                        ? <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">✓ Your Zone</span>
                        : <span className="text-[8px] font-black text-red-400/60 uppercase tracking-widest">🔒 Other Zone</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[180px]">
                  {items.slice(0, 2).map((item, i) => (
                    <p key={i} className="text-white/70 truncate">{item.quantity}× {item.name}</p>
                  ))}
                  {items.length > 2 && <p className="text-primary">+{items.length - 2} more</p>}
                </td>
                <td className="px-4 py-3 font-bold text-primary">${total.toFixed(0)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full uppercase border font-bold text-[9px] ${statusColors[ord.status] || ''}`}>
                    {STATUS_LABELS[ord.status] || ord.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    // served_by is set by backend when:
                    //   dine-in  → status 'served'   (captain/manager/owner who clicked Serve)
                    //   pickup   → status 'dispatched' (captain/manager/owner who clicked At Counter)
                    //   delivery → status 'dispatched' (captain/manager/owner who clicked Dispatch)
                    const isDeliveryType = ['delivery','pickup','takeaway'].includes(ord.order_type);
                    const isDineIn = ord.order_type === 'dine-in';

                    // Only show a name once the key action has been performed
                    const hasBeenServed = isDineIn
                      ? ['served','paid'].includes(ord.status)
                      : ['dispatched','delivered','paid','in_transit'].includes(ord.status);

                    // Priority: served_by (most accurate) → delivery.dispatched_by (delivery fallback) → captain_id (dine-in fallback)
                    let captainName = null;
                    if (hasBeenServed) {
                      captainName = ord.served_by?.name
                        || (isDeliveryType ? (ord.delivery?.dispatched_by?.name || null) : null)
                        || (isDineIn ? (ord.captain_id?.name || null) : null);
                    }

                    return (
                      <div className="flex items-center gap-1.5">
                        {captainName ? (
                          <>
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-primary/20 shrink-0">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${captainName}`} alt="" />
                            </div>
                            <span className="text-white/70 text-[11px] font-bold">{captainName}</span>
                          </>
                        ) : (
                          <span className="text-white/20 text-[11px]">—</span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <span className="text-text-muted capitalize">{ord.spiceness || '—'}</span>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  {ord.order_type === 'pickup' && ord.pickup_extra_items ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">📦 Pickup Extras</span>
                      <span className="text-[10px] text-white/80 break-words">{ord.pickup_extra_items}</span>
                    </div>
                  ) : ord.order_type === 'delivery' ? (
                    <div className="flex flex-col gap-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${ord.knock_bell === false ? 'text-purple-400' : 'text-blue-400'}`}>
                        {ord.knock_bell === false ? '🤫 Do Not Disturb' : '🔔 Ring Bell/Knock'}
                      </span>
                      {ord.delivery_notes && (
                        <span className="text-[10px] text-white/80 break-words">{ord.delivery_notes}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-text-muted text-[10px]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {new Date(ord.created_at || ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <CookDurationCell order={ord} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                    {/* pending_confirmation: Accept / Reject (owner + manager only) */}
                    {ord.status === 'pending_confirmation' && ['owner', 'manager'].includes(user.role) && onConfirmOrder && (
                      <>
                        <button onClick={() => onConfirmOrder(id, 'accept')}
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[10px] font-black uppercase hover:bg-green-500 hover:text-white transition-all">
                          ✓ Accept
                        </button>
                        <button onClick={() => onConfirmOrder(id, 'reject')}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {/* Main action button — only shown for in-zone orders */}
                    {canAdvance(ord) && inZone && (() => {
                      const nextSt = getNextStatus(ord);
                      const isDelivery = ord.order_type === 'delivery';
                      const isPickup   = ['pickup', 'takeaway'].includes(ord.order_type);
                      // Dispatch gate: ONLY for delivery orders (pickup customers come themselves)
                      const isDispatchAction = nextSt === 'dispatched' && isDelivery;
                      const deliveryRec = ord.delivery || null;
                      const riderAssigned = deliveryRec?.driver_id && deliveryRec?.status === 'assigned';
                      const dispatchBlocked = isDispatchAction && !riderAssigned;

                      if (dispatchBlocked) {
                        return (
                          <div className="flex flex-col items-end gap-1">
                            <button disabled
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-white/5 text-text-muted border border-white/10 cursor-not-allowed opacity-60">
                              🚗 Dispatch
                            </button>
                            <span className="text-[8px] text-yellow-400 font-bold uppercase tracking-widest">
                              ⏳ Awaiting rider
                            </span>
                          </div>
                        );
                      }
                      // Color the button based on next status and order type
                      const btnClass = (() => {
                        if (nextSt === 'dispatched') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white';
                        if (nextSt === 'served')     return 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white';
                        if (nextSt === 'paid' && isDelivery) return 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black';
                        if (nextSt === 'paid' && isPickup)   return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white';
                        if (nextSt === 'paid') return 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black';
                        return 'bg-primary text-white hover:bg-primary-hover';
                      })();
                      return (
                        <button onClick={() => onStatusUpdate(id, nextSt)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${btnClass}`}>
                          {getActionLabel(ord)}
                        </button>
                      );
                    })()}
                    {/* Out-of-zone indicator for dine-in captains only */}
                    {user.role === 'captain' && !inZone && !isDeliveryCaptain && canAdvance(ord) && (
                      <span className="text-[9px] text-text-muted px-2 py-1 bg-white/5 rounded-lg border border-white/10 uppercase tracking-widest">
                        🔒 Other Zone
                      </span>
                    )}
                    {user.role === 'owner' && (
                      <button onClick={() => onDelete(id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr><td colSpan={11} className="py-20 text-center text-text-muted">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-sm">No orders found</p>
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ─── CHEF KITCHEN MODULE ─────────────────────────────────────────────────────
const ChefKitchenModule = ({ orders, updateOrderStatus, ingredients }) => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('active');
  const [localIngredients, setLocalIngredients] = useState(ingredients);
  const [stockMsg, setStockMsg] = useState('');
  const [reducingId, setReducingId] = useState(null);
  const [reduceQty, setReduceQty] = useState('');

  useEffect(() => { setLocalIngredients(ingredients); }, [ingredients]);

  const flashStock = (t) => { setStockMsg(t); setTimeout(() => setStockMsg(''), 3000); };

  const handleReduceStock = async (ing) => {
    const qty = parseFloat(reduceQty);
    if (!qty || qty <= 0) return flashStock('Enter a valid quantity');
    if (qty > ing.stock) return flashStock('Cannot reduce more than current stock');
    const newStock = +(ing.stock - qty).toFixed(3);
    try {
      await ingredientsAPI.updateStock(ing._id || ing.id, newStock);
      setLocalIngredients(prev => prev.map(i => (i._id || i.id) === (ing._id || ing.id) ? { ...i, stock: newStock } : i));
      flashStock(`✓ Reduced ${ing.name} by ${qty} ${ing.unit}`);
    } catch { flashStock('Failed to update stock'); }
    setReducingId(null);
    setReduceQty('');
  };
  // Chef exclusivity: show pending (available to all) + start_cooking owned by THIS chef only
  // Orders cooking by another chef are hidden — only their chef_id is visible to them
  const chefId = user?._id;
  const activeOrders = orders.filter(o => {
    if (o.status === 'pending') return true; // all chefs can see and claim pending orders
    if (o.status === 'start_cooking') {
      // Only show this cooking order if it belongs to the current chef
      const ordChefId = o.chef_id?._id || o.chef_id;
      return ordChefId && ordChefId.toString() === chefId?.toString();
    }
    return false;
  });
  const filtered = statusFilter === 'active' ? activeOrders
    : statusFilter === 'pending' ? orders.filter(o => o.status === 'pending')
    : statusFilter === 'cooking' ? orders.filter(o => {
        if (o.status !== 'start_cooking') return false;
        const ordChefId = o.chef_id?._id || o.chef_id;
        return ordChefId && ordChefId.toString() === chefId?.toString();
      })
    : activeOrders;

  const lowStockIngredients = localIngredients.filter(i => i.stock < i.min_stock);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-white flex items-center gap-3"><ChefHat size={32} className="text-primary" />My Kitchen</h2>
          <p className="text-text-muted mt-1 text-sm">Your active cooking queue</p>
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl w-fit">
            <ChefHat size={11} className="text-orange-400" />
            <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Chef ID: CHF-{chefId?.slice(-6).toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-3 rounded-xl">
          <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
          <span className="text-xs font-black text-primary uppercase tracking-widest">{activeOrders.length} ACTIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Cooking', value: orders.filter(o => o.status === 'start_cooking').length, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Completed Orders', value: orders.filter(o => o.status === 'completed_cooking' || o.status === 'served' || o.status === 'paid').length, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-white/5 p-5 text-center`}>
            <p className={`text-2xl md:text-4xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5 w-fit">
        {[['active', 'All Active'], ['pending', 'Pending'], ['cooking', 'Cooking']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === val ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {/* Order cards */}
      {filtered.length === 0 ? (
        <div className="py-32 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
          <ChefHat size={56} className="mx-auto mb-4 text-text-muted opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest text-text-muted">Kitchen is clear!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(ord => {
            const id = ord._id || ord.id;
            const isPending = ord.status === 'pending';
            const isCooking = ord.status === 'start_cooking';
            return (
              <MotionDiv key={id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl border p-6 space-y-4 ${isPending ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-orange-500/5 border-orange-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Table {ord.table_number || 'Takeaway'}</p>
                    <h3 className="text-xl font-black text-white">{ord.order_number || `#${id?.slice(-5).toUpperCase()}`}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase ${isPending ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {STATUS_LABELS[ord.status]}
                    </span>
                    {ord.spiceness && (
                      <span className="text-[9px] text-text-muted capitalize">🌶 {ord.spiceness}</span>
                    )}
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                  {(ord.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-white/80">{item.name}</span>
                      <span className="text-sm font-black text-primary">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-text-muted flex items-center justify-between">
                  <span><Clock size={10} className="inline mr-1" />{new Date(ord.created_at || ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {ord.cooking_started_at && <span>Started: {new Date(ord.cooking_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                {/* Customer Requirements — pickup extras or delivery arrival preference */}
                {(ord.order_type === 'pickup' && ord.pickup_extra_items) && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2 flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">📦 Customer Extras (Pickup)</span>
                    <span className="text-xs text-white/80">{ord.pickup_extra_items}</span>
                  </div>
                )}
                {ord.order_type === 'delivery' && (ord.delivery_notes || ord.knock_bell !== undefined) && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 flex flex-col gap-0.5">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${ord.knock_bell === false ? 'text-purple-400' : 'text-blue-400'}`}>
                      {ord.knock_bell === false ? '🤫 Do Not Disturb' : '🔔 Ring Bell / Knock'}
                    </span>
                    {ord.delivery_notes && <span className="text-xs text-white/80">{ord.delivery_notes}</span>}
                  </div>
                )}
                <div className="pt-2 border-t border-white/10">
                  {isPending && (() => {
                    // If another chef has already claimed this order (race condition guard)
                    const ordChefId = ord.chef_id?._id || ord.chef_id;
                    const isClaimedByOther = ordChefId && ordChefId.toString() !== chefId?.toString();
                    if (isClaimedByOther) return (
                      <div className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest text-center">
                        🔒 Claimed by Another Chef
                      </div>
                    );
                    return (
                      <button onClick={() => updateOrderStatus(id, 'start_cooking')}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                        <Play size={14} /> Start Cooking
                      </button>
                    );
                  })()}
                  {isCooking && (
                    <button onClick={() => updateOrderStatus(id, 'completed_cooking')}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                      <CheckSquare size={14} /> Mark Cooking Done ✓
                    </button>
                  )}
                  {ord.status === 'completed_cooking' && (
                    <div className="w-full py-3 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest text-center">
                      ✓ Ready — Waiting for Service
                    </div>
                  )}
                </div>
              </MotionDiv>
            );
          })}
        </div>
      )}

      {/* Ingredients section in chef page */}
      {localIngredients.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Package size={20} className="text-primary" />Ingredient Stock</h3>
          <p className="text-text-muted text-xs mb-4">Tap <span className="text-primary font-bold">Reduce</span> to deduct stock after use</p>
          {stockMsg && <p className="text-xs text-primary font-bold px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl mb-3">{stockMsg}</p>}
          <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-3">
            {localIngredients.slice(0, 20).map(ing => {
              const id = ing._id || ing.id;
              const isReducing = reducingId === id;
              return (
                <div key={id} className={`p-4 rounded-xl border ${ing.stock < ing.min_stock ? 'bg-red-500/5 border-red-500/30' : 'bg-white/3 border-white/10'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-white truncate">{ing.name}</p>
                    {ing.stock < ing.min_stock && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-text-muted mb-2">{ing.stock} {ing.unit} <span className="text-text-muted/60">/ min {ing.min_stock}</span></p>
                  <div className="mb-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ing.stock < ing.min_stock ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (ing.stock / Math.max(ing.min_stock * 2, 1)) * 100)}%` }} />
                  </div>
                  {isReducing ? (
                    <div className="flex gap-1">
                      <input
                        type="number" min="0.01" step="0.01" placeholder="Qty"
                        value={reduceQty} onChange={e => setReduceQty(e.target.value)}
                        className="flex-1 min-w-0 bg-bg-main border border-primary/40 p-1.5 rounded-lg text-white text-xs outline-none focus:border-primary"
                        autoFocus
                      />
                      <button onClick={() => handleReduceStock(ing)}
                        className="px-2 py-1 bg-primary text-white rounded-lg text-[10px] font-black">✓</button>
                      <button onClick={() => { setReducingId(null); setReduceQty(''); }}
                        className="px-2 py-1 bg-white/10 text-white rounded-lg text-[10px] font-black">✗</button>
                    </div>
                  ) : (
                    <button onClick={() => { setReducingId(id); setReduceQty(''); }}
                      className="w-full py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                      − Reduce Stock
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CHEF ORDER HISTORY ───────────────────────────────────────────────────────
const ChefOrderHistory = ({ user, allOrders }) => {
  const [period, setPeriod] = useState('today');

  // Filter from the global orders already in context — no separate API call needed.
  // Chef history = orders that are completed_cooking / served / paid (kitchen done).
  // Period filter is applied client-side since orders are already loaded.
  const orders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);

    return (allOrders || []).filter(o => {
      if (!['completed_cooking', 'served', 'paid'].includes(o.status)) return false;
      const ts = new Date(o.created_at || o.timestamp);
      if (period === 'today')   return ts >= todayStart;
      if (period === 'weekly')  return ts >= weekAgo;
      if (period === 'monthly') return ts >= monthAgo;
      return true;
    });
  }, [allOrders, period]);

  const stats = useMemo(() => ({
    total: orders.length,
    items: orders.reduce((s, o) => s + (o.items || []).reduce((a, i) => a + (i.quantity || 1), 0), 0),
    paid: orders.filter(o => o.status === 'paid').length,
  }), [orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><ClipboardList size={28} className="text-primary" />My Order History</h2>
          <p className="text-text-muted text-sm mt-1">All orders you have cooked</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['today', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: 'Orders Cooked', value: stats.total, color: 'text-primary' },
          { label: 'Total Items', value: stats.items, color: 'text-orange-400' },
          { label: 'Fully Paid', value: stats.paid, color: 'text-green-400' },
        ].map((s, i) => (
          <div key={i} className="bg-secondary/40 rounded-2xl border border-white/5 p-5 text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
          {orders.map(ord => (
            <div key={ord._id || ord.id} className="bg-secondary/40 rounded-2xl border border-white/5 p-5 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p className="font-black text-white">{ord.order_number || `#${(ord._id || '').slice(-6).toUpperCase()}`}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Table {ord.table_number || '—'} · {new Date(ord.created_at || ord.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase border ${STATUS_COLORS[ord.status] || 'bg-white/5 text-text-muted border-white/10'}`}>
                  {STATUS_LABELS[ord.status] || ord.status}
                </span>
              </div>
              {/* All items prepared */}
              <div className="bg-bg-main/50 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2">Items Prepared</p>
                {(ord.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-white/80">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-black">×{item.quantity}</span>
                      <span className="text-text-muted text-[10px]">${((item.unit_price || item.price || 0) * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {ord.cooking_started_at && ord.cooking_completed_at && (
                <p className="text-[10px] text-text-muted mt-2">
                  <Timer size={10} className="inline mr-1" />
                  Cook time: {Math.round((new Date(ord.cooking_completed_at) - new Date(ord.cooking_started_at)) / 60000)} min
                </p>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <div className="py-20 text-center text-text-muted bg-secondary/20 rounded-3xl border border-white/5">
              <ChefHat size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No cooked orders for this period</p>
            </div>
          )}
        </div>
    </div>
  );
};

// ─── CAPTAIN MY ORDERS ────────────────────────────────────────────────────────
// ─── CAPTAIN BONUS MODULE ─────────────────────────────────────────────────────
const BONUS_TIERS = [
  { key: 'bronze', label: 'Bronze',   min: 0,    max: 500,  pct: 3,  color: 'text-amber-600',  bg: 'bg-amber-700/10', border: 'border-amber-700/30',   glow: 'shadow-amber-700/20',   icon: '🥉', badge: 'from-amber-700 to-amber-500' },
  { key: 'silver', label: 'Silver',   min: 500,  max: 1500, pct: 5,  color: 'text-slate-300',  bg: 'bg-slate-500/10', border: 'border-slate-500/30',   glow: 'shadow-slate-400/20',   icon: '🥈', badge: 'from-slate-500 to-slate-300' },
  { key: 'gold',   label: 'Gold',     min: 1500, max: 3000, pct: 8,  color: 'text-yellow-400', bg: 'bg-yellow-500/10',border: 'border-yellow-500/30',  glow: 'shadow-yellow-400/20',  icon: '🥇', badge: 'from-yellow-500 to-yellow-300' },
  { key: 'diamond',label: 'Diamond',  min: 3000, max: Infinity, pct: 12, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-cyan-400/20', icon: '💎', badge: 'from-cyan-500 to-cyan-300' },
];

const getTier = (revenue) => BONUS_TIERS.find(t => revenue >= t.min && revenue < t.max) || BONUS_TIERS[0];

const CaptainBonusModule = ({ user, allOrders, captainTableNumbers }) => {
  const [period, setPeriod] = useState('monthly');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isDeliveryCaptain = !captainTableNumbers || captainTableNumbers.length === 0;

  // Filter orders by period and captain zone
  const zoneOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const weekAgo    = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo   = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
    const yearAgo    = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);

    return (allOrders || []).filter(o => {
      if (o.status !== 'paid') return false;
      // Zone filter
      if (isDeliveryCaptain) {
        if (!['delivery','pickup','takeaway'].includes(o.order_type)) return false;
      } else {
        const rawT = String(o.table_number || '');
        const match = rawT.match(/\d+/);
        const tNum = match ? parseInt(match[0]) : NaN;
        if (isNaN(tNum) || !captainTableNumbers.includes(tNum)) return false;
      }
      // Period filter
      const ts = new Date(o.created_at || o.timestamp);
      if (period === 'today')   return ts >= todayStart;
      if (period === 'weekly')  return ts >= weekAgo;
      if (period === 'monthly') return ts >= monthAgo;
      if (period === 'yearly')  return ts >= yearAgo;
      return true;
    });
  }, [allOrders, period, captainTableNumbers, isDeliveryCaptain]);

  const revenue    = zoneOrders.reduce((s, o) => s + (o.total || 0), 0);
  const tier       = getTier(revenue);
  const bonusAmt   = revenue * (tier.pct / 100);
  const nextTier   = BONUS_TIERS.find(t => t.min > tier.min);
  const toNextTier = nextTier ? Math.max(0, nextTier.min - revenue) : 0;
  const progressPct= nextTier ? Math.min(100, ((revenue - tier.min) / (tier.max - tier.min)) * 100) : 100;

  // All-time cumulative
  const allTimePaid = (allOrders || []).filter(o => {
    if (o.status !== 'paid') return false;
    if (isDeliveryCaptain) return ['delivery','pickup','takeaway'].includes(o.order_type);
    const rawT = String(o.table_number || '');
    const match = rawT.match(/\d+/);
    const tNum = match ? parseInt(match[0]) : NaN;
    return !isNaN(tNum) && captainTableNumbers.includes(tNum);
  });
  const allTimeRevenue = allTimePaid.reduce((s, o) => s + (o.total || 0), 0);
  const allTimeTier    = getTier(allTimeRevenue);

  const periodLabel = { today: 'Today', weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Award size={28} className="text-yellow-400" />My Bonus
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {isDeliveryCaptain ? 'Delivery & Pickup orders' : `Tables ${captainTableNumbers.map(n => `Table ${n}`).join(', ')}`}
          </p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['today','weekly','monthly','yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Current Tier Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl border p-8 ${tier.bg} ${tier.border} shadow-2xl ${tier.glow}`}>
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(ellipse at 80% 50%, ${tier.key === 'gold' ? '#eab308' : tier.key === 'silver' ? '#94a3b8' : tier.key === 'diamond' ? '#06b6d4' : '#b45309'}, transparent 60%)` }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-5xl">{tier.icon}</span>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${tier.color}`}>{tier.label} Tier Captain</p>
                <p className="text-[10px] text-text-muted">{tier.pct}% bonus rate · {periodLabel[period]}</p>
              </div>
            </div>
            <p className={`text-6xl font-black ${tier.color} leading-none`}>${bonusAmt.toFixed(2)}</p>
            <p className="text-text-muted text-sm mt-2">Bonus from <span className="text-white font-bold">${revenue.toFixed(0)}</span> revenue · <span className="text-white font-bold">{zoneOrders.length}</span> paid orders</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Bonus Rate</p>
            <p className={`text-3xl md:text-5xl font-black ${tier.color}`}>{tier.pct}%</p>
            <p className="text-[10px] text-text-muted mt-1">of total revenue</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="relative z-10 mt-6">
            <div className="flex justify-between text-[10px] font-bold text-text-muted mb-1.5">
              <span>{tier.icon} {tier.label} (${tier.min.toFixed(0)})</span>
              <span className={tier.color}>${toNextTier.toFixed(0)} to {nextTier.icon} {nextTier.label}</span>
              <span>{nextTier.icon} {nextTier.label} (${nextTier.min.toFixed(0)})</span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${tier.badge} transition-all duration-700`}
                style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-[10px] text-text-muted mt-1 text-center">
              Reach {nextTier.icon} {nextTier.label} tier → earn {nextTier.pct}% bonus (+{nextTier.pct - tier.pct}% more)
            </p>
          </div>
        )}
        {!nextTier && (
          <div className="relative z-10 mt-6 text-center">
            <p className={`text-sm font-black ${tier.color}`}>🎉 You've reached the highest tier! Maximum {tier.pct}% bonus.</p>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Paid Orders',   value: zoneOrders.length,            color: 'text-primary',    bg: 'bg-primary/10',    icon: ClipboardList },
          { label: 'Revenue',       value: `$${revenue.toFixed(0)}`,     color: 'text-green-400',  bg: 'bg-green-500/10',  icon: TrendingUp },
          { label: 'Bonus Earned',  value: `$${bonusAmt.toFixed(2)}`,    color: tier.color,         bg: tier.bg,            icon: Award },
          { label: 'Avg Per Order', value: zoneOrders.length ? `$${(revenue/zoneOrders.length).toFixed(0)}` : '—', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: DollarSign },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl border border-white/5 p-5 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* All Tiers Reference Table */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Star size={15} className="text-yellow-400" /> Bonus Tier Structure
          </h3>
          <p className="text-[10px] text-text-muted">Based on paid revenue per period</p>
        </div>
        <div className="divide-y divide-white/5">
          {BONUS_TIERS.map((t) => {
            const isCurrentTier = t.key === tier.key;
            return (
              <div key={t.key} className={`flex items-center px-6 py-4 gap-4 transition-all ${isCurrentTier ? `${t.bg} ring-1 ring-inset ${t.border}` : 'hover:bg-white/3'}`}>
                <span className="text-2xl w-8 text-center">{t.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-black text-sm ${t.color}`}>{t.label}</p>
                    {isCurrentTier && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${t.badge} text-white`}>CURRENT</span>}
                  </div>
                  <p className="text-[10px] text-text-muted">
                    Revenue: ${t.min.toFixed(0)}{t.max === Infinity ? '+' : ` – $${t.max.toFixed(0)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${t.color}`}>{t.pct}%</p>
                  <p className="text-[10px] text-text-muted">bonus rate</p>
                </div>
                <div className="text-right w-24">
                  <p className="text-xs font-bold text-white">
                    {isCurrentTier ? `$${bonusAmt.toFixed(2)}` : `$${(revenue * t.pct / 100).toFixed(2)}`}
                  </p>
                  <p className="text-[10px] text-text-muted">on ${revenue.toFixed(0)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All-time stats */}
      <div className={`rounded-3xl border p-6 ${allTimeTier.bg} ${allTimeTier.border}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{allTimeTier.icon}</span>
          <div>
            <p className="text-sm font-black text-white">All-Time Performance</p>
            <p className="text-[10px] text-text-muted">Based on your total lifetime revenue in your zone</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {[
            { label: 'All-Time Revenue',  value: `$${allTimeRevenue.toFixed(0)}`,                           color: 'text-white' },
            { label: 'Lifetime Tier',     value: `${allTimeTier.icon} ${allTimeTier.label}`,                 color: allTimeTier.color },
            { label: 'Lifetime Bonus',    value: `$${(allTimeRevenue * allTimeTier.pct / 100).toFixed(2)}`,  color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-black/20 rounded-2xl p-4 text-center">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Breakdown */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
        <button onClick={() => setShowBreakdown(b => !b)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-all">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} className="text-primary" /> Order Breakdown — {periodLabel[period]}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted">{zoneOrders.length} orders</span>
            <ChevronDown size={14} className={`text-text-muted transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
          </div>
        </button>
        <AnimatePresence>
          {showBreakdown && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5">
              {zoneOrders.length === 0 ? (
                <div className="py-10 text-center text-text-muted">
                  <Award size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold">No paid orders this {period === 'today' ? 'day' : period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {zoneOrders.map(o => {
                    const tableRaw = String(o.table_number || '');
                    const match = tableRaw.match(/\d+/);
                    const tableLabel = match ? `Table ${match[0]}` : (o.order_type || '—');
                    return (
                      <div key={o._id || o.id} className="flex items-center px-6 py-3 hover:bg-white/3 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{o.order_number || `#${String(o._id || '').slice(-6).toUpperCase()}`}</p>
                          <p className="text-[10px] text-text-muted">{tableLabel} · {new Date(o.created_at || o.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-white">${(o.total || 0).toFixed(0)}</p>
                          <p className={`text-[10px] font-bold ${tier.color}`}>+${((o.total || 0) * tier.pct / 100).toFixed(2)} bonus</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="px-6 py-3 bg-white/3 border-t border-white/5 flex justify-between text-xs font-bold">
                <span className="text-text-muted">{zoneOrders.length} orders · ${revenue.toFixed(0)} total</span>
                <span className={tier.color}>${bonusAmt.toFixed(2)} bonus @ {tier.pct}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CaptainMyOrders = ({ user, allOrders, captainTableNumbers }) => {
  const [period, setPeriod] = useState('today');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter from global orders in context — no separate API call needed.
  const orders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);

    const myTables = captainTableNumbers || [];
    const isDeliveryCaptain = myTables.length === 0;

    return (allOrders || []).filter(o => {
      // Zone filter
      if (isDeliveryCaptain) {
        if (!['delivery', 'pickup', 'takeaway'].includes(o.order_type)) return false;
      } else {
        // Dine-in captain: match by table number OR by captain_id OR by served_by email
        const tNum = parseInt(String(o.table_number || '').match(/\d+/)?.[0] || '0') || 0;
        const tableMatch = tNum > 0 && myTables.includes(tNum);
        const captainIdMatch = o.captain_id && (
          (o.captain_id._id || o.captain_id) === user._id ||
          (o.captain_id._id || o.captain_id) === (user.id)
        );
        const emailMatch = o.served_by && user.email && o.served_by === user.email;
        if (!tableMatch && !captainIdMatch && !emailMatch) return false;
      }
      const ts = new Date(o.created_at || o.timestamp);
      if (period === 'today')   return ts >= todayStart;
      if (period === 'weekly')  return ts >= weekAgo;
      if (period === 'monthly') return ts >= monthAgo;
      return true;
    });
  }, [allOrders, period, captainTableNumbers, user.email]);

  // Status sub-filter
  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders;
    if (statusFilter === 'active') return orders.filter(o => !['paid', 'cancelled'].includes(o.status));
    if (statusFilter === 'completed') return orders.filter(o => ['served', 'paid'].includes(o.status));
    return orders;
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const paidOrders = orders.filter(o => o.status === 'paid');
    const revenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);
    // Tiered bonus: Bronze <$500→3%, Silver $500-$1500→5%, Gold >$1500→8%
    const bonusPct = revenue >= 1500 ? 0.08 : revenue >= 500 ? 0.05 : 0.03;
    const bonusTier = revenue >= 1500 ? 'Gold' : revenue >= 500 ? 'Silver' : 'Bronze';
    const bonusTierColor = revenue >= 1500 ? 'text-yellow-400' : revenue >= 500 ? 'text-slate-300' : 'text-amber-600';
    return {
      total: orders.length,
      active: orders.filter(o => !['paid', 'cancelled'].includes(o.status)).length,
      served: orders.filter(o => ['served', 'paid'].includes(o.status)).length,
      paid: paidOrders.length,
      revenue,
      items: orders.reduce((s, o) => s + (o.items || []).reduce((a, i) => a + (i.quantity || 1), 0), 0),
      bonusAmt: revenue * bonusPct,
      bonusPct: (bonusPct * 100).toFixed(0),
      bonusTier,
      bonusTierColor,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><ClipboardList size={28} className="text-primary" />My Orders</h2>
          <p className="text-text-muted text-sm mt-1">All orders you have served</p>
          {/* Zone badge */}
          {captainTableNumbers && captainTableNumbers.length > 0 ? (
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl w-fit">
              <span className="text-green-400 text-sm">🪑</span>
              <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">
                Zone: {captainTableNumbers.map(n => `Table ${n}`).join(' · ')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl w-fit">
              <span className="text-blue-400 text-sm">🚗</span>
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Zone: Delivery & Pickup</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['today', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Status sub-filter */}
      <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5 w-fit">
        {[['all','All'],['active','Active'],['completed','Completed']].map(([val,lbl]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === val ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{lbl}</button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',  value: stats.total,                    color: 'text-white',      bg: 'bg-white/5' },
          { label: 'Active',        value: stats.active,                   color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Items Served',  value: stats.items,                  color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Revenue',       value: `$${stats.revenue.toFixed(0)}`, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-white/5 p-5 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bonus Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award size={20} className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Performance Bonus</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 ${stats.bonusTierColor}`}>
                {stats.bonusTier} Tier · {stats.bonusPct}%
              </span>
            </div>
            <p className="text-2xl md:text-4xl font-black text-white">${stats.bonusAmt.toFixed(2)}</p>
            <p className="text-text-muted text-xs mt-1">Based on ${stats.revenue.toFixed(0)} revenue generated · {period}</p>
          </div>
          <div className="space-y-1 text-right">
            {[['Bronze','< $500','3%','text-amber-600'],['Silver','$500–$1500','5%','text-slate-300'],['Gold','> $1500','8%','text-yellow-400']].map(([tier, range, pct, col]) => (
              <div key={tier} className={`flex items-center gap-2 text-[10px] font-bold ${stats.bonusTier === tier ? col : 'text-text-muted'}`}>
                <span className={`w-2 h-2 rounded-full ${stats.bonusTier === tier ? 'bg-current' : 'bg-white/10'}`} />
                {tier}: {range} → {pct} bonus
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="py-16 text-center text-text-muted">
              <ClipboardList size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No orders found</p>
              <p className="text-xs mt-1">Try changing the time period or status filter</p>
            </div>
          )}
          {filtered.map(ord => {
            const isExpanded = expandedOrder === (ord._id || ord.id);
            return (
              <div key={ord._id || ord.id}
                className="bg-secondary/40 rounded-2xl border border-white/5 hover:border-primary/20 transition-all overflow-hidden">
                {/* Order row */}
                <button
                  className="w-full flex items-center px-5 py-4 gap-4 text-left"
                  onClick={() => setExpandedOrder(isExpanded ? null : (ord._id || ord.id))}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-black text-white text-sm">
                        {ord.order_number || `#${(ord._id || '').slice(-6).toUpperCase()}`}
                      </p>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase border ${STATUS_COLORS[ord.status] || 'bg-white/5 text-text-muted border-white/10'}`}>
                        {STATUS_LABELS[ord.status] || ord.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Table {ord.table_number || '—'} · {ord.customerName || 'Walk-in'} · {(ord.items || []).reduce((a, i) => a + (i.quantity || 1), 0)} items
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-primary">${(ord.total || 0).toFixed(0)}</p>
                    <p className="text-[10px] text-text-muted">{new Date(ord.created_at || ord.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <ChevronDown size={16} className={`text-text-muted transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded item detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5">
                      <div className="px-5 py-4 bg-bg-main/40 space-y-2">
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-3">Order Items</p>
                        {(ord.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-white/80">{item.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-primary font-black">×{item.quantity}</span>
                              <span className="text-text-muted text-xs">${((item.unit_price || item.price || 0) * item.quantity).toFixed(0)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 font-black text-sm">
                          <span className="text-text-muted">Total</span>
                          <span className="text-primary">${(ord.total || 0).toFixed(0)}</span>
                        </div>
                        {ord.spiceness && (
                          <p className="text-[10px] text-text-muted">Spice: {ord.spiceness}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="py-20 text-center text-text-muted bg-secondary/20 rounded-3xl border border-white/5">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No orders served in this period</p>
            </div>
          )}
        </div>
    </div>
  );
};

// ─── TABLE STATUS ─────────────────────────────────────────────────────────────
const TableStatus = ({ user }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [isDeliveryCaptain, setIsDeliveryCaptain] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [addForm, setAddForm] = useState({ label: '', capacity: 4, type: 'regular', captain_id: '' });
  const [captains, setCaptains] = useState([]);
  const [addingTable, setAddingTable] = useState(false);

  const isCaptain = user?.role === 'captain';
  const isOwner = user?.role === 'owner';
  const isManager = user?.role === 'manager';
  const canAddTable = isOwner || isManager;

  const [reservations, setReservations] = useState([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (isCaptain) {
        const res = await tablesAPI.getMyTables();
        const myTables = res.data || [];
        setTables(myTables);
        setIsDeliveryCaptain(myTables.length === 0);
      } else {
        const res = await tablesAPI.getAll();
        setTables(res.data || []);
        setIsDeliveryCaptain(false);
      }
      try {
        const rRes = await reservationsAPI.getAll('?status=confirmed');
        setReservations(rRes.data || []);
      } catch { setReservations([]); }
    } catch { setTables([]); }
    finally { if (!silent) setLoading(false); }
  }, [isCaptain]);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, 20000);

  // Load captains list for the "Add Table" form
  useEffect(() => {
    if (canAddTable) {
      usersAPI.getAll('?role=captain').then(r => setCaptains(r.data || [])).catch(() => setCaptains([]));
    }
  }, [canAddTable]);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const handleStatusChange = async (tableId, newStatus) => {
    setUpdating(tableId);
    try {
      await tablesAPI.setStatus(tableId, newStatus);
      setTables(prev => prev.map(t => t._id === tableId ? { ...t, status: newStatus } : t));
      flash(`Table updated to ${newStatus}`);
    } catch (err) { flash(err.message, 'error'); }
    finally { setUpdating(null); }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!addForm.label.trim()) { flash('Table label is required', 'error'); return; }
    setAddingTable(true);
    try {
      await tablesAPI.create({
        label: addForm.label.trim(),
        capacity: parseInt(addForm.capacity) || 4,
        type: addForm.type,
        captain_id: addForm.captain_id || undefined,
      });
      flash(`Table "${addForm.label}" added successfully!`);
      setShowAddTable(false);
      setAddForm({ label: '', capacity: 4, type: 'regular', captain_id: '' });
      load();
    } catch (err) { flash(err.message || 'Failed to add table', 'error'); }
    finally { setAddingTable(false); }
  };

  const tableConfig = {
    available:     { bg: 'bg-green-500/10 border-green-500/30', badge: 'bg-green-500/20 text-green-400', dot: 'bg-green-400' },
    occupied:      { bg: 'bg-red-500/10 border-red-500/30',     badge: 'bg-red-500/20 text-red-400',     dot: 'bg-red-400'   },
    reserved:      { bg: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-400' },
    not_available: { bg: 'bg-white/5 border-white/10',          badge: 'bg-white/10 text-text-muted',   dot: 'bg-gray-500'  },
  };

  const allStatuses = ['available', 'occupied', 'reserved', 'not_available'];

  if (isDeliveryCaptain) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Truck size={28} className="text-primary" />Your Zone: Delivery & Pickup</h2>
          <p className="text-text-muted text-sm mt-1">You are assigned to manage delivery and pickup orders — no dine-in tables in your zone.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {[
            { icon: Truck, label: 'Delivery Orders', desc: 'Manage and dispatch incoming delivery orders to riders', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
            { icon: Package, label: 'Pickup Orders', desc: 'Coordinate takeaway and counter pickup orders', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
            { icon: Activity, label: 'Live Tracking', desc: 'Track active deliveries and rider assignments', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
          ].map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-6 ${bg}`}>
              <Icon size={28} className={`${color} mb-3`} />
              <h3 className={`text-lg font-black ${color}`}>{label}</h3>
              <p className="text-text-muted text-sm mt-2">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-secondary/40 rounded-2xl border border-white/10 p-5">
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-2">Your Captain ID</p>
          <p className="text-white font-mono text-sm">CAP4-{user?._id?.slice(-8).toUpperCase()}</p>
          <p className="text-text-muted text-xs mt-1">Notifications for delivery/pickup orders are routed to you exclusively.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <LayoutDashboard size={28} className="text-primary" />Table Status
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {isCaptain
              ? `Your zone: ${tables.length} table${tables.length !== 1 ? 's' : ''} assigned`
              : 'Click a table to change its status manually'}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-4 text-xs font-bold text-text-muted flex-wrap">
            {allStatuses.map(s => (
              <div key={s} className="flex items-center gap-1.5 capitalize">
                <span className={`w-2.5 h-2.5 rounded-full ${tableConfig[s]?.dot}`} />
                {s.replace('_', ' ')}
              </div>
            ))}
          </div>
          {canAddTable && (
            <button
              onClick={() => setShowAddTable(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all"
            >
              <Plus size={14} /> Add Table
            </button>
          )}
        </div>
      </div>
      {isCaptain && (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border w-fit ${
          isDeliveryCaptain
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          <Shield size={12} />
          <span className="text-xs font-black uppercase tracking-widest">
            {isDeliveryCaptain
              ? '🚗 Delivery & Pickup Captain'
              : `🪑 Zone: ${tables.map(t => t.label || `Table ${t.table_number}`).join(' · ')}`}
          </span>
        </div>
      )}
      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAddTable && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-3xl border border-white/10 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-black text-white flex items-center gap-2"><Plus size={18} className="text-primary" />Add New Table</h3>
                <button onClick={() => setShowAddTable(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"><X size={16} /></button>
              </div>
              <form onSubmit={handleAddTable} className="p-6 space-y-4">
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">TABLE LABEL *</label>
                  <input
                    type="text" required
                    value={addForm.label}
                    onChange={e => setAddForm(p => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Table 10, Terrace 1, Lounge A"
                    className="w-full bg-[#252525] border border-white/10 p-3.5 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                  <div>
                    <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">CAPACITY</label>
                    <input
                      type="number" min="1" max="50"
                      value={addForm.capacity}
                      onChange={e => setAddForm(p => ({ ...p, capacity: e.target.value }))}
                      className="w-full bg-[#252525] border border-white/10 p-3.5 rounded-xl focus:border-primary outline-none text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">TYPE</label>
                    <select
                      value={addForm.type}
                      onChange={e => setAddForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-[#252525] border border-white/10 p-3.5 rounded-xl focus:border-primary outline-none text-white text-sm appearance-none cursor-pointer"
                    >
                      <option value="regular">Regular</option>
                      <option value="vip">VIP</option>
                      <option value="outdoor">Outdoor</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">ASSIGN CAPTAIN (optional)</label>
                  <select
                    value={addForm.captain_id}
                    onChange={e => setAddForm(p => ({ ...p, captain_id: e.target.value }))}
                    className="w-full bg-[#252525] border border-white/10 p-3.5 rounded-xl focus:border-primary outline-none text-white text-sm appearance-none cursor-pointer"
                  >
                    <option value="">— Unassigned —</option>
                    {captains.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddTable(false)}
                    className="flex-1 py-3.5 border border-white/20 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" disabled={addingTable}
                    className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50">
                    {addingTable ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                    {addingTable ? 'Adding...' : 'Add Table'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map(t => {
            const cfg = tableConfig[t.status] || tableConfig.available;
            const isUpdating = updating === t._id;
            const tableRes = reservations.find(r =>
              String(r.table_assigned) === String(t.table_number) ||
              String(r.table_assigned) === t.label
            );
            return (
              <div key={t._id} className={`rounded-2xl border p-4 ${cfg.bg} relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xl font-black text-white">{
                    (() => {
                      const lbl = t.label || String(t.table_number || '');
                      const n = parseInt(lbl);
                      return (!isNaN(n) && String(n) === lbl.trim()) ? `Table ${n}` : (lbl || `T${t.table_number}`);
                    })()
                  }</p>
                  {isUpdating && <Loader size={14} className="animate-spin text-primary" />}
                </div>
                {t.capacity && <p className="text-[10px] text-text-muted mb-2">{t.capacity} seats</p>}
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase mb-2 inline-block ${cfg.badge}`}>
                  {t.status.replace('_', ' ')}
                </span>
                {t.type === 'vip' && (
                  <span className="ml-1 text-[9px] font-black px-2 py-1 rounded-full uppercase bg-amber-500/20 text-amber-400">VIP</span>
                )}
                {tableRes && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-2 mb-2">
                    <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-0.5">📅 Reserved</p>
                    <p className="text-[9px] text-yellow-300 font-bold truncate">{tableRes.customer_name}</p>
                    <p className="text-[9px] text-yellow-300/70">
                      {tableRes.date ? new Date(tableRes.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                      {tableRes.time ? ` @ ${tableRes.time}` : ''}
                    </p>
                    <p className="text-[9px] text-yellow-300/60">{tableRes.guests} guests</p>
                  </div>
                )}
                {t.captain_id && (
                  <p className="text-[9px] text-text-muted mb-1 truncate">👤 {t.captain_id.name || 'Captain'}</p>
                )}
                <select
                  value={t.status}
                  onChange={e => handleStatusChange(t._id, e.target.value)}
                  disabled={isUpdating}
                  className="w-full mt-1 bg-black/40 border border-white/10 text-white text-[10px] font-bold rounded-lg px-2 py-1.5 outline-none focus:border-primary cursor-pointer uppercase tracking-widest"
                >
                  {allStatuses.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
            );
          })}
          {tables.length === 0 && (
            <div className="col-span-full py-20 text-center text-text-muted">
              <LayoutDashboard size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No tables configured</p>
              {canAddTable && (
                <button onClick={() => setShowAddTable(true)} className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
                  Add First Table
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────
const ReservationsPanel = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [resDelConfirm, setResDelConfirm] = useState(null);
  const [allTables, setAllTables] = useState([]); // for dropdown
  const RESERVATION_TIMES = ['11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM'];
  const [form, setForm] = useState({ customer_name: '', email: '', phone: '', guests: 2, date: '', time: '', notes: '', table_assigned: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await reservationsAPI.getAll(); setReservations(res.data || []); }
    catch { setReservations([]); }
    finally { if (!silent) setLoading(false); }
  }, []);

  // Load real tables list for dropdown
  useEffect(() => {
    tablesAPI.getAll()
      .then(r => setAllTables(r.data || []))
      .catch(() => setAllTables([]));
  }, []);

  // Format a table label to always show "Table N" format
  const getTableLabel = (t) => {
    if (!t) return '';
    const lbl = t.label || String(t.table_number || '');
    const n = parseInt(lbl);
    return (!isNaN(n) && String(n) === lbl.trim()) ? `Table ${n}` : lbl;
  };

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 30000);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  // Ensure table label always shows "Table 1" format, not bare "1"
  const fmtTable = (t) => {
    if (!t) return null;
    const s = String(t).trim();
    const n = parseInt(s);
    return (!isNaN(n) && String(n) === s) ? `Table ${n}` : s;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await reservationsAPI.create({
        customer_name: form.customer_name,
        email: form.email,
        phone: form.phone,
        guests: Number(form.guests),
        date: form.date ? new Date(form.date).toISOString() : undefined,
        time: form.time,
        notes: form.notes,
        table_assigned: form.table_assigned,
      });
      flash('Reservation created successfully');
      setShowForm(false);
      setForm({ customer_name: '', email: '', phone: '', guests: 2, date: '', time: '', notes: '', table_assigned: '' });
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const [confirmingId, setConfirmingId] = useState(null);
  const [quotationMsg, setQuotationMsg] = useState('');
  const [tableAssign,  setTableAssign]  = useState('');
  const [tableConflicts, setTableConflicts] = useState([]); // conflicts from API
  const [checkingConflict, setCheckingConflict] = useState(false);

  // ── Check conflicts whenever table or confirmingId changes ───────────────
  useEffect(() => {
    if (!confirmingId || !tableAssign.trim()) { setTableConflicts([]); return; }
    const reservation = reservations.find(r => r._id === confirmingId);
    if (!reservation?.date || !reservation?.time) return;
    let cancelled = false;
    setCheckingConflict(true);
    reservationsAPI.checkConflict(tableAssign.trim(), reservation.date, reservation.time, confirmingId)
      .then(r => { if (!cancelled) setTableConflicts(r.conflicts || []); })
      .catch(() => { if (!cancelled) setTableConflicts([]); })
      .finally(() => { if (!cancelled) setCheckingConflict(false); });
    return () => { cancelled = true; };
  }, [tableAssign, confirmingId, reservations]);

  const updateStatus = async (id, status) => {
    try {
      await reservationsAPI.patch(id, { status });
      flash(`Reservation ${status}${status === 'cancelled' ? ' — sorry email sent' : ''}`);
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleConfirm = async (id) => {
    try {
      const body = {};
      if (quotationMsg.trim()) body.quotation_message = quotationMsg.trim();
      if (tableAssign.trim())  body.table_assigned    = tableAssign.trim();
      await reservationsAPI.confirm(id, body);
      flash('Reservation confirmed — confirmation email sent!');
      setConfirmingId(null); setQuotationMsg(''); setTableAssign('');
      load();
    } catch (err) { flash(err?.message || 'Failed to confirm', 'error'); }
  };

  const markComplete = async (id) => {
    try { await reservationsAPI.patch(id, { status: 'completed' }); flash('Marked as completed'); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const STATUS_COLORS = {
    confirmed: 'text-green-400', pending: 'text-yellow-400',
    cancelled:  'text-red-400',  completed: 'text-text-muted',
  };
  const STATUS_BG = {
    pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-white/5 text-text-muted border-white/10',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  reservations.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
  const filtered = filterStatus === 'all' ? reservations : reservations.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Calendar size={28} className="text-primary" />Reservations
            {reservations.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2.5 py-1 rounded-full font-black animate-pulse">
                +{reservations.filter(r => r.status === 'pending').length} pending
              </span>
            )}
          </h2>
          <p className="text-text-muted text-sm mt-1">{reservations.length} total reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
            <Plus size={14} /> New Reservation
          </button>
        </div>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Status group tabs with counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
        {(['pending','confirmed','completed','cancelled']).map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={`rounded-2xl border p-4 text-center transition-all ${filterStatus === s ? 'ring-2 ring-primary' : ''} ${STATUS_BG[s]}`}>
            <p className="text-2xl font-black">{counts[s]}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest mt-1 capitalize">{s}</p>
          </button>
        ))}
      </div>

      {/* New Reservation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-secondary/40 rounded-3xl border border-primary/30 p-4 md:p-8">
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2"><Calendar size={18} className="text-primary" /> New Reservation</h3>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input required value={form.customer_name} onChange={sf('customer_name')} placeholder="Customer name"
                    className="w-full bg-bg-main border border-white/10 pl-9 pr-3 py-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="email" value={form.email} onChange={sf('email')} placeholder="customer@email.com"
                    className="w-full bg-bg-main border border-white/10 pl-9 pr-3 py-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="tel" value={form.phone} onChange={sf('phone')} placeholder="+1 555 000 0000"
                    className="w-full bg-bg-main border border-white/10 pl-9 pr-3 py-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Date *</label>
                <input type="date" required value={form.date} style={{ colorScheme: "dark" }} onChange={sf('date')} min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Time *</label>
                <select required value={form.time} onChange={sf('time')}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm">
                  <option value="">Select time</option>
                  {RESERVATION_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Guests *</label>
                <select required value={form.guests} onChange={sf('guests')}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm">
                  {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Assign Table (optional)</label>
                <select value={form.table_assigned} onChange={sf('table_assigned')}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm appearance-none cursor-pointer">
                  <option value="">— No table yet —</option>
                  {allTables.map(t => {
                    const lbl = getTableLabel(t);
                    return (
                      <option key={t._id} value={lbl}>
                        {lbl}{t.capacity ? ` (${t.capacity} seats)` : ''}{t.type === 'vip' ? ' ⭐ VIP' : ''}
                        {t.status !== 'available' ? ` [${t.status}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Special Requests</label>
                <textarea value={form.notes} onChange={sf('notes')} rows={2}
                  placeholder="Dietary preferences, special occasions, seating preference…"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm resize-none" />
              </div>
              <div className="md:col-span-full flex gap-3">
                <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">Save Reservation</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filtered.length === 0 && (
              <div className="py-20 text-center text-text-muted">
                <Calendar size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">No {filterStatus !== 'all' ? filterStatus : ''} reservations</p>
              </div>
            )}
            {filtered.map(r => (
              <React.Fragment key={r._id}>
                <div className="flex items-center px-6 py-4 hover:bg-white/3 group flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{r.customer_name}</p>
                    <p className="text-xs text-text-muted">{r.phone || '—'} · {r.guests} guests{fmtTable(r.table_assigned) ? ` · ${fmtTable(r.table_assigned)}` : ''}</p>
                    {r.email && <p className="text-[10px] text-text-muted/70">{r.email}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{r.date ? new Date(r.date).toLocaleDateString() : '—'} {r.time}</span>
                    <span className={`font-black uppercase px-2 py-0.5 rounded-full text-[10px] border ${STATUS_BG[r.status] || ''}`}>{r.status}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {r.status === 'pending' && (
                      <button onClick={() => setConfirmingId(confirmingId === r._id ? null : r._id)}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 text-[10px] font-black rounded-lg hover:bg-green-500 hover:text-white transition-all">
                        ✉ Confirm & Email
                      </button>
                    )}
                    {r.status === 'confirmed' && (
                      <button onClick={() => markComplete(r._id)}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                        ✓ Complete
                      </button>
                    )}
                    {r.status !== 'cancelled' && r.status !== 'completed' && (
                      <button onClick={() => setResDelConfirm({ id: r._id, name: r.customer_name, action: 'cancel' })}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 text-[10px] font-black rounded-lg hover:bg-red-500 hover:text-white transition-all">✕ Cancel</button>
                    )}
                  </div>
                </div>
                {confirmingId === r._id && (
                  <div className="border-b border-primary/20 bg-primary/5 px-6 py-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">✉ Confirm & Send Email to Customer</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Assign Table</label>
                        <select value={tableAssign} onChange={e => setTableAssign(e.target.value)}
                          className={`w-full bg-bg-main border p-2.5 rounded-xl outline-none text-white text-sm appearance-none cursor-pointer ${tableConflicts.length > 0 ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-primary'}`}>
                          <option value="">— Select a table —</option>
                          {allTables.map(t => {
                            const lbl = getTableLabel(t);
                            return (
                              <option key={t._id} value={lbl}>
                                {lbl}{t.capacity ? ` (${t.capacity} seats)` : ''}{t.type === 'vip' ? ' ⭐ VIP' : ''}
                                {t.status !== 'available' ? ` [${t.status}]` : ' ✓ Available'}
                              </option>
                            );
                          })}
                        </select>
                        {/* Conflict warning */}
                        {checkingConflict && <p className="text-[10px] text-text-muted mt-1">Checking availability…</p>}
                        {!checkingConflict && tableConflicts.length > 0 && (
                          <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-1">
                            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">⚠ Table Conflict — Within 30 Minutes</p>
                            {tableConflicts.map(con => (
                              <p key={con._id} className="text-[10px] text-red-300">
                                {con.customer_name} is booked at <strong>{con.time}</strong> ({con.status})
                              </p>
                            ))}
                            <p className="text-[10px] text-red-400/70">Choose a different table or a time at least 30 min apart.</p>
                          </div>
                        )}
                        {!checkingConflict && tableAssign.trim() && tableConflicts.length === 0 && (
                          <p className="text-[10px] text-green-400 font-bold mt-1">✓ Table available at this time</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Message to Customer (optional)</label>
                        <textarea value={quotationMsg} onChange={e => setQuotationMsg(e.target.value)} rows={2}
                          placeholder="Add a personal note for the confirmation email…"
                          className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl focus:border-primary outline-none text-white text-sm resize-none" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleConfirm(r._id)} disabled={tableConflicts.length > 0 || checkingConflict}
                        className="px-5 py-2 bg-green-500 text-white text-xs font-black rounded-xl hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {checkingConflict ? 'Checking…' : '✓ Confirm & Send Email'}
                      </button>
                      <button onClick={() => { setConfirmingId(null); setQuotationMsg(''); setTableAssign(''); setTableConflicts([]); }}
                        className="px-5 py-2 border border-white/20 text-text-muted text-xs font-black rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!resDelConfirm}
        title="Cancel Reservation?"
        message={resDelConfirm?.name ? `Are you sure you want to cancel ${resDelConfirm.name}'s reservation?` : 'Are you sure you want to cancel this reservation?'}
        confirmText="Yes, Cancel It"
        cancelText="Keep Reservation"
        onCancel={() => setResDelConfirm(null)}
        onConfirm={() => { updateStatus(resDelConfirm.id, 'cancelled'); setResDelConfirm(null); }}
      />
    </div>
  );
};

// ─── FEEDBACK BOX ─────────────────────────────────────────────────────────────
const FeedbackBox = ({ userRole = 'owner' }) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(userRole === 'manager' ? 'unread' : 'all');
  const [fbDelConfirm, setFbDelConfirm] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Local map: feedbackId → 'owner'|'manager' — persists replied_by when backend doesn't return it
  const [localReplyBy, setLocalReplyBy] = useState({});
  // Date filter: 'all' | 'today' | 'custom'
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await feedbackAPI.getAll(); setFeedback(res.data || []); }
    catch { setFeedback([]); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 30000);

  const markRead = async (id) => { await feedbackAPI.markRead(id); load(); };
  const markAllRead = async () => { await feedbackAPI.markAllRead(); load(); };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    setReplySending(true);
    try {
      await feedbackAPI.reply(id, replyText, userRole);
      // Store who replied locally — backend may not return replied_by field
      setLocalReplyBy(prev => ({ ...prev, [id]: userRole }));
      setReplyMsg('Reply sent via email ✓');
      setReplyingTo(null); setReplyText('');
      setTimeout(() => setReplyMsg(''), 4000);
      load();
    } catch(e) { setReplyMsg('Failed: '+(e.message||'Error')); setTimeout(()=>setReplyMsg(''),4000); }
    finally { setReplySending(false); }
  };

  const handleDeleteFeedback = async (id) => {
    setFbDelConfirm(null);
    try { await feedbackAPI.delete?.(id) || await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/feedback/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('bb_token')}` } }); load(); }
    catch {}
  };

  // Use _role_is_read: backend attaches role-aware read state to each doc
  const unread = feedback.filter(f => !f._role_is_read).length;

  // Category filter values that map to backend stored values
  const CATEGORY_FILTERS = ['general', 'food', 'service', 'ambience', 'delivery'];

  // Status/category filter using role-aware field
  const isCategoryFilter = CATEGORY_FILTERS.includes(filter);
  const statusFiltered = (() => {
    if (filter === 'all')    return feedback;
    if (filter === 'unread') return feedback.filter(f => !f._role_is_read);
    if (isCategoryFilter)    return feedback.filter(f => (f.category || 'general') === filter);
    // Manager legacy: show unread or unreplied
    if (userRole === 'manager') return feedback.filter(f => !f._role_is_read || !f._role_replied_at);
    return feedback;
  })();

  // Date filter on top of status filter
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
  const filtered = statusFiltered.filter(f => {
    if (dateFilter === 'all') return true;
    const fDate = new Date(f.created_at).toLocaleDateString('en-CA');
    if (dateFilter === 'today') return fDate === todayStr;
    if (dateFilter === 'custom' && selectedDate) return fDate === selectedDate;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce((acc, f) => {
    const key = new Date(f.created_at).toLocaleDateString('en-CA');
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatGroupDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const starColor = (n) => n >= 4 ? 'text-green-400' : n >= 3 ? 'text-yellow-400' : 'text-red-400';

  // Reply label — backend provides _role_label based on caller's role
  const getReplyLabel = (f) => {
    if (f._role_label === 'Manager Reply') {
      return { label: 'Manager Reply', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' };
    }
    return { label: 'Owner Reply', color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <MessageSquare size={28} className="text-primary" />Feedback Box
            {unread > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-black">{unread}</span>}
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${userRole === 'owner' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
              {userRole === 'owner' ? '👑 Owner View — All Feedback' : '🧑‍💼 Manager View — Unread & Pending'}
            </span>
          </h2>
          <p className="text-text-muted text-sm mt-1">{feedback.length} total · {unread} unread</p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="px-5 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-black rounded-xl uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
              Mark All Read
            </button>
          )}
          <button onClick={refresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['all', 'unread'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{f}</button>
          ))}
        </div>
        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { val: 'all',      label: '🔘 All',          },
            { val: 'general',  label: '💬 General'       },
            { val: 'food',     label: '🍛 Food Quality'  },
            { val: 'service',  label: '⭐ Service'        },
            { val: 'ambience', label: '✨ Ambience'       },
            { val: 'delivery', label: '🚗 Delivery'       },
          ].map(({ val, label }) => (
            <button key={val}
              onClick={() => setFilter(val === 'all' ? filter === 'all' ? 'all' : 'all' : val)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                filter === val ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/30'
              }`}>{label}</button>
          ))}
        </div>
        {/* Date filter */}
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {[['all','All Dates'],['today','Today'],['custom','Pick Date']].map(([val, lbl]) => (
            <button key={val} onClick={() => setDateFilter(val)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${dateFilter === val ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
              {val === 'custom' && <Calendar size={10} />}{lbl}
            </button>
          ))}
        </div>
        {/* Calendar picker for custom date */}
        {dateFilter === 'custom' && (
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            max={todayStr}
            className="bg-bg-main border border-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-primary transition-all" />
        )}
        {/* Active date badge */}
        {dateFilter !== 'all' && (
          <span className="text-[10px] text-primary font-black px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-1.5">
            <Calendar size={10} />
            {dateFilter === 'today' ? 'Showing: Today' : selectedDate ? `Showing: ${new Date(selectedDate+'T00:00:00').toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'})}` : 'Select a date'}
            <button onClick={() => { setDateFilter('all'); setSelectedDate(''); }} className="ml-1 text-text-muted hover:text-white transition-all">✕</button>
          </span>
        )}
      </div>

      {replyMsg && <p className="text-xs text-primary font-bold px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl">{replyMsg}</p>}
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="space-y-6">
          {sortedDates.length === 0 && (
            <div className="py-20 text-center text-text-muted">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No feedback found</p>
            </div>
          )}
          {sortedDates.map(dateKey => (
            <div key={dateKey}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                  <Calendar size={11} className="text-primary" />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">{formatGroupDate(dateKey)}</span>
                  <span className="text-[10px] text-text-muted font-bold">· {grouped[dateKey].length} feedback</span>
                </div>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="space-y-3">
                {grouped[dateKey].map(f => {
                  const replyMeta = getReplyLabel(f);
                  return (
                    <div key={f._id} className={`bg-secondary/40 rounded-2xl border p-5 ${f._role_is_read ? 'border-white/5' : 'border-primary/30 bg-primary/5'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{f.customer_name || f.customer_id?.name || 'Anonymous'}</p>
                            <p className="text-[10px] text-text-muted">{f.category} · {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-black ${starColor(f.rating)}`}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                          {!f._role_is_read && (
                            <button onClick={() => markRead(f._id)} className="text-[10px] px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg font-black uppercase hover:bg-primary hover:text-white transition-all">
                              Mark Read
                            </button>
                          )}
                          {userRole === 'owner' && (
                            <button onClick={() => setFbDelConfirm(f._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </div>
                      {f.mobile_number && (
                        <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
                          <Phone size={10} className="text-primary" /> {f.mobile_number}
                        </p>
                      )}
                      {f.message && <p className="text-sm text-white/80 bg-white/5 rounded-xl p-3 mb-2">{f.message}</p>}
                      {f.suggestion && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Suggestion</p>
                          <p className="text-sm text-white/70">{f.suggestion}</p>
                        </div>
                      )}
                      {(f.customer_email||f.customer_id?.email) && (
                        <p className="text-[10px] text-text-muted flex items-center gap-1 mt-2">
                          <Mail size={9} className="text-primary" />{f.customer_email||f.customer_id?.email}
                        </p>
                      )}
                      {/* Reply display — shows Manager Reply or Owner Reply based on who replied */}
                      {f._role_reply && (
                        <div className={`mt-2 ${replyMeta.bg} border ${replyMeta.border} rounded-xl p-3`}>
                          <p className={`text-[9px] ${replyMeta.color} font-black uppercase tracking-widest mb-1 flex items-center gap-1`}>
                            <Mail size={9} /> {replyMeta.label} {f._role_reply_sent?'· Sent ✓':'· Draft'}
                          </p>
                          <p className="text-xs text-white/70">{f._role_reply}</p>
                        </div>
                      )}
                      {/* Reply button */}
                      {(f.customer_email||f.customer_id?.email) && (
                        <div className="mt-3">
                          {replyingTo===f._id ? (
                            <div className="bg-white/5 rounded-xl p-3 space-y-2">
                              <p className="text-[10px] text-text-muted font-bold">
                                Replying as <span className={userRole === 'manager' ? 'text-blue-400' : 'text-yellow-400'}>{userRole === 'manager' ? '🧑‍💼 Manager' : '👑 Owner'}</span> → {f.customer_email||f.customer_id?.email}
                              </p>
                              <textarea rows={3} value={replyText} onChange={e=>setReplyText(e.target.value)} autoFocus
                                placeholder="Type your reply — will be emailed to the customer..."
                                className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-primary resize-none" />
                              <div className="flex gap-2">
                                <button onClick={()=>handleReply(f._id)} disabled={replySending||!replyText.trim()}
                                  className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-black uppercase flex items-center gap-1.5 disabled:opacity-60">
                                  <Mail size={11}/>{replySending?'Sending…':'Send Reply'}
                                </button>
                                <button onClick={()=>{setReplyingTo(null);setReplyText('');}}
                                  className="px-4 py-1.5 border border-white/20 rounded-lg text-xs font-black uppercase hover:bg-white/5">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={()=>{setReplyingTo(f._id);setReplyText(f._role_reply||'');}}
                              className="text-[10px] px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-black uppercase hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1.5">
                              <Mail size={10}/>{f._role_reply?'Edit Reply':'Reply via Email'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!fbDelConfirm}
        title="Delete Feedback?"
        message="Are you sure you want to permanently delete this customer feedback?"
        confirmText="Delete"
        onCancel={() => setFbDelConfirm(null)}
        onConfirm={() => handleDeleteFeedback(fbDelConfirm)}
      />
    </div>
  );
};

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
const AnnouncementsPanel = ({ isAdmin }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [announcementTab, setAnnouncementTab] = useState('customer'); // 'customer' | 'staff'
  const [menuItems, setMenuItems] = useState([]);
  const [form, setForm] = useState({
    title: '', message: '', priority: 'normal',
    target_roles: ['customer'],
    is_scheduled: false, scheduled_date: '',
    is_festival: false, festival_name: '',
    has_offer: false, offer_scope: 'all', offer_discount: '', offer_item_ids: [],
    is_staff_only: false,
  });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const sb = f => e => setForm(p => ({ ...p, [f]: e.target.checked }));

  useEffect(() => {
    menuAPI.getAll().then(r => setMenuItems(r.data || [])).catch(() => {});
  }, []);

  const toggleOfferItem = (id) => {
    setForm(p => ({
      ...p,
      offer_item_ids: p.offer_item_ids.includes(id)
        ? p.offer_item_ids.filter(i => i !== id)
        : [...p.offer_item_ids, id],
    }));
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = isAdmin ? await announcementsAPI.getAllAdmin() : await announcementsAPI.getAll();
      setAnnouncements(res.data || []);
    } catch { setAnnouncements([]); }
    finally { if (!silent) setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 30000);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Staff-only targets all staff roles; customer targets customers
      const target_roles = form.is_staff_only
        ? ['owner', 'manager', 'captain', 'chef']
        : ['customer'];
      const payload = {
        ...form,
        target_roles,
        scheduled_date: form.is_scheduled && form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null,
        offer_items: form.has_offer && form.offer_scope === 'selected' ? form.offer_item_ids : form.has_offer ? ['ALL'] : [],
      };
      await announcementsAPI.create(payload);
      flash(form.is_scheduled ? 'Announcement scheduled!' : 'Announcement posted!');
      setShowForm(false);
      setForm({ title: '', message: '', priority: 'normal', target_roles: ['customer'], is_scheduled: false, scheduled_date: '', is_festival: false, festival_name: '', has_offer: false, offer_scope: 'all', offer_discount: '', offer_item_ids: [], is_staff_only: false });
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const [annDelConfirm, setAnnDelConfirm] = useState(null); // { id, title }
  const handleDeleteClick = (a) => setAnnDelConfirm({ id: a._id, title: a.title });
  const handleDelete = async (id) => {
    setAnnDelConfirm(null);
    try { await announcementsAPI.delete(id); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const priorityColor  = { low: 'text-text-muted', normal: 'text-blue-400', high: 'text-yellow-400', urgent: 'text-red-400' };
  const priorityBorder = { low: 'border-white/5', normal: 'border-blue-500/20', high: 'border-yellow-500/30', urgent: 'border-red-500/40' };

  // Split announcements: staff vs customer
  const STAFF_ROLES = ['owner','manager','captain','chef'];
  const isStaffAnnouncement = (a) => a.target_roles?.some(r => STAFF_ROLES.includes(r)) && !a.target_roles?.includes('customer');
  const customerAnnouncements = announcements.filter(a => !isStaffAnnouncement(a));
  const staffAnnouncements    = announcements.filter(a => isStaffAnnouncement(a));
  const visibleAnnouncements  = announcementTab === 'staff' ? staffAnnouncements : customerAnnouncements;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Megaphone size={28} className="text-primary" />Announcements</h2>
          <p className="text-text-muted text-sm mt-1">Post manually or schedule for festivals & events</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">
            <Plus size={14} /> Post Announcement
          </button>
        )}
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Tabs: Customer vs Staff */}
      <div className="flex gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/8 w-fit">
        <button onClick={() => setAnnouncementTab('customer')}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${announcementTab === 'customer' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
          🌐 Customer ({customerAnnouncements.length})
        </button>
        <button onClick={() => setAnnouncementTab('staff')}
          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${announcementTab === 'staff' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
          👥 Staff Only ({staffAnnouncements.length})
        </button>
      </div>

      <AnimatePresence>
        {showForm && isAdmin && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-secondary/40 rounded-3xl border border-primary/30 p-4 md:p-8 space-y-5">
            <h3 className="text-lg font-bold text-white">New Announcement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Staff-only toggle */}
              <div className="flex items-center gap-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_staff_only} onChange={sb('is_staff_only')} className="w-4 h-4 rounded accent-purple-400" />
                  <span className="text-sm font-bold text-purple-400 flex items-center gap-2">👥 Staff Only Announcement</span>
                </label>
                <p className="text-xs text-text-muted">{form.is_staff_only ? 'Visible only to: Owner, Manager, Captain, Chef' : 'Will be shown to customers'}</p>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Title *</label>
                <input required value={form.title} onChange={sf('title')}
                  className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Message *</label>
                <textarea required value={form.message} onChange={sf('message')} rows={3}
                  className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Priority</label>
                <div className="flex gap-2">
                  {['low', 'normal', 'high', 'urgent'].map(p => (
                    <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${form.priority === p ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>{p}</button>
                  ))}
                </div>
              </div>
              {/* Festival toggle */}
              <div className="flex items-center gap-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_festival} onChange={sb('is_festival')} className="w-4 h-4 rounded accent-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400 flex items-center gap-2"><Star size={14} /> Festival Offer</span>
                </label>
                {form.is_festival && (
                  <input type="text" placeholder="Festival name (e.g. Christmas Special)"
                    value={form.festival_name} onChange={sf('festival_name')}
                    className="flex-1 bg-bg-main border border-yellow-500/30 p-2.5 rounded-xl focus:border-yellow-400 outline-none text-white text-sm" />
                )}
              </div>
              {/* Offer toggle — only for customer announcements */}
              {!form.is_staff_only && (
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.has_offer} onChange={sb('has_offer')} className="w-4 h-4 rounded accent-green-400" />
                    <span className="text-sm font-bold text-green-400 flex items-center gap-2"><Star size={14} /> 🎁 Attach an Offer / Discount</span>
                  </label>
                  {form.has_offer && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Discount % *</label>
                          <input type="number" min="1" max="100" required value={form.offer_discount} onChange={sf('offer_discount')} placeholder="e.g. 20"
                            className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-green-400" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Apply To</label>
                          <div className="flex gap-2">
                            {['all', 'selected'].map(s => (
                              <button key={s} type="button" onClick={() => setForm(p => ({ ...p, offer_scope: s, offer_item_ids: [] }))}
                                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase border transition-all ${form.offer_scope === s ? 'bg-green-500/30 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>
                                {s === 'all' ? '🍽 All Items' : '✅ Pick Items'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      {form.offer_scope === 'selected' && (
                        <div>
                          <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Select Items ({form.offer_item_ids.length} selected)</label>
                          <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2 p-2 bg-bg-main rounded-xl border border-white/10">
                            {menuItems.map(item => {
                              const id = item._id || item.id;
                              const picked = form.offer_item_ids.includes(id);
                              return (
                                <button key={id} type="button" onClick={() => toggleOfferItem(id)}
                                  className={`px-3 py-2 rounded-lg text-xs font-bold text-left border transition-all flex items-center gap-2 ${picked ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20 hover:text-white'}`}>
                                  <span className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center text-[8px] ${picked ? 'bg-green-500 border-green-500 text-white' : 'border-white/30'}`}>{picked ? '✓' : ''}</span>
                                  <span className="truncate">{item.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Schedule toggle */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_scheduled} onChange={sb('is_scheduled')} className="w-4 h-4 rounded accent-blue-400" />
                  <span className="text-sm font-bold text-blue-400 flex items-center gap-2"><Calendar size={14} /> Schedule for Later</span>
                </label>
                {form.is_scheduled && (
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Date & Time</label>
                    <input type="datetime-local" value={form.scheduled_date} style={{ colorScheme: "dark" }} onChange={sf('scheduled_date')} required={form.is_scheduled}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      className="bg-bg-main border border-blue-500/30 p-2.5 rounded-xl focus:border-blue-400 outline-none text-white text-sm" />
                    <p className="text-[10px] text-text-muted mt-1">Announcement will be visible from this date/time</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">
                  {form.is_scheduled ? '📅 Schedule' : '📢 Post Now'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="space-y-4">
          {announcementTab === 'staff' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="text-purple-400 text-xs font-bold">👥 Staff-only announcements — visible to Owner, Manager, Captain & Chef only</span>
            </div>
          )}
          {visibleAnnouncements.map(a => (
            <div key={a._id} className={`bg-secondary/40 rounded-2xl border p-6 ${priorityBorder[a.priority] || 'border-white/5'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`w-2.5 h-2.5 rounded-full ${a.priority === 'urgent' ? 'bg-red-400 animate-pulse' : a.priority === 'high' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                  <h4 className="text-base font-bold text-white">{a.title}</h4>
                  <span className={`text-[10px] font-black uppercase ${priorityColor[a.priority]}`}>{a.priority}</span>
                  {isStaffAnnouncement(a) && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">👥 Staff Only</span>
                  )}
                  {a.is_festival && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      🎉 {a.festival_name || 'Festival Offer'}
                    </span>
                  )}
                  {a.has_offer && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      🎁 {a.offer_discount}% OFF · {a.offer_scope === 'all' ? 'All Items' : (() => {
                        // offer_items may be { id, name } objects (backend-resolved) or raw IDs
                        const names = (a.offer_items || []).map(item => {
                          if (item?.name) return item.name;
                          return menuItems.find(m => (m._id||m.id) === item)?.name || null;
                        }).filter(Boolean);
                        if (names.length > 0) return names.slice(0,2).join(', ') + (names.length > 2 ? ` +${names.length-2}` : '');
                        return `${a.offer_items?.length || 0} item${(a.offer_items?.length||0)!==1?'s':''}`;
                      })()}
                    </span>
                  )}
                  {a.is_scheduled && a.scheduled_date && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      📅 {new Date(a.scheduled_date).toLocaleDateString()} {new Date(a.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => handleDeleteClick(a)} title="Delete announcement"
                    className="text-text-muted hover:text-red-400 transition-colors p-1 shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-white/80 ml-6">{a.message}</p>
              {/* Show offer items list with prices + estimated cost */}
              {a.has_offer && a.offer_items && a.offer_items.length > 0 && (
                <div className="ml-6 mt-3 bg-green-500/5 border border-green-500/15 rounded-xl px-3 py-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">Offer applies to:</p>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{a.offer_discount}% OFF</span>
                  </div>
                  {a.offer_items.includes('ALL') ? (
                    <div>
                      <p className="text-xs text-white/70">🍽 All menu items — {a.offer_discount}% discount applied at checkout</p>
                      {menuItems.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {menuItems.slice(0, 8).map(mi => {
                            const discounted = (mi.price * (1 - a.offer_discount / 100)).toFixed(2);
                            return (
                              <div key={mi._id || mi.id} className="flex items-center justify-between text-[10px]">
                                <span className="text-white/60">{mi.name}</span>
                                <span className="flex items-center gap-1.5">
                                  <span className="line-through text-white/30">${mi.price?.toFixed(2)}</span>
                                  <span className="text-green-400 font-black">${discounted}</span>
                                </span>
                              </div>
                            );
                          })}
                          {menuItems.length > 8 && <p className="text-[10px] text-text-muted">+{menuItems.length - 8} more items</p>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {a.offer_items.map((item, idx) => {
                        // Backend resolves offer_items to { id, name } objects
                        // Also support raw string IDs for backward compat
                        const itemId  = item?.id || item;
                        const itemName = item?.name
                          || menuItems.find(m => (m._id || m.id) === itemId)?.name
                          || null;
                        const mi = menuItems.find(m => (m._id || m.id) === itemId);
                        const discounted = mi ? (mi.price * (1 - a.offer_discount / 100)).toFixed(2) : null;
                        return (
                          <div key={itemId || idx} className="flex items-center justify-between text-[10px] bg-white/5 rounded-lg px-2 py-1">
                            <span className="text-white font-bold">
                              {itemName || <span className="text-white/40 italic">Unknown Item</span>}
                            </span>
                            <span className="flex items-center gap-1.5">
                              {mi && <span className="line-through text-white/30">${mi.price?.toFixed(2)}</span>}
                              {discounted && <span className="text-green-400 font-black">${discounted}</span>}
                              {!discounted && <span className="text-green-400 font-black">{a.offer_discount}% OFF</span>}
                            </span>
                          </div>
                        );
                      })}
                      <p className="text-[10px] text-green-400/70 font-bold pt-1">
                        {`${a.offer_discount}% OFF applies to all selected items`}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] text-text-muted ml-6 mt-2">
                By {a.created_by?.name || 'Admin'} · {new Date(a.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {visibleAnnouncements.length === 0 && (
            <div className="py-20 text-center text-text-muted">
              <Megaphone size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No {announcementTab === 'staff' ? 'staff' : 'customer'} announcements</p>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!annDelConfirm}
        title="Delete Announcement?"
        message={annDelConfirm?.title ? `Are you sure you want to delete "${annDelConfirm.title}"? This cannot be undone.` : 'Are you sure you want to delete this announcement?'}
        confirmText="Delete"
        onCancel={() => setAnnDelConfirm(null)}
        onConfirm={() => handleDelete(annDelConfirm?.id)}
      />
    </div>
  );
};

// ─── SHIFT LOGS ───────────────────────────────────────────────────────────────
const ShiftLogs = ({ user, isAdmin, onViewProfile }) => {
  const [shifts, setShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [roleFilter, setRoleFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [shiftsRes, activeRes] = await Promise.all([
        shiftsAPI.getAll(`?period=${period}`),
        shiftsAPI.getMyActive(),
      ]);
      setShifts(shiftsRes.data || []);
      setActiveShift(activeRes.data || null);
    } catch { setShifts([]); }
    finally { if (!silent) setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, 15000);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const handleCheckIn = async () => {
    try { await shiftsAPI.checkIn(); flash('Checked in successfully!'); load(); }
    catch (err) { flash(err.message, 'error'); }
  };
  const handleCheckOut = async () => {
    if (!activeShift) return;
    try { await shiftsAPI.checkOut(activeShift._id); flash('Checked out!'); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const formatDuration = (mins) => {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Filter by role
  const filteredShifts = roleFilter === 'all'
    ? shifts
    : shifts.filter(s => (s.user_id?.role || s.role) === roleFilter);

  // Analytics calculations
  const totalHours = filteredShifts.reduce((a, s) => a + (s.duration_minutes || 0), 0) / 60;
  const avgHours = filteredShifts.length ? totalHours / filteredShifts.length : 0;
  const activeCount = filteredShifts.filter(s => s.status === 'active').length;

  // Build bar chart data from shifts grouped by user
  const staffStats = useMemo(() => {
    const map = {};
    filteredShifts.forEach(s => {
      const name = s.user_id?.name || 'Unknown';
      if (!map[name]) map[name] = { name, hours: 0, sessions: 0, role: s.user_id?.role || s.role };
      map[name].hours += (s.duration_minutes || 0) / 60;
      map[name].sessions++;
    });
    return Object.values(map).sort((a, b) => b.hours - a.hours).slice(0, 8);
  }, [filteredShifts]);

  const maxHours = staffStats.length ? Math.max(...staffStats.map(s => s.hours), 1) : 1;

  const roleColors = {
    captain: 'bg-green-500 text-green-400',
    chef:    'bg-orange-500 text-orange-400',
    manager: 'bg-blue-500 text-blue-400',
    owner:   'bg-purple-500 text-purple-400',
  };
  const roleBadge = {
    captain: 'bg-green-500/10 text-green-400 border-green-500/20',
    chef:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
    manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    owner:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><UserCheck size={28} className="text-primary" />Shift Logs</h2>
          <p className="text-text-muted text-sm mt-1">Attendance analytics & check-in tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
          <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
            {['today', 'weekly', 'monthly', 'yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Personal shift status — Check In button removed, only Check Out when active */}
      {activeShift && (
        <div className="p-6 rounded-2xl border bg-green-500/10 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Currently on shift</p>
              <p className="text-xs text-green-400 mt-1">Started: {new Date(activeShift.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button onClick={handleCheckOut} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">Check Out</button>
          </div>
        </div>
      )}

      {/* Analytics cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: 'Total Hours', value: totalHours.toFixed(1) + 'h', icon: Clock, color: 'text-primary' },
          { label: 'Avg Hours/Session', value: avgHours.toFixed(1) + 'h', icon: BarChart3, color: 'text-blue-400' },
          { label: 'Currently Active', value: activeCount, icon: Activity, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-secondary/40 rounded-2xl border border-white/5 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{label}</p>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

    

      {/* Role filter buttons — only shown to admins; captain/chef only see their own */}
      {isAdmin && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Filter:</span>
          {['all', 'captain', 'chef', 'manager', 'owner'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${roleFilter === r
                ? r === 'all' ? 'bg-primary text-white border-primary' : `border ${roleBadge[r] || 'bg-primary text-white border-primary'} opacity-100`
                : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Shifts table */}
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="flex px-6 py-3 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
            <div className="w-[28%]">Staff</div>
            <div className="w-[14%]">Role</div>
            <div className="w-[20%]">Check In</div>
            <div className="w-[20%]">Check Out</div>
            <div className="w-[13%]">Duration</div>
            <div className="w-[5%]">Status</div>
          </div>
          <div className="divide-y divide-white/5">
            {filteredShifts.map(s => {
              // user_id may be null if user was deleted/re-seeded (broken reference)
              const staffName = s.user_id?.name || null;
              const staffRole = s.user_id?.role || s.role || '—';
              const displayName = staffName || `(${staffRole})`;
              const canOpenProfile = s.user_id && s.user_id._id;
              return (
              <div key={s._id}
                onClick={() => canOpenProfile && onViewProfile && onViewProfile(s.user_id)}
                className={`flex items-center px-6 py-4 transition-all group ${canOpenProfile ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default opacity-70'}`}>
                <div className="w-[28%] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staffName || staffRole || s._id}`} alt="" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${canOpenProfile ? 'group-hover:text-primary' : ''} ${staffName ? 'text-white' : 'text-text-muted italic'} transition-colors`}>{displayName}</p>
                    <p className="text-[10px] text-text-muted">{s.date}</p>
                  </div>
                </div>
                <div className="w-[14%]">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${roleBadge[s.user_id?.role || s.role] || 'text-text-muted bg-white/5 border-white/10'}`}>
                    {s.user_id?.role || s.role}
                  </span>
                </div>
                <div className="w-[20%] text-sm text-white/80">
                  {s.check_in ? new Date(s.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
                <div className="w-[20%] text-sm text-white/80">
                  {s.check_out ? new Date(s.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-green-400 animate-pulse">Active</span>}
                </div>
                <div className="w-[13%] text-sm font-bold text-white">{formatDuration(s.duration_minutes)}</div>
                <div className="w-[5%]">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-text-muted'}`}>{s.status}</span>
                </div>
              </div>
            );})}
            {filteredShifts.length === 0 && (
              <div className="py-16 text-center text-text-muted">
                <UserCheck size={36} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">No shift logs found</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── Calendar View — pick a date, see all shifts that day ── */}
      {isAdmin && (() => {
        const [calDate, setCalDate] = React.useState('');
        const dayShifts = calDate
          ? filteredShifts.filter(s => {
              const d = new Date(s.check_in || s.date || '');
              return d.toISOString().split('T')[0] === calDate;
            })
          : [];
        // Group by person for the selected day
        const grouped = {};
        dayShifts.forEach(s => {
          const key = s.user_id?._id || s._id;
          if (!grouped[key]) grouped[key] = { name: s.user_id?.name || '—', role: s.user_id?.role || '—', sessions: [] };
          grouped[key].sessions.push(s);
        });
        return (
          <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar size={16} className="text-primary" /> Shift Calendar
              </h3>
              <input type="date" value={calDate} onChange={e => setCalDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-all" />
            </div>
            {!calDate ? (
              <p className="text-text-muted text-sm text-center py-6">Pick a date to see all shifts for that day</p>
            ) : Object.keys(grouped).length === 0 ? (
              <p className="text-text-muted text-sm text-center py-6">No shifts recorded on {new Date(calDate + 'T12:00:00').toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'})}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-4">
                  {Object.keys(grouped).length} staff · {dayShifts.length} sessions on {new Date(calDate + 'T12:00:00').toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'})}
                </p>
                {Object.values(grouped).map((g, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${g.name}`} alt="" className="w-full h-full" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{g.name}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${roleBadge[g.role] || 'text-text-muted bg-white/5 border-white/10'}`}>{g.role}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-text-muted">{g.sessions.length} session{g.sessions.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="space-y-1.5">
                      {g.sessions.map((s, j) => (
                        <div key={j} className="flex items-center justify-between bg-black/20 rounded-xl px-4 py-2 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-green-400 font-bold">IN: {s.check_in ? new Date(s.check_in).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—'}</span>
                            <span className="text-white/20">→</span>
                            <span className={`font-bold ${s.check_out ? 'text-red-400' : 'text-yellow-400 animate-pulse'}`}>
                              OUT: {s.check_out ? new Date(s.check_out).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : 'Active'}
                            </span>
                          </div>
                          <span className="text-primary font-black">{s.duration_minutes ? `${Math.floor(s.duration_minutes/60)}h ${s.duration_minutes%60}m` : '—'}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-primary font-black mt-2 text-right">
                      Total: {(g.sessions.reduce((a,s) => a+(s.duration_minutes||0), 0)/60).toFixed(1)}h
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
};

// ─── STAFF MANAGEMENT ─────────────────────────────────────────────────────────
const StaffManagement = ({ currentUserRole, onViewProfile }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [roleFilter, setRoleFilter] = useState('all');
  const [allTables, setAllTables] = useState([]);
  const [activeShiftIds, setActiveShiftIds] = useState(new Set()); // user IDs currently on shift
  const [captainTableMap, setCaptainTableMap] = useState({}); // captainId → [tableIds]
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'captain',
    dob: '', gender: '', address: '', city: '', state: '', pincode: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    joining_date: '', id_proof_type: '', id_proof_number: '',
    salary: '', bank_account: '', ifsc_code: '',
  });
  const [selectedTableIds, setSelectedTableIds] = useState([]); // for captain assignment
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const allowedRoles = currentUserRole === 'owner'
    ? ['manager', 'captain', 'chef', 'servant', 'helper', 'cleaner', 'security']
    : ['captain', 'chef', 'servant', 'helper', 'cleaner', 'security'];

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const queries = allowedRoles.map(r => usersAPI.getAll(`?role=${r}`));
      const results = await Promise.all(queries);
      const allStaff = results.flatMap(r => r.data || []);
      setStaff(allStaff);

      // Load all tables + build captain→tables map
      const tablesRes = await tablesAPI.getAll();
      const tables = tablesRes.data || [];
      setAllTables(tables);
      const map = {};
      for (const t of tables) {
        if (t.captain_id) {
          const capId = t.captain_id._id || t.captain_id;
          if (!map[capId]) map[capId] = [];
          map[capId].push(t._id);
        }
      }
      setCaptainTableMap(map);

      // Fetch currently active shifts to show real-time availability
      try {
        const activeRes = await shiftsAPI.getActive();
        const activeIds = new Set((activeRes.data || []).map(s => String(s.user_id?._id || s.user_id)));
        setActiveShiftIds(activeIds);
      } catch { setActiveShiftIds(new Set()); }
    } catch { setStaff([]); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const openAdd = () => {
    setEditTarget(null);
    setSelectedTableIds([]);
    setForm({ name: '', email: '', phone: '', password: '', role: allowedRoles[0], dob: '', gender: '', address: '', city: '', state: '', pincode: '', emergency_contact_name: '', emergency_contact_phone: '', joining_date: '', id_proof_type: '', id_proof_number: '', salary: '', bank_account: '', ifsc_code: '' });
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    // Load current table assignments for this captain
    const currentTableIds = (captainTableMap[u._id] || []);
    setSelectedTableIds(currentTableIds);
    setForm({ name: u.name, email: u.email || '', phone: u.phone || '', password: '', role: u.role, dob: u.dob ? u.dob.split('T')[0] : '', gender: u.gender || '', address: u.address || '', city: u.city || '', state: u.state || '', pincode: u.pincode || '', emergency_contact_name: u.emergency_contact_name || '', emergency_contact_phone: u.emergency_contact_phone || '', joining_date: u.joining_date ? u.joining_date.split('T')[0] : '', id_proof_type: u.id_proof_type || '', id_proof_number: u.id_proof_number || '', salary: u.salary || '', bank_account: u.bank_account || '', ifsc_code: u.ifsc_code || '' });
    setShowForm(true);
  };

  const toggleTableSelection = (tableId) => {
    setSelectedTableIds(prev =>
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const [dupEmailAlert, setDupEmailAlert] = useState(null); // { name, role, email }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Pre-check: if adding (not editing), detect duplicate email in already-loaded staff list
    if (!editTarget && form.email.trim()) {
      const existing = staff.find(u => u.email?.toLowerCase() === form.email.trim().toLowerCase());
      if (existing) {
        setDupEmailAlert({ name: existing.name, role: existing.role, email: existing.email });
        return;
      }
    }

    try {
      const { password, ...rest } = form;
      let savedUser;
      if (editTarget) {
        const res = await usersAPI.update(editTarget._id, rest);
        savedUser = res.data;
        flash('Staff updated successfully');
      } else {
        const res = await usersAPI.create({ ...rest, password });
        savedUser = res.data;
        flash(`${form.role} added successfully`);
      }

      // If role is captain, handle table assignments
      if (form.role === 'captain' && savedUser?._id) {
        const captainId = savedUser._id;

        // 1. Unassign tables currently owned by this captain that are no longer selected
        const previousTableIds = editTarget ? (captainTableMap[editTarget._id] || []) : [];
        const toUnassign = previousTableIds.filter(id => !selectedTableIds.includes(id));
        for (const tid of toUnassign) {
          await tablesAPI.assignCaptain(tid, null);
        }

        // 2. Assign newly selected tables to this captain
        for (const tid of selectedTableIds) {
          await tablesAPI.assignCaptain(tid, captainId);
        }
      }

      setShowForm(false);
      load();
    } catch (err) {
      // Backend may also detect duplicate email — show popup for that too
      if (err.message?.toLowerCase().includes('email') && err.message?.toLowerCase().includes('exist')) {
        setDupEmailAlert({ name: '(existing staff)', role: 'unknown', email: form.email });
      } else {
        flash(err.message, 'error');
      }
    }
  };

  const toggleActive = async (u) => {
    try {
      await usersAPI.toggleStatus(u._id, !u.is_active, 'Temporarily disabled by manager');
      flash(`${u.name} ${u.is_active ? 'disabled' : 'enabled'}`);
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try { await usersAPI.delete(id); flash('Staff removed'); setDelConfirm(null); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const roleColor = {
    manager:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
    captain:  'text-green-400 bg-green-500/10 border-green-500/20',
    chef:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
    servant:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
    helper:   'text-pink-400 bg-pink-500/10 border-pink-500/20',
    cleaner:  'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    security: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  };

  const filteredStaff = roleFilter === 'all' ? staff : staff.filter(u => u.role === roleFilter);

  // Tables available for captain assignment (show all tables, mark which captain has them)
  const getTableOwnerName = (tableId) => {
    for (const [capId, tableIds] of Object.entries(captainTableMap)) {
      if (tableIds.includes(tableId)) {
        const cap = staff.find(s => s._id === capId);
        if (cap && (!editTarget || capId !== editTarget._id)) return cap.name;
      }
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Staff Management</h2>
          <p className="text-text-muted text-sm">{currentUserRole === 'owner' ? 'Manage all managers, captains & chefs' : 'Manage captains and chefs'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} /> <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 md:px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/25">
            <Plus size={14} /> Add Staff
          </button>
        </div>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Role filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Filter:</span>
        {['all', ...allowedRoles].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${roleFilter === r
              ? r === 'all' ? 'bg-primary text-white border-primary' : roleColor[r] + ' opacity-100'
              : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>
            {r} {r !== 'all' && `(${staff.filter(u => u.role === r).length})`}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-text-muted">{filteredStaff.length} shown</span>
      </div>

      {/* Add/Edit Staff Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-3xl border border-white/10 w-full max-w-md shadow-2xl my-4">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-black text-white">{editTarget ? `Edit ${editTarget.name}` : 'Add New Staff'}</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">FULL NAME *</label>
                  <input type="text" required value={form.name} onChange={sf('name')} placeholder="e.g. Arjun Singh"
                    className="w-full bg-[#252525] border border-white/10 p-3.5 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">EMAIL *</label>
                  <div className="relative">
                    <input type="email" required value={form.email} onChange={sf('email')} placeholder="staff@biryanibox.com"
                      className="w-full bg-[#252525] border border-white/10 p-3.5 pr-12 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center">
                      <Mail size={13} className="text-primary" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">MOBILE NUMBER *</label>
                  <input type="tel" value={form.phone} onChange={sf('phone')} placeholder="+1-555-000-0000" required
                    className="w-full bg-[#252525] border border-white/10 p-3.5 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">ROLE *</label>
                  <div className="relative">
                    <select value={form.role} onChange={sf('role')}
                      className="w-full bg-[#252525] border border-white/10 p-3.5 pr-10 rounded-xl focus:border-primary outline-none text-white text-sm appearance-none cursor-pointer">
                      {allowedRoles.map(r => (
                        <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>
                {!editTarget && (
                  <div>
                    <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">PASSWORD *</label>
                    <PasswordField value={form.password} onChange={sf('password')} placeholder="Min 6 characters" required />
                  </div>
                )}

                {/* Captain Table Assignment Section */}
                {form.role === 'captain' && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-green-400" />
                      <label className="text-[11px] text-green-400 font-black uppercase tracking-widest">
                        TABLE ZONE ASSIGNMENT
                      </label>
                    </div>
                    <p className="text-[10px] text-text-muted">Select which tables this captain will manage. Only this captain will receive notifications for these tables.</p>
                    {allTables.length === 0 ? (
                      <p className="text-[10px] text-text-muted italic">No tables available yet. Add tables first from the Table Status module.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                        {allTables.map(t => {
                          const isSelected = selectedTableIds.includes(t._id);
                          const ownerName = getTableOwnerName(t._id);
                          const isOwnedByOther = !!ownerName;
                          return (
                            <button
                              key={t._id}
                              type="button"
                              onClick={() => toggleTableSelection(t._id)}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                  : isOwnedByOther
                                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 opacity-70'
                                  : 'bg-white/5 border-white/10 text-text-muted hover:border-white/30 hover:text-white'
                              }`}
                            >
                              <p className="text-[10px] font-black">{t.label}</p>
                              {t.type === 'vip' && <p className="text-[8px] text-amber-400">VIP</p>}
                              {isSelected && <p className="text-[8px] text-green-400">✓ Selected</p>}
                              {isOwnedByOther && !isSelected && (
                                <p className="text-[8px] text-orange-400 truncate">{ownerName}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {selectedTableIds.length > 0 && (
                      <p className="text-[10px] text-green-400 font-bold">
                        {selectedTableIds.length} table{selectedTableIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                    {selectedTableIds.length === 0 && (
                      <p className="text-[10px] text-text-muted italic">No tables selected — this captain will handle Delivery & Pickup only.</p>
                    )}
                  </div>
                )}

                <details className="group">
                  <summary className="text-[10px] text-primary font-black uppercase tracking-widest cursor-pointer hover:text-primary/80 list-none flex items-center gap-2">
                    <Plus size={12} /> Additional Details (optional)
                  </summary>
                  <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      {[
                        { label: 'Date of Birth', field: 'dob', type: 'date' },
                        { label: 'Joining Date', field: 'joining_date', type: 'date' },
                        { label: 'City', field: 'city', type: 'text' },
                        { label: 'Salary ($)', field: 'salary', type: 'number' },
                      ].map(({ label, field, type }) => (
                        <div key={field}>
                          <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">{label}</label>
                          <input type={type} value={form[field]} onChange={sf(field)}
                            className="w-full bg-[#252525] border border-white/10 p-2.5 rounded-xl focus:border-primary outline-none text-white text-xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3.5 border border-white/20 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit"
                    className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                    <Save size={15} />{editTarget ? 'UPDATE STAFF' : 'CREATE STAFF'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff table */}
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          {/* Column Headers — hidden on mobile, shown md+ */}
          <div className="hidden md:flex items-center px-6 py-3 bg-white/3 border-b border-white/8">
            <div className="flex-1 min-w-0 text-[10px] font-black uppercase tracking-widest text-text-muted">Staff Member</div>
            <div className="w-[15%] text-[10px] font-black uppercase tracking-widest text-text-muted">Role</div>
            <div className="w-[15%] text-[10px] font-black uppercase tracking-widest text-text-muted">Mobile Number</div>
            <div className="w-[10%] text-[10px] font-black uppercase tracking-widest text-text-muted">Status</div>
            <div className="w-[10%] text-[10px] font-black uppercase tracking-widest text-text-muted">Availability</div>
            <div className="w-[120px] text-[10px] font-black uppercase tracking-widest text-text-muted text-right pr-1">Actions</div>
          </div>
          <div className="divide-y divide-white/5">
            {filteredStaff.map(u => {
              const assignedTables = u.role === 'captain'
                ? allTables.filter(t => (t.captain_id?._id || t.captain_id) === u._id)
                : [];
              return (
                <div key={u._id} className="flex flex-col md:flex-row md:items-center px-4 md:px-6 py-4 md:py-5 hover:bg-white/3 group gap-3 md:gap-0">
                  <button
                    onClick={() => onViewProfile && onViewProfile(u)}
                    className="flex items-center gap-4 flex-1 min-w-0 text-left"
                  >
                    <div className="w-11 h-11 rounded-full border border-primary/30 overflow-hidden shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{u.name}</p>
                      <p className="text-[10px] text-text-muted">{u.email}</p>
                      {u.role === 'captain' && (
                        <p className="text-[10px] text-green-400 mt-0.5">
                          {assignedTables.length > 0
                            ? `🪑 ${assignedTables.map(t => t.label).join(', ')}`
                            : '🚗 Delivery & Pickup'}
                        </p>
                      )}
                      {/* Mobile-only inline badges */}
                      <div className="flex items-center gap-2 mt-1.5 md:hidden flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${roleColor[u.role] || 'text-text-muted bg-white/5 border-white/10'}`}>{u.role}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${u.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{u.is_active ? 'Active' : 'Disabled'}</span>
                        {(() => { const onShift = activeShiftIds.has(String(u._id)); return <span className={`flex items-center gap-1 text-[9px] font-bold uppercase ${onShift ? 'text-green-400' : 'text-text-muted'}`}><span className={`w-1.5 h-1.5 rounded-full ${onShift ? 'bg-green-400' : 'bg-white/20'}`}/>{onShift ? 'On Shift' : 'Off Shift'}</span>; })()}
                        {u.phone && <span className="text-[9px] text-text-muted">📞 {u.phone}</span>}
                      </div>
                    </div>
                  </button>
                  {/* Desktop-only columns */}
                  <div className="hidden md:block w-[15%]">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${roleColor[u.role] || 'text-text-muted bg-white/5 border-white/10'}`}>{u.role}</span>
                  </div>
                  <div className="hidden md:block w-[15%] text-xs text-text-muted">{u.phone || '—'}</div>
                  <div className="hidden md:block w-[10%]">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase border ${u.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="hidden md:flex w-[10%] items-center gap-1.5">
                    {(() => { const onShift = activeShiftIds.has(String(u._id)); return (<>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${onShift ? 'bg-green-400 shadow-sm shadow-green-400/60 animate-pulse' : 'bg-white/20'}`} />
                      <span className={`text-[9px] font-bold uppercase ${onShift ? 'text-green-400' : 'text-text-muted'}`}>
                        {onShift ? 'On Shift' : 'Off Shift'}
                      </span>
                    </>); })()}
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                    {onViewProfile && (
                      <button onClick={() => onViewProfile(u)} className="p-1.5 md:p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all" title="View Profile">
                        <Eye size={13} />
                      </button>
                    )}
                    <button onClick={() => openEdit(u)} className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all" title="Edit"><Edit2 size={13} /></button>
                    <button onClick={() => toggleActive(u)}
                      className={`p-2 rounded-lg transition-all ${u.is_active ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white'}`}
                      title={u.is_active ? 'Disable' : 'Enable'}>
                      {u.is_active ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                    </button>
                    {currentUserRole === 'owner' && (
                      <button onClick={() => setDelConfirm(u)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Delete"><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredStaff.length === 0 && (
              <div className="py-16 text-center text-text-muted">
                <Users size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No staff found for this role</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {delConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-secondary rounded-3xl border border-white/10 p-6 md:p-10 max-w-md w-full mx-4 sm:mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={28} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-white">Remove Staff?</h3>
                <p className="text-text-muted text-sm">This will permanently remove <span className="text-white font-bold">{delConfirm.name}</span> ({delConfirm.role}).</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setDelConfirm(null)} className="flex-1 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5">Cancel</button>
                <button onClick={() => handleDelete(delConfirm._id)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate email popup */}
      <AnimatePresence>
        {dupEmailAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-secondary rounded-3xl border border-yellow-500/30 p-6 md:p-10 max-w-md w-full mx-4 sm:mx-auto text-center space-y-5">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto border border-yellow-500/20">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-xl font-black mb-2 text-white">Email Already Registered</h3>
                <p className="text-text-muted text-sm mb-4">This email address is already in use by an existing staff member:</p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Name</span>
                    <span className="text-sm font-black text-white">{dupEmailAlert.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Role</span>
                    <span className={`text-sm font-black capitalize ${roleColor[dupEmailAlert.role]?.split(' ')[0] || 'text-primary'}`}>{dupEmailAlert.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Email</span>
                    <span className="text-xs font-bold text-yellow-400">{dupEmailAlert.email}</span>
                  </div>
                </div>
                <p className="text-white/40 text-xs mt-4">Please use a different email address to add this staff member.</p>
              </div>
              <button onClick={() => setDupEmailAlert(null)}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                OK, Use Different Email
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const LeaveModule = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [form, setForm] = useState({ from_date: '', to_date: '', leave_type: 'casual', reason: '' });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const isStaff = ['captain', 'chef'].includes(user.role);
  const isManager = user.role === 'manager';
  const isOwner = user.role === 'owner';
  const canApprove = isManager || isOwner;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await leavesAPI.getAll();
      setLeaves(res.data || []);
    } catch { setLeaves([]); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await leavesAPI.apply(form);
      flash('Leave application submitted!');
      setShowForm(false);
      setForm({ from_date: '', to_date: '', leave_type: 'casual', reason: '' });
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleApprove = async (id, status, remarks = '') => {
    try {
      await leavesAPI.updateStatus(id, { status, remarks });
      flash(`Leave ${status}!`);
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const [leaveDelConfirm, setLeaveDelConfirm] = useState(null);
  const handleDelete = async (id) => {
    setLeaveDelConfirm(null);
    try { await leavesAPI.delete(id); flash('Leave request cancelled'); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const statusColors = {
    pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const typeColors = {
    casual: 'text-blue-400', sick: 'text-red-400', emergency: 'text-orange-400',
    annual: 'text-purple-400', unpaid: 'text-gray-400',
  };

  // Permission check: can this user approve THIS leave?
  // leave.role is stored at creation time; fall back to leave.user_id?.role if populated
  const canApproveLeave = (leave) => {
    const leaveRole = leave.role || leave.user_id?.role || '';
    if (isOwner) return true;                                                   // owner approves all
    if (isManager) return ['captain', 'chef'].includes(leaveRole);              // manager approves captain/chef only
    return false;
  };

  // Stats
  const pending  = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;
  const myLeaves = leaves.filter(l => String(l.user_id?._id || l.user_id) === String(user._id));

  // Active filter for stat card clicks
  const [filterStatus, setFilterStatus] = useState('all');
  const displayedLeaves = filterStatus === 'all'
    ? leaves
    : filterStatus === 'mine'
      ? leaves.filter(l => String(l.user_id?._id || l.user_id) === String(user._id))
      : leaves.filter(l => l.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Briefcase size={28} className="text-primary" />Leave Module</h2>
          <p className="text-text-muted text-sm mt-1">
            {isStaff ? 'Apply and track your leave requests' : 'Manage and approve leave applications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
          {!isOwner && (
            <button onClick={() => setShowForm(s => !s)}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
              <Plus size={14} /> Apply Leave
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Stats — 4 tabs: Pending / Approved / Rejected / Mine */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
        {[
          { label: 'Pending',          value: pending,         color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', filter: 'pending'  },
          { label: 'Approved',         value: approved,        color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  filter: 'approved' },
          { label: 'Rejected',         value: rejected,        color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    filter: 'rejected' },
          { label: 'My Applications',  value: myLeaves.length, color: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/20',    filter: 'mine'     },
        ].map(({ label, value, color, bg, border, filter }) => {
          const isActive = filterStatus === filter;
          return (
            <button
              key={label}
              onClick={() => setFilterStatus(isActive ? 'all' : filter)}
              className={`${bg} rounded-2xl border p-5 text-center transition-all hover:scale-[1.03] active:scale-100 cursor-pointer ${isActive ? `${border} ring-2 ring-offset-1 ring-offset-bg-main ${border.replace('border-', 'ring-')}` : 'border-white/5'}`}
            >
              <p className={`text-2xl md:text-3xl font-black ${color}`}>{value}</p>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1">{label}</p>
              {isActive && <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${color} opacity-70`}>● Filtered</p>}
            </button>
          );
        })}
      </div>

      {/* Apply Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-secondary/40 rounded-3xl border border-primary/30 p-4 md:p-8">
            <h3 className="text-lg font-bold mb-6 text-white">New Leave Application</h3>
            <form onSubmit={handleApply} className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">From Date *</label>
                <input type="date" required value={form.from_date}
                  style={{ colorScheme: 'dark' }}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    const newFrom = e.target.value;
                    setForm(p => ({
                      ...p,
                      from_date: newFrom,
                      // Auto-reset to_date if it would be before from_date
                      to_date: (p.to_date && p.to_date < newFrom) ? newFrom : p.to_date,
                    }));
                  }}
                  className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">To Date *</label>
                <input type="date" required value={form.to_date}
                  style={{ colorScheme: 'dark' }}
                  min={form.from_date || new Date().toISOString().split('T')[0]}
                  onChange={sf('to_date')}
                  className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Leave Type</label>
                <select value={form.leave_type} onChange={sf('leave_type')}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm appearance-none">
                  {['casual', 'sick', 'emergency', 'annual', 'unpaid'].map(t => (
                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Reason *</label>
                <textarea required value={form.reason} onChange={sf('reason')} rows={1}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm resize-none" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">Submit</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaves List */}
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="space-y-3">
          {filterStatus !== 'all' && (
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Showing: <span className="text-white capitalize">{filterStatus}</span> ({displayedLeaves.length})
              </span>
              <button onClick={() => setFilterStatus('all')} className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline">
                Clear Filter ✕
              </button>
            </div>
          )}
          {displayedLeaves.length === 0 ? (
            <div className="py-20 text-center text-text-muted bg-secondary/40 rounded-3xl border border-white/5">
              <Briefcase size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No {filterStatus === 'all' ? '' : filterStatus} leave applications</p>
            </div>
          ) : (
            displayedLeaves.map(l => (
              <div key={l._id} className="bg-secondary/40 rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${l.user_id?.name || l._id}`} alt="" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{l.user_id?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-text-muted uppercase font-bold">{l.user_id?.role || l.role}</span>
                        <span className="text-[10px] text-text-muted">·</span>
                        <span className={`text-[10px] font-bold uppercase ${typeColors[l.leave_type] || 'text-text-muted'}`}>{l.leave_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${statusColors[l.status]}`}>{l.status}</span>
                    {canApprove && canApproveLeave(l) && l.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(l._id, 'approved')}
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 text-[10px] font-black rounded-lg hover:bg-green-500 hover:text-white transition-all flex items-center gap-1">
                          <CheckCircle size={11} /> Approve
                        </button>
                        <button onClick={() => handleApprove(l._id, 'rejected')}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 text-[10px] font-black rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center gap-1">
                          <XCircle size={11} /> Reject
                        </button>
                      </>
                    )}
                    {String(l.user_id?._id || l.user_id) === String(user._id) && l.status === 'pending' && (
                      <button onClick={() => handleDelete(l._id)}
                        className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[9px] text-text-muted uppercase font-bold mb-1">Period</p>
                    <p className="text-xs font-bold text-white">
                      {new Date(l.from_date).toLocaleDateString()} → {new Date(l.to_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[9px] text-text-muted uppercase font-bold mb-1">Days</p>
                    <p className="text-xs font-bold text-primary">{l.days} day{l.days !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-[9px] text-text-muted uppercase font-bold mb-1">Applied</p>
                    <p className="text-xs font-bold text-white">{new Date(l.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3 bg-white/5 rounded-xl p-3">
                  <p className="text-[9px] text-text-muted uppercase font-bold mb-1">Reason</p>
                  <p className="text-xs text-white/80">{l.reason}</p>
                </div>
                {l.approved_by && (
                  <div className="mt-2 text-[10px] text-text-muted">
                    {l.status === 'approved' ? '✓ Approved' : '✗ Rejected'} by {l.approved_by?.name} · {l.approved_at ? new Date(l.approved_at).toLocaleDateString() : ''}
                    {l.remarks && <span> · "{l.remarks}"</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      <ConfirmDialog
        open={!!leaveDelConfirm}
        title="Cancel Leave Request?"
        message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmText="Yes, Cancel Leave"
        onCancel={() => setLeaveDelConfirm(null)}
        onConfirm={() => handleDelete(leaveDelConfirm)}
      />
    </div>
  );
};

// ─── CATERING PANEL (Owner/Manager) ──────────────────────────────────────────
const CateringPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [selected,       setSelected]       = useState(null);
  const [priceForm,      setPriceForm]      = useState('');
  const [quotationMsg,   setQuotationMsg]   = useState('');
  const [sendingQuote,   setSendingQuote]   = useState(false);
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [catCancelConfirm, setCatCancelConfirm] = useState(null); // { id, name }
  const [showNewForm,    setShowNewForm]    = useState(false);
  const [newForm,        setNewForm]        = useState({
    customer_name: '', email: '', phone: '',
    event_type: 'Wedding', event_date: '', delivery_time: '',
    guest_count: '', venue: '', budget: '', notes: '',
  });
  const [savingNew, setSavingNew] = useState(false);
  const snf = f => e => setNewForm(p => ({ ...p, [f]: e.target.value }));

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const res = await cateringAPI.getAll(); setOrders(res.data || []); }
    catch { setOrders([]); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 30000);
  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  // ── 48-hour upcoming catering alert ───────────────────────────────────────
  const now48         = new Date();
  const cutoff48      = new Date(now48.getTime() + 48 * 60 * 60 * 1000);
  const upcomingOrders = orders.filter(o => {
    if (!o.event_date) return false;
    if (o.status === 'cancelled' || o.status === 'completed') return false;
    const evtDate = new Date(o.event_date);
    return evtDate >= now48 && evtDate <= cutoff48;
  });

  // Auto-flash notification when upcoming events exist (once per load)
  const [notifiedUpcoming, setNotifiedUpcoming] = useState(false);
  useEffect(() => {
    if (!notifiedUpcoming && upcomingOrders.length > 0) {
      flash(`⚠️ ${upcomingOrders.length} catering event${upcomingOrders.length > 1 ? 's' : ''} happening within 48 hours — review now!`, 'error');
      setNotifiedUpcoming(true);
    }
  }, [upcomingOrders.length]);

  const updateStatus = async (id, status) => {
    // Enforce: cannot confirm without a quotation
    if (status === 'confirmed') {
      const order = orders.find(o => o._id === id);
      if (!order?.total_price && !order?.quotation_message) {
        flash('Send a quotation email first before confirming this catering order.', 'error');
        return;
      }
    }
    // Cancel → show confirmation popup instead of direct action
    if (status === 'cancelled') {
      const order = orders.find(o => o._id === id);
      setCatCancelConfirm({ id, name: order?.customer_name || 'this order' });
      return;
    }
    try { await cateringAPI.updateStatus(id, status); flash(`Status updated to ${status}`); load(); }
    catch (err) { flash(err.message || 'Failed to update status', 'error'); }
  };

  const confirmCatCancel = async () => {
    if (!catCancelConfirm) return;
    const { id } = catCancelConfirm;
    setCatCancelConfirm(null);
    try { await cateringAPI.updateStatus(id, 'cancelled'); flash('Order cancelled — sorry message sent to customer.'); load(); }
    catch (err) { flash(err.message || 'Failed to cancel', 'error'); }
  };

  const handleNewOrder = async (e) => {
    e.preventDefault();
    if (!newForm.customer_name.trim() || !newForm.event_date || !newForm.guest_count) {
      flash('Name, event date, and guest count are required.', 'error'); return;
    }
    setSavingNew(true);
    try {
      await cateringAPI.create({ ...newForm, guest_count: Number(newForm.guest_count), status: 'pending' });
      flash('New catering order created!');
      setShowNewForm(false);
      setNewForm({ customer_name: '', email: '', phone: '', event_type: 'Wedding', event_date: '', delivery_time: '', guest_count: '', venue: '', budget: '', notes: '' });
      load();
    } catch (err) { flash(err.message || 'Failed to create order', 'error'); }
    finally { setSavingNew(false); }
  };

  const handleSendQuotation = async (id) => {
    const price = parseFloat(priceForm);
    if (!price || price <= 0) { flash('Enter a valid price', 'error'); return; }
    setSendingQuote(true);
    try {
      await cateringAPI.sendQuotation(id, { total_price: price, quotation_message: quotationMsg, status: 'confirmed' });
      flash('Quotation sent to customer email! Order confirmed.');
      setPriceForm(''); setQuotationMsg(''); setSelected(null);
      load();
    } catch (err) { flash(err.message || 'Failed to send quotation', 'error'); }
    finally { setSendingQuote(false); }
  };

  const deleteOrder = async (id) => {
    try { await cateringAPI.delete(id); flash('Order deleted'); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const statusColors = {
    pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const totalRevenue = orders.filter(o => o.status === 'confirmed' || o.status === 'completed')
    .reduce((a, o) => a + (o.total_price || 0), 0);

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Utensils size={28} className="text-primary" />Catering Orders</h2>
          <p className="text-text-muted text-sm mt-1">{orders.length} total orders · ${totalRevenue.toLocaleString()} confirmed revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowNewForm(s => !s)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
            <Plus size={14} /> New Catering Order
          </button>
        </div>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* ── New Catering Order Form ── */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-secondary/40 border border-primary/30 rounded-3xl p-6 space-y-5">
            <h3 className="text-lg font-black text-white flex items-center gap-2"><Utensils size={18} className="text-primary" /> New Catering Order</h3>
            <form onSubmit={handleNewOrder} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Customer Name *</label>
                <input required value={newForm.customer_name} onChange={snf('customer_name')} placeholder="Full name"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Email</label>
                <input type="email" value={newForm.email} onChange={snf('email')} placeholder="customer@email.com"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Phone</label>
                <input type="tel" value={newForm.phone} onChange={snf('phone')} placeholder="+91 98765 43210"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Event Type</label>
                <select value={newForm.event_type} onChange={snf('event_type')}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none appearance-none">
                  {['Wedding','Birthday','Corporate','Anniversary','Engagement','Festival','Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Event Date *</label>
                <input type="date" required value={newForm.event_date} onChange={snf('event_date')}
                  min={new Date().toISOString().split('T')[0]} style={{ colorScheme: 'dark' }}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Delivery Time</label>
                <input type="time" value={newForm.delivery_time} onChange={snf('delivery_time')} style={{ colorScheme: 'dark' }}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Guest Count *</label>
                <input type="number" required min="1" value={newForm.guest_count} onChange={snf('guest_count')} placeholder="e.g. 150"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Venue</label>
                <input value={newForm.venue} onChange={snf('venue')} placeholder="Event hall or address"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Customer Budget ($)</label>
                <input type="number" min="0" value={newForm.budget} onChange={snf('budget')} placeholder="e.g. 5000"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none" />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1.5 block">Notes / Special Requests</label>
                <textarea value={newForm.notes} onChange={snf('notes')} rows={2} placeholder="Menu preferences, dietary requirements, special arrangements…"
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl text-sm text-white focus:border-primary outline-none resize-none" />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex gap-3">
                <button type="submit" disabled={savingNew}
                  className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2 transition-all">
                  {savingNew ? <><RefreshCw size={13} className="animate-spin" /> Saving…</> : <><Plus size={13} /> Create Order</>}
                </button>
                <button type="button" onClick={() => setShowNewForm(false)}
                  className="px-8 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 48-Hour Upcoming Catering Alert Container ───────────────────── */}
      {upcomingOrders.length > 0 && (
        <div className="rounded-3xl border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-orange-500/15 border-b border-orange-500/30">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-orange-400">Happening Within 48 Hours</p>
                <p className="text-[10px] text-orange-400/60 font-bold">Action required — ensure all preparations are confirmed</p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-orange-500 text-white text-[11px] font-black rounded-full uppercase tracking-widest animate-pulse">
              {upcomingOrders.length} Alert{upcomingOrders.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Upcoming order cards */}
          <div className="p-4 space-y-3">
            {upcomingOrders.map(o => {
              const evtDate    = new Date(o.event_date);
              const hoursLeft  = Math.max(0, Math.round((evtDate - new Date()) / (1000 * 60 * 60)));
              const minsLeft   = Math.max(0, Math.round((evtDate - new Date()) / (1000 * 60)));
              const isToday    = evtDate.toDateString() === new Date().toDateString();
              const isTomorrow = evtDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              const dayLabel   = isToday ? '🔴 TODAY' : isTomorrow ? '🟡 TOMORROW' : '🟢 UPCOMING';
              const urgencyColor = isToday
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-yellow-500/30 bg-yellow-500/5';

              return (
                <div key={o._id} className={`rounded-2xl border p-4 ${urgencyColor}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Name + day badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${isToday ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                          {dayLabel}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                          o.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>{o.status}</span>
                        <h4 className="text-sm font-black text-white">{o.contact_name || o.customer_name}</h4>
                      </div>

                      {/* Key details row */}
                      <div className="flex flex-wrap gap-3 text-[11px]">
                        <span className="text-text-muted">🍽 <span className="text-white font-bold">{o.event_type || 'Catering'}</span></span>
                        <span className="text-text-muted">👥 <span className="text-white font-bold">{o.guest_count || o.guests || '—'} guests</span></span>
                        {(o.email || o.contact_email) && (
                          <span className="text-text-muted">📧 <span className="text-white/70">{o.email || o.contact_email}</span></span>
                        )}
                        {(o.phone || o.contact_phone) && (
                          <span className="text-text-muted">📞 <span className="text-white/70">{o.phone || o.contact_phone}</span></span>
                        )}
                      </div>
                    </div>

                    {/* Countdown timer */}
                    <div className={`text-center px-4 py-3 rounded-2xl shrink-0 ${isToday ? 'bg-red-500/15 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                      <p className={`text-2xl font-black ${isToday ? 'text-red-400' : 'text-yellow-400'}`}>
                        {hoursLeft < 1 ? `${minsLeft}m` : `${hoursLeft}h`}
                      </p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-red-400/60' : 'text-yellow-400/60'}`}>
                        {hoursLeft < 1 ? 'minutes' : 'hours'} left
                      </p>
                      <p className="text-[9px] text-text-muted mt-1">
                        {evtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Quote status warning */}
                  {o.status === 'pending' && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <span className="text-red-400 text-xs">⚠</span>
                      <p className="text-[11px] text-red-400 font-bold">No quotation sent yet — send quotation immediately!</p>
                    </div>
                  )}
                  {o.status === 'confirmed' && o.total_price > 0 && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                      <span className="text-green-400 text-xs">✓</span>
                      <p className="text-[11px] text-green-400 font-bold">Confirmed · ${Number(o.total_price).toLocaleString()} · Ensure kitchen & staff are prepped.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {['pending', 'confirmed', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={`rounded-2xl border p-4 text-center transition-all ${filterStatus === s ? 'ring-2 ring-primary' : ''} ${statusColors[s] || 'bg-white/5 border-white/10'}`}>
            <p className="text-2xl font-black">{orders.filter(o => o.status === s).length}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest mt-1 capitalize">{s}</p>
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-text-muted bg-secondary/40 rounded-3xl border border-white/5">
              <Utensils size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No {filterStatus !== 'all' ? filterStatus : ''} catering orders</p>
            </div>
          ) : filtered.map(o => (
            <div key={o._id} className="bg-secondary/40 rounded-2xl border border-white/5 hover:border-primary/20 transition-all overflow-hidden">
              {/* Header */}
              <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-3">

                  {/* Name + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">{o.contact_name || o.customer_name}</h3>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${statusColors[o.status] || 'bg-white/5 border-white/10 text-text-muted'}`}>{o.status}</span>
                    {o.total_price > 0 && <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">✓ Quoted: ${Number(o.total_price).toLocaleString()}</span>}
                  </div>

                  {/* Event info grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: 'Event Type', value: o.event_type || '—' },
                      { label: 'Event Date', value: o.event_date ? new Date(o.event_date).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}) : '—' },
                      { label: 'Guests', value: o.guest_count || o.guests || '—' },
                      { label: 'Final Quote', value: o.total_price > 0 ? `$${Number(o.total_price).toLocaleString()}` : 'Pending', highlight: o.total_price > 0 },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className={`rounded-xl p-2.5 ${highlight ? 'bg-primary/10 border border-primary/20' : 'bg-white/5'}`}>
                        <p className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-0.5">{label}</p>
                        <p className={`font-black text-sm ${highlight ? 'text-primary' : 'text-white'}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Contact */}
                  {(o.email || o.contact_email) && (
                    <p className="text-[11px] text-text-muted">
                      📧 {o.email || o.contact_email}
                      {(o.phone || o.contact_phone) && <span> · 📞 {o.phone || o.contact_phone}</span>}
                    </p>
                  )}

                  {/* ── Menu Selection ── */}
                  {o.menu_selection && (() => {
                    const raw = o.menu_selection || '';
                    const isPkg = raw.startsWith('Package:');
                    let pkgName = '', items = [];
                    if (isPkg) {
                      const parts = raw.split('|');
                      pkgName = parts[0]?.replace('Package:', '').trim();
                      items = (parts[1]?.replace('Items:', '').trim() || '').split(',').map(s => s.trim()).filter(Boolean);
                    } else {
                      items = raw.replace('Custom Menu:', '').trim().split(',').map(s => s.trim()).filter(Boolean);
                    }
                    return (
                      <div className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
                            {isPkg ? '📦 Package' : '🍽 Custom Menu'}
                          </p>
                          {isPkg && pkgName && (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20">{pkgName}</span>
                          )}
                        </div>
                        {items.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((item, idx) => (
                              <span key={idx} className="text-[10px] px-2.5 py-1 bg-white/8 border border-white/10 rounded-full text-white/80 font-bold">{item}</span>
                            ))}
                          </div>
                        )}
                        {o.quote_value > 0 && (
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <p className="text-[10px] text-text-muted font-bold">Customer Budget Estimate</p>
                            <div className="text-right">
                              <p className="text-sm font-black text-yellow-400">${Number(o.quote_value).toLocaleString()}</p>
                              {(o.guest_count || o.guests) > 0 && (
                                <p className="text-[10px] text-text-muted">${(o.quote_value / Number(o.guest_count || o.guests)).toFixed(2)} / guest</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Notes */}
                  {o.notes && (
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-0.5">Customer Notes</p>
                      <p className="text-xs text-white/70 italic">"{o.notes}"</p>
                    </div>
                  )}
                  {o.quotation_message && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-0.5">Quotation Note Sent</p>
                      <p className="text-xs text-white/70">{o.quotation_message}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {o.status === 'pending' && (
                    <>
                      <button onClick={() => { setSelected(selected === o._id ? null : o._id); if (selected !== o._id && o.quote_value > 0) setPriceForm(String(o.quote_value)); }}
                        className="px-3 py-2 bg-primary/20 text-primary text-[10px] font-black rounded-xl hover:bg-primary hover:text-white transition-all">
                        ✉ Send Quotation
                      </button>
                      <button onClick={() => updateStatus(o._id, 'confirmed')}
                        disabled={!o.total_price && !o.quotation_message}
                        title={!o.total_price ? 'Send quotation first' : 'Confirm'}
                        className="px-3 py-2 bg-green-500/20 text-green-400 text-[10px] font-black rounded-xl hover:bg-green-500 hover:text-white disabled:opacity-40 transition-all">
                        {o.total_price ? '✓ Confirm' : '⚠ Needs Quote'}
                      </button>
                    </>
                  )}
                  {o.status === 'confirmed' && (
                    <button onClick={() => updateStatus(o._id, 'completed')}
                      className="px-3 py-2 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                      ✓ Complete
                    </button>
                  )}
                  {o.status !== 'cancelled' && o.status !== 'completed' && (
                    <button onClick={() => updateStatus(o._id, 'cancelled')}
                      className="px-3 py-2 bg-red-500/10 text-red-400 text-[10px] font-black rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      ✕ Cancel
                    </button>
                  )}
                  <button onClick={() => deleteOrder(o._id)}
                    className="px-3 py-2 bg-white/5 text-text-muted text-[10px] font-black rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all">
                    Delete
                  </button>
                </div>
              </div>

              {/* ── Quotation Form ── */}
              {selected === o._id && (
                <div className="px-5 pb-5 border-t border-primary/20 pt-4 bg-primary/5 space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">✉ Quotation Details — Sent to Customer & Confirms Order</p>

                  {/* Summary row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 bg-white/5 rounded-2xl p-4">
                    <div>
                      <p className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Guests</p>
                      <p className="text-xl font-black text-white">{o.guest_count || o.guests || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Cust. Estimate</p>
                      <p className="text-xl font-black text-yellow-400">{o.quote_value > 0 ? `$${Number(o.quote_value).toLocaleString()}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1">Est. Per Head</p>
                      <p className="text-xl font-black text-green-400">
                        {o.quote_value > 0 && (o.guest_count || o.guests) > 0
                          ? `$${(o.quote_value / Number(o.guest_count || o.guests)).toFixed(2)}`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">
                        Your Quote ($) *
                        {o.quote_value > 0 && <span className="text-yellow-400 normal-case font-normal ml-1">· customer estimated ${Number(o.quote_value).toLocaleString()}</span>}
                      </label>
                      <input type="number" value={priceForm} onChange={e => setPriceForm(e.target.value)}
                        placeholder={o.quote_value ? String(o.quote_value) : 'e.g. 2500'}
                        className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl focus:border-primary outline-none text-white text-sm" />
                      {priceForm && Number(o.guest_count || o.guests) > 0 && (
                        <p className="text-[10px] text-primary font-bold mt-1">
                          = ${(Number(priceForm) / Number(o.guest_count || o.guests)).toFixed(2)} per guest
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Message to Customer</label>
                      <textarea value={quotationMsg} onChange={e => setQuotationMsg(e.target.value)} rows={3}
                        placeholder="e.g. Includes serving staff, cutlery, setup…"
                        className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl focus:border-primary outline-none text-white text-sm resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSendQuotation(o._id)} disabled={sendingQuote}
                      className="px-5 py-2 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-all">
                      {sendingQuote ? 'Sending…' : '✓ Send Quotation & Confirm'}
                    </button>
                    <button onClick={() => { setSelected(null); setPriceForm(''); setQuotationMsg(''); }}
                      className="px-4 py-2 border border-white/20 text-text-muted text-xs font-black rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {catCancelConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
              className="bg-secondary rounded-3xl border border-red-500/30 p-8 max-w-sm w-full mx-auto text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">😔</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-2">Cancel Catering Order?</h3>
                <p className="text-white/50 text-sm mb-1">Cancelling <span className="text-white font-bold">{catCancelConfirm.name}</span>'s order will:</p>
                <div className="text-left bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-red-400 flex items-center gap-2">✕ Mark the order as cancelled</p>
                  <p className="text-xs text-red-400 flex items-center gap-2">✉ Send a sincere apology email to the customer</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCatCancelConfirm(null)}
                  className="flex-1 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Keep Order
                </button>
                <button onClick={confirmCatCancel}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                  Cancel & Apologise
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
const PasswordField = ({ value, onChange, placeholder, required }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full bg-[#252525] border border-white/10 p-3.5 pr-12 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
        <Eye size={16} />
      </button>
    </div>
  );
};

// ─── MENU MASTER ─────────────────────────────────────────────────────────────
const MenuMaster = ({ menu: ctxMenu, updateMenuStock, toggleMenuAvailability, ingredients, updateIngredientStock }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'Biryani', price: '', description: '',
    spice_level: 1, is_veg: false, is_halal: true,
    stock: 100,
  });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const sb = f => e => setForm(p => ({ ...p, [f]: e.target.checked }));

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  // Sync from context
  useEffect(() => { setMenuItems(ctxMenu || []); }, [ctxMenu]);

  const categories = ['Appetizers', 'Beverages', 'Biryani', 'Curries', 'Desserts', 'Dosa', 'Pulao', 'Street Style', 'Tiffins'];

  const filtered = menuItems.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || (item.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || item.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', category: 'Biryani', price: '', description: '', spice_level: 1, is_veg: false, is_halal: true, stock: 100 });
    setShowAddModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, category: item.category, price: item.price,
      description: item.description || '', spice_level: item.spice_level ?? 1,
      is_veg: item.is_veg || false, is_halal: item.is_halal !== false,
      stock: item.stock || 100,
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), spice_level: Number(form.spice_level), stock: Number(form.stock) };
      if (editItem) {
        await menuAPI.update(editItem._id || editItem.id, payload);
        flash('Item updated!');
      } else {
        await menuAPI.create(payload);
        flash('Item added to menu!');
      }
      setShowAddModal(false);
      // Refresh via API
      const res = await menuAPI.getAll();
      setMenuItems(res.data || []);
    } catch (err) { flash(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const [menuDelConfirm, setMenuDelConfirm] = useState(null);
  const handleDeleteClick = (id) => setMenuDelConfirm(id);
  const handleDelete = async (id) => {
    setMenuDelConfirm(null);
    try {
      await menuAPI.delete(id);
      setMenuItems(prev => prev.filter(i => (i._id || i.id) !== id));
      flash('Item removed');
    } catch (err) { flash(err.message, 'error'); }
  };

  const spiceLabel = { 1: '🌶', 2: '🌶🌶', 3: '🌶🌶🌶' };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><FileText size={28} className="text-primary" />Menu Master</h2>
          <p className="text-text-muted text-sm mt-1">{menuItems.length} items · {filtered.length} shown</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
          <Plus size={14} /> Add Item
        </button>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Search + category filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text" placeholder="Search items by name or category…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary/40 border border-white/10 pl-10 pr-4 py-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-white/5 p-1.5 rounded-xl border border-white/5 overflow-x-auto">
          {['all', ...categories].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${catFilter === c ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(item => {
          const id = item._id || item.id;
          const avail = item.is_available ?? item.available ?? true;
          return (
            <div key={id} className="p-5 bg-secondary/40 border border-white/10 rounded-2xl hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                  <h4 className="font-bold text-white truncate">{item.name}</h4>
                  <p className="text-[10px] text-text-muted mt-0.5">{item.category}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${avail ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {avail ? 'Available' : 'Off Menu'}
                  </span>
                  {item.is_veg
                    ? <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-700/30 text-green-500 border border-green-700/40"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />VEG</span>
                    : <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-700/30 text-orange-400 border border-orange-700/40"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />NON-VEG</span>
                  }
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-lg font-black text-primary">${(item.price || 0).toFixed(0)}</p>
                <span className="text-sm">{spiceLabel[item.spice_level] || '🌶'}</span>
                {item.description && <p className="text-xs text-text-muted mb-3 line-clamp-2">{item.description}</p>}
              </div>
              {item.description && <p className="text-xs text-text-muted mb-3 line-clamp-2">{item.description}</p>}
              <div className="flex gap-2 mt-1">
                <button onClick={() => toggleMenuAvailability(id)}
                  className={`flex-1 py-2 border text-xs font-black uppercase rounded-lg transition-all
                    ${avail
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                      : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'}`}>
                  {avail ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => openEdit(item)}
                  className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDeleteClick(id)}
                  title="Delete menu item"
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-text-muted">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm uppercase tracking-widest">{search ? 'No items match your search' : 'No menu items yet'}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-3xl border border-white/10 w-full max-w-lg shadow-2xl my-4">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-black text-white">{editItem ? 'Edit Menu Item' : 'Add New Item'}</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Item Name *</label>
                    <input required type="text" value={form.name} onChange={sf('name')} placeholder="e.g. Chicken Biryani"
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Category *</label>
                    <select required value={form.category} onChange={sf('category')}
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Price ($) *</label>
                    <input required type="number" min="0" step="0.5" value={form.price} onChange={sf('price')} placeholder="0.00"
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Spice Level</label>
                    <select value={form.spice_level} onChange={sf('spice_level')}
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm">
                      <option value={0}>🇺🇸 American Spice (No Heat)</option>
                      <option value={1}>🌶 Mild</option>
                      <option value={2}>🌶🌶 Medium</option>
                      <option value={3}>🌶🌶🌶 Hot</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Description</label>
                    <textarea value={form.description} onChange={sf('description')} rows={2} placeholder="Short description..."
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      {/* Veg / Non-Veg radio buttons */}
                      <button type="button" onClick={() => setForm(p => ({ ...p, is_veg: true, is_halal: false }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black transition-all ${form.is_veg ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-text-muted hover:text-green-400'}`}>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" /> VEG
                      </button>
                      <button type="button" onClick={() => setForm(p => ({ ...p, is_veg: false }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black transition-all ${!form.is_veg ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-text-muted hover:text-orange-400'}`}>
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" /> NON-VEG
                      </button>
                    </label>
                    {!form.is_veg && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_halal} onChange={sb('is_halal')} className="w-4 h-4 rounded accent-primary" />
                        <span className="text-sm text-white font-bold">Halal</span>
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3.5 border border-white/20 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
                    {editItem ? 'UPDATE ITEM' : 'ADD ITEM'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ingredient Manager */}
      <IngredientManager ingredients={ingredients} updateIngredientStock={updateIngredientStock} />

      {/* Waste Management */}
      <WasteManagement ingredients={ingredients} />

      <ConfirmDialog
        open={!!menuDelConfirm}
        title="Remove Menu Item?"
        message="Are you sure you want to remove this menu item? This action cannot be undone."
        confirmText="Remove Item"
        onCancel={() => setMenuDelConfirm(null)}
        onConfirm={() => handleDelete(menuDelConfirm)}
      />
    </div>
  );
};

// ─── WASTE MANAGEMENT ─────────────────────────────────────────────────────────
const WasteManagement = ({ ingredients }) => {
  const [entries, setEntries] = useState([]);
  const [wasteType, setWasteType] = useState('ingredients'); // 'ingredients' | 'food_items'
  const [menuItems, setMenuItems] = useState([]);
  const [form, setForm] = useState({ ingredient_id: '', quantity: '', reason: 'spoilage', notes: '', waste_date: '' });
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [wasteLoading, setWasteLoading] = useState(true);
  const [wasteFilter, setWasteFilter] = useState('all'); // 'all' | 'ingredient' | 'menu_item'

  const loadWaste = useCallback(async () => {
    setWasteLoading(true);
    try { const r = await wasteAPI.getAll(); setEntries(r.data || []); }
    catch {} finally { setWasteLoading(false); }
  }, []);

  useEffect(() => {
    loadWaste();
    menuAPI.getAll().then(r => setMenuItems(r.data || [])).catch(() => {});
  }, [loadWaste]);

  const REASONS = ['spoilage', 'overcooking', 'expiry', 'spillage', 'quality_reject', 'other'];

  const flash = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    let item_name, unit, unit_cost_at_time, ingredient_id, menu_item_id, item_type;
    if (wasteType === 'ingredients') {
      const ing = ingredients.find(i => (i._id || i.id) === form.ingredient_id);
      if (!ing) return;
      item_name = ing.name; unit = ing.unit;
      unit_cost_at_time = ing.unit_cost || ing.unitCost || 0;
      ingredient_id = ing._id || ing.id; item_type = 'ingredient';
    } else { // food_items
      const mi = menuItems.find(i => (i._id || i.id) === form.ingredient_id);
      if (!mi) return;
      item_name = mi.name; unit = 'pcs';
      unit_cost_at_time = mi.price || 0;
      menu_item_id = mi._id || mi.id; item_type = 'menu_item';
    }
    try {
      await wasteAPI.create({
        ingredient_id, menu_item_id, item_type, item_name,
        quantity_wasted: Number(form.quantity), unit,
        unit_cost_at_time, reason: form.reason, notes: form.notes,
        waste_date: form.waste_date || new Date().toISOString(),
      });
      setForm({ ingredient_id: '', quantity: '', reason: 'spoilage', notes: '', waste_date: '' });
      setShowForm(false);
      flash(`Waste logged: ${item_name} — ${form.quantity} ${unit}`);
      loadWaste();
    } catch (err) { flash('Failed to log waste: ' + (err.message || 'Error'), 'error'); }
  };

  const handleDelete = async (id) => {
    try { await wasteAPI.delete(id); setEntries(prev => prev.filter(e => (e._id||e.id) !== id)); flash('Entry deleted'); }
    catch (err) { flash('Delete failed: ' + (err.message || 'Error'), 'error'); }
  };

  const filteredEntries = wasteFilter === 'all' ? entries : entries.filter(e => (e.item_type || 'ingredient') === wasteFilter);
  const totalCost = filteredEntries.reduce((s, e) => s + (e.total_loss || e.cost || 0), 0);
  const byReason = REASONS.map(r => ({ reason: r, count: filteredEntries.filter(e => e.reason === r).length, cost: filteredEntries.filter(e => e.reason === r).reduce((s, e) => s + (e.total_loss || e.cost || 0), 0) })).filter(r => r.count > 0);

  return (
    <div className="space-y-6 mt-10 pt-8 border-t border-white/5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trash2 size={20} className="text-red-400" />Waste Management
          </h3>
          <p className="text-text-muted text-sm mt-0.5">Track ingredient waste & calculate losses</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Waste filter buttons */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {[['all', '🗂 All'], ['ingredient', '📦 Inventory Waste'], ['menu_item', '🍽 Food Waste']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setWasteFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${wasteFilter === val ? 'bg-red-500 text-white' : 'text-text-muted hover:text-white'}`}>{label}</button>
            ))}
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-5 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
            <Plus size={13} /> Log Waste
          </button>
        </div>
      </div>

      {msg.text && <p className={`text-xs font-bold px-3 py-2 rounded-xl border ${msg.type === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-primary bg-primary/10 border-primary/20'}`}>{msg.text}</p>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Total Entries</p>
          <p className="text-2xl font-black text-red-400">{filteredEntries.length}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Total Loss</p>
          <p className="text-2xl font-black text-orange-400">${totalCost.toFixed(0)}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">This Week</p>
          <p className="text-2xl font-black text-yellow-400">{filteredEntries.filter(e => new Date(e.date) > new Date(Date.now() - 7*86400000)).length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Top Reason</p>
          <p className="text-sm font-black text-white capitalize">{byReason.sort((a,b)=>b.count-a.count)[0]?.reason || '—'}</p>
        </div>
      </div>

      {/* Log Waste Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <h4 className="text-base font-bold text-white mb-4">Log Waste Entry</h4>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                {/* Type selector */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {[['ingredients', '🧂 Ingredients'], ['food_items', '🍽 Food Items']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => { setWasteType(val); setForm(p => ({ ...p, ingredient_id: '' })); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${wasteType === val ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{label}</button>
            ))}
          </div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">{wasteType === 'ingredients' ? 'Ingredient' : 'Food Item'} *</label>
                <select required value={form.ingredient_id} onChange={e => setForm(p => ({ ...p, ingredient_id: e.target.value }))}
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-red-400">
                  <option value="">Select {wasteType === 'ingredients' ? 'ingredient' : 'food item'}...</option>
                  {wasteType === 'ingredients'
                    ? ingredients.map(i => <option key={i._id || i.id} value={i._id || i.id}>{i.name} ({i.unit})</option>)
                    : menuItems.map(i => <option key={i._id || i.id} value={i._id || i.id}>{i.name} (${i.price})</option>)
                  }
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Quantity Wasted *</label>
                <input type="number" required min="0.01" step="0.01" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-red-400" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Reason *</label>
                <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-red-400">
                  {REASONS.map(r => <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional details..."
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-red-400" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block flex items-center gap-1">
                  <Calendar size={10} /> Date of Waste
                </label>
                <input type="date" value={form.waste_date} style={{ colorScheme: "dark" }}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(p => ({ ...p, waste_date: e.target.value }))}
                  placeholder="Leave blank for today"
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-red-400" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-red-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"><Plus size={12} />Log Waste</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-white/20 rounded-xl text-xs font-black uppercase hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waste Log Table */}
      {filteredEntries.length > 0 ? (
        <div className="bg-bg-main/50 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto rounded-2xl -mx-1 md:mx-0">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left p-3 text-[10px] text-text-muted font-black uppercase tracking-widest">Date</th>
                  <th className="text-left p-3 text-[10px] text-text-muted font-black uppercase tracking-widest">Ingredient</th>
                  <th className="text-left p-3 text-[10px] text-text-muted font-black uppercase tracking-widest">Qty</th>
                  <th className="text-left p-3 text-[10px] text-text-muted font-black uppercase tracking-widest">Reason</th>
                  <th className="text-left p-3 text-[10px] text-text-muted font-black uppercase tracking-widest">Loss ($)</th>
                  <th className="text-left p-3 text-[10px] text-text-muted font-black uppercase tracking-widest">Notes</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.slice(0, 20).map(e => (
                  <tr key={e._id || e.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-3 text-text-muted text-xs">{new Date(e.created_at || e.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</td>
                    <td className="p-3 text-white font-bold">{e.item_name || e.ingredient_name}</td>
                    <td className="p-3 text-white">{e.quantity_wasted || e.quantity} {e.unit}</td>
                    <td className="p-3"><span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-300 capitalize">{(e.reason||'').replace('_',' ')}</span></td>
                    <td className="p-3 text-orange-400 font-bold">${(e.total_loss || e.cost || 0).toFixed(2)}</td>
                    <td className="p-3 text-text-muted text-xs">{e.notes || '—'}</td>
                    <td className="p-3">
                      <button onClick={() => setBudgetDelConfirm(e._id || e.id)} className="text-text-muted hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-text-muted border border-white/5 rounded-2xl">
          <Trash2 size={32} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold text-sm uppercase tracking-widest">No waste logged yet</p>
        </div>
      )}
    </div>
  );
};
const IngredientManager = ({ ingredients, updateIngredientStock }) => {
  const [localIngredients, setLocalIngredients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newIng, setNewIng] = useState({ name: '', unit: 'kg', stock: 0, min_stock: 0, unit_cost: 0, category: 'other' });
  const [editForm, setEditForm] = useState({ name: '', unit: 'kg', stock: 0, min_stock: 0, unit_cost: 0 });
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setLocalIngredients(ingredients); }, [ingredients]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ingredientsAPI.create({ ...newIng, stock: Number(newIng.stock), min_stock: Number(newIng.min_stock), unit_cost: Number(newIng.unit_cost) });
      flash('Ingredient added!');
      setShowAdd(false);
      setNewIng({ name: '', unit: 'kg', stock: 0, min_stock: 0, unit_cost: 0, category: 'other' });
      const res = await ingredientsAPI.getAll();
      setLocalIngredients(res.data || []);
    } catch (err) { flash(err.message); }
    finally { setSubmitting(false); }
  };

  const openEdit = (ing) => {
    setEditItem(ing);
    setEditForm({ name: ing.name, unit: ing.unit || 'kg', stock: ing.stock || 0, min_stock: ing.min_stock || ing.minStock || 0, unit_cost: ing.unit_cost || ing.unitCost || 0 });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const id = editItem._id || editItem.id;
    try {
      await ingredientsAPI.update(id, { ...editForm, stock: Number(editForm.stock), min_stock: Number(editForm.min_stock), unit_cost: Number(editForm.unit_cost) });
      flash('Ingredient updated!');
      setEditItem(null);
      const res = await ingredientsAPI.getAll();
      setLocalIngredients(res.data || []);
    } catch (err) { flash(err.message); }
    finally { setSubmitting(false); }
  };

  const [ingrDelConfirm, setIngrDelConfirm] = useState(null);
  const handleDeleteIngredientClick = (id) => setIngrDelConfirm(id);
  const handleDelete = async (id) => {
    setIngrDelConfirm(null);
    try {
      await ingredientsAPI.delete(id);
      setLocalIngredients(prev => prev.filter(i => (i._id || i.id) !== id));
      flash('Ingredient deleted.');
    } catch (err) { flash(err.message); }
  };

  const UNITS = ['kg', 'g', 'liters', 'ml', 'units', 'pieces', 'pounds', 'gallons'];

  const ING_GROUPS = [
    { key:'all',        label:'All',               emoji:'📦' },
    { key:'chicken',    label:'Chicken',            emoji:'🍗' },
    { key:'mutton',     label:'Mutton & Beef',      emoji:'🥩' },
    { key:'seafood',    label:'Seafood',            emoji:'🦐' },
    { key:'dairy',      label:'Dairy',              emoji:'🥛' },
    { key:'vegetables', label:'Vegetables',         emoji:'🥦' },
    { key:'spices',     label:'Spices & Herbs',     emoji:'🌶' },
    { key:'staples',    label:'Salt · Sugar · Oil', emoji:'🧂' },
    { key:'rice',       label:'Rice & Grains',      emoji:'🌾' },
    { key:'sauces',     label:'Sauces',             emoji:'🫗' },
    { key:'beverages',  label:'Beverages',          emoji:'🥤' },
    { key:'dry',        label:'Dry Goods',          emoji:'🧺' },
    { key:'other',      label:'Other',              emoji:'📦' },
  ];
  const [ingGroup, setIngGroup] = useState('all');
  const groupedIngs = ingGroup === 'all' ? localIngredients : localIngredients.filter(i => (i.category||'other') === ingGroup);
  const FORM_FIELDS = [
    { l: 'Name', f: 'name', t: 'text' },
    { l: 'Stock', f: 'stock', t: 'number' },
    { l: 'Min Stock (Reorder Level)', f: 'min_stock', t: 'number' },
    { l: 'Unit Cost ($)', f: 'unit_cost', t: 'number' },
  ];

  return (
    <div className="space-y-6 mt-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Package size={20} className="text-primary" />Ingredients</h3>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">
          <Plus size={13} /> Add Ingredient
        </button>
      </div>

      {msg.text && <p className={`text-xs font-bold px-3 py-2 rounded-xl border ${msg.type === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-primary bg-primary/10 border-primary/20'}`}>{msg.text}</p>}

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-secondary/50 rounded-2xl border border-primary/30 p-6">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Plus size={14} className="text-primary" />New Ingredient</h4>
            <form onSubmit={handleAdd} className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {FORM_FIELDS.map(({ l, f, t }) => (
                <div key={f}>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">{l}</label>
                  <input type={t} required value={newIng[f]} onChange={e => setNewIng(p => ({ ...p, [f]: e.target.value }))}
                    className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-primary" />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Unit</label>
                <select value={newIng.unit} onChange={e => setNewIng(p => ({ ...p, unit: e.target.value }))}
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-primary">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="md:col-span-full flex gap-3">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 disabled:opacity-60">
                  {submitting ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Save
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 border border-white/20 rounded-xl text-xs font-black uppercase hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="bg-[#1a1a1a] rounded-3xl border border-primary/30 w-full max-w-lg shadow-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-5">
                <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2"><Edit2 size={16} className="text-primary" />Edit Ingredient</h3>
                <button onClick={() => setEditItem(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X size={16} /></button>
              </div>
              <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-4">
                {FORM_FIELDS.map(({ l, f, t }) => (
                  <div key={f} className={f === 'name' ? 'col-span-2' : ''}>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">{l}</label>
                    <input type={t} required value={editForm[f]} onChange={e => setEditForm(p => ({ ...p, [f]: e.target.value }))}
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-primary" />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Unit</label>
                  <select value={editForm.unit} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-primary">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditItem(null)}
                    className="flex-1 py-3 border border-white/20 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl text-sm font-black uppercase flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} Update
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group filter pills */}
      {/* <div className="flex flex-wrap gap-2 mb-4">
        {ING_GROUPS.map(g => {
          const cnt = g.key==='all' ? localIngredients.length : localIngredients.filter(i=>(i.category||'other')===g.key).length;
          if(g.key!=='all'&&cnt===0) return null;
          return (
            <button key={g.key} onClick={()=>setIngGroup(g.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${ingGroup===g.key?'bg-primary border-primary text-white':'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>
              {g.emoji} {g.label} <span className="opacity-60">({cnt})</span>
            </button>
          );
        })}
      </div> */}

      {/* Ingredient Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groupedIngs.map(ing => {
          const id = ing._id || ing.id;
          const stock = typeof ing.stock === 'number' ? ing.stock : 0;
          const min = ing.min_stock || ing.minStock || 0;
          const cost = ing.unit_cost || ing.unitCost || 0;
          const pct = Math.min(100, (stock / Math.max(min * 2, 1)) * 100);
          const isLow = stock < min;
          return (
            <div key={id} className="p-5 bg-bg-main/70 border border-white/10 rounded-2xl hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white">{ing.name}</h4>
                  <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-widest">{ing.unit}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${isLow ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                  {isLow ? '⚠ Reorder' : '✓ OK'}
                </span>
              </div>

              {/* Stock bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-text-muted uppercase tracking-widest mb-0.5">Stock</p>
                  <p className="text-sm font-black text-white">{stock}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-text-muted uppercase tracking-widest mb-0.5">Min</p>
                  <p className="text-sm font-black text-white">{min}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-text-muted uppercase tracking-widest mb-0.5">Cost</p>
                  <p className="text-sm font-black text-primary">${cost}</p>
                </div>
              </div>

              {/* Last Updated */}
              {(ing.updatedAt || ing.updated_at || ing.createdAt || ing.created_at) && (
                <p className="text-[9px] text-text-muted mb-2 flex items-center gap-1">
                  <Clock size={9} className="opacity-60" />
                  Updated {new Date(ing.updatedAt || ing.updated_at || ing.createdAt || ing.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => openEdit(ing)}
                  className="flex-1 py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1">
                  <Edit2 size={10} /> Update
                </button>
                <button onClick={() => handleDeleteIngredientClick(id)}
                  title="Delete ingredient"
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {groupedIngs.length === 0 && (
          <div className="col-span-full py-16 text-center text-text-muted">
            <Package size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm uppercase tracking-widest">{ingGroup==="all"?"No ingredients yet":"No items in this group"}</p>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!ingrDelConfirm}
        title="Delete Ingredient?"
        message="Are you sure you want to delete this ingredient? Stock data will be permanently lost."
        confirmText="Delete Ingredient"
        onCancel={() => setIngrDelConfirm(null)}
        onConfirm={() => handleDelete(ingrDelConfirm)}
      />
    </div>
  );
};

// ─── ORDER BOOKING (live orders panel + POS) ─────────────────────────────────
const OrderBookingPanel = ({ orders, user, updateOrderStatus, confirmOrder, deleteOrder, captainTableNumbers, liveDeliveries = [] }) => {
  // Augment each delivery order with its live delivery record for dispatch gating
  const ordersWithDelivery = React.useMemo(() => {
    if (!liveDeliveries.length) return orders;
    const dlvMap = {};
    liveDeliveries.forEach(d => {
      const oid = d.order_id?._id || d.order_id;
      if (oid) dlvMap[String(oid)] = d;
    });
    return orders.map(o =>
      o.order_type === 'delivery' ? { ...o, delivery: dlvMap[String(o._id)] || o.delivery || null } : o
    );
  }, [orders, liveDeliveries]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Declare BEFORE useMemo to avoid temporal dead zone
  const isDeliveryCaptain = user.role === 'captain' && (!captainTableNumbers || captainTableNumbers.length === 0);
  const isDineInCaptain   = user.role === 'captain' && captainTableNumbers && captainTableNumbers.length > 0;

  // For captains: filter orders to ONLY show their zone (dine-in: their tables; delivery captain: delivery+pickup)
  const captainFiltered = React.useMemo(() => {
    if (user.role !== 'captain') return ordersWithDelivery;
    const parseTableNum = (raw) => { const m = String(raw || '').match(/\d+/); return m ? parseInt(m[0]) : NaN; };
    if (isDeliveryCaptain) {
      return ordersWithDelivery.filter(o => ['delivery','pickup','takeaway'].includes(o.order_type));
    }
    // Dine-in captain: only their assigned tables
    return ordersWithDelivery.filter(o => {
      if (['delivery','pickup','takeaway'].includes(o.order_type)) return false; // not their zone
      const tNum = parseTableNum(o.table_number);
      const captainIdMatch = o.captain_id && ((o.captain_id._id || o.captain_id) === user._id || (o.captain_id._id || o.captain_id) === user.id);
      return (captainTableNumbers || []).includes(tNum) || captainIdMatch;
    });
  }, [ordersWithDelivery, user, isDeliveryCaptain, captainTableNumbers]);

  const filtered = (filterStatus === 'all' ? captainFiltered : captainFiltered.filter(o => o.status === filterStatus));

  // Count orders needing confirmation
  const pendingConfirmCount = ordersWithDelivery.filter(o => o.status === 'pending_confirmation').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><OrderIcon size={28} className="text-primary" />Orders</h2>
          <p className="text-text-muted text-sm mt-1">{orders.length} orders
            {pendingConfirmCount > 0 && <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-[10px] font-black animate-pulse">⏰ {pendingConfirmCount} awaiting confirmation</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['all', 'pending_confirmation', 'pending', 'start_cooking', 'completed_cooking', 'served', 'paid'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-primary text-white' : 'text-text-muted hover:text-white'} ${s === 'pending_confirmation' && pendingConfirmCount > 0 ? 'border border-yellow-500/40' : ''}`}>
              {s === 'pending_confirmation' ? `⏰ Confirm${pendingConfirmCount > 0 ? ` (${pendingConfirmCount})` : ''}` : (STATUS_LABELS[s] || s)}
            </button>
          ))}
        </div>
      </div>

      {/* Captain Zone Banner */}
      {user.role === 'captain' && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${isDeliveryCaptain ? 'bg-blue-500/10 border-blue-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${isDeliveryCaptain ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
            {isDeliveryCaptain ? '🚗' : '🪑'}
          </div>
          <div>
            <p className={`text-xs font-black uppercase tracking-widest ${isDeliveryCaptain ? 'text-blue-400' : 'text-green-400'}`}>
              Your Zone · {isDeliveryCaptain ? 'Delivery & Pickup Captain' : `Tables ${captainTableNumbers.map(n => `Table ${n}`).join(', ')}`}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {isDeliveryCaptain
                ? 'Delivery orders: Start → Done → Dispatch → Paid. Pickup/Takeaway orders: Start → Done → Collected.'
                : `You see and manage orders for your assigned tables only. Buttons on other-zone tables are locked.`}
            </p>
          </div>
          <div className={`ml-auto px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${isDeliveryCaptain ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} in zone
          </div>
        </div>
      )}

      <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
        <OrderTable orders={filtered} user={user} onStatusUpdate={updateOrderStatus} onConfirmOrder={confirmOrder} onDelete={deleteOrder} statusColors={STATUS_COLORS} captainTableNumbers={captainTableNumbers} />
      </div>
    </div>
  );
};

// ─── OVERVIEW — Enhanced Command Hub ──────────────────────────────────────────
const DISH_COLORS = [
  '#f97316','#3b82f6','#22c55e','#a855f7','#ec4899',
  '#14b8a6','#f59e0b','#ef4444','#6366f1','#84cc16',
  '#06b6d4','#d946ef','#fb923c','#34d399','#818cf8',
];

const Overview = ({ orders }) => {
  const [period,        setPeriod]        = useState('week');   // day|week|month|year|custom
  const [customFrom,    setCustomFrom]    = useState('');
  const [customTo,      setCustomTo]      = useState('');
  const [hubData,       setHubData]       = useState(null);
  const [hubLoading,    setHubLoading]    = useState(true);
  const [calDate,       setCalDate]       = useState('');
  const [showAllDishes, setShowAllDishes] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [activeSection, setActiveSection] = useState('pipeline'); // pipeline|cancelled

  const loadHub = useCallback(async (silent = false) => {
    if (!silent) setHubLoading(true);
    try {
      let url = `/dashboard/command-hub?period=${period}`;
      if (period === 'custom' && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      if (calDate) url += `&calendar_date=${calDate}`;
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('bb_token');
      const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const json = await res.json();
      if (json.success) setHubData(json.data);
    } catch {}
    finally { if (!silent) setHubLoading(false); }
  }, [period, customFrom, customTo, calDate]);

  useEffect(() => { loadHub(false); }, [loadHub]);
  useAutoRefresh(loadHub, 30000);

  // Local analytics from the passed orders prop (for instant display while API loads)
  const localAnalytics = useMemo(() => {
    const itemFreq = {};
    orders.forEach(o => (o.items || []).forEach(i => {
      itemFreq[i.name] = (itemFreq[i.name] || 0) + (i.quantity || 1);
    }));
    const topItems = Object.entries(itemFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    return { topItems };
  }, [orders]);

  const d = hubData;

  // Format chart label based on period
  const chartLabel = (pt) => {
    if (!pt) return '';
    if (pt._id.hour !== undefined) return `${pt._id.hour}:00`;
    if (pt._id.day) return `${pt._id.month}/${pt._id.day}`;
    return `${pt._id.year}/${pt._id.month}`;
  };

  const pipelineStats = d ? [
    { label: 'Pending',        value: d.pipeline.pending + (d.pipeline.pending_confirmation || 0), color: 'bg-yellow-500',  dot: 'bg-yellow-400' },
    { label: 'Cooking',        value: d.pipeline.start_cooking,     color: 'bg-orange-500', dot: 'bg-orange-400' },
    { label: 'Ready to Serve', value: d.pipeline.completed_cooking, color: 'bg-blue-500',   dot: 'bg-blue-400'   },
    { label: 'Served',         value: d.pipeline.served,            color: 'bg-green-500',  dot: 'bg-green-400'  },
    { label: 'Paid',           value: d.pipeline.paid,              color: 'bg-primary',    dot: 'bg-primary'    },
    { label: 'Cancelled',      value: d.pipeline.cancelled,         color: 'bg-red-500',    dot: 'bg-red-400'    },
  ] : [];

  const maxPipeline = pipelineStats.reduce((m, s) => Math.max(m, s.value), 1);

  const displayedDishes = d
    ? (showAllDishes ? d.top_dishes_all : d.top_dishes)
    : localAnalytics.topItems.slice(0, 5).map(x => ({ name: x.name, total_qty: x.count }));

  const topDishes10 = d ? d.top_dishes_10 : localAnalytics.topItems.slice(0, 10).map(x => ({ name: x.name, total_qty: x.count }));
  const totalDishQty = topDishes10.reduce((s, x) => s + (x.total_qty || 0), 0) || 1;

  // Revenue chart
  // Revenue = strictly paid orders only
  const chartPoints = d?.revenue_chart || [];
  const maxRev = Math.max(...chartPoints.map(p => p.revenue), 1);

  const makeSmoothPath = (pts, W, H) => {
    if (pts.length === 0) return { line: '', area: '', xs: [], ys: [] };
    const xs = pts.map((_, i) => i * (W / Math.max(pts.length - 1, 1)));
    const ys = pts.map(p => H - Math.max(2, (p.revenue / maxRev) * (H - 10)) + 5);
    let line = `M \${xs[0]},\${ys[0]}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = xs[i - 1] + (xs[i] - xs[i - 1]) * 0.4;
      const cp2x = xs[i] - (xs[i] - xs[i - 1]) * 0.4;
      line += ` C \${cp1x},\${ys[i-1]} \${cp2x},\${ys[i]} \${xs[i]},\${ys[i]}`;
    }
    const area = `\${line} L \${xs[pts.length-1]},\${H} L \${xs[0]},\${H} Z`;
    return { line, area, xs, ys };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black font-heading text-white mb-1">Command Hub</h2>
          <p className="text-text-muted text-sm">Live business intelligence — all data from database</p>
        </div>
        <button onClick={() => loadHub(false)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-text-muted hover:text-white hover:bg-white/10 transition-all">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Period Selector ── */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'day',   label: 'Today' },
          { key: 'week',  label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'year',  label: 'This Year' },
          { key: 'custom',label: 'Custom' },
        ].map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${period === p.key ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30'}`}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary" />
            <span className="text-text-muted text-xs">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary" />
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Revenue',         value: d ? `$${d.revenue.toFixed(0)}` : '…', icon: DollarSign,  color: 'text-green-400',  bg: 'bg-green-500/10'  },
          { label: 'Total Orders',    value: d ? d.total_all_orders : '…',         icon: OrderIcon,   color: 'text-primary',    bg: 'bg-primary/10'    },
          { label: 'Avg Order Value', value: d ? `$${d.avg_order_value.toFixed(0)}` : '…', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Paid Orders',     value: d ? d.paid_count : '…',               icon: CheckCircle2,color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map((stat, idx) => (
          <MotionDiv key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
            className="bg-secondary/40 p-6 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-3xl opacity-20`} />
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            {hubLoading ? (
              <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            )}
          </MotionDiv>
        ))}
      </div>

      {/* ── Revenue Trend Chart — paid orders only ── */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">💰 Daily Sales Chart</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white">
                {d ? `$${d.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
              </h3>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">total earned</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {period === 'day' ? 'Hour-by-hour breakdown for today' : period === 'week' ? 'Each dot = one day of sales (last 7 days)' : period === 'month' ? 'Each dot = one day this month' : period === 'year' ? 'Each dot = one month this year' : 'Sales for selected date range'}
            </p>
          </div>
          {d && chartPoints.length > 0 && (() => {
            const peak = chartPoints.reduce((m, p) => p.revenue > m.revenue ? p : m, chartPoints[0]);
            const totalOrders = chartPoints.reduce((s, p) => s + p.orders, 0);
            const trend = chartPoints.length > 1
              ? ((chartPoints[chartPoints.length - 1].revenue - chartPoints[0].revenue) / (chartPoints[0].revenue || 1) * 100).toFixed(0)
              : null;
            return (
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Best Day</p>
                  <p className="text-base font-black text-primary">${peak.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-text-muted">{chartLabel(peak)}</p>
                </div>
                {trend !== null && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Trend</p>
                    <p className={`text-base font-black ${Number(trend) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(trend) >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </p>
                    <p className="text-[10px] text-text-muted">{Number(trend) >= 0 ? 'growing' : 'declining'}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        {hubLoading ? (
          <div className="space-y-2">
            <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            <div className="flex justify-between">{[1,2,3,4,5].map(i => <div key={i} className="h-3 w-10 bg-white/5 rounded animate-pulse" />)}</div>
          </div>
        ) : chartPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 size={36} className="text-white/10 mb-3" />
            <p className="text-text-muted text-sm font-bold">No revenue data for this period</p>
            <p className="text-text-muted/50 text-xs mt-1">Revenue is recorded when orders are marked as Paid</p>
          </div>
        ) : (() => {
          const W = 560, H = 130;
          const { line, area, xs, ys } = makeSmoothPath(chartPoints, W, H);
          const yTicks = [0, 0.25, 0.5, 0.75, 1];
          const step = Math.ceil(chartPoints.length / 7);
          const xLabels = chartPoints.filter((_, i) => i === 0 || i === chartPoints.length - 1 || i % step === 0);
          return (
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none" style={{ width: 44 }}>
                {[...yTicks].reverse().map((frac, i) => (
                  <span key={i} className="text-[9px] text-text-muted font-bold text-right pr-2 leading-none">
                    ${frac === 0 ? '0' : (maxRev * frac).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                ))}
              </div>
              <div className="pl-11 overflow-x-auto">
                <svg width="100%" viewBox={`0 0 ${W} ${H + 32}`} className="min-w-[280px]" style={{ height: 170 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#f97316" stopOpacity="0.35" />
                      <stop offset="70%"  stopColor="#f97316" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0"    />
                    </linearGradient>
                    <filter id="lineGlow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  {yTicks.map((frac, i) => (
                    <line key={i} x1="0" y1={H - frac * (H - 10) + 5} x2={W} y2={H - frac * (H - 10) + 5}
                      stroke={frac === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
                      strokeWidth={frac === 0 ? 1.5 : 1} strokeDasharray={frac === 0 ? 'none' : '4,6'} />
                  ))}
                  <path d={area} fill="url(#revGrad)" />
                  <path d={line} fill="none" stroke="#f97316" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" filter="url(#lineGlow)" />
                  {xs && xs.map((x, i) => (
                    <g key={i}>
                      <circle cx={x} cy={ys[i]} r="3.5" fill="#111" stroke="#f97316" strokeWidth="2">
                        <title>{chartLabel(chartPoints[i])}: ${chartPoints[i].revenue.toFixed(0)} ({chartPoints[i].orders} order{chartPoints[i].orders !== 1 ? 's' : ''})</title>
                      </circle>
                      <line x1={x} y1={ys[i]} x2={x} y2={H + 5} stroke="rgba(249,115,22,0.10)" strokeWidth="1" strokeDasharray="2,3" />
                    </g>
                  ))}
                  {xs && xLabels.map((pt) => {
                    const idx = chartPoints.indexOf(pt);
                    return (
                      <text key={idx} x={xs[idx]} y={H + 22} textAnchor="middle" fill="#555" fontSize="9" fontWeight="700">
                        {chartLabel(pt)}
                      </text>
                    );
                  })}
                </svg>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mt-4 pt-4 border-t border-white/5">
                <div className="text-center">
                  <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Orders Paid</p>
                  <p className="text-lg font-black text-white">{chartPoints.reduce((s, p) => s + p.orders, 0)}</p>
                  <p className="text-[9px] text-text-muted">completed sales</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Avg per Day</p>
                  <p className="text-lg font-black text-white">${chartPoints.length > 0 ? (d.revenue / chartPoints.length).toFixed(0) : '0'}</p>
                  <p className="text-[9px] text-text-muted">daily average</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Best Single Day</p>
                  <p className="text-lg font-black text-primary">${maxRev.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[9px] text-text-muted">{chartLabel(chartPoints.reduce((m, p) => p.revenue > m.revenue ? p : m, chartPoints[0]))}</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Order Pipeline + Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Order Pipeline */}
        <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-5">
            <h4 className="text-base md:text-lg font-bold text-white flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/30 inline-flex items-center justify-center mr-1"><Zap size={14} className="text-yellow-400" /></span>Order Pipeline</h4>
            <div className="flex gap-1">
              <button onClick={() => setActiveSection('pipeline')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeSection === 'pipeline' ? 'bg-primary text-white' : 'bg-white/5 text-text-muted hover:text-white'}`}>
                Pipeline
              </button>
              <button onClick={() => setActiveSection('cancelled')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${activeSection === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-text-muted hover:text-white'}`}>
                Cancelled {d && d.cancelled_count > 0 && <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">{d.cancelled_count}</span>}
              </button>
            </div>
          </div>

          {activeSection === 'pipeline' ? (
            <div className="space-y-4">
              {hubLoading ? (
                [1,2,3,4,5,6].map(i => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />)
              ) : (
                pipelineStats.map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{s.label}</span>
                      </div>
                      <span className="text-base font-black text-white">{s.value}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <MotionDiv initial={{ width: 0 }}
                        animate={{ width: `${(s.value / maxPipeline) * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full ${s.color} rounded-full`} />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Cancelled orders list */
            <div>
              {hubLoading ? (
                <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
              ) : !d || d.cancelled_count === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 size={32} className="mx-auto mb-3 text-green-400/40" />
                  <p className="text-text-muted text-sm">No cancelled orders in this period</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">
                    {d.cancelled_count} cancelled order{d.cancelled_count !== 1 ? 's' : ''}
                  </p>
                  {d.cancelled_orders.map(o => (
                    <div key={o._id} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-xs font-black text-white">#{o.order_number}</p>
                        <p className="text-[10px] text-text-muted">
                          {o.customer?.name || 'Walk-in'} · {o.order_type}
                          {o.table_number ? ` · Table ${o.table_number}` : ''}
                        </p>
                        <p className="text-[10px] text-text-muted/60">
                          {new Date(o.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-sm font-black text-red-400">${(o.total || 0).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar — Sales by date */}
        <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-primary" />
            </span>
            Sales Calendar
          </h4>
          <div className="flex items-center gap-3 mb-4">
            <input type="date" value={calDate} onChange={e => setCalDate(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="flex-1 bg-bg-main border-2 border-white/20 hover:border-primary/40 focus:border-primary rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all cursor-pointer font-medium" />
            {calDate && (
              <button onClick={() => setCalDate('')} className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
          {!calDate ? (
            <div className="text-center py-10 text-text-muted text-sm">
              <Calendar size={32} className="mx-auto mb-3 opacity-30" />
              Pick a date to see all orders placed on that day
            </div>
          ) : hubLoading ? (
            <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
          ) : !d?.calendar_orders?.length ? (
            <div className="text-center py-8 text-text-muted text-sm">
              <p className="font-bold">No orders on {new Date(calDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                  {d.calendar_orders.length} orders · <span className="text-primary font-black">${(d.calendar_paid_total || 0).toFixed(0)}</span> paid revenue
                </p>
                <p className="text-[10px] text-text-muted font-bold">
                  {new Date(calDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {d.calendar_orders.map(o => (
                  <div key={o._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                    <div>
                      <p className="text-xs font-black text-white">#{o.order_number}</p>
                      <p className="text-[10px] text-text-muted capitalize">
                        {o.customer?.name || 'Walk-in'} · {o.order_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">${(o.total || 0).toFixed(0)}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        o.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        o.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Dishes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Bar list + Show More */}
        <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-5">
            <h4 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 inline-flex items-center justify-center mr-1"><BarChart3 size={14} className="text-primary" /></span>Top Dishes
            </h4>
            {d && d.top_dishes_all && d.top_dishes_all.length > 5 && (
              <button onClick={() => setShowAllDishes(s => !s)}
                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1">
                <Eye size={12} /> {showAllDishes ? 'Show Less' : `See All (${d.top_dishes_all.length})`}
              </button>
            )}
          </div>
          {hubLoading ? (
            [1,2,3,4,5].map(i => <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse mb-2" />)
          ) : displayedDishes.length === 0 ? (
            <p className="text-text-muted text-sm py-6 text-center">No dish data for this period</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {displayedDishes.map((dish, i) => {
                const pct = totalDishQty > 0 ? ((dish.total_qty || 0) / totalDishQty) * 100 : 0;
                const col = DISH_COLORS[i % DISH_COLORS.length];
                return (
                  <div key={dish.name || i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: col }} />
                        <span className="text-sm font-bold text-white truncate">{dish.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-[10px] text-text-muted">{dish.total_qty}×</span>
                        {dish.total_revenue > 0 && (
                          <span className="text-[10px] font-black text-primary">${dish.total_revenue.toFixed(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <MotionDiv initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.04 }}
                        className="h-full rounded-full" style={{ background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie chart — top 10 */}
        <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6">
          <h4 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <PieChart size={18} className="text-primary" />Top 10 Dish Distribution
          </h4>
          {hubLoading ? (
            <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          ) : topDishes10.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">No orders yet in this period</p>
          ) : (() => {
            const tot  = topDishes10.reduce((s, i) => s + (i.total_qty || 0), 0) || 1;
            let   ang  = 0;
            const segs = topDishes10.map((item, idx) => {
              const span = ((item.total_qty || 0) / tot) * 360;
              const seg  = { ...item, span, start: ang, color: DISH_COLORS[idx % DISH_COLORS.length] };
              ang += span;
              return seg;
            });
            const SZ = 180, R = 70, cx = 90, cy = 90;
            const pt = (a, r) => ({ x: cx + r * Math.cos((a - 90) * Math.PI / 180), y: cy + r * Math.sin((a - 90) * Math.PI / 180) });
            return (
              <div className="flex items-start gap-5 flex-wrap">
                <svg width={SZ} height={SZ} className="shrink-0">
                  {segs.map((s, i) => {
                    if (s.span < 0.5) return null;
                    const p1 = pt(s.start, R), p2 = pt(s.start + s.span, R);
                    return (
                      <path key={i} d={`M${cx},${cy}L${p1.x},${p1.y}A${R},${R} 0 ${s.span > 180 ? 1 : 0} 1 ${p2.x},${p2.y}Z`}
                        fill={s.color} opacity="0.88">
                        <title>{s.name}: {s.total_qty}× ({((s.total_qty / tot) * 100).toFixed(0)}%)</title>
                      </path>
                    );
                  })}
                  <circle cx={cx} cy={cy} r={R * 0.42} fill="#111" />
                  <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="14" fontWeight="900">{tot}</text>
                  <text x={cx} y={cy + 11} textAnchor="middle" fill="#666" fontSize="8" fontWeight="700">ORDERS</text>
                </svg>
                <div className="flex-1 space-y-1.5 min-w-0 max-h-48 overflow-y-auto pr-1">
                  {segs.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-white/80 truncate">{s.name}</span>
                      </div>
                      <span className="text-xs font-black text-white shrink-0">
                        {s.total_qty}× ({((s.total_qty / tot) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};


// ─── FINANCE CENTER ───────────────────────────────────────────────────────────
const FinanceCenter = ({ orders }) => {
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [wasteEntries,  setWasteEntries]  = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ label: '', amount: '', type: 'expense', category: 'other', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [importBills,   setImportBills]   = useState(false);
  const [xlsxRows,      setXlsxRows]      = useState([]);  // parsed rows from Excel
  const [xlsxErrors,    setXlsxErrors]    = useState([]);
  const [xlsxUploading, setXlsxUploading] = useState(false);
  const [xlsxResult,    setXlsxResult]    = useState(null); // { imported, skipped, errors }
  const [period, setPeriod] = useState('all');
  const [loadingFinance, setLoadingFinance] = useState(true);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 3500); };

  // ── Load budget + waste from DB ───────────────────────────────────────────
  const loadFinance = useCallback(async () => {
    setLoadingFinance(true);
    try {
      const [bRes, wRes] = await Promise.all([budgetAPI.getAll(), wasteAPI.getAll()]);
      setBudgetEntries(bRes.data || []);
      setWasteEntries(wRes.data || []);
    } catch (err) { console.error('Finance load error:', err.message); }
    finally { setLoadingFinance(false); }
  }, []);

  useEffect(() => { loadFinance(); }, [loadFinance]);

  const now = new Date();

  const filterByPeriod = (date) => {
    const d = new Date(date);
    if (period === 'today')   { const t = new Date(now); t.setHours(0,0,0,0); return d >= t; }
    if (period === 'week')    return d >= new Date(now - 7*86400000);
    if (period === 'month')   { const m = new Date(now); m.setDate(1); m.setHours(0,0,0,0); return d >= m; }
    if (period === 'quarter') { const q = new Date(now); q.setMonth(q.getMonth() - 3); q.setHours(0,0,0,0); return d >= q; }
    if (period === 'year')    { const y = new Date(now.getFullYear(), 0, 1); return d >= y; }
    return true; // 'all'
  };

  // Revenue from paid orders
  const paidOrders = orders.filter(o => o.status === 'paid' && filterByPeriod(o.created_at || o.timestamp));
  const revenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);
  const avgOrderValue = paidOrders.length > 0 ? revenue / paidOrders.length : 0;

  // Budget entries
  const filteredBudget = budgetEntries.filter(e => filterByPeriod(e.date || e.created_at));
  const totalExpenses = filteredBudget.filter(e => (e.entry_type || e.type) === 'expense').reduce((s, e) => s + (e.amount || 0), 0);
  const otherIncome   = filteredBudget.filter(e => (e.entry_type || e.type) === 'income').reduce((s, e) => s + (e.amount || 0), 0);

  // Wastage losses — from DB (total_loss field)
  const filteredWaste = wasteEntries.filter(e => filterByPeriod(e.created_at || e.date));
  const wasteLoss = filteredWaste.reduce((s, e) => s + (e.total_loss || e.cost || 0), 0);

  // Net Profit = Revenue + Other Income - Expenses - Wastage
  const netProfit = revenue + otherIncome - totalExpenses - wasteLoss;
  const totalIncome = revenue + otherIncome;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const isProfit = netProfit >= 0;

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      await budgetAPI.create({
        title:      budgetForm.label,
        amount:     Number(budgetForm.amount),
        entry_type: budgetForm.type,
        category:   budgetForm.category || 'other',
        date:       budgetForm.date,
        notes:      budgetForm.notes || '',
      });
      setBudgetForm({ label: '', amount: '', type: 'expense', category: 'other', date: new Date().toISOString().slice(0, 10), notes: '' });
      setShowBudgetForm(false);
      flash(`${budgetForm.type === 'expense' ? 'Expense' : 'Income'} of $${budgetForm.amount} added!`);
      loadFinance();
    } catch (err) { flash(err.message || 'Failed to add entry', 'error'); }
  };

  const deleteBudget = async (id) => {
    try {
      await budgetAPI.delete(id);
      setBudgetEntries(prev => prev.filter(e => e._id !== id && e.id !== id));
      flash('Entry deleted');
    } catch (err) { flash(err.message || 'Failed to delete', 'error'); }
  };

  // Revenue last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const rev = orders.filter(o => o.status === 'paid' && new Date(o.created_at || o.timestamp) >= d && new Date(o.created_at || o.timestamp) < next)
      .reduce((s, o) => s + (o.total || 0), 0);
    return { day: d.toLocaleDateString(undefined, { weekday: 'short' }), rev };
  });
  const maxRev = Math.max(...last7.map(d => d.rev), 1);

  return (
    <div className="space-y-6">

      {/* Header — matches screenshot */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-white flex items-center gap-3">
            <DollarSign size={32} className="text-primary" />Finance Center
          </h2>
          <p className="text-text-muted mt-1 text-sm">Revenue auto-tracked from paid orders · Add budget manually or import from bills</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setImportBills(s => !s)}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all">
            <FileText size={14} /> Import Bills
          </button>
          <button onClick={loadFinance} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowBudgetForm(s => !s)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
            <Plus size={14} /> Add Budget Entry
          </button>
        </div>
      </div>

      {/* ── Excel Import Panel ── */}
      <AnimatePresence>
        {importBills && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-secondary/40 border border-primary/30 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Import Budget Entries via Excel
              </h4>
              <button onClick={() => { setImportBills(false); setXlsxRows([]); setXlsxErrors([]); setXlsxResult(null); }}
                className="text-text-muted hover:text-white"><X size={16} /></button>
            </div>

            {/* Step 1 — Download Template */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Step 1 — Download Template</p>
              <p className="text-xs text-text-muted mb-3">Download the Excel template, fill it in, then upload it back.</p>
              <button
                onClick={() => {
                  // Generate CSV template
                  const headers = ['title','amount','entry_type','category','date','period','notes'];
                  const sample = [
                    ['Gas Bill - March','2500','expense','utilities','2026-03-01','monthly','Monthly gas bill'],
                    ['Staff Salary','45000','expense','salary','2026-03-01','monthly','March salaries'],
                    ['Catering Income','15000','income','other','2026-03-05','one-time','Corporate event'],
                    ['Vegetable Supplies','3200','expense','supplies','2026-03-10','weekly','Weekly veggie purchase'],
                  ];
                  const csv = [headers, ...sample].map(r => r.join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = 'biryanibox_budget_template.csv';
                  document.body.appendChild(a); a.click();
                  document.body.removeChild(a); URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
                ⬇ Download CSV Template
              </button>
              {/* Column guide */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['title', 'Entry name (required)'],
                  ['amount', 'Numeric amount (required)'],
                  ['entry_type', '"expense" or "income" (required)'],
                  ['category', 'rent / salary / utilities / supplies / marketing / maintenance / equipment / other'],
                  ['date', 'YYYY-MM-DD format'],
                  ['period', 'daily / weekly / monthly / yearly / one-time'],
                  ['notes', 'Optional notes'],
                ].map(([col, desc]) => (
                  <div key={col} className="bg-white/5 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-black text-primary uppercase">{col}</p>
                    <p className="text-[10px] text-text-muted">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 — Upload File */}
            <div className="bg-white/3 border border-white/10 rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-3">Step 2 — Upload Your File</p>
              <label className="border-2 border-dashed border-white/20 hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer block transition-all group">
                <FileText size={28} className="mx-auto mb-2 text-text-muted group-hover:text-primary transition-colors" />
                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">Click to browse or drag & drop</p>
                <p className="text-[10px] text-text-muted mt-1">.csv or .xlsx files supported</p>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setXlsxErrors([]); setXlsxRows([]); setXlsxResult(null);
                    const ext = file.name.split('.').pop().toLowerCase();
                    try {
                      if (ext === 'csv') {
                        // Parse CSV natively
                        const text = await file.text();
                        const lines = text.trim().split('\n');
                        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
                        const rows = lines.slice(1).filter(l => l.trim()).map(line => {
                          const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
                          return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
                        });
                        setXlsxRows(rows);
                      } else {
                        // Load xlsx from CDN and parse
                        if (!window.XLSX) {
                          await new Promise((res, rej) => {
                            const s = document.createElement('script');
                            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                            s.onload = res; s.onerror = rej;
                            document.head.appendChild(s);
                          });
                        }
                        const data = await file.arrayBuffer();
                        const wb = window.XLSX.read(data, { type: 'array' });
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const rows = window.XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
                        setXlsxRows(rows);
                      }
                    } catch (err) {
                      setXlsxErrors([`Failed to parse file: ${err.message}`]);
                    }
                  }}
                />
              </label>
            </div>

            {/* Preview parsed rows */}
            {xlsxRows.length > 0 && !xlsxResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-white">{xlsxRows.length} rows parsed — preview:</p>
                  <button
                    disabled={xlsxUploading}
                    onClick={async () => {
                      setXlsxUploading(true);
                      setXlsxErrors([]);
                      try {
                        const result = await budgetAPI.bulkImport(xlsxRows);
                        setXlsxResult(result);
                        setXlsxRows([]);
                        loadFinance();
                      } catch (err) {
                        setXlsxErrors([err.message || 'Import failed']);
                      } finally { setXlsxUploading(false); }
                    }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${xlsxUploading ? 'bg-white/5 text-text-muted cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-hover'}`}>
                    {xlsxUploading ? <><Loader size={13} className="animate-spin" /> Importing…</> : <>⬆ Import {xlsxRows.length} Entries</>}
                  </button>
                </div>
                <div className="bg-black/20 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        {['#','Title','Amount','Type','Category','Date'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] font-black uppercase text-text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {xlsxRows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-3 py-2 text-text-muted">{i + 1}</td>
                          <td className="px-3 py-2 text-white font-bold truncate max-w-[120px]">{row.title || row.Title || '—'}</td>
                          <td className="px-3 py-2 text-primary font-black">${row.amount || row.Amount || 0}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${(row.entry_type || row['Entry Type'] || 'expense').toLowerCase() === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {row.entry_type || row['Entry Type'] || 'expense'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-text-muted">{row.category || row.Category || 'other'}</td>
                          <td className="px-3 py-2 text-text-muted">{row.date || row.Date || 'today'}</td>
                        </tr>
                      ))}
                      {xlsxRows.length > 20 && (
                        <tr><td colSpan={6} className="px-3 py-2 text-center text-text-muted">…and {xlsxRows.length - 20} more rows</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Success result */}
            {xlsxResult && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                <p className="text-green-400 font-black text-base mb-2">✅ Import Complete!</p>
                <div className="flex gap-6 text-sm">
                  <div><p className="text-text-muted text-xs uppercase font-bold">Imported</p><p className="text-green-400 font-black text-xl">{xlsxResult.imported}</p></div>
                  {xlsxResult.skipped > 0 && <div><p className="text-text-muted text-xs uppercase font-bold">Skipped</p><p className="text-yellow-400 font-black text-xl">{xlsxResult.skipped}</p></div>}
                </div>
                {xlsxResult.errors?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {xlsxResult.errors.map((e, i) => <p key={i} className="text-[10px] text-red-400">⚠ {e}</p>)}
                  </div>
                )}
                <button onClick={() => { setXlsxResult(null); setImportBills(false); }}
                  className="mt-3 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-xs font-black uppercase hover:bg-green-500 hover:text-white transition-all">
                  Close
                </button>
              </div>
            )}

            {/* Errors */}
            {xlsxErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 font-bold text-sm mb-2">Import Errors:</p>
                {xlsxErrors.map((e, i) => <p key={i} className="text-[10px] text-red-400">• {e}</p>)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Budget Entry Form — slides in under header */}
      <AnimatePresence>
        {showBudgetForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-secondary/40 border border-primary/30 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
              <h4 className="text-base font-bold text-white">New Budget Entry</h4>
              <button type="button" onClick={() => setShowBudgetForm(false)} className="text-text-muted hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddBudget} className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Label *</label>
                <input required value={budgetForm.label} onChange={e => setBudgetForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Gas bill, Salary..."
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Amount ($) *</label>
                <input required type="number" min="0.01" step="0.01" value={budgetForm.amount} onChange={e => setBudgetForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Type</label>
                <div className="flex gap-2">
                  {[['expense', '📤 Expense'], ['income', '📥 Income']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setBudgetForm(p => ({ ...p, type: val }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-black uppercase border transition-all ${budgetForm.type === val ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Date</label>
                <input type="date" value={budgetForm.date} onChange={e => setBudgetForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full bg-bg-main border border-white/10 p-2.5 rounded-xl text-white text-sm outline-none focus:border-primary" />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"><Plus size={12} />Add Entry</button>
                <button type="button" onClick={() => setShowBudgetForm(false)} className="px-6 py-2 border border-white/20 rounded-xl text-xs font-black uppercase hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Period filter */}
      <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5 w-fit">
        {[['all','All Time'],['today','Today'],['week','This Week'],['month','This Month'],['quarter','This Quarter'],['year','This Year']].map(([val, label]) => (
          <button key={val} onClick={() => setPeriod(val)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === val ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {msg.text && <p className={`text-xs font-bold px-3 py-2 rounded-xl border ${msg.type === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-primary bg-primary/10 border-primary/20'}`}>{msg.text}</p>}

      {/* NET PROFIT / LOSS Banner — styled like screenshot */}
      <div className={`rounded-3xl border p-8 relative overflow-hidden ${isProfit ? 'bg-green-900/40 border-green-700/40' : 'bg-red-900/40 border-red-700/40'}`}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: isProfit ? 'radial-gradient(circle at 80% 50%, #22c55e, transparent 60%)'  : 'radial-gradient(circle at 80% 50%, #ef4444, transparent 60%)' }} />
        <p className="text-[11px] text-text-muted font-black uppercase tracking-widest mb-3">
          NET {isProfit ? 'PROFIT' : 'LOSS'} · {period === 'all' ? 'ALL TIME' : period === 'today' ? 'TODAY' : period === 'week' ? 'THIS WEEK' : period === 'month' ? 'THIS MONTH' : period === 'quarter' ? 'THIS QUARTER' : 'THIS YEAR'}
        </p>
        <p className={`text-7xl font-black tracking-tight ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}${Math.abs(netProfit).toFixed(0)}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <p className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {profitMargin.toFixed(1)}% profit margin
          </p>
          <span className={`text-xs font-black px-3 py-1 rounded-full border ${isProfit ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
            {isProfit ? '📈 Healthy' : '📉 Loss'}
          </span>
        </div>
        {/* Wastage deducted notice */}
        {wasteLoss > 0 && (
          <p className="text-[10px] text-text-muted mt-2 font-bold">
            Includes ${wasteLoss.toFixed(0)} wastage deducted
          </p>
        )}
        <div className={`absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}>
          {isProfit ? <TrendingUp size={28} className="text-white" /> : <TrendingDown size={28} className="text-white" />}
        </div>
      </div>

      {/* KPI Cards — 4 cards matching screenshot colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue (Orders) — green */}
        <div className="bg-green-900/30 border border-green-700/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-green-400" />
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Revenue (Orders)</p>
          </div>
          <p className="text-3xl font-black text-green-400">${revenue.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted mt-1">{paidOrders.length} paid orders</p>
        </div>
        {/* Total Expenses — red */}
        <div className="bg-red-900/30 border border-red-700/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={13} className="text-red-400" />
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Total Expenses</p>
          </div>
          <p className="text-3xl font-black text-red-400">${totalExpenses.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted mt-1">{filteredBudget.filter(e => e.type === 'expense').length} entries</p>
        </div>
        {/* Other Income — blue */}
        <div className="bg-blue-900/30 border border-blue-700/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={13} className="text-blue-400" />
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Other Income</p>
          </div>
          <p className="text-3xl font-black text-blue-400">${otherIncome.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted mt-1">{filteredBudget.filter(e => e.type === 'income').length} entries</p>
        </div>
        {/* Avg Order Value — amber */}
        <div className="bg-amber-900/30 border border-amber-700/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={13} className="text-amber-400" />
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Avg Order Value</p>
          </div>
          <p className="text-3xl font-black text-amber-400">${avgOrderValue.toFixed(0)}</p>
          <p className="text-[10px] text-text-muted mt-1">per paid order</p>
        </div>
      </div>

      {/* Wastage Card — always visible, deducted from profit */}
      <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${wasteLoss > 0 ? 'bg-orange-900/30 border-orange-700/30' : 'bg-white/5 border-white/10'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${wasteLoss > 0 ? 'bg-orange-500/20' : 'bg-white/10'}`}>
            <Trash2 size={18} className={wasteLoss > 0 ? 'text-orange-400' : 'text-text-muted'} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Wastage Losses</p>
            <p className="text-xs text-text-muted mt-0.5">
              {filteredWaste.length} waste entries · Automatically deducted from net profit
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${wasteLoss > 0 ? 'text-orange-400' : 'text-text-muted'}`}>
            {wasteLoss > 0 ? '-' : ''}${wasteLoss.toFixed(0)}
          </p>
          {wasteLoss === 0 && <p className="text-[10px] text-text-muted">No waste logged</p>}
        </div>
      </div>

      {/* Revenue Last 7 Days Chart */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6">
        <h4 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 inline-flex items-center justify-center mr-1"><BarChart3 size={14} className="text-primary" /></span>Revenue — Last 7 Days
        </h4>
        <div className="flex items-end gap-2" style={{ height: '120px' }}>
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {d.rev > 0 && <p className="text-[9px] text-text-muted font-bold">${d.rev.toFixed(0)}</p>}
              <div className="w-full bg-white/5 rounded-t-lg flex-1 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all duration-700"
                  style={{ height: `${(d.rev / maxRev) * 100}%` }} />
              </div>
              <p className="text-[9px] text-text-muted font-bold uppercase">{d.day}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profit Breakdown Table */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h4 className="text-base font-bold text-white flex items-center gap-2"><DollarSign size={16} className="text-primary" />Profit & Loss Breakdown</h4>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Revenue from Orders', value: revenue, positive: true },
            { label: 'Other Income (Budget)', value: otherIncome, positive: true },
            { label: 'Total Expenses (Budget)', value: -totalExpenses, positive: totalExpenses === 0 },
            { label: 'Wastage Losses', value: -wasteLoss, positive: wasteLoss === 0 },
          ].map(({ label, value, positive }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <p className="text-sm text-text-muted font-bold">{label}</p>
              <p className={`font-black text-base ${positive ? 'text-green-400' : 'text-red-400'}`}>
                {value >= 0 ? '+' : ''}${Math.abs(value).toFixed(0)}
              </p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t-2 border-white/20">
            <p className="text-base font-black text-white">Net {isProfit ? 'Profit' : 'Loss'}</p>
            <p className={`font-black text-xl ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}${Math.abs(netProfit).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Entries Table */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h4 className="text-base font-bold text-white flex items-center gap-2"><FileText size={16} className="text-primary" />Budget Entries</h4>
          <span className="text-xs text-text-muted">{filteredBudget.length} entries</span>
        </div>
        {filteredBudget.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl -mx-1 md:mx-0">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {['Date', 'Label', 'Type', 'Amount'].map(h => (
                    <th key={h} className="text-left p-3 text-[10px] text-text-muted font-black uppercase tracking-widest">{h}</th>
                  ))}
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {filteredBudget.map(e => (
                  <tr key={e._id || e.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-3 text-text-muted text-xs">{new Date(e.date || e.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                    <td className="p-3 text-white font-bold">{e.title || e.label}<span className="text-[10px] text-text-muted ml-2">{e.category || ''}</span></td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${(e.entry_type||e.type) === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{e.entry_type || e.type}</span>
                    </td>
                    <td className={`p-3 font-black ${(e.entry_type||e.type) === 'expense' ? 'text-red-400' : 'text-green-400'}`}>{(e.entry_type||e.type) === 'expense' ? '-' : '+'}${(e.amount||0).toFixed(0)}</td>
                    <td className="p-3">
                      <button onClick={() => deleteBudget(e._id || e.id)} className="text-text-muted hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-text-muted">
            <DollarSign size={32} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm uppercase tracking-widest">No budget entries yet</p>
            <p className="text-xs mt-1">Add expenses or other income using the button above</p>
          </div>
        )}
      </div>

      {/* Break-Even Analysis Chart */}
      {(() => {
        const fixedCosts = totalExpenses + wasteLoss;
        const variableCostRate = revenue > 0 ? (totalExpenses * 0.3) / Math.max(paidOrders.length, 1) : 0;
        const avgPrice = avgOrderValue;
        const contributionMargin = avgPrice - variableCostRate;
        const breakevenUnits = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
        const breakevenRevenue = breakevenUnits * avgPrice;
        const achieved = revenue >= breakevenRevenue;
        const progressPct = breakevenRevenue > 0 ? Math.min(100, (revenue / breakevenRevenue) * 100) : 100;

        // Chart points: revenue line vs fixed cost line
        const chartPoints = Array.from({ length: 11 }, (_, i) => {
          const units = i * Math.max(breakevenUnits * 1.5, paidOrders.length * 1.5) / 10;
          return {
            units: Math.round(units),
            revenueVal: units * avgPrice,
            costVal: fixedCosts + units * variableCostRate,
          };
        });
        const maxVal = Math.max(...chartPoints.map(p => Math.max(p.revenueVal, p.costVal)), 1);
        const chartH = 160;
        const chartW = 100; // percent units for SVG viewBox

        return (
          <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4 flex-wrap gap-3">
              <div>
                <h4 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <BarChart2 size={18} className="text-primary" />Break-Even Analysis
                </h4>
                <p className="text-xs text-text-muted mt-0.5">Based on current revenue, expenses &amp; order data</p>
              </div>
              <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase border ${achieved ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'}`}>
                {achieved ? '✅ Break-Even Achieved' : `⚠ ${breakevenUnits - paidOrders.length} orders to break-even`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-[10px] text-text-muted font-bold mb-1">
                <span>Revenue Progress to Break-Even</span>
                <span>{progressPct.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${achieved ? 'bg-green-500' : 'bg-primary'}`}
                  style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>${revenue.toFixed(0)} earned</span>
                <span>Target: ${breakevenRevenue.toFixed(0)}</span>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="relative" style={{ height: chartH + 30 }}>
              <svg viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none" className="w-full" style={{ height: chartH }}>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map(f => (
                  <line key={f} x1="0" y1={chartH * (1 - f)} x2="100" y2={chartH * (1 - f)}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                ))}
                {/* Revenue line (green) */}
                <polyline
                  points={chartPoints.map((p, i) => `${(i / 10) * 100},${chartH - (p.revenueVal / maxVal) * chartH}`).join(' ')}
                  fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round" />
                {/* Cost line (red) */}
                <polyline
                  points={chartPoints.map((p, i) => `${(i / 10) * 100},${chartH - (p.costVal / maxVal) * chartH}`).join(' ')}
                  fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="3,2" />
                {/* Break-even vertical line */}
                {breakevenUnits > 0 && (() => {
                  const beX = Math.min(100, (breakevenUnits / (chartPoints[10]?.units || 1)) * 100);
                  return <line x1={beX} y1="0" x2={beX} y2={chartH} stroke="#e8890c" strokeWidth="1" strokeDasharray="2,2" />;
                })()}
              </svg>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2 text-[10px] font-bold">
                <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-green-500" />Revenue</div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '1px dashed' }} />Total Cost</div>
                <div className="flex items-center gap-1.5"><div className="w-0.5 h-3 bg-primary" />Break-Even</div>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mt-4">
              {[
                { label: 'Fixed Costs', val: `$${fixedCosts.toFixed(0)}`, color: 'text-red-400' },
                { label: 'Break-Even Orders', val: breakevenUnits, color: 'text-primary' },
                { label: 'Break-Even Revenue', val: `$${breakevenRevenue.toFixed(0)}`, color: 'text-yellow-400' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                  <p className={`text-xl font-black ${color}`}>{val}</p>
                  <p className="text-[9px] text-text-muted uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Revenue from Paid Orders */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h4 className="text-base font-bold text-white flex items-center gap-2"><TrendingUp size={16} className="text-green-400" />Revenue from Orders</h4>
          <p className="text-xs text-text-muted mt-1">{paidOrders.length} paid orders · ${revenue.toFixed(0)} total</p>
        </div>
        {paidOrders.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl -mx-1 md:mx-0">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {['Order', 'Table', 'Items', 'Amount'].map(h => (
                    <th key={h} className="text-left p-3 text-[10px] text-text-muted font-black uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paidOrders.slice(0, 20).map(o => (
                  <tr key={o._id || o.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-3 text-white font-bold text-xs">{o.order_number || `#${(o._id || o.id)?.slice(-5).toUpperCase()}`}</td>
                    <td className="p-3 text-text-muted text-xs">Table {o.table_number || 'Takeaway'}</td>
                    <td className="p-3 text-text-muted text-xs">{(o.items || []).length} items</td>
                    <td className="p-3 text-green-400 font-black">${(o.total || 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-text-muted">
            <p className="text-sm">No paid orders in this period</p>
          </div>
        )}
      </div>
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
//  RIDERS HUB — Owner/Manager manage delivery riders
// ════════════════════════════════════════════════════════════════════════════
const RidersPanel = ({ currentUserRole }) => {
  const [riders,       setRiders]      = useState([]);
  const [deliveries,   setDeliveries]  = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [showForm,     setShowForm]    = useState(false);
  const [delConfirm,   setDelConfirm]  = useState(null);
  const [msg,          setMsg]         = useState({ text: '', type: '' });
  const [activeRider,  setActiveRider] = useState(null);
  const [riderDels,    setRiderDels]   = useState([]);
  const [riderDelLoad, setRiderDelLoad] = useState(false);
  const [liveDeliveries, setLiveDeliveries] = useState([]);
  const [showMap,      setShowMap]     = useState(true);
  // mapReady gates marker placement — prevents race condition where liveDeliveries
  // arrives before Leaflet finishes initialising the map instance
  const [mapReady,     setMapReady]    = useState(false);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', vehicle_type: 'bike' });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  // Load live delivery locations from backend
  const loadLive = useCallback(async () => {
    try {
      const res = await deliveryAPI.getLiveLocations();
      setLiveDeliveries(res.data || []);
    } catch (err) {
      console.error('[RidersHub] live-locations error:', err.message);
    }
  }, []);

  // Init Leaflet map — window.L is guaranteed by index.html script tag
  useEffect(() => {
    if (!showMap || !mapRef.current || leafletMap.current) return;
    if (!window.L) { console.error('[RidersHub] Leaflet not loaded'); return; }
    const L = window.L;
    leafletMap.current = L.map(mapRef.current, { zoomControl: true }).setView([17.3850, 78.4867], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(leafletMap.current);
    // Ensure container dimensions are finalised before tiles render
    requestAnimationFrame(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
        setMapReady(true);
      }
    });
    return () => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
      setMapReady(false);
    };
  }, [showMap]);

  // Place / refresh markers — prefer stored GPS coords, fall back to geocoding
  useEffect(() => {
    if (!mapReady || !leafletMap.current || !window.L) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (liveDeliveries.length === 0) return;

    const statusColor = { in_transit: '#22c55e', picked_up: '#f97316', assigned: '#3b82f6' };
    const statusEmoji = { in_transit: '🛵', picked_up: '📦', assigned: '⏳' };

    const placeMarker = (lat, lon, d) => {
      if (!leafletMap.current) return;
      const color = statusColor[d.status] || '#3b82f6';
      const emoji = statusEmoji[d.status] || '📦';
      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${emoji}</div>`,
        className: '', iconSize: [36, 36], iconAnchor: [18, 18],
      });
      const marker = L.marker([lat, lon], { icon })
        .addTo(leafletMap.current)
        .bindPopup(`<b>${d.driver_id?.name || 'Rider'}</b><br>Order #${d.order_id?.order_number || '—'}<br>${d.delivery_address || ''}<br><i>${d.status.replace(/_/g,' ')}</i>`);
      markersRef.current.push(marker);
    };

    const geocodeAndPlace = async (d) => {
      const addr = d.delivery_address || d.order_id?.delivery_address || '';
      if (!addr) return;
      try {
        // Use backend proxy — browser cannot set User-Agent, Nominatim blocks localhost
        const res = await deliveryAPI.geocode(addr);
        const data = res.data || [];
        if (data[0] && leafletMap.current) placeMarker(parseFloat(data[0].lat), parseFloat(data[0].lon), d);
      } catch {}
    };

    liveDeliveries.forEach(d => {
      // Use stored GPS first (set by rider's location updates) — no geocoding needed
      if (d.rider_lat && d.rider_lng) {
        placeMarker(d.rider_lat, d.rider_lng, d);
      } else {
        geocodeAndPlace(d);
      }
    });

    setTimeout(() => {
      if (markersRef.current.length > 0 && leafletMap.current) {
        try {
          const group = L.featureGroup(markersRef.current);
          if (group.getBounds().isValid()) leafletMap.current.fitBounds(group.getBounds().pad(0.3));
        } catch {}
      }
    }, 1200);
  }, [liveDeliveries, mapReady]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    // Fetch riders and deliveries independently — one failure must not wipe the other
    try {
      const ridersRes = await usersAPI.getAll('?role=delivery');
      setRiders(ridersRes.data || []);
    } catch (err) {
      console.error('[RidersHub] Failed to load riders:', err.message);
    }
    try {
      const delRes = await deliveryAPI.getAll();
      setDeliveries(delRes.data || []);
    } catch (err) {
      console.error('[RidersHub] Failed to load deliveries:', err.message);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { load(); loadLive(); }, []);
  useAutoRefresh(load, 20000);
  useAutoRefresh(loadLive, 10000);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3500); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create({ ...form, role: 'delivery' });
      flash('Rider account created successfully');
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', password: '', vehicle_type: 'bike' });
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleToggle = async (rider) => {
    try {
      await usersAPI.toggleStatus(rider._id, !rider.is_active, 'Disabled by manager');
      flash(`${rider.name} ${rider.is_active ? 'disabled' : 'enabled'}`);
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try { await usersAPI.delete(id); flash('Rider removed'); setDelConfirm(null); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const openRiderDrawer = async (rider) => {
    setActiveRider(rider);
    setRiderDelLoad(true);
    try {
      const res = await deliveryAPI.getAll(`?driver_id=${rider._id}`);
      setRiderDels(res.data || []);
    } catch { setRiderDels([]); }
    finally { setRiderDelLoad(false); }
  };

  // Which deliveries are "active" for a given rider
  const activeDelivery = (riderId) =>
    deliveries.find(d => String(d.driver_id?._id || d.driver_id) === String(riderId) && ['assigned','picked_up','in_transit'].includes(d.status));

  const totalForRider = (riderId) =>
    deliveries.filter(d => String(d.driver_id?._id || d.driver_id) === String(riderId) && d.status === 'delivered').length;

  const statusDot = {
    assigned: 'bg-blue-400', picked_up: 'bg-orange-400', in_transit: 'bg-green-400',
  };

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending' && d.order_id?.order_type === 'delivery');
  const pendingPickups    = deliveries.filter(d => d.status === 'pending' && ['pickup','takeaway'].includes(d.order_id?.order_type));
  const activeDeliveries  = deliveries.filter(d => ['assigned','picked_up','in_transit'].includes(d.status));
  const totalEarnings     = deliveries.filter(d => d.status === 'delivered').reduce((s, d) => s + (d.delivery_fee || 0), 0);
  // Only delivery orders need dispatch (rider assigned but not yet dispatched)
  const awaitingDispatch  = deliveries.filter(d => d.status === 'assigned' && !d.captain_dispatched && d.order_id?.order_type === 'delivery');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Truck size={28} className="text-primary" />Riders Hub</h2>
          <p className="text-text-muted text-sm mt-1">
            {['owner', 'manager'].includes(currentUserRole)
              ? 'Manage delivery riders, track live deliveries and performance'
              : 'Dispatch delivery orders to riders and track live deliveries'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
          {['owner', 'manager'].includes(currentUserRole) && (
            <button onClick={() => setShowForm(s => !s)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
              <Plus size={14} /> Add Rider
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Riders',      value: riders.length,            color: 'text-primary',    bg: 'bg-primary/10',    icon: Truck    },
          { label: 'Active Deliveries', value: activeDeliveries.length,  color: 'text-green-400',  bg: 'bg-green-500/10',  icon: Activity },
          { label: 'Pending Delivery',  value: pendingDeliveries.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Package  },
          ['owner', 'manager'].includes(currentUserRole)
            ? { label: 'Total Paid Out',      value: `$${totalEarnings}`,     color: 'text-blue-400', bg: 'bg-blue-500/10',   icon: DollarSign }
            : { label: 'Ready to Dispatch',   value: awaitingDispatch.length, color: 'text-blue-400', bg: 'bg-blue-500/10',   icon: Truck },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-secondary/40 rounded-2xl border border-white/5 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}><Icon size={18} className={color} /></div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{label}</p>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery orders awaiting dispatch — rider assigned but captain hasn't dispatched yet */}
      {awaitingDispatch.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
          <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Truck size={14} /> {awaitingDispatch.length} Delivery Order{awaitingDispatch.length !== 1 ? 's' : ''} Ready to Dispatch
          </h4>
          <div className="space-y-2">
            {awaitingDispatch.map(d => {
              const pm = d.order_id?.payment_method;
              const isPrepaid = pm && pm !== 'cash';
              return (
              <div key={d._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-bold text-white">Order #{d.order_id?.order_number || '—'}</p>
                    <span className="text-[8px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full font-black uppercase">🚗 Delivery</span>
                    {/* Payment status badge */}
                    {pm && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${
                        isPrepaid
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {isPrepaid ? '✅ Prepaid' : '💵 Cash on Delivery'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">{d.delivery_address || d.order_id?.delivery_address}</p>
                  <p className="text-[10px] text-blue-400">Rider: {d.driver_id?.name || '—'} · Waiting for dispatch</p>
                  {!isPrepaid && pm === 'cash' && (
                    <p className="text-[10px] text-yellow-400 font-bold mt-0.5">⚠ Rider must collect ${(d.order_id?.total || 0).toFixed(2)} cash on delivery</p>
                  )}
                </div>
                <button onClick={async () => {
                  try { await deliveryAPI.dispatch(d._id); flash('Order dispatched! Rider can now pickup.'); load(); await loadOrders(); }
                  catch (err) { flash(err.message || 'Failed to dispatch', 'error'); }
                }} className="px-4 py-2 bg-blue-500 text-white text-[10px] font-black rounded-xl hover:bg-blue-600 transition-all flex items-center gap-1.5">
                  <Truck size={12} /> Dispatch Order
                </button>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending delivery orders — waiting for a rider to accept */}
      {pendingDeliveries.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
          <h4 className="text-sm font-black text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={14} /> {pendingDeliveries.length} Delivery Order{pendingDeliveries.length !== 1 ? 's' : ''} Waiting for a Rider
          </h4>
          <div className="space-y-2">
            {pendingDeliveries.slice(0, 5).map(d => (
              <div key={d._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white">{d.order_id?.order_number || '—'}</p>
                    <span className="text-[8px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-full font-black uppercase">🚗 Delivery</span>
                  </div>
                  <p className="text-xs text-text-muted truncate">{d.delivery_address || d.order_id?.delivery_address}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-text-muted">{d.customer_name}</span>
                  <span className="text-[10px] font-black px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 uppercase">Waiting for Rider</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pickup orders — no rider needed, customer collects */}
      {pendingPickups.length > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
          <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Package size={14} /> {pendingPickups.length} Pickup Order{pendingPickups.length !== 1 ? 's' : ''} — Customer Collecting
          </h4>
          <div className="space-y-2">
            {pendingPickups.slice(0, 5).map(d => (
              <div key={d._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white">{d.order_id?.order_number || '—'}</p>
                    <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full font-black uppercase">📦 Pickup</span>
                  </div>
                  <p className="text-xs text-text-muted">{d.customer_name || 'Walk-in'}</p>
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase shrink-0">
                  No Rider Needed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Rider form — Owner & Manager only */}
      {['owner', 'manager'].includes(currentUserRole) && (
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="bg-secondary/40 rounded-3xl border border-primary/30 p-4 md:p-8">
              <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2"><Truck size={18} className="text-primary" />Create Rider Account</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {[
                  { label: 'Full Name',    field: 'name',     type: 'text',     req: true },
                  { label: 'Email',        field: 'email',    type: 'email',    req: true },
                  { label: 'Phone',        field: 'phone',    type: 'tel',      req: false },
                  { label: 'Password',     field: 'password', type: 'password', req: true },
                ].map(({ label, field, type, req }) => (
                  <div key={field}>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">{label}{req && ' *'}</label>
                    <input type={type} required={req} value={form[field]} onChange={sf(field)}
                      className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Vehicle Type</label>
                  <select value={form.vehicle_type} onChange={sf('vehicle_type')}
                    className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm">
                    {['bike','bicycle','scooter','car'].map(v => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">Create Account</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Live Tracking Map */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Live Rider Tracking</h3>
              <p className="text-[10px] text-text-muted mt-0.5">{liveDeliveries.length} active delivery{liveDeliveries.length !== 1 ? 'ies' : ''} · refreshes every 10s</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveDeliveries.length > 0 && <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span className="text-[10px] text-green-400 font-bold">LIVE</span></div>}
            <button onClick={() => setShowMap(m => !m)} className="text-[10px] font-black text-text-muted hover:text-white px-3 py-1.5 bg-white/5 rounded-lg uppercase tracking-widest transition-all">
              {showMap ? 'Hide' : 'Show'} Map
            </button>
          </div>
        </div>
        {showMap && (
          <div className="relative">
            <div ref={mapRef} style={{ height: 380, width: '100%', background: '#111' }} />
            {liveDeliveries.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none">
                <Truck size={36} className="text-white/20 mb-2" />
                <p className="text-white/30 text-sm font-bold">No active deliveries to track</p>
                <p className="text-white/20 text-xs mt-1">Map will populate when riders are on the road</p>
              </div>
            )}
          </div>
        )}
        {/* Active delivery legend */}
        {liveDeliveries.length > 0 && (
          <div className="px-6 py-3 border-t border-white/5 flex flex-wrap gap-3">
            {liveDeliveries.map(d => (
              <div key={d._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${
                d.status === 'in_transit' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                d.status === 'picked_up'  ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}>
                <span>{d.status === 'in_transit' ? '🛵' : d.status === 'picked_up' ? '📦' : '✅'}</span>
                <span>{d.driver_id?.name || 'Rider'}</span>
                <span className="text-text-muted">→ #{d.order_id?.order_number || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riders table */}
      {loading ? <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-primary" /></div> : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          {riders.length === 0 ? (
            <div className="py-20 text-center text-text-muted">
              <Truck size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No riders yet</p>
              <p className="text-xs mt-2">Add a rider account to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {riders.map(r => {
                const live    = activeDelivery(r._id);
                const count   = totalForRider(r._id);
                const statusCfg = live ? statusDot[live.status] : null;
                return (
                  <div key={r._id} className="flex items-center px-4 md:px-6 py-4 md:py-5 hover:bg-white/3 group gap-4">
                    {/* Avatar + name */}
                    <button onClick={() => openRiderDrawer(r)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden border border-primary/30">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`} alt="" />
                        </div>
                        {live && (
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-secondary ${statusCfg || 'bg-gray-400'} animate-pulse`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{r.name}</p>
                        <p className="text-[10px] text-text-muted truncate">{r.email}</p>
                        {r.phone && <p className="text-[10px] text-text-muted">{r.phone}</p>}
                      </div>
                    </button>

                    {/* Vehicle */}
                    <div className="hidden md:block w-[14%]">
                      <span className="text-[10px] font-bold text-text-muted capitalize bg-white/5 px-2 py-1 rounded-lg">
                        {r.vehicle_type || 'bike'}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-[18%]">
                      {live ? (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${live.status === 'in_transit' ? 'bg-green-500/10 text-green-400 border-green-500/20' : live.status === 'picked_up' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {live.status === 'in_transit' ? 'On Route' : live.status === 'picked_up' ? 'Picked Up' : 'Assigned'}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border ${r.is_active ? 'bg-white/5 text-text-muted border-white/10' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {r.is_active ? 'Idle' : 'Disabled'}
                        </span>
                      )}
                    </div>

                    {/* Total deliveries */}
                    <div className="w-[12%] text-center hidden md:block">
                      <p className="text-sm font-black text-white">{count}</p>
                      <p className="text-[9px] text-text-muted">deliveries</p>
                    </div>

                    {/* Actions — view always visible; edit/delete only for owner & manager */}
                    <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <button onClick={() => openRiderDrawer(r)}
                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all" title="View profile">
                        <Eye size={13} />
                      </button>
                      {['owner', 'manager'].includes(currentUserRole) && (
                        <button onClick={() => handleToggle(r)}
                          className={`p-2 rounded-lg transition-all ${r.is_active ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white'}`}>
                          {r.is_active ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                        </button>
                      )}
                      {['owner', 'manager'].includes(currentUserRole) && (
                        <button onClick={() => setDelConfirm(r)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {delConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-secondary rounded-3xl border border-white/10 p-6 md:p-10 max-w-md w-full mx-4 sm:mx-auto text-center space-y-6">
              <Truck size={32} className="text-red-400 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold mb-2 text-white">Remove Rider?</h3>
                <p className="text-text-muted text-sm">This permanently removes <span className="text-white font-bold">{delConfirm.name}</span>.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setDelConfirm(null)} className="flex-1 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5">Cancel</button>
                <button onClick={() => handleDelete(delConfirm._id)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rider detail drawer */}
      <AnimatePresence>
        {activeRider && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-end"
            onClick={e => { if (e.target === e.currentTarget) setActiveRider(null); }}>
            <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: 'spring', damping: 26 }}
              className="w-full max-w-md h-full bg-[#141414] border-l border-white/10 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/30 shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeRider.name}`} alt="" className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-white">{activeRider.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{activeRider.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase">Rider</span>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-text-muted border border-white/10 capitalize">{activeRider.vehicle_type || 'bike'}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${activeRider.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {activeRider.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setActiveRider(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 shrink-0">
                  <X size={14} />
                </button>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 p-6 border-b border-white/10">
                {[
                  { label: 'Total', value: riderDels.filter(d => d.status === 'delivered').length, color: 'text-primary' },
                  { label: 'Earned', value: `$${riderDels.filter(d => d.status === 'delivered').reduce((s, d) => s + (d.delivery_fee || 40), 0)}`, color: 'text-green-400' },
                  { label: 'Phone', value: activeRider.phone || '—', color: 'text-text-muted' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[9px] text-text-muted uppercase font-bold mb-1">{label}</p>
                    <p className={`text-base font-black ${color} truncate`}>{value}</p>
                  </div>
                ))}
              </div>
              {/* Delivery history */}
              <div className="flex-1 overflow-y-auto p-6">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Truck size={12} className="text-primary" /> Delivery History
                </h4>
                {riderDelLoad ? (
                  <div className="flex justify-center py-10"><Loader size={20} className="animate-spin text-primary" /></div>
                ) : riderDels.length === 0 ? (
                  <div className="py-12 text-center text-text-muted">
                    <Truck size={28} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase">No deliveries yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {riderDels.slice(0, 30).map(d => (
                      <div key={d._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-sm font-bold text-white truncate">{d.order_id?.order_number || `BOX-${(d._id || '').slice(-5).toUpperCase()}`}</p>
                          <p className="text-[10px] text-text-muted truncate">{d.delivery_address}</p>
                          {d.delivered_at && <p className="text-[10px] text-text-muted">{new Date(d.delivered_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-black ${d.status === 'delivered' ? 'text-green-400' : 'text-text-muted'}`}>
                            {d.status === 'delivered' ? `+$${d.delivery_fee || 40}` : d.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
//  STAFF PROFILE VIEW — Full page shown when clicking any staff member
// ════════════════════════════════════════════════════════════════════════════
const StaffProfileView = ({ staffUser, onBack }) => {
  const [allShifts,   setAllShifts]   = useState([]);
  const [leaves,      setLeaves]      = useState([]);
  const [staffOrders, setStaffOrders] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [period,      setPeriod]      = useState('monthly');

  const formatDuration = (mins) => {
    if (!mins) return '\u2014';
    const h = Math.floor(mins / 60); const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  useEffect(() => {
    if (!staffUser?._id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [shiftsRes, leavesRes, ordersRes] = await Promise.all([
          shiftsAPI.getAll(`?user_id=${staffUser._id}`),   // ← fixed: user_id not userId; no period so all shifts returned
          leavesAPI.getAll(),
          ordersAPI.getAll(`?captain_id=${staffUser._id}&chef_id=${staffUser._id}`).catch(() =>
            ordersAPI.getAll(`?captain_id=${staffUser._id}`).catch(() => ({ data: [] }))
          ),
        ]);
        setAllShifts(shiftsRes.data || []);
        const all = leavesRes.data || [];
        setLeaves(all.filter(l => String(l.user_id?._id || l.user_id) === String(staffUser._id)));
        // fetch orders where this staff is captain OR chef
        const [capRes, chefRes] = await Promise.allSettled([
          ordersAPI.getAll(`?captain_id=${staffUser._id}`),
          ordersAPI.getAll(`?chef_id=${staffUser._id}`),
        ]);
        const capOrders  = capRes.status  === 'fulfilled' ? (capRes.value.data  || []) : [];
        const chefOrders = chefRes.status === 'fulfilled' ? (chefRes.value.data || []) : [];
        // merge unique
        const seen = new Set();
        const merged = [...capOrders, ...chefOrders].filter(o => {
          if (seen.has(o._id)) return false;
          seen.add(o._id); return true;
        });
        setStaffOrders(merged.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch { }
      finally { setLoading(false); }
    };
    load();
  }, [staffUser._id]);

  // Real duration in minutes from check_in→check_out (or check_in→now for active shifts)
  const shiftMinutes = (s) => {
    if (s.check_out) return Math.round((new Date(s.check_out) - new Date(s.check_in)) / 60000);
    if (s.status === 'active' && s.check_in) return Math.round((Date.now() - new Date(s.check_in)) / 60000);
    return s.duration_minutes || 0;
  };

  // Period filter — client-side using real check_in timestamp
  const filteredShifts = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(now); cutoff.setFullYear(cutoff.getFullYear() - 1);
    if (period === 'today')   { cutoff = new Date(now); cutoff.setHours(0,0,0,0); }
    if (period === 'weekly')  { cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 6); cutoff.setHours(0,0,0,0); }
    if (period === 'monthly') { cutoff = new Date(now); cutoff.setDate(1); cutoff.setHours(0,0,0,0); }
    return allShifts.filter(s => s.check_in && new Date(s.check_in) >= cutoff);
  }, [allShifts, period]);

  // KPIs — all computed from real check_in/check_out durations
  const totalHours    = filteredShifts.reduce((a, s) => a + shiftMinutes(s), 0) / 60;
  const uniqueDays    = new Set(filteredShifts.map(s => new Date(s.check_in).toDateString())).size;
  const totalSessions = filteredShifts.length;
  const avgHrsPerDay  = uniqueDays ? totalHours / uniqueDays : 0;

  // Graph bars — built from real check_in/check_out timestamps
  const graphBars = useMemo(() => {
    const now = new Date();
    if (period === 'today') {
      // 24-hour breakdown — place each shift in the hour it started
      const bars = Array.from({ length: 24 }, (_, h) => ({
        label: `${h}`, hours: 0,
        tip: `${String(h).padStart(2,'0')}:00 – ${String(h+1).padStart(2,'0')}:00`,
      }));
      filteredShifts.forEach(s => {
        if (!s.check_in) return;
        const h = new Date(s.check_in).getHours();
        bars[h].hours += shiftMinutes(s) / 60;
      });
      return bars;
    }
    if (period === 'weekly') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const ds = allShifts.filter(s => s.check_in && new Date(s.check_in) >= d && new Date(s.check_in) < next);
        const hours = ds.reduce((a, s) => a + shiftMinutes(s), 0) / 60;
        return {
          label: d.toLocaleDateString(undefined, { weekday: 'short' }),
          hours,
          tip: `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}: ${hours.toFixed(1)}h (${ds.length} shifts)`,
        };
      });
    }
    if (period === 'monthly') {
      const yr = now.getFullYear(); const mo = now.getMonth();
      const dim = new Date(yr, mo + 1, 0).getDate();
      return Array.from({ length: dim }, (_, i) => {
        const d = new Date(yr, mo, i + 1);
        const next = new Date(yr, mo, i + 2);
        const ds = allShifts.filter(s => s.check_in && new Date(s.check_in) >= d && new Date(s.check_in) < next);
        const hours = ds.reduce((a, s) => a + shiftMinutes(s), 0) / 60;
        return {
          label: String(i + 1),
          hours,
          tip: `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}: ${hours.toFixed(1)}h`,
        };
      });
    }
    // yearly — 12 monthly bars
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now); d.setDate(1); d.setMonth(d.getMonth() - (11 - i));
      const ms = allShifts.filter(s => {
        if (!s.check_in) return false;
        const sd = new Date(s.check_in);
        return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      const hours = ms.reduce((a, s) => a + shiftMinutes(s), 0) / 60;
      const lbl = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      return {
        label: lbl, hours,
        tip: `${lbl}: ${hours.toFixed(1)}h · ${new Set(ms.map(s => new Date(s.check_in).toDateString())).size}d · ${ms.length} shifts`,
      };
    });
  }, [allShifts, filteredShifts, period]);

  const maxBarH = Math.max(...graphBars.map(b => b.hours), 0.1);

  const roleBadge = {
    captain: 'bg-green-500/10 text-green-400 border-green-500/20',
    chef:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
    manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    owner:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const leaveStatusColors = {
    pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const periodLabel = { today: 'Today', weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' };
  const graphTitle  = { today: 'Hourly Breakdown — Today', weekly: 'Daily Breakdown — Last 7 Days', monthly: 'Daily Breakdown — This Month', yearly: 'Monthly Breakdown — Last 12 Months' };

  return (
    <div className="space-y-6">

      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-xs font-black uppercase tracking-widest group">
        <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" /> Back to List
      </button>

      {/* Profile header */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-8">
        <div className="flex items-center gap-8 flex-wrap">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/40 shrink-0 shadow-xl shadow-primary/10">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staffUser.name || staffUser._id}`} alt="" className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-black text-white">{staffUser.name || 'Staff Member'}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${roleBadge[staffUser.role] || 'text-text-muted bg-white/5 border-white/10'}`}>{staffUser.role}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${staffUser.is_active !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {staffUser.is_active !== false ? '\u25cf Active' : '\u25cf Disabled'}
              </span>
            </div>
            <div className="flex gap-5 mt-3 flex-wrap text-xs text-text-muted">
              {staffUser.email        && <span className="flex items-center gap-1.5"><Mail size={11} className="text-primary" />{staffUser.email}</span>}
              {staffUser.phone        && <span className="flex items-center gap-1.5"><Phone size={11} className="text-primary" />{staffUser.phone}</span>}
              {staffUser.city         && <span className="flex items-center gap-1.5"><MapPin size={11} className="text-primary" />{staffUser.city}</span>}
              {staffUser.joining_date && <span className="flex items-center gap-1.5"><Calendar size={11} className="text-primary" />Joined {new Date(staffUser.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              {staffUser.salary       && <span className="flex items-center gap-1.5"><DollarSign size={11} className="text-primary" />\u20b9{Number(staffUser.salary).toLocaleString()}/mo</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Employee ID</p>
            <p className="text-lg font-black text-white font-mono">BB-{(staffUser._id || '').slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Period + Tab row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/5">
              {['today','weekly','monthly','yearly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white'}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/5">
              {[{ id:'overview',label:'Overview' },{ id:'shifts',label:'Shifts' },{ id:'leaves',label:'Leaves' },{ id:'orders',label:'Order History' }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:'Total Shifts',  value:totalSessions,              icon:UserCheck, color:'text-primary',    bg:'bg-primary/10'    },
              { label:'Days Worked',   value:uniqueDays,                  icon:Calendar,  color:'text-blue-400',   bg:'bg-blue-500/10'   },
              { label:'Total Hours',   value:totalHours.toFixed(1)+'h',  icon:Clock,     color:'text-green-400',  bg:'bg-green-500/10'  },
              { label:'Avg Hrs/Day',   value:avgHrsPerDay.toFixed(1)+'h',icon:BarChart2, color:'text-orange-400', bg:'bg-orange-500/10' },
            ].map(({ label, value, icon:Icon, color, bg }) => (
              <div key={label} className="bg-secondary/40 rounded-2xl border border-white/5 p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}><Icon size={18} className={color} /></div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{label}</p>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-[9px] text-text-muted mt-0.5">{periodLabel[period]}</p>
                </div>
              </div>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Bar chart */}
              <div className="bg-secondary/40 rounded-3xl border border-white/5 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <BarChart2 size={16} className="text-primary" /> {graphTitle[period]}
                  </h3>
                  <span className="text-[10px] text-text-muted font-bold">{totalHours.toFixed(1)}h total</span>
                </div>
                {/* Chart container — fixed height, flex row aligned to bottom */}
                <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', gap: 2, padding: '0 4px' }}>
                  {graphBars.map((bar, i) => {
                    const pct = maxBarH > 0 ? (bar.hours / maxBarH) * 100 : 0;
                    const barH = Math.max(pct / 100 * 110, bar.hours > 0 ? 3 : 0);
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative' }}
                        className="group">
                        {/* Tooltip */}
                        {bar.hours > 0 && (
                          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, zIndex: 20, pointerEvents: 'none' }}
                            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <div className="bg-[#111] border border-primary/40 rounded-lg px-2 py-1 text-[9px] text-white font-bold whitespace-nowrap shadow-xl">
                              {bar.tip}
                            </div>
                          </div>
                        )}
                        {/* Bar */}
                        <div style={{ width: '100%', height: barH, minHeight: bar.hours > 0 ? 3 : 0, borderRadius: '3px 3px 0 0', transition: 'height 0.5s ease' }}
                          className={bar.hours > 0 ? 'bg-primary/70 group-hover:bg-primary' : 'bg-white/5'} />
                        {/* Label */}
                        <span style={{ fontSize: graphBars.length > 20 ? 6 : 8, color: '#666', fontWeight: 700, textAlign: 'center', lineHeight: 1, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}>
                          {bar.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 4px' }}
                  className="text-[9px] text-text-muted">
                  <span>0h</span>
                  <span>{(maxBarH / 2).toFixed(1)}h</span>
                  <span>{maxBarH.toFixed(1)}h</span>
                </div>
              </div>

              {/* Leave summary + performance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-secondary/40 rounded-2xl border border-white/5 p-5">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase size={13} className="text-primary" />Leave Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                    {[
                      { label:'Total',    value:leaves.length,                                  color:'text-white'      },
                      { label:'Approved', value:leaves.filter(l => l.status === 'approved').length, color:'text-green-400'  },
                      { label:'Pending',  value:leaves.filter(l => l.status === 'pending').length,  color:'text-yellow-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                        <p className={`text-xl font-black ${color}`}>{value}</p>
                        <p className="text-[9px] text-text-muted uppercase font-bold mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-secondary/40 rounded-2xl border border-white/5 p-5">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={13} className="text-primary" />Performance — {periodLabel[period]}</h4>
                  <div className="space-y-4">
                    {[
                      { label:'Days Worked', value:`${uniqueDays}d`, bar: period==='today'?Math.min(1,uniqueDays):period==='weekly'?Math.min(1,uniqueDays/7):period==='monthly'?Math.min(1,uniqueDays/26):Math.min(1,uniqueDays/312) },
                      { label:'Avg Hrs/Shift', value:totalSessions?`${(totalHours/totalSessions).toFixed(1)}h`:'—', bar:Math.min(1,(totalHours/Math.max(totalSessions,1))/10) },
                    ].map(({ label, bar, value }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs font-bold text-text-muted mb-1.5"><span>{label}</span><span className="text-white">{value}</span></div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width:`${Math.max(bar*100,0)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHIFTS TAB */}
          {activeTab === 'shifts' && (
            <div className="space-y-4">
              <div className="bg-secondary/40 rounded-2xl border border-white/5 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  {[{label:'Shifts',value:totalSessions,color:'text-primary'},{label:'Days',value:uniqueDays,color:'text-blue-400'},{label:'Hours',value:totalHours.toFixed(1)+'h',color:'text-green-400'},{label:'Avg/Day',value:avgHrsPerDay.toFixed(1)+'h',color:'text-orange-400'}].map(({label,value,color})=>(
                    <div key={label} className="text-center">
                      <p className={`text-lg font-black ${color}`}>{value}</p>
                      <p className="text-[9px] text-text-muted font-bold uppercase">{label}</p>
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg">{periodLabel[period]}</span>
              </div>
              <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
                <div className="flex px-6 py-3 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
                  <div className="w-[20%]">Date</div><div className="w-[10%]">Day</div><div className="w-[22%]">Check In</div><div className="w-[22%]">Check Out</div><div className="w-[16%]">Duration</div><div className="w-[10%]">Status</div>
                </div>
                <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
                  {filteredShifts.length === 0 ? (
                    <div className="py-16 text-center text-text-muted">
                      <Clock size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="font-bold text-sm uppercase">No shifts for {periodLabel[period].toLowerCase()}</p>
                    </div>
                  ) : filteredShifts.map(s => {
                    const ci = s.check_in  ? new Date(s.check_in)  : null;
                    const co = s.check_out ? new Date(s.check_out) : null;
                    const realMins = shiftMinutes(s);
                    return (
                      <div key={s._id} className="flex items-center px-6 py-3.5 hover:bg-white/3 transition-all">
                        <div className="w-[20%] text-sm text-white font-bold">{s.date}</div>
                        <div className="w-[10%] text-[10px] text-text-muted font-bold">{ci?ci.toLocaleDateString('en-IN',{weekday:'short'}):'—'}</div>
                        <div className="w-[22%] text-sm text-white/80 font-mono">{ci?ci.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}</div>
                        <div className="w-[22%] text-sm text-white/80 font-mono">{co?co.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):<span className="text-green-400 animate-pulse text-xs font-bold">Active</span>}</div>
                        <div className="w-[16%] text-sm font-black text-primary">{formatDuration(realMins)}</div>
                        <div className="w-[10%]"><span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${s.status==='active'?'bg-green-500/20 text-green-400':'bg-white/5 text-text-muted'}`}>{s.status}</span></div>
                      </div>
                    );
                  })}
                </div>
                {filteredShifts.length > 0 && (
                  <div className="px-6 py-3 bg-white/3 border-t border-white/5 flex justify-between text-xs font-bold text-text-muted">
                    <span>{filteredShifts.length} records</span>
                    <span className="text-primary">{totalHours.toFixed(1)}h total, {uniqueDays} days</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEAVES TAB */}
          {activeTab === 'leaves' && (
            <div className="space-y-3">
              {leaves.length === 0 ? (
                <div className="py-20 text-center text-text-muted bg-secondary/40 rounded-3xl border border-white/5">
                  <Briefcase size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-sm uppercase tracking-widest">No leave applications</p>
                </div>
              ) : leaves.map(l => (
                <div key={l._id} className="bg-secondary/40 rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-white capitalize">{l.leave_type} Leave</span>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${leaveStatusColors[l.status]}`}>{l.status}</span>
                      </div>
                      <p className="text-xs text-text-muted">
                        {new Date(l.from_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} to {new Date(l.to_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        <span className="ml-2 text-primary font-bold">({l.days} day{l.days!==1?'s':''})</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-text-muted">Applied: {new Date(l.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 mb-3">
                    <p className="text-[9px] text-text-muted uppercase font-bold mb-1">Reason</p>
                    <p className="text-xs text-white/80">{l.reason}</p>
                  </div>
                  {l.approved_by && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${l.status==='approved'?'bg-green-500/5 border-green-500/20 text-green-400':'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                      {l.status==='approved'?<CheckCircle size={12}/>:<XCircle size={12}/>}
                      <span className="font-bold">{l.status==='approved'?'Approved':'Rejected'} by {l.approved_by?.name}</span>
                      {l.approved_at && <span className="text-text-muted ml-1">· {new Date(l.approved_at).toLocaleDateString()}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <ClipboardList size={16} className="text-primary" /> Order History
                </h3>
                <span className="text-[10px] text-text-muted font-bold bg-white/5 px-3 py-1.5 rounded-lg">{staffOrders.length} total orders</span>
              </div>
              {staffOrders.length === 0 ? (
                <div className="py-20 text-center text-text-muted bg-secondary/40 rounded-3xl border border-white/5">
                  <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-sm uppercase tracking-widest">No orders found for this staff</p>
                </div>
              ) : (
                <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
                  <div className="flex px-6 py-3 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
                    <div className="w-[14%]">Order #</div>
                    <div className="w-[18%]">Date</div>
                    <div className="w-[13%]">Type</div>
                    <div className="w-[12%]">Table</div>
                    <div className="w-[13%]">Total</div>
                    <div className="w-[15%]">Role</div>
                    <div className="w-[15%]">Status</div>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
                    {staffOrders.map(o => {
                      const isChef    = String(o.chef_id?._id    || o.chef_id)    === String(staffUser._id);
                      const isCaptain = String(o.captain_id?._id || o.captain_id) === String(staffUser._id);
                      const roleLabel = isChef && isCaptain ? 'Chef+Cap' : isChef ? 'Chef' : 'Captain';
                      return (
                        <div key={o._id} className="flex items-center px-6 py-3.5 hover:bg-white/3 transition-all">
                          <div className="w-[14%] text-sm font-black text-primary">#{o.order_number}</div>
                          <div className="w-[18%] text-xs text-white/60">{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</div>
                          <div className="w-[13%]">
                            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-white/5 text-white/50 uppercase">{(o.order_type||'dine-in').replace('_','-')}</span>
                          </div>
                          <div className="w-[12%] text-sm text-white/60">{o.table_number || '—'}</div>
                          <div className="w-[13%] text-sm font-black text-white">${o.total}</div>
                          <div className="w-[15%]">
                            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary uppercase">{roleLabel}</span>
                          </div>
                          <div className="w-[15%]">
                            <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase border ${STATUS_COLORS[o.status] || 'bg-white/5 text-white/40 border-white/10'}`}>{STATUS_LABELS[o.status] || o.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-6 py-3 bg-white/3 border-t border-white/5 flex justify-between text-xs font-bold text-text-muted">
                    <span>{staffOrders.length} orders total</span>
                    <span className="text-primary">${staffOrders.reduce((s,o) => s+(o.total||0),0).toFixed(2)} handled</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  CUSTOMERS PANEL
// ══════════════════════════════════════════════════════════════════════════════
const CustomersPanel = () => {
  const [customers,   setCustomers]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(null);
  const [custOrders,  setCustOrders]  = useState([]);
  const [ordLoading,  setOrdLoading]  = useState(false);

  const loadCustomers = (silent = false) => {
    if (!silent) setLoading(true);
    usersAPI.getCustomers()
      .then(r => setCustomers(r.data || []))
      .catch(() => setCustomers([]))
      .finally(() => { if (!silent) setLoading(false); });
  };
  useEffect(() => { loadCustomers(false); }, []);
  useAutoRefresh(loadCustomers, 30000);

  const openCustomer = async (c) => {
    setSelected(c);
    setOrdLoading(true);
    try {
      const r = await ordersAPI.getAll(`?customer_id=${c._id}`);
      setCustOrders(r.data || []);
    } catch { setCustOrders([]); }
    setOrdLoading(false);
  };

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (selected) {
    const totalSpent = custOrders.filter(o => o.status === 'paid').reduce((s,o) => s+(o.total||0), 0);
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-xs font-black uppercase tracking-widest group">
          <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" /> Back to Customers
        </button>

        {/* Customer header */}
        <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-8 flex items-center gap-8 flex-wrap">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/40 shrink-0">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selected.name || selected._id}`} alt="" className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-black text-white">{selected.name || 'Unknown'}</h2>
            <div className="flex gap-4 mt-2 flex-wrap text-xs text-text-muted">
              {selected.email && <span className="flex items-center gap-1.5"><Mail size={11} className="text-primary" />{selected.email}</span>}
              {selected.phone && <span className="flex items-center gap-1.5"><Phone size={11} className="text-primary" />{selected.phone}</span>}
              <span className="flex items-center gap-1.5"><Calendar size={11} className="text-primary" />Joined {new Date(selected.created_at || Date.now()).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Total Orders', value: custOrders.length, color: 'text-primary' },
              { label: 'Paid Orders', value: custOrders.filter(o=>o.status==='paid').length, color: 'text-green-400' },
              { label: 'Total Spent', value: `$${totalSpent.toFixed(0)}`, color: 'text-yellow-400' },
              { label: 'Loyalty Pts', value: selected.loyalty_points || 0, color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/5 rounded-2xl px-5 py-3 text-center border border-white/5">
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-[9px] text-text-muted uppercase font-bold mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <ClipboardList size={15} className="text-primary" /> Order History
          </h3>
          {ordLoading ? (
            <div className="flex justify-center py-10"><Loader size={24} className="animate-spin text-primary" /></div>
          ) : custOrders.length === 0 ? (
            <div className="py-14 text-center bg-secondary/40 rounded-3xl border border-white/5 text-text-muted">
              <ClipboardList size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase">No orders yet</p>
            </div>
          ) : (
            <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
              <div className="flex px-6 py-3 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
                <div className="w-[14%]">Order #</div><div className="w-[20%]">Date</div><div className="w-[15%]">Type</div>
                <div className="w-[12%]">Table</div><div className="w-[14%]">Total</div><div className="w-[15%]">Status</div><div className="w-[10%]">Rating</div>
              </div>
              <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
                {custOrders.map(o => (
                  <div key={o._id} className="flex items-center px-6 py-3.5 hover:bg-white/3 transition-all">
                    <div className="w-[14%] text-sm font-black text-primary">#{o.order_number}</div>
                    <div className="w-[20%] text-xs text-white/60">{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</div>
                    <div className="w-[15%]"><span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-white/5 text-white/50 uppercase">{(o.order_type||'dine-in').replace('_','-')}</span></div>
                    <div className="w-[12%] text-sm text-white/60">{o.table_number||'—'}</div>
                    <div className="w-[14%] text-sm font-black text-white">${o.total}</div>
                    <div className="w-[15%]"><span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase border ${STATUS_COLORS[o.status]||'bg-white/5 text-white/40 border-white/10'}`}>{STATUS_LABELS[o.status]||o.status}</span></div>
                    <div className="w-[10%] text-sm text-yellow-400 font-bold">{o.rating ? `★ ${o.rating}` : '—'}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 bg-white/3 border-t border-white/5 flex justify-between text-xs font-bold text-text-muted">
                <span>{custOrders.length} orders</span>
                <span className="text-primary">${totalSpent.toFixed(2)} paid</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">All Customers</h2>
          <p className="text-xs text-text-muted mt-1">{customers.length} registered customers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadCustomers} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => {
              // Download customers as CSV
              const headers = ['Name','Email','Phone','Orders','Loyalty Points','Status','Joined'];
              const rows = customers.map(u => [
                u.name || '',
                u.email || '',
                u.phone || '',
                u.order_count || 0,
                u.loyalty_points || 0,
                u.is_active ? 'Active' : 'Inactive',
                u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
              ]);
              const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'biryanibox_customers.csv';
              document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-xs font-black text-green-400 hover:bg-green-500/20 transition-all uppercase tracking-widest">
            ⬇ Download CSV
          </button>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/40 w-72"
          />
        </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-secondary/40 rounded-3xl border border-white/5 text-text-muted">
          <Users size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-bold text-sm uppercase tracking-widest">No customers found</p>
        </div>
      ) : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="flex px-6 py-3 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
            <div className="w-[30%]">Customer</div>
            <div className="w-[25%]">Email</div>
            <div className="w-[15%]">Phone</div>
            <div className="w-[12%]">Orders</div>
            <div className="w-[10%]">Points</div>
            <div className="w-[8%]">Status</div>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map(c => (
              <div key={c._id} onClick={() => openCustomer(c)}
                className="flex items-center px-6 py-4 hover:bg-white/5 cursor-pointer transition-all group">
                <div className="w-[30%] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name||c._id}`} alt="" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{c.name || '—'}</p>
                </div>
                <div className="w-[25%] text-xs text-white/50 truncate">{c.email || '—'}</div>
                <div className="w-[15%] text-xs text-white/50">{c.phone || '—'}</div>
                <div className="w-[12%] text-sm font-black text-primary">{c.order_count || 0}</div>
                <div className="w-[10%] text-sm font-bold text-yellow-400">{c.loyalty_points || 0}</div>
                <div className="w-[8%]">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${c.is_active !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {c.is_active !== false ? 'Active' : 'Off'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MY PROFILE PANEL — Comprehensive self-profile for owner/manager/captain/chef
// ══════════════════════════════════════════════════════════════════════════════
const MyProfilePanel = ({ user }) => {
  const { user: authUser, updateUser } = useAuth();
  const [tab, setTab]                 = useState('profile');
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState({ text: '', type: '' });
  const [shiftStats, setShiftStats]   = useState({ total: 0, hours: 0, today: 0 });
  const [orderStats, setOrderStats]   = useState({ total: 0, paid: 0 });

  const [form, setForm] = useState({
    name:  user.name  || '',
    phone: user.phone || '',
    dob:   user.dob   ? user.dob.split('T')[0] : '',
    gender: user.gender || '',
    address: user.address || '',
    city:    user.city    || '',
    state:   user.state   || '',
    emergency_contact_name:  user.emergency_contact_name  || '',
    emergency_contact_phone: user.emergency_contact_phone || '',
  });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const spw = f => e => setPwForm(p => ({ ...p, [f]: e.target.value }));

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  };

  // Load stats
  useEffect(() => {
    shiftsAPI.getAll(`?user_id=${user._id}`).then(r => {
      const s = r.data || [];
      const today = new Date(); today.setHours(0,0,0,0);
      const hrs = s.reduce((a, sh) => {
        if (!sh.check_in) return a;
        const co = sh.check_out ? new Date(sh.check_out) : new Date();
        return a + (co - new Date(sh.check_in)) / 3600000;
      }, 0);
      setShiftStats({ total: s.length, hours: hrs.toFixed(1), today: s.filter(sh => sh.check_in && new Date(sh.check_in) >= today).length });
    }).catch(() => {});

    ordersAPI.getAll(`?captain_id=${user._id}`).then(r => {
      const o = r.data || [];
      setOrderStats({ total: o.length, paid: o.filter(x => x.status === 'paid').length });
    }).catch(() => {});
  }, [user._id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersAPI.updateMe(form);
      // Refresh auth context so navbar/header name updates immediately
      if (updateUser) updateUser({ name: form.name, phone: form.phone, ...form });
      flash('Profile updated successfully!');
      setEditing(false);
      // Update name in the form in case it changed
      setForm(p => ({ ...p }));
    } catch (err) { flash(err.message || 'Failed to update profile', 'error'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      flash('New passwords do not match', 'error'); return;
    }
    if (pwForm.new_password.length < 6) {
      flash('Password must be at least 6 characters', 'error'); return;
    }
    setSaving(true);
    try {
      await usersAPI.changeMyPassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      flash('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { flash(err.message || 'Failed to change password', 'error'); }
    finally { setSaving(false); }
  };

  const roleBadgeColor = {
    owner:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
    manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    captain: 'bg-green-500/20 text-green-400 border-green-500/30',
    chef:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    delivery:'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  const TABS = [
    { id: 'profile',  label: 'My Profile',      icon: User },
    { id: 'security', label: 'Password',         icon: Shield },
    { id: 'stats',    label: 'My Stats',         icon: BarChart2 },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Hero Card */}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-8">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-xl shadow-primary/10">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user._id}`} alt="" className="w-full h-full" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-secondary flex items-center justify-center">
              <span className="text-[7px] font-black text-white">●</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-3xl font-black text-white">{form.name || user.name}</h2>
              <span className={`text-xs font-black px-3 py-1 rounded-full border uppercase ${roleBadgeColor[user.role] || 'bg-white/5 text-text-muted border-white/10'}`}>
                {user.role}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><Mail size={11} className="text-primary" />{user.email}</span>
              {(form.phone || user.phone) && <span className="flex items-center gap-1.5"><Phone size={11} className="text-primary" />{form.phone || user.phone}</span>}
              {(form.city || user.city) && <span className="flex items-center gap-1.5"><MapPin size={11} className="text-primary" />{form.city || user.city}</span>}
            </div>
          </div>

          {/* Employee ID */}
          <div className="text-right shrink-0">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Employee ID</p>
            <p className="text-lg font-black text-white font-mono">BB-{(user._id || '').slice(-6).toUpperCase()}</p>
            <p className="text-[10px] text-text-muted mt-1">Since {user.joining_date ? new Date(user.joining_date).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : 'N/A'}</p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6 pt-6 border-t border-white/5">
          {[
            { label: 'Total Shifts',  value: shiftStats.total,          color: 'text-primary'    },
            { label: 'Hours Worked',  value: shiftStats.hours + 'h',    color: 'text-green-400'  },
            { label: 'Orders Served', value: orderStats.total,          color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/5 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Flash */}
      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/8 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${tab === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white'}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ─────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2"><User size={18} className="text-primary" />Personal Information</h3>
            <button onClick={() => setEditing(e => !e)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${editing ? 'bg-white/10 text-text-muted' : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white'}`}>
              {editing ? <><X size={13} /> Cancel</> : <><Edit2 size={13} /> Edit Profile</>}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Full Name *</label>
                  <input required value={form.name} onChange={sf('name')}
                    className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                </div>
                {/* Phone */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Phone</label>
                  <input value={form.phone} onChange={sf('phone')} placeholder="+1 555 000 0000"
                    className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                </div>
                {/* DOB */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Date of Birth</label>
                  <input type="date" value={form.dob} onChange={sf('dob')}
                    className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                </div>
                {/* Gender */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Gender</label>
                  <select value={form.gender} onChange={sf('gender')}
                    className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {/* Address */}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Address</label>
                  <input value={form.address} onChange={sf('address')} placeholder="Street address"
                    className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                </div>
                {/* City */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">City</label>
                  <input value={form.city} onChange={sf('city')}
                    className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                </div>
                {/* State */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">State</label>
                  <input value={form.state} onChange={sf('state')}
                    className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                </div>
                {/* Emergency Contact Name */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Emergency Contact Name</label>
                  <input value={form.emergency_contact_name} onChange={sf('emergency_contact_name')}
                    className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                </div>
                {/* Emergency Contact Phone */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Emergency Contact Phone</label>
                  <input value={form.emergency_contact_phone} onChange={sf('emergency_contact_phone')}
                    className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover disabled:opacity-60 transition-all">
                  {saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="px-8 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[
                { label: 'Full Name',        value: user.name },
                { label: 'Email',            value: user.email },
                { label: 'Phone',            value: form.phone || user.phone || '—' },
                { label: 'Role',             value: user.role },
                { label: 'Employee ID',      value: `BB-${(user._id||'').slice(-6).toUpperCase()}` },
                { label: 'Date of Birth',    value: (form.dob||user.dob) ? new Date(form.dob||user.dob).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'}) : '—' },
                { label: 'Gender',           value: (form.gender||user.gender) ? (form.gender||user.gender).charAt(0).toUpperCase()+(form.gender||user.gender).slice(1) : '—' },
                { label: 'City',             value: form.city || user.city || '—' },
                { label: 'State',            value: form.state || user.state || '—' },
                { label: 'Address',          value: form.address || user.address || '—' },
                { label: 'Emergency Contact',value: (form.emergency_contact_name||user.emergency_contact_name) || '—' },
                { label: 'Emergency Phone',  value: (form.emergency_contact_phone||user.emergency_contact_phone) || '—' },
                { label: 'Joining Date',     value: user.joining_date ? new Date(user.joining_date).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'}) : '—' },
                { label: 'Salary',           value: user.salary ? `$${Number(user.salary).toLocaleString()}/mo` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{label}</p>
                  <p className="font-bold text-white text-sm truncate">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECURITY TAB ────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-8 space-y-6">
          <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2"><Shield size={18} className="text-primary" />Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Current Password *</label>
              <input type="password" required value={pwForm.current_password} onChange={spw('current_password')}
                placeholder="Enter current password"
                className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">New Password *</label>
              <input type="password" required value={pwForm.new_password} onChange={spw('new_password')}
                placeholder="At least 6 characters"
                className="w-full bg-bg-main border border-white/20 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Confirm New Password *</label>
              <input type="password" required value={pwForm.confirm_password} onChange={spw('confirm_password')}
                placeholder="Repeat new password"
                className={`w-full bg-bg-main border p-3 rounded-xl outline-none text-white text-sm ${pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary'}`} />
              {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                <p className="text-xs text-red-400 mt-1 font-bold">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={saving || (pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password)}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover disabled:opacity-60 transition-all">
              {saving ? <Loader size={13} className="animate-spin" /> : <Shield size={13} />}
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-2">
            <p className="text-xs font-black text-white uppercase tracking-widest mb-2">🔒 Security Tips</p>
            <ul className="space-y-1 text-xs text-text-muted">
              <li>• Use at least 8 characters with a mix of letters and numbers</li>
              <li>• Never share your password with anyone</li>
              <li>• Change your password every 90 days</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── STATS TAB ───────────────────────────────────────────── */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Shifts',    value: shiftStats.total,       icon: UserCheck,    color: 'text-primary',    bg: 'bg-primary/10'    },
              { label: 'Hours Logged',    value: shiftStats.hours + 'h', icon: Clock,        color: 'text-green-400',  bg: 'bg-green-500/10'  },
              { label: 'Today\'s Shifts', value: shiftStats.today,       icon: Activity,     color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
              { label: 'Orders Handled',  value: orderStats.total,       icon: ClipboardList, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-secondary/40 rounded-2xl border border-white/5 p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}><Icon size={18} className={color} /></div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{label}</p>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Account info summary */}
          <div className="bg-secondary/40 rounded-3xl border border-white/10 p-4 md:p-6 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <User size={15} className="text-primary" /> Account Summary
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Account Status', value: user.is_active !== false ? '✅ Active' : '❌ Disabled',        color: user.is_active !== false ? 'text-green-400' : 'text-red-400' },
                { label: 'Verified Email', value: user.is_verified ? '✅ Verified' : '⏳ Pending',              color: user.is_verified ? 'text-green-400' : 'text-yellow-400' },
                { label: 'Last Check-in',  value: user.last_checkin_at ? new Date(user.last_checkin_at).toLocaleDateString() : '—', color: 'text-white' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{label}</p>
                  <p className={`font-black text-sm ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user, logout } = useAuth();
const navigate = useNavigate();
  const {
    orders, menu, ingredients,
    updateOrderStatus: ctxUpdateStatus, deleteOrder,
    updateMenuStock, toggleMenuAvailability, updateIngredientStock,
    getFinancialMetrics, loadOrders,
  } = useOrders();

  const defaultTab = user.role === 'chef' ? 'kitchen' : user.role === 'captain' ? 'tables' : 'overview';
  const [liveDeliveries, setLiveDeliveries] = React.useState([]);

  // Load delivery records for dispatch gating
  React.useEffect(() => {
    const loadDeliveries = async () => {
      try {
        const r = await deliveryAPI.getAll();
        setLiveDeliveries(r.data || []);
      } catch {}
    };
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 15000);
    return () => clearInterval(interval);
  }, []);
  // ── URL tab history: back/forward navigates between tabs ──────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (() => {
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab;
    try { return localStorage.getItem(`bb_dashboard_tab_${user.role}`) || defaultTab; } catch { return defaultTab; }
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [financial, setFinancial] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [profileViewUser, setProfileViewUser] = useState(null);
  const [captainTableNumbers, setCaptainTableNumbers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Check-in gate for non-owner staff
  const [checkedIn, setCheckedIn] = useState(
    user.role === 'owner' || user.role === 'customer'
  );

  // Load check-in status for staff roles
  useEffect(() => {
    if (['manager','captain','chef','delivery'].includes(user.role)) {
      shiftsAPI.getMyActive()
        .then(r => setCheckedIn(!!(r.data)))
        .catch(() => setCheckedIn(false));
    }
  }, [user.role]);

  // Poll check-in status every 30s so it auto-unlocks when they check in
  useAutoRefresh(() => {
    if (['manager','captain','chef','delivery'].includes(user.role)) {
      shiftsAPI.getMyActive()
        .then(r => setCheckedIn(!!(r.data)))
        .catch(() => {});
    }
  }, 15000);

  // Load captain's assigned tables for zone-aware filtering
  useEffect(() => {
    if (user.role === 'captain') {
      tablesAPI.getMyTables()
        .then(res => setCaptainTableNumbers((res.data || []).map(t => parseInt(t.table_number)).filter(n => !isNaN(n))))
        .catch(() => setCaptainTableNumbers([]));
    }
  }, [user.role]);

  const TITLE_MAP = {
    overview: 'Command Hub', pos: 'Order Booking', orders: 'Orders',
    kitchen: 'My Kitchen', menu: 'Menu Master', tables: 'Table Status',
    reservations: 'Reservations', catering: 'Catering Orders', feedback: 'Feedback Box',
    announcements: 'Announcements', leaves: 'Leave Module', shifts: 'Shift Logs',
    staffmgmt: 'Staff Management', finance: 'Finance Center', riders: 'Riders Hub', waste_chef: 'Waste Log',
    customers: 'Customers',
    my_orders: 'My Orders', captain_bonus: 'My Bonus', chef_orders: 'Order History', staff: 'My Profile',
  };

  useEffect(() => {
    let cancelled = false;
    // Only owner and manager are authorized to call financials endpoint
    if (['owner', 'manager'].includes(user.role)) {
      getFinancialMetrics?.().then(r => { if (!cancelled && r?.revenue != null) setFinancial(r); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [orders]);

  // Soft refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadOrders(); } catch {}
    setTimeout(() => setRefreshing(false), 600);
  }, [loadOrders]);

  // Accept / Reject a dine-in pending_confirmation order (owner + manager only)
  const confirmOrder = useCallback(async (id, action) => {
    try {
      await ordersAPI.confirmOrder(id, action);
      handleRefresh();
    } catch (err) {
      console.error('[confirmOrder]', err.message);
    }
  }, [handleRefresh]);

  // Role-aware status update: chef can only do start_cooking / completed_cooking
  // captain/manager/owner can do served / paid / dispatched
  const updateOrderStatus = useCallback(async (id, status) => {
    const CHEF_OK    = ['start_cooking', 'completed_cooking'];
    const CAPTAIN_OK = ['start_cooking', 'completed_cooking', 'dispatched', 'served', 'paid', 'cancelled'];
    if (user.role === 'chef'    && !CHEF_OK.includes(status))    return;
    if (user.role === 'captain' && !CAPTAIN_OK.includes(status)) return;

    // When dispatching a delivery order, also call deliveryAPI.dispatch()
    // on the linked delivery record so captain_dispatched=true and rider pickup unlocks
    if (status === 'dispatched') {
      try {
        const orderObj = orders.find(o => o._id === id);
        if (orderObj && ['delivery', 'pickup'].includes(orderObj.order_type)) {
          // Find the delivery record for this order
          const allDeliveries = await deliveryAPI.getAll();
          const linked = (allDeliveries.data || []).find(
            d => (d.order_id?._id || d.order_id) === id && d.status === 'assigned'
          );
          if (linked) {
            await deliveryAPI.dispatch(linked._id);
            // deliveryAPI.dispatch already updates order status to dispatched in backend
            // so just refresh and skip ctxUpdateStatus to avoid double-update
            await ctxUpdateStatus(id, status);
            return;
          }
        }
      } catch (err) {
        console.error('Delivery dispatch error:', err.message);
      }
    }

    await ctxUpdateStatus(id, status);
  }, [user.role, ctxUpdateStatus, orders]);

  const isAdmin = ['owner', 'manager'].includes(user.role);

  // Wrap tab change to also clear staff profile view
  // Stable logout handler — created once so Sidebar memo is never broken
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleTabChange = useCallback((tab) => {
    setProfileViewUser(null);
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: false });
    try { localStorage.setItem(`bb_dashboard_tab_${user.role}`, tab); } catch {}
  }, [user.role, setSearchParams]);

  // Sync tab when browser navigates back/forward
  const _urlTab = searchParams.get('tab');
  React.useEffect(() => {
    if (_urlTab && _urlTab !== activeTab) {
      setProfileViewUser(null);
      setActiveTab(_urlTab);
    }
  }, [_urlTab]);

  return (
    <div className="min-h-screen bg-bg-main flex">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} user={user} unreadAnnouncements={unreadAnnouncements} onLogout={handleLogout} captainTableNumbers={captainTableNumbers} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-hidden">
        <Header title={profileViewUser ? `${profileViewUser.name || 'Staff'} — Profile` : (TITLE_MAP[activeTab] || '')} onRefresh={handleRefresh} loading={refreshing} onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-3 md:py-4 md:py-6">
          {/* ── Shift Badge — hidden for owner ───────────────────────────── */}
          {user.role !== 'owner' && (
            <div className="flex justify-end mb-4">
              <ShiftCheckinBadge />
            </div>
          )}

          {/* ── CHECK-IN GATE: staff must check in to access dashboard ──── */}
          {['manager','captain','chef','delivery'].includes(user.role) && !checkedIn ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 md:px-8">
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mb-6">
                <Shield size={36} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Check In Required</h2>
              <p className="text-text-muted text-sm max-w-md mb-8">
                You must check in to access the dashboard. Use the <strong className="text-primary">Check In</strong> button above to start your shift.
              </p>
              <div className="bg-secondary/40 border border-white/10 rounded-2xl p-6 text-left max-w-sm w-full">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Logged in as</p>
                <p className="text-white font-black text-lg">{user.name}</p>
                <p className="text-primary text-xs font-bold uppercase mt-1">{user.role}</p>
              </div>
            </div>
          ) : (
          <>

          {/* ── Staff Profile Full Page View ─────────────────────────────── */}
          {profileViewUser ? (
            <StaffProfileView staffUser={profileViewUser} onBack={() => setProfileViewUser(null)} />
          ) : (
          <AnimatePresence mode="wait">

            {/* COMMAND HUB */}
            {activeTab === 'overview' && (
              <MotionDiv key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <Overview orders={orders} financial={financial} />
              </MotionDiv>
            )}

            {/* ORDER BOOKING — POS only, no live orders table */}
            {activeTab === 'pos' && (
              <MotionDiv key="pos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Plus size={18} className="text-primary" />Place New Order</h3>
                <POS user={user} />
              </MotionDiv>
            )}

            {/* LIVE ORDERS */}
            {activeTab === 'orders' && (
              <MotionDiv key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <OrderBookingPanel orders={orders} user={user} updateOrderStatus={updateOrderStatus} confirmOrder={confirmOrder} deleteOrder={deleteOrder} captainTableNumbers={captainTableNumbers} liveDeliveries={liveDeliveries} />
              </MotionDiv>
            )}

            {/* CHEF KITCHEN */}
            {activeTab === 'kitchen' && (
              <MotionDiv key="kitchen" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <ChefKitchenModule orders={orders} updateOrderStatus={updateOrderStatus} ingredients={ingredients} />
              </MotionDiv>
            )}

            {/* MENU MASTER */}
            {activeTab === 'menu' && (
              <MotionDiv key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <MenuMaster
                  menu={menu}
                  updateMenuStock={updateMenuStock}
                  toggleMenuAvailability={toggleMenuAvailability}
                  ingredients={ingredients}
                  updateIngredientStock={updateIngredientStock}
                />
              </MotionDiv>
            )}

            {/* TABLE STATUS */}
            {activeTab === 'tables' && (
              <MotionDiv key="tables" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <TableStatus user={user} />
              </MotionDiv>
            )}

            {/* RESERVATIONS */}
            {activeTab === 'reservations' && (
              <MotionDiv key="reservations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <ReservationsPanel />
              </MotionDiv>
            )}

            {/* FEEDBACK BOX */}
            {activeTab === 'feedback' && isAdmin && (
              <MotionDiv key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FeedbackBox userRole={user.role} />
              </MotionDiv>
            )}

            {/* CATERING ORDERS */}
            {activeTab === 'catering' && isAdmin && (
              <MotionDiv key="catering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CateringPanel />
              </MotionDiv>
            )}

            {/* LEAVE MODULE */}
            {activeTab === 'leaves' && (
              <MotionDiv key="leaves" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LeaveModule user={user} />
              </MotionDiv>
            )}

            {/* ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <MotionDiv key="announcements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnnouncementsPanel isAdmin={isAdmin} />
              </MotionDiv>
            )}

            {/* SHIFT LOGS */}
            {activeTab === 'shifts' && (
              <MotionDiv key="shifts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ShiftLogs user={user} isAdmin={isAdmin} onViewProfile={setProfileViewUser} />
              </MotionDiv>
            )}

            {/* STAFF MANAGEMENT */}
            {activeTab === 'staffmgmt' && isAdmin && (
              <MotionDiv key="staffmgmt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StaffManagement currentUserRole={user.role} onViewProfile={setProfileViewUser} />
              </MotionDiv>
            )}

            {/* RIDERS HUB */}
            {activeTab === 'riders' && (isAdmin || user.role === 'captain') && (
              <MotionDiv key="riders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RidersPanel currentUserRole={user.role} />
              </MotionDiv>
            )}

            {/* CUSTOMERS */}
            {activeTab === 'customers' && user.role === 'owner' && (
              <MotionDiv key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CustomersPanel />
              </MotionDiv>
            )}

            {/* FINANCE CENTER */}
            {activeTab === 'finance' && isAdmin && (
              <MotionDiv key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FinanceCenter orders={orders} />
              </MotionDiv>
            )}

            {/* CAPTAIN MY ORDERS */}
            {activeTab === 'my_orders' && user.role === 'captain' && (
              <MotionDiv key="my_orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <CaptainMyOrders user={user} allOrders={orders} captainTableNumbers={captainTableNumbers} />
              </MotionDiv>
            )}

            {/* CAPTAIN BONUS MODULE */}
            {activeTab === 'captain_bonus' && user.role === 'captain' && (
              <MotionDiv key="captain_bonus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CaptainBonusModule user={user} allOrders={orders} captainTableNumbers={captainTableNumbers} />
              </MotionDiv>
            )}

            {/* CHEF ORDER HISTORY */}
            {activeTab === 'chef_orders' && user.role === 'chef' && (
              <MotionDiv key="chef_orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChefOrderHistory user={user} allOrders={orders} />
              </MotionDiv>
            )}

            {/* CHEF WASTE LOG */}
            {activeTab === 'waste_chef' && user.role === 'chef' && (
              <MotionDiv key="waste_chef" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WasteManagement ingredients={ingredients} />
              </MotionDiv>
            )}

            {/* MY PROFILE */}
            {activeTab === 'staff' && (
              <MotionDiv key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MyProfilePanel user={user} />
              </MotionDiv>
            )}

          </AnimatePresence>
          )} {/* end profileViewUser conditional */}
          </> /* end checkedIn gate */
          )}
        </main>
      </div>
    </div>
  );
};


export default Dashboard;