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
  Timer, ToggleLeft, ToggleRight, Hash,
} from 'lucide-react';
import { useAuth, useOrders } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import {
  usersAPI, ordersAPI, ingredientsAPI, reservationsAPI, tablesAPI,
  feedbackAPI, announcementsAPI, shiftsAPI, notificationsAPI, normalizeOrder,
  menuAPI,
} from '../services/api';
import POS from '../components/POS';

// ─── Auto-refresh hook ───────────────────────────────────────────────────────
const useAutoRefresh = (callback, intervalMs = 30000) => {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:           'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  start_cooking:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  completed_cooking: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  served:            'bg-green-500/10 text-green-400 border-green-500/20',
  paid:              'bg-primary/20 text-primary border-primary/30',
  cancelled:         'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_LABELS = {
  pending:           'Pending',
  start_cooking:     'Cooking',
  completed_cooking: 'Ready',
  served:            'Served',
  paid:              'Paid',
  cancelled:         'Cancelled',
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ activeTab, setActiveTab, user, unreadAnnouncements }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const allItems = [
    { id: 'overview',      label: 'Command Hub',    icon: PieChart,        roles: ['owner', 'manager'] },
    { id: 'pos',           label: 'Order Booking',  icon: OrderIcon,       roles: ['owner', 'manager', 'captain'] },
    { id: 'orders',        label: 'Live Orders',    icon: Monitor,         roles: ['owner', 'manager', 'captain', 'chef'] },
    { id: 'kitchen',       label: 'My Kitchen',     icon: ChefHat,         roles: ['chef'] },
    { id: 'menu',          label: 'Menu Master',    icon: FileText,        roles: ['owner', 'manager'] },
    { id: 'tables',        label: 'Table Status',   icon: LayoutDashboard, roles: ['owner', 'manager', 'captain'] },
    { id: 'reservations',  label: 'Reservations',   icon: Calendar,        roles: ['owner', 'manager', 'captain'] },
    { id: 'feedback',      label: 'Feedback Box',   icon: MessageSquare,   roles: ['owner', 'manager'] },
    { id: 'announcements', label: 'Announcements',  icon: Megaphone,       roles: ['owner', 'manager', 'chef', 'captain'] },
    { id: 'shifts',        label: 'Shift Logs',     icon: UserCheck,       roles: ['owner', 'manager', 'chef', 'captain'] },
    { id: 'staffmgmt',     label: 'Staff Mgmt',     icon: Users,           roles: ['owner', 'manager'] },
    { id: 'my_orders',     label: 'My Orders',      icon: ClipboardList,   roles: ['captain'] },
    { id: 'chef_orders',   label: 'Order History',  icon: ClipboardList,   roles: ['chef'] },
    { id: 'staff',         label: 'My Profile',     icon: User,            roles: ['owner', 'manager', 'captain', 'chef'] },
  ];

  const items = allItems.filter(i => i.roles.includes(user.role));

  return (
    <div className="w-64 bg-bg-main border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-50 overflow-y-auto">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-xl border border-primary/20">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Command size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">BIRYANI BOX</p>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest">SYSTEM.v2</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-1">
        {items.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
            <div className="flex items-center gap-3">
              <item.icon size={16} className={activeTab === item.id ? 'text-white' : 'text-primary/70'} />
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
        <button onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 p-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────
const Header = ({ title, onRefresh, loading }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-bg-main/80 backdrop-blur-xl sticky top-0 z-40">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="flex items-center gap-3">
        <button onClick={onRefresh}
          className={`w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-primary transition-all ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={14} />
        </button>
        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white uppercase tracking-wider">{user.name}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mt-1">{user.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
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

  const load = useCallback(async () => {
    try { const r = await shiftsAPI.getMyActive(); setActiveShift(r.data || null); } catch { setActiveShift(null); }
  }, []);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 60000);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const handleCheckIn = async () => {
    setLoading(true);
    try { await shiftsAPI.checkIn(); flash('Checked in!'); load(); } catch (e) { flash(e.message); }
    finally { setLoading(false); }
  };
  const handleCheckOut = async () => {
    if (!activeShift) return;
    setLoading(true);
    try { await shiftsAPI.checkOut(activeShift._id); flash('Checked out!'); load(); } catch (e) { flash(e.message); }
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
const OrderTable = ({ orders, user, onStatusUpdate, onDelete, statusColors }) => {
  // Which statuses can this role trigger?
  const chefStatuses     = ['start_cooking', 'completed_cooking'];
  const captainStatuses  = ['served', 'paid'];
  const managerStatuses  = ['served', 'paid', 'cancelled'];

  const TRANSITIONS = {
    pending:           'start_cooking',
    start_cooking:     'completed_cooking',
    completed_cooking: 'served',
    served:            'paid',
  };

  const canAdvance = (order) => {
    const next = TRANSITIONS[order.status];
    if (!next) return false;
    if (user.role === 'chef') return chefStatuses.includes(next);
    if (user.role === 'captain') return captainStatuses.includes(next);
    if (['manager', 'owner'].includes(user.role)) return managerStatuses.includes(next);
    return false;
  };

  const nextLabel = { start_cooking: '▶ Start', completed_cooking: '✓ Done', served: 'Serve', paid: 'Paid ✓' };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-text-muted uppercase tracking-widest border-b border-white/5">
            <th className="text-left px-4 py-3 font-bold">Order</th>
            <th className="text-left px-4 py-3 font-bold">Table</th>
            <th className="text-left px-4 py-3 font-bold">Items</th>
            <th className="text-left px-4 py-3 font-bold">Total</th>
            <th className="text-left px-4 py-3 font-bold">Status</th>
            <th className="text-left px-4 py-3 font-bold">Spice</th>
            <th className="text-left px-4 py-3 font-bold">Time</th>
            <th className="text-right px-4 py-3 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map(ord => {
            const id = ord._id || ord.id;
            const items = ord.items || [];
            const total = typeof ord.total === 'number' ? ord.total : 0;
            return (
              <tr key={id} className="hover:bg-white/3 transition-all group">
                <td className="px-4 py-3">
                  <p className="font-bold text-white">{ord.order_number || `#${id?.slice(-6).toUpperCase()}`}</p>
                  <p className="text-text-muted text-[10px]">{ord.customerName || 'Walk-in'}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-white/5 rounded text-white border border-white/10">{ord.table_number || '—'}</span>
                </td>
                <td className="px-4 py-3 max-w-[180px]">
                  {items.slice(0, 2).map((item, i) => (
                    <p key={i} className="text-white/70 truncate">{item.quantity}× {item.name}</p>
                  ))}
                  {items.length > 2 && <p className="text-primary">+{items.length - 2} more</p>}
                </td>
                <td className="px-4 py-3 font-bold text-primary">₹{total.toFixed(0)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full uppercase border font-bold text-[9px] ${statusColors[ord.status] || ''}`}>
                    {STATUS_LABELS[ord.status] || ord.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-text-muted capitalize">{ord.spiceness || '—'}</span>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {new Date(ord.created_at || ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {canAdvance(ord) && (
                      <button onClick={() => onStatusUpdate(id, TRANSITIONS[ord.status])}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase hover:bg-primary-hover transition-all">
                        {nextLabel[TRANSITIONS[ord.status]]}
                      </button>
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
            <tr><td colSpan={8} className="py-20 text-center text-text-muted">
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
  const activeOrders = orders.filter(o => ['pending', 'start_cooking'].includes(o.status));
  const filtered = statusFilter === 'active' ? activeOrders
    : statusFilter === 'pending' ? orders.filter(o => o.status === 'pending')
    : statusFilter === 'cooking' ? orders.filter(o => o.status === 'start_cooking')
    : activeOrders;

  const lowStockIngredients = ingredients.filter(i => i.stock < i.min_stock);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-black text-white flex items-center gap-3"><ChefHat size={32} className="text-primary" />My Kitchen</h2>
          <p className="text-text-muted mt-1 text-sm">Your active cooking queue</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-3 rounded-xl">
          <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
          <span className="text-xs font-black text-primary uppercase tracking-widest">{activeOrders.length} ACTIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Cooking', value: orders.filter(o => o.status === 'start_cooking').length, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Ready Today', value: orders.filter(o => o.status === 'completed_cooking' || o.status === 'served' || o.status === 'paid').length, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-white/5 p-5 text-center`}>
            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
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
                <div className="pt-2 border-t border-white/10">
                  {isPending && (
                    <button onClick={() => updateOrderStatus(id, 'start_cooking')}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                      <Play size={14} /> Start Cooking
                    </button>
                  )}
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
      {ingredients.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Package size={20} className="text-primary" />Ingredient Stock Overview</h3>
          <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-3">
            {ingredients.slice(0, 16).map(ing => (
              <div key={ing._id} className={`p-4 rounded-xl border ${ing.stock < ing.min_stock ? 'bg-red-500/5 border-red-500/30' : 'bg-white/3 border-white/10'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-white truncate">{ing.name}</p>
                  {ing.stock < ing.min_stock && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
                </div>
                <p className="text-xs text-text-muted">{ing.stock} {ing.unit} <span className="text-text-muted/60">/ min {ing.min_stock}</span></p>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${ing.stock < ing.min_stock ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, (ing.stock / Math.max(ing.min_stock * 2, 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
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
          <h2 className="text-3xl font-black text-white flex items-center gap-3"><ClipboardList size={28} className="text-primary" />My Order History</h2>
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
      <div className="grid grid-cols-3 gap-4">
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
                      <span className="text-text-muted text-[10px]">₹{((item.unit_price || item.price || 0) * item.quantity).toFixed(0)}</span>
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
const CaptainMyOrders = ({ user, allOrders }) => {
  const [period, setPeriod] = useState('today');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Filter from global orders in context — no separate API call needed.
  // Captain My Orders = all orders with status served or paid (these are served orders),
  // matching the "Served" count shown on the owner dashboard overview.
  const orders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);

    return (allOrders || []).filter(o => {
      if (!['served', 'paid'].includes(o.status)) return false;
      const ts = new Date(o.created_at || o.timestamp);
      if (period === 'today')   return ts >= todayStart;
      if (period === 'weekly')  return ts >= weekAgo;
      if (period === 'monthly') return ts >= monthAgo;
      return true;
    });
  }, [allOrders, period]);

  const stats = useMemo(() => ({
    total: orders.length,
    served: orders.filter(o => ['served', 'paid'].includes(o.status)).length,
    paid: orders.filter(o => o.status === 'paid').length,
    revenue: orders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.total || 0), 0),
    items: orders.reduce((s, o) => s + (o.items || []).reduce((a, i) => a + (i.quantity || 1), 0), 0),
  }), [orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3"><ClipboardList size={28} className="text-primary" />My Orders</h2>
          <p className="text-text-muted text-sm mt-1">All orders you have served</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['today', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',  value: stats.total,                  color: 'text-white',      bg: 'bg-white/5' },
          { label: 'Served',        value: stats.served,                 color: 'text-blue-400',   bg: 'bg-blue-500/10' },
          { label: 'Items Served',  value: stats.items,                  color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Revenue',       value: `₹${stats.revenue.toFixed(0)}`, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-white/5 p-5 text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
          {orders.map(ord => {
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
                    <p className="text-sm font-black text-primary">₹{(ord.total || 0).toFixed(0)}</p>
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
                              <span className="text-text-muted text-xs">₹{((item.unit_price || item.price || 0) * item.quantity).toFixed(0)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 font-black text-sm">
                          <span className="text-text-muted">Total</span>
                          <span className="text-primary">₹{(ord.total || 0).toFixed(0)}</span>
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
const TableStatus = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tablesAPI.getAll();
      setTables(res.data || []);
    } catch { setTables([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 20000);

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

  const tableConfig = {
    available:     { bg: 'bg-green-500/10 border-green-500/30', badge: 'bg-green-500/20 text-green-400', dot: 'bg-green-400' },
    occupied:      { bg: 'bg-red-500/10 border-red-500/30',   badge: 'bg-red-500/20 text-red-400',   dot: 'bg-red-400'   },
    reserved:      { bg: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-400' },
    not_available: { bg: 'bg-white/5 border-white/10',        badge: 'bg-white/10 text-text-muted', dot: 'bg-gray-500'  },
  };

  const allStatuses = ['available', 'occupied', 'reserved', 'not_available'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3"><LayoutDashboard size={28} className="text-primary" />Table Status</h2>
          <p className="text-text-muted text-sm mt-1">Click a table to change its status manually</p>
        </div>
        <div className="flex gap-4 text-xs font-bold text-text-muted flex-wrap">
          {allStatuses.map(s => (
            <div key={s} className="flex items-center gap-1.5 capitalize">
              <span className={`w-2.5 h-2.5 rounded-full ${tableConfig[s]?.dot}`} />
              {s.replace('_', ' ')}
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map(t => {
            const cfg = tableConfig[t.status] || tableConfig.available;
            const isUpdating = updating === t._id;
            return (
              <div key={t._id} className={`rounded-2xl border p-4 ${cfg.bg} relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xl font-black text-white">T{t.table_number || t.label}</p>
                  {isUpdating && <Loader size={14} className="animate-spin text-primary" />}
                </div>
                {t.capacity && <p className="text-[10px] text-text-muted mb-3">{t.capacity} seats</p>}
                {/* Status badge */}
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase mb-3 inline-block ${cfg.badge}`}>
                  {t.status.replace('_', ' ')}
                </span>
                {/* Manual status selector */}
                <select
                  value={t.status}
                  onChange={e => handleStatusChange(t._id, e.target.value)}
                  disabled={isUpdating}
                  className="w-full mt-2 bg-black/40 border border-white/10 text-white text-[10px] font-bold rounded-lg px-2 py-1.5 outline-none focus:border-primary cursor-pointer uppercase tracking-widest"
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────
const ReservationsPanel = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ guest_name: '', guest_phone: '', party_size: 2, date: '', time: '', notes: '', table_number: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await reservationsAPI.getAll(); setReservations(res.data || []); }
    catch { setReservations([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 30000);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customer_name:  form.guest_name,
        phone:          form.guest_phone,
        guests:         Number(form.party_size),
        date:           form.date ? new Date(form.date).toISOString() : undefined,
        time:           form.time,
        notes:          form.notes,
        table_assigned: form.table_number,
      };
      await reservationsAPI.create(payload);
      flash('Reservation created successfully');
      setShowForm(false);
      setForm({ guest_name: '', guest_phone: '', party_size: 2, date: '', time: '', notes: '', table_number: '' });
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const updateStatus = async (id, status) => {
    try { await reservationsAPI.patch(id, { status }); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const statusColor = { confirmed: 'text-green-400', pending: 'text-yellow-400', cancelled: 'text-red-400', completed: 'text-text-muted' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3"><Calendar size={28} className="text-primary" />Reservations</h2>
          <p className="text-text-muted text-sm mt-1">{reservations.length} total reservations</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
          <Plus size={14} /> New Reservation
        </button>
      </div>
      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-secondary/40 rounded-3xl border border-primary/30 p-8">
            <h3 className="text-lg font-bold mb-6 text-white">New Reservation</h3>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Guest Name', field: 'guest_name', type: 'text' },
                { label: 'Phone', field: 'guest_phone', type: 'tel' },
                { label: 'Party Size', field: 'party_size', type: 'number' },
                { label: 'Date', field: 'date', type: 'date' },
                { label: 'Time', field: 'time', type: 'time' },
                { label: 'Table #', field: 'table_number', type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">{label}</label>
                  <input type={type} required value={form[field]} onChange={sf(field)}
                    className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                </div>
              ))}
              <div className="md:col-span-full">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Notes</label>
                <textarea value={form.notes} onChange={sf('notes')} rows={2}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
              </div>
              <div className="md:col-span-full flex gap-3">
                <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            {reservations.map(r => (
              <div key={r._id} className="flex items-center px-6 py-4 hover:bg-white/3 group">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{r.customer_name}</p>
                  <p className="text-xs text-text-muted">{r.phone} · {r.guests} guests · Table {r.table_assigned || '—'}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>{r.date ? new Date(r.date).toLocaleDateString() : '—'} {r.time}</span>
                  <span className={`font-bold uppercase ${statusColor[r.status] || ''}`}>{r.status}</span>
                </div>
                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-all">
                  {r.status === 'pending' && (
                    <button onClick={() => updateStatus(r._id, 'confirmed')}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 text-[10px] font-black rounded-lg hover:bg-green-500 hover:text-white transition-all">Confirm</button>
                  )}
                  {r.status !== 'cancelled' && (
                    <button onClick={() => updateStatus(r._id, 'cancelled')}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 text-[10px] font-black rounded-lg hover:bg-red-500 hover:text-white transition-all">Cancel</button>
                  )}
                </div>
              </div>
            ))}
            {reservations.length === 0 && (
              <div className="py-20 text-center text-text-muted">
                <Calendar size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">No reservations yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FEEDBACK BOX ─────────────────────────────────────────────────────────────
const FeedbackBox = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await feedbackAPI.getAll(); setFeedback(res.data || []); }
    catch { setFeedback([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 30000);

  const markRead = async (id) => { await feedbackAPI.markRead(id); load(); };
  const markAllRead = async () => { await feedbackAPI.markAllRead(); load(); };

  const unread = feedback.filter(f => !f.is_read).length;
  const filtered = filter === 'all' ? feedback : filter === 'unread' ? feedback.filter(f => !f.is_read) : feedback.filter(f => f.category === filter);

  const starColor = (n) => n >= 4 ? 'text-green-400' : n >= 3 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <MessageSquare size={28} className="text-primary" />Feedback Box
            {unread > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-black">{unread}</span>}
          </h2>
          <p className="text-text-muted text-sm mt-1">{feedback.length} total · {unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="px-5 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-black rounded-xl uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
            Mark All Read
          </button>
        )}
      </div>
      <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5 w-fit">
        {['all', 'unread', 'food', 'service', 'ambience', 'general'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{f}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f._id} className={`bg-secondary/40 rounded-2xl border p-5 ${f.is_read ? 'border-white/5' : 'border-primary/30 bg-primary/5'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{f.customer_name || f.customer_id?.name || 'Anonymous'}</p>
                    <p className="text-[10px] text-text-muted">{f.category} · {new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black ${starColor(f.rating)}`}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                  {!f.is_read && (
                    <button onClick={() => markRead(f._id)} className="text-[10px] px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg font-black uppercase hover:bg-primary hover:text-white transition-all">
                      Mark Read
                    </button>
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
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-20 text-center text-text-muted">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No feedback found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
const AnnouncementsPanel = ({ isAdmin }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', message: '', priority: 'normal',
    target_roles: ['chef', 'captain', 'manager', 'owner', 'customer'],
    is_scheduled: false, scheduled_date: '',
    is_festival: false, festival_name: '',
  });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const sb = f => e => setForm(p => ({ ...p, [f]: e.target.checked }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = isAdmin ? await announcementsAPI.getAllAdmin() : await announcementsAPI.getAll();
      setAnnouncements(res.data || []);
    } catch { setAnnouncements([]); }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { load(); }, []);
  useAutoRefresh(load, 30000);

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        scheduled_date: form.is_scheduled && form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null,
      };
      await announcementsAPI.create(payload);
      flash(form.is_scheduled ? 'Announcement scheduled!' : 'Announcement posted!');
      setShowForm(false);
      setForm({ title: '', message: '', priority: 'normal', target_roles: ['chef', 'captain', 'manager', 'owner', 'customer'], is_scheduled: false, scheduled_date: '', is_festival: false, festival_name: '' });
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try { await announcementsAPI.delete(id); load(); }
    catch (err) { flash(err.message, 'error'); }
  };

  const priorityColor = { low: 'text-text-muted', normal: 'text-blue-400', high: 'text-yellow-400', urgent: 'text-red-400' };
  const priorityBorder = { low: 'border-white/5', normal: 'border-blue-500/20', high: 'border-yellow-500/30', urgent: 'border-red-500/40' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3"><Megaphone size={28} className="text-primary" />Announcements</h2>
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
      <AnimatePresence>
        {showForm && isAdmin && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-secondary/40 rounded-3xl border border-primary/30 p-8 space-y-5">
            <h3 className="text-lg font-bold text-white">New Announcement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Title *</label>
                <input required value={form.title} onChange={sf('title')}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
              </div>
              {/* Message */}
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Message *</label>
                <textarea required value={form.message} onChange={sf('message')} rows={3}
                  className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
              </div>
              {/* Priority */}
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
                  <input type="checkbox" checked={form.is_festival} onChange={sb('is_festival')}
                    className="w-4 h-4 rounded accent-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400 flex items-center gap-2"><Star size={14} /> Festival Offer</span>
                </label>
                {form.is_festival && (
                  <input type="text" placeholder="Festival name (e.g. Eid Special, Diwali Offer)"
                    value={form.festival_name} onChange={sf('festival_name')}
                    className="flex-1 bg-bg-main border border-yellow-500/30 p-2.5 rounded-xl focus:border-yellow-400 outline-none text-white text-sm" />
                )}
              </div>
              {/* Schedule toggle */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_scheduled} onChange={sb('is_scheduled')}
                    className="w-4 h-4 rounded accent-blue-400" />
                  <span className="text-sm font-bold text-blue-400 flex items-center gap-2"><Calendar size={14} /> Schedule for Later</span>
                </label>
                {form.is_scheduled && (
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Date & Time</label>
                    <input type="datetime-local" value={form.scheduled_date} onChange={sf('scheduled_date')} required={form.is_scheduled}
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
          {announcements.map(a => (
            <div key={a._id} className={`bg-secondary/40 rounded-2xl border p-6 ${priorityBorder[a.priority] || 'border-white/5'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`w-2.5 h-2.5 rounded-full ${a.priority === 'urgent' ? 'bg-red-400 animate-pulse' : a.priority === 'high' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                  <h4 className="text-base font-bold text-white">{a.title}</h4>
                  <span className={`text-[10px] font-black uppercase ${priorityColor[a.priority]}`}>{a.priority}</span>
                  {a.is_festival && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      🎉 {a.festival_name || 'Festival Offer'}
                    </span>
                  )}
                  {a.is_scheduled && a.scheduled_date && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      📅 {new Date(a.scheduled_date).toLocaleDateString()} {new Date(a.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(a._id)} className="text-text-muted hover:text-red-400 transition-colors p-1 shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-white/80 ml-6">{a.message}</p>
              <p className="text-[10px] text-text-muted ml-6 mt-2">
                By {a.created_by?.name || 'Admin'} · {new Date(a.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="py-20 text-center text-text-muted">
              <Megaphone size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm uppercase tracking-widest">No announcements</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── SHIFT LOGS ───────────────────────────────────────────────────────────────
const ShiftLogs = ({ user, isAdmin }) => {
  const [shifts, setShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftsRes, activeRes] = await Promise.all([
        shiftsAPI.getAll(`?period=${period}`),
        shiftsAPI.getMyActive(),
      ]);
      setShifts(shiftsRes.data || []);
      setActiveShift(activeRes.data || null);
    } catch { setShifts([]); }
    finally { setLoading(false); }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3"><UserCheck size={28} className="text-primary" />Shift Logs</h2>
          <p className="text-text-muted text-sm mt-1">Check-in/checkout tracking</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['today', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Personal check-in/out control */}
      <div className={`p-6 rounded-2xl border ${activeShift ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">{activeShift ? 'Currently on shift' : 'Not checked in'}</p>
            {activeShift && (
              <p className="text-xs text-green-400 mt-1">
                Started: {new Date(activeShift.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          {activeShift ? (
            <button onClick={handleCheckOut}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              Check Out
            </button>
          ) : (
            <button onClick={handleCheckIn}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              Check In
            </button>
          )}
        </div>
      </div>

      {/* Shifts table */}
      {loading ? <div className="flex justify-center py-20"><Loader size={28} className="animate-spin text-primary" /></div> : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="flex px-6 py-3 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
            <div className="w-[25%]">Staff</div>
            <div className="w-[15%]">Role</div>
            <div className="w-[20%]">Check In</div>
            <div className="w-[20%]">Check Out</div>
            <div className="w-[15%]">Duration</div>
            <div className="w-[5%]">Status</div>
          </div>
          <div className="divide-y divide-white/5">
            {shifts.map(s => (
              <div key={s._id} className="flex items-center px-6 py-4 hover:bg-white/3">
                <div className="w-[25%]">
                  <p className="text-sm font-bold text-white">{s.user_id?.name || '—'}</p>
                  <p className="text-[10px] text-text-muted">{s.date}</p>
                </div>
                <div className="w-[15%]">
                  <span className="text-xs text-primary uppercase font-bold">{s.user_id?.role || s.role}</span>
                </div>
                <div className="w-[20%] text-sm text-white/80">
                  {s.check_in ? new Date(s.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
                <div className="w-[20%] text-sm text-white/80">
                  {s.check_out ? new Date(s.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-green-400 animate-pulse">Active</span>}
                </div>
                <div className="w-[15%] text-sm font-bold text-white">
                  {formatDuration(s.duration_minutes)}
                </div>
                <div className="w-[5%]">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-text-muted'}`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
            {shifts.length === 0 && (
              <div className="py-16 text-center text-text-muted">
                <UserCheck size={36} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">No shift logs found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STAFF MANAGEMENT ─────────────────────────────────────────────────────────
const StaffManagement = ({ currentUserRole }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'captain',
    dob: '', gender: '', address: '', city: '', state: '', pincode: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    joining_date: '', id_proof_type: '', id_proof_number: '',
    salary: '', bank_account: '', ifsc_code: '',
  });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const allowedRoles = currentUserRole === 'owner'
    ? ['manager', 'captain', 'chef']
    : ['captain', 'chef'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const queries = allowedRoles.map(r => usersAPI.getAll(`?role=${r}`));
      const results = await Promise.all(queries);
      setStaff(results.flatMap(r => r.data || []));
    } catch { setStaff([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);
  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', email: '', phone: '', password: '', role: allowedRoles[0], dob: '', gender: '', address: '', city: '', state: '', pincode: '', emergency_contact_name: '', emergency_contact_phone: '', joining_date: '', id_proof_type: '', id_proof_number: '', salary: '', bank_account: '', ifsc_code: '' });
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email || '', phone: u.phone || '', password: '', role: u.role, dob: u.dob ? u.dob.split('T')[0] : '', gender: u.gender || '', address: u.address || '', city: u.city || '', state: u.state || '', pincode: u.pincode || '', emergency_contact_name: u.emergency_contact_name || '', emergency_contact_phone: u.emergency_contact_phone || '', joining_date: u.joining_date ? u.joining_date.split('T')[0] : '', id_proof_type: u.id_proof_type || '', id_proof_number: u.id_proof_number || '', salary: u.salary || '', bank_account: u.bank_account || '', ifsc_code: u.ifsc_code || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { password, ...rest } = form;
      if (editTarget) {
        await usersAPI.update(editTarget._id, rest);
        flash('Staff updated successfully');
      } else {
        await usersAPI.create({ ...rest, password });
        flash(`${form.role} added successfully`);
      }
      setShowForm(false);
      load();
    } catch (err) { flash(err.message, 'error'); }
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
    manager: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    captain: 'text-green-400 bg-green-500/10 border-green-500/20',
    chef:    'text-orange-400 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Staff Management</h2>
          <p className="text-text-muted text-sm">{currentUserRole === 'owner' ? 'Manage all managers, captains & chefs' : 'Manage captains and chefs'}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">
          <Plus size={14} /> Add Staff
        </button>
      </div>

      <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>

      {/* Screenshot-style Add/Edit Staff Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-3xl border border-white/10 w-full max-w-md shadow-2xl my-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-xl font-black text-white">{editTarget ? `Edit ${editTarget.name}` : 'Add New Staff'}</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">FULL NAME *</label>
                  <input type="text" required value={form.name} onChange={sf('name')} placeholder="e.g. Arjun Singh"
                    className="w-full bg-[#252525] border border-white/10 p-3.5 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">EMAIL *</label>
                  <div className="relative">
                    <input type="email" required value={form.email} onChange={sf('email')} placeholder="staff@spiceroute.com"
                      className="w-full bg-[#252525] border border-white/10 p-3.5 pr-12 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center">
                      <Mail size={13} className="text-primary" />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">PHONE</label>
                  <input type="tel" value={form.phone} onChange={sf('phone')} placeholder="+1-555-0100"
                    className="w-full bg-[#252525] border border-white/10 p-3.5 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                </div>

                {/* Role */}
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

                {/* Password (only for new staff) */}
                {!editTarget && (
                  <div>
                    <label className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-2 block">PASSWORD *</label>
                    <PasswordField value={form.password} onChange={sf('password')} placeholder="Min 6 characters" required />
                  </div>
                )}

                {/* Optional fields collapsed */}
                <details className="group">
                  <summary className="text-[10px] text-primary font-black uppercase tracking-widest cursor-pointer hover:text-primary/80 list-none flex items-center gap-2">
                    <Plus size={12} /> Additional Details (optional)
                  </summary>
                  <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Date of Birth', field: 'dob', type: 'date' },
                        { label: 'Joining Date', field: 'joining_date', type: 'date' },
                        { label: 'City', field: 'city', type: 'text' },
                        { label: 'Salary (₹)', field: 'salary', type: 'number' },
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

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3.5 border border-white/20 rounded-2xl text-sm font-bold text-white/70 hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                    <Save size={15} />
                    {editTarget ? 'UPDATE STAFF' : 'CREATE STAFF'}
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
          <div className="divide-y divide-white/5">
            {staff.map(u => (
              <div key={u._id} className="flex items-center px-6 py-5 hover:bg-white/3 group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full border border-primary/30 overflow-hidden shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <p className="text-[10px] text-text-muted">{u.email}</p>
                    {u.phone && <p className="text-[10px] text-text-muted">{u.phone}</p>}
                  </div>
                </div>
                <div className="w-[15%]">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${roleColor[u.role] || 'text-text-muted bg-white/5 border-white/10'}`}>{u.role}</span>
                </div>
                <div className="w-[15%] text-xs text-text-muted">
                  {u.phone || '—'}
                </div>
                <div className="w-[10%]">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase border ${u.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(u)} className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all" title="Edit">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => toggleActive(u)}
                    className={`p-2 rounded-lg transition-all ${u.is_active ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white'}`}
                    title={u.is_active ? 'Disable' : 'Enable'}>
                    {u.is_active ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                  </button>
                  {currentUserRole === 'owner' && (
                    <button onClick={() => setDelConfirm(u)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {staff.length === 0 && (
              <div className="py-16 text-center text-text-muted">
                <Users size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No staff yet. Add your first!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {delConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-secondary rounded-3xl border border-red-500/30 p-10 max-w-md w-full text-center space-y-6">
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
    </div>
  );
};

// ─── Password field with eye toggle ─────────────────────────────────────────
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
    prep_time: 20, stock: 100,
  });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const sb = f => e => setForm(p => ({ ...p, [f]: e.target.checked }));

  const flash = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  // Sync from context
  useEffect(() => { setMenuItems(ctxMenu || []); }, [ctxMenu]);

  const categories = ['Biryani', 'Appetizers', 'Breads', 'Desserts', 'Combos', 'Drinks'];

  const filtered = menuItems.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || (item.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || item.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', category: 'Biryani', price: '', description: '', spice_level: 1, is_veg: false, is_halal: true, prep_time: 20, stock: 100 });
    setShowAddModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, category: item.category, price: item.price,
      description: item.description || '', spice_level: item.spice_level || 1,
      is_veg: item.is_veg || false, is_halal: item.is_halal !== false,
      prep_time: item.prep_time || 20, stock: item.stock || 100,
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), spice_level: Number(form.spice_level), prep_time: Number(form.prep_time), stock: Number(form.stock) };
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

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from the menu?')) return;
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
          <h2 className="text-3xl font-black text-white flex items-center gap-3"><FileText size={28} className="text-primary" />Menu Master</h2>
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
                  {item.is_veg && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-700/30 text-green-500 border border-green-700/40">VEG</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-lg font-black text-primary">₹{(item.price || 0).toFixed(0)}</p>
                <span className="text-sm">{spiceLabel[item.spice_level] || '🌶'}</span>
                {item.prep_time && <span className="text-[10px] text-text-muted"><Clock size={10} className="inline mr-1" />{item.prep_time}m</span>}
              </div>
              {item.description && <p className="text-xs text-text-muted mb-3 line-clamp-2">{item.description}</p>}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => toggleMenuAvailability(id)}
                  className="flex-1 py-2 bg-white/10 border border-white/15 text-xs font-black uppercase rounded-lg hover:border-primary hover:text-primary transition-all">
                  {avail ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => openEdit(item)}
                  className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(id)}
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
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Price (₹) *</label>
                    <input required type="number" min="0" step="0.5" value={form.price} onChange={sf('price')} placeholder="0.00"
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Spice Level</label>
                    <select value={form.spice_level} onChange={sf('spice_level')}
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm">
                      <option value={1}>🌶 Mild</option>
                      <option value={2}>🌶🌶 Medium</option>
                      <option value={3}>🌶🌶🌶 Hot</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Prep Time (min)</label>
                    <input type="number" min="1" value={form.prep_time} onChange={sf('prep_time')}
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Description</label>
                    <textarea value={form.description} onChange={sf('description')} rows={2} placeholder="Short description..."
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_veg} onChange={sb('is_veg')} className="w-4 h-4 rounded accent-green-500" />
                      <span className="text-sm text-white font-bold">Veg</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_halal} onChange={sb('is_halal')} className="w-4 h-4 rounded accent-primary" />
                      <span className="text-sm text-white font-bold">Halal</span>
                    </label>
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
    </div>
  );
};
const IngredientManager = ({ ingredients, updateIngredientStock }) => {
  const [localIngredients, setLocalIngredients] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newIng, setNewIng] = useState({ name: '', unit: 'kg', stock: 0, min_stock: 0, unit_cost: 0 });
  const [msg, setMsg] = useState('');

  useEffect(() => { setLocalIngredients(ingredients); }, [ingredients]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await ingredientsAPI.create(newIng);
      flash('Ingredient added!');
      setShowAdd(false);
    } catch (err) { flash(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Package size={20} className="text-primary" />Ingredients</h3>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover">
          <Plus size={13} /> Add Ingredient
        </button>
      </div>
      {msg && <p className="text-xs text-primary font-bold">{msg}</p>}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-secondary/50 rounded-2xl border border-primary/30 p-6">
            <form onSubmit={handleAdd} className="grid md:grid-cols-3 gap-4">
              {[
                { l: 'Name', f: 'name', t: 'text' },
                { l: 'Stock', f: 'stock', t: 'number' },
                { l: 'Min Stock', f: 'min_stock', t: 'number' },
                { l: 'Unit Cost (₹)', f: 'unit_cost', t: 'number' },
              ].map(({ l, f, t }) => (
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
                  {['kg', 'g', 'liters', 'ml', 'units', 'pieces'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="md:col-span-full flex gap-3">
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase">Save</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 border border-white/20 rounded-xl text-xs font-black uppercase hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {localIngredients.map(ing => {
          const id = ing._id || ing.id;
          const stock = typeof ing.stock === 'number' ? ing.stock : 0;
          const min = ing.min_stock || ing.minStock || 0;
          return (
            <div key={id} className="p-5 bg-bg-main/70 border border-white/10 rounded-xl hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-white">{ing.name}</h4>
                <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${stock < min ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                  {stock < min ? 'Reorder' : 'OK'}
                </span>
              </div>
              <p className="text-xs text-text-muted mb-1">{stock} {ing.unit} / Min: {min}</p>
              <p className="text-xs text-text-muted mb-3">Unit Cost: ₹{ing.unit_cost || ing.unitCost || 0}</p>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${stock < min ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (stock / Math.max(min * 2, 1)) * 100)}%` }} />
              </div>
              <button onClick={() => {
                const v = Number(window.prompt(`Set ${ing.name} stock:`, stock));
                if (!isNaN(v) && v >= 0) updateIngredientStock(id, v);
              }} className="w-full py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all">
                Update Stock
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── ORDER BOOKING (live orders panel + POS) ─────────────────────────────────
const OrderBookingPanel = ({ orders, user, updateOrderStatus, deleteOrder }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3"><OrderIcon size={28} className="text-primary" />Live Orders</h2>
          <p className="text-text-muted text-sm mt-1">{orders.length} orders</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['all', 'pending', 'start_cooking', 'completed_cooking', 'served', 'paid'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
              {STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
        <OrderTable orders={filtered} user={user} onStatusUpdate={updateOrderStatus} onDelete={deleteOrder} statusColors={STATUS_COLORS} />
      </div>
    </div>
  );
};

// ─── OVERVIEW (owner/manager command hub) ─────────────────────────────────────
const Overview = ({ orders, financial }) => {
  const analytics = useMemo(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const cookingCount = orders.filter(o => o.status === 'start_cooking').length;
    const readyCount   = orders.filter(o => o.status === 'completed_cooking').length;
    const servedCount  = orders.filter(o => o.status === 'served').length;
    const paidCount    = orders.filter(o => o.status === 'paid').length;
    const totalRev     = orders.reduce((s, o) => s + (o.total || 0), 0);
    const avgVal       = orders.length > 0 ? totalRev / orders.length : 0;
    const itemFreq     = {};
    orders.forEach(o => (o.items || []).forEach(i => { itemFreq[i.name] = (itemFreq[i.name] || 0) + i.quantity; }));
    const topItems = Object.entries(itemFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
    return { pendingCount, cookingCount, readyCount, servedCount, paidCount, totalRev, avgVal, topItems, totalOrders: orders.length };
  }, [orders]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-black font-heading text-white mb-2">Command Hub</h2>
        <p className="text-text-muted text-sm">Real-time business overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: `₹${analytics.totalRev.toFixed(0)}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Active Orders', value: analytics.totalOrders, icon: Flame, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Avg Order Value', value: `₹${analytics.avgVal.toFixed(0)}`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Paid Orders', value: analytics.paidCount, icon: CheckCircle2, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map((stat, idx) => (
          <MotionDiv key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            className="bg-secondary/40 p-6 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-3xl opacity-20`} />
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white">{stat.value}</h3>
          </MotionDiv>
        ))}
      </div>

      {/* Pipeline + Top dishes */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-secondary/40 rounded-3xl border border-white/10 p-6">
          <h4 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><Zap size={18} className="text-primary" />Order Pipeline</h4>
          <div className="space-y-4">
            {[
              { label: 'Pending',           value: analytics.pendingCount, color: 'bg-yellow-500', pct: analytics.pendingCount },
              { label: 'Cooking',           value: analytics.cookingCount, color: 'bg-orange-500', pct: analytics.cookingCount },
              { label: 'Ready to Serve',    value: analytics.readyCount,   color: 'bg-blue-500',   pct: analytics.readyCount },
              { label: 'Served',            value: analytics.servedCount,  color: 'bg-green-500',  pct: analytics.servedCount },
              { label: 'Paid',              value: analytics.paidCount,    color: 'bg-primary',    pct: analytics.paidCount },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{s.label}</span>
                  <span className="text-base font-black text-white">{s.value}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <MotionDiv initial={{ width: 0 }} animate={{ width: `${(s.pct / Math.max(analytics.totalOrders, 1)) * 100}%` }}
                    transition={{ duration: 0.8 }} className={`h-full ${s.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-secondary/40 rounded-3xl border border-white/10 p-6">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-primary" />Top Dishes</h4>
            {analytics.topItems.length > 0 ? analytics.topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 mb-2 border border-white/5">
                <span className="text-sm font-bold text-white">{item.name}</span>
                <span className="text-primary font-black">{item.count}×</span>
              </div>
            )) : <p className="text-text-muted text-sm">No orders yet</p>}
          </div>
          {financial && typeof financial.revenue === 'number' && typeof financial.costOfGoods === 'number' && typeof financial.profit === 'number' && typeof financial.profitMargin === 'number' && (
            <div className="bg-secondary/40 rounded-3xl border border-white/10 p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><DollarSign size={18} className="text-primary" />Financial KPIs</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Revenue', value: `₹${financial.revenue.toFixed(0)}`, color: 'text-green-400' },
                  { label: 'COGS', value: `₹${financial.costOfGoods.toFixed(0)}`, color: 'text-red-400' },
                  { label: 'Gross Profit', value: `₹${financial.profit.toFixed(0)}`, color: 'text-blue-400' },
                  { label: 'Margin', value: `${financial.profitMargin.toFixed(1)}%`, color: 'text-primary' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-text-muted font-bold uppercase mb-1">{label}</p>
                    <p className={`text-lg font-black ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user } = useAuth();
  const {
    orders, menu, ingredients,
    updateOrderStatus: ctxUpdateStatus, deleteOrder,
    updateMenuStock, toggleMenuAvailability, updateIngredientStock,
    getFinancialMetrics,
  } = useOrders();

  const defaultTab = user.role === 'chef' ? 'kitchen' : user.role === 'captain' ? 'orders' : 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [financial, setFinancial] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  const TITLE_MAP = {
    overview: 'Command Hub', pos: 'Order Booking', orders: 'Live Orders',
    kitchen: 'My Kitchen', menu: 'Menu Master', tables: 'Table Status',
    reservations: 'Reservations', feedback: 'Feedback Box',
    announcements: 'Announcements', shifts: 'Shift Logs',
    staffmgmt: 'Staff Management', my_orders: 'My Orders',
    chef_orders: 'Order History', staff: 'My Profile',
  };

  useEffect(() => {
    let cancelled = false;
    getFinancialMetrics?.().then(r => { if (!cancelled && r?.revenue != null) setFinancial(r); }).catch(() => {});
    return () => { cancelled = true; };
  }, [orders]);

  // Soft refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Role-aware status update: chef can only do start_cooking / completed_cooking
  // captain/manager/owner can do served / paid
  const updateOrderStatus = useCallback(async (id, status) => {
    const CHEF_OK    = ['start_cooking', 'completed_cooking'];
    const CAPTAIN_OK = ['served', 'paid', 'cancelled'];
    if (user.role === 'chef' && !CHEF_OK.includes(status)) return;
    if (user.role === 'captain' && !CAPTAIN_OK.includes(status)) return;
    await ctxUpdateStatus(id, status);
  }, [user.role, ctxUpdateStatus]);

  const isAdmin = ['owner', 'manager'].includes(user.role);

  return (
    <div className="min-h-screen bg-bg-main pl-64">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} unreadAnnouncements={unreadAnnouncements} />
      <div className="flex-1">
        <Header title={TITLE_MAP[activeTab] || ''} onRefresh={handleRefresh} loading={refreshing} />
        <main className="px-8 py-8">
          {/* ── Global Shift Badge (top of every page) ─────────────────── */}
          <div className="flex justify-end mb-5">
            <ShiftCheckinBadge />
          </div>

          <AnimatePresence mode="wait">

            {/* COMMAND HUB */}
            {activeTab === 'overview' && (
              <MotionDiv key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <Overview orders={orders} financial={financial} />
              </MotionDiv>
            )}

            {/* ORDER BOOKING */}
            {activeTab === 'pos' && (
              <MotionDiv key="pos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <div className="mb-8">
                  <OrderBookingPanel orders={orders} user={user} updateOrderStatus={updateOrderStatus} deleteOrder={deleteOrder} />
                  <div className="my-8 border-t border-white/10" />
                  <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Plus size={18} className="text-primary" />Place New Order</h3>
                </div>
                <POS user={user} />
              </MotionDiv>
            )}

            {/* LIVE ORDERS */}
            {activeTab === 'orders' && (
              <MotionDiv key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <OrderBookingPanel orders={orders} user={user} updateOrderStatus={updateOrderStatus} deleteOrder={deleteOrder} />
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
                <TableStatus />
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
                <FeedbackBox />
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
                <ShiftLogs user={user} isAdmin={isAdmin} />
              </MotionDiv>
            )}

            {/* STAFF MANAGEMENT */}
            {activeTab === 'staffmgmt' && isAdmin && (
              <MotionDiv key="staffmgmt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StaffManagement currentUserRole={user.role} />
              </MotionDiv>
            )}

            {/* CAPTAIN MY ORDERS */}
            {activeTab === 'my_orders' && user.role === 'captain' && (
              <MotionDiv key="my_orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KitchenFlowBar orders={orders} />
                <CaptainMyOrders user={user} allOrders={orders} />
              </MotionDiv>
            )}

            {/* CHEF ORDER HISTORY */}
            {activeTab === 'chef_orders' && user.role === 'chef' && (
              <MotionDiv key="chef_orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChefOrderHistory user={user} allOrders={orders} />
              </MotionDiv>
            )}

            {/* MY PROFILE */}
            {activeTab === 'staff' && (
              <MotionDiv key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="max-w-2xl mx-auto bg-secondary/40 rounded-3xl border border-white/10 p-10 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/40">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.role}`} alt="" className="w-full h-full" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{user.name}</h2>
                      <span className="text-primary font-bold uppercase tracking-widest text-sm">{user.role}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Email', value: user.email },
                      { label: 'Phone', value: user.phone || '—' },
                      { label: 'Employee ID', value: `BB-${user._id?.slice(-6).toUpperCase()}` },
                      { label: 'Role', value: user.role },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/5 rounded-xl p-4">
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className="font-bold text-white text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </MotionDiv>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;