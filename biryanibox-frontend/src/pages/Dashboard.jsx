import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
import {
  ShoppingCart, Users, LogOut, ChevronRight, TrendingUp, Clock,
  AlertCircle, FileText, Trash2, Bell, ChevronDown, Monitor, Command,
  PieChart, ShoppingBag as OrderIcon, Zap, Target, Award, BarChart3,
  Calendar, DollarSign, Flame, Eye, CheckCircle2, Package, ChefHat,
  Ticket, Loader,
} from 'lucide-react';
import { useAuth, useOrders } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { usersAPI, ordersAPI } from '../services/api';
import POS from '../components/POS';

/* ─────────────────────────────── Sidebar ─────────────────────────────────── */
const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const menuItems = [
    { id: 'overview',  label: 'Command Hub',    icon: PieChart,  roles: ['owner','manager'] },
    { id: 'pos',       label: 'Order Booking',  icon: OrderIcon, roles: ['owner','manager','captain'] },
    { id: 'orders',    label: 'Kitchen Flow',   icon: Monitor,   roles: ['owner','manager','captain'] },
    { id: 'kitchen',   label: 'My Kitchen',     icon: ChefHat,   roles: ['chef'] },
    { id: 'menu',      label: 'Menu Master',    icon: FileText,  roles: ['owner','manager'] },
    { id: 'staffmgmt', label: 'Staff Mgmt',     icon: Users,     roles: ['owner','manager'] },
    { id: 'users',     label: 'Access Protocol',icon: Users,     roles: ['owner'] },
    { id: 'staff',     label: 'Personnel',      icon: Users,     roles: ['owner','manager','captain'] },
  ];
  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));
  return (
    <div className="w-72 bg-bg-main border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-8 mb-8">
        <div className="flex items-center gap-4 bg-gradient-to-br from-primary/20 to-transparent p-4 rounded-xl border border-primary/20">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            <Command size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">BIRYANI</h1>
            <h2 className="text-xs text-primary font-bold tracking-widest leading-none">SYSTEM.v1</h2>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-6 space-y-2">
        {filteredMenu.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-sm font-semibold transition-all relative group ${activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
            <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-primary/70 group-hover:text-primary transition-colors'} />
            {item.label}
            {activeTab === item.id && <motion.div layoutId="active" className="absolute left-[-24px] w-2 h-8 bg-primary rounded-r-full" />}
          </button>
        ))}
      </nav>
      <div className="p-6">
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            SYSTEM STATUS: OPTIMAL
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all">
          <LogOut size={20} /> Sign Out Portal
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────── Header ──────────────────────────────────── */
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  return (
    <div className="h-24 flex items-center justify-between px-10 border-b border-white/5 bg-bg-main/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">Administrative Hub</h3>
        <span className="hidden md:block w-px h-6 bg-white/10 mx-6" />
        <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-text-muted bg-white/5 py-1 px-3 rounded-full border border-white/10 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white hover:border-primary/50 transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-4 ring-bg-main" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white uppercase tracking-wider">{user.name}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mt-1">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg flex-shrink-0">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.role}`} alt="Profile" className="w-full h-full" />
          </div>
          {/* ✅ Logout button in header — visible for all roles including owner */}
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── Order Table ─────────────────────────────────────── */
const OrderTable = ({ orders, updateOrderStatus, user, deleteOrder, acknowledgeOrder, statusColors }) => {
  const getNextStatus = (current) => {
    const statuses = ['pending','preparing','served','paid'];
    const idx = statuses.indexOf(current);
    return idx < statuses.length - 1 ? statuses[idx + 1] : null;
  };
  // Helper: get a usable string ID from either MongoDB _id or legacy id
  const getId = (ord) => ord._id || ord.id || '';

  return (
    <div className="bg-transparent overflow-hidden px-4 pb-4">
      <div className="flex px-10 py-4 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-widest bg-white/5 rounded-xl border border-white/5">
        <div className="w-[28%]">Order Identification</div>
        <div className="w-[13%]">Table</div>
        <div className="w-[22%]">Items</div>
        <div className="w-[12%]">Amount</div>
        <div className="w-[12%]">Time</div>
        <div className="w-[8%] text-center">Status</div>
        <div className="w-[5%] text-right">Act</div>
      </div>
      <div className="space-y-3">
        {orders.map(ord => {
          const id = getId(ord);
          const items = ord.items || [];
          const total = typeof ord.total === 'number' ? ord.total : 0;
          const timestamp = ord.timestamp || ord.created_at || new Date().toISOString();
          const table = ord.table || ord.table_number || '—';
          return (
            <motion.div key={id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`flex items-center px-10 py-4 rounded-2xl border transition-all group ${ord.isNew ? 'bg-primary/5 border-primary/30' : 'bg-secondary/30 border-white/5 hover:border-primary/20 hover:bg-secondary/50'}`}>
              <div className="w-[28%] flex items-center gap-3">
                {ord.isNew && <span className="w-2 h-2 bg-primary rounded-full animate-pulse shrink-0" />}
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:scale-110 transition-transform shrink-0">
                  <ShoppingCart size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">
                    {ord.order_number || `#${id.slice(-6).toUpperCase()}`}
                  </p>
                  <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase truncate">
                    {ord.customerName || `Capt. ${ord.captain || ''}`}
                  </p>
                </div>
              </div>
              <div className="w-[13%]">
                <span className="text-xs font-bold px-3 py-1 bg-white/5 rounded-md border border-white/10 text-white">{table}</span>
              </div>
              <div className="w-[22%]">
                <div className="space-y-0.5">
                  {items.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="text-[10px] text-white/70 leading-tight truncate">{item.quantity}× {item.name}</p>
                  ))}
                  {items.length > 2 && <p className="text-[10px] text-primary font-bold">+{items.length - 2} more</p>}
                </div>
              </div>
              <div className="w-[12%]">
                <p className="text-sm font-bold text-primary">${total.toFixed(2)}</p>
                <p className="text-[10px] text-text-muted">{items.length} item{items.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="w-[12%]">
                <p className="text-xs text-text-muted flex items-center gap-1 font-medium">
                  <Clock size={12} className="text-primary/50" />
                  {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="w-[8%] flex justify-center">
                <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase border shadow-sm ${statusColors[ord.status] || ''}`}>{ord.status}</span>
              </div>
              <div className="w-[5%] flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                {ord.isNew && (
                  <button onClick={() => acknowledgeOrder(id)} title="Acknowledge"
                    className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all">
                    <CheckCircle2 size={14} />
                  </button>
                )}
                {getNextStatus(ord.status) && (
                  <button onClick={() => updateOrderStatus(id, getNextStatus(ord.status))}
                    className="p-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                    <ChevronRight size={14} />
                  </button>
                )}
                {user.role === 'owner' && (
                  <button onClick={() => deleteOrder(id)} className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {orders.length === 0 && (
          <div className="py-32 text-center text-text-muted/40 border-2 border-dashed border-white/5 rounded-3xl mx-4">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Awaiting Live Bookings...</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────── Captain Kitchen Flow ────────────────────────────────── */
const ChefKitchenFlow = ({ orders, updateOrderStatus }) => {
  const pendingOrders   = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const activeOrders    = [...pendingOrders, ...preparingOrders];

  // Build aggregated item summary for the summary table
  const itemMap = {};
  activeOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const key = item.name;
      if (!itemMap[key]) itemMap[key] = { name: item.name, category: item.category || 'Biryani', totalQty: 0, orderCount: 0 };
      itemMap[key].totalQty += item.quantity;
      itemMap[key].orderCount += 1;
    });
  });
  const aggregated = Object.values(itemMap).sort((a, b) => b.totalQty - a.totalQty);

  const categoryColors = {
    Biryani:    'bg-primary/10 text-primary border-primary/20',
    Appetizers: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Combos:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Desserts:   'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Dessert:    'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };

  const statusStyle = {
    pending:   { card: 'bg-yellow-500/5 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-400', btn: 'Preparing' },
    preparing: { card: 'bg-blue-500/5 border-blue-500/30',    badge: 'bg-blue-500/20 text-blue-400',    dot: 'bg-blue-400',   btn: 'Served'    },
  };

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <ChefHat size={28} className="text-primary" />Kitchen Flow
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {pendingOrders.length} pending · {preparingOrders.length} preparing
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs font-black text-primary uppercase tracking-widest">LIVE</span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending',      value: pendingOrders.length,   color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Preparing',    value: preparingOrders.length, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
          { label: 'Active Orders',value: activeOrders.length,    color: 'text-primary',    bg: 'bg-primary/10 border-primary/20'      },
          { label: 'Total Items',  value: aggregated.reduce((s, i) => s + i.totalQty, 0), color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border rounded-2xl p-5 text-center`}>
            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {activeOrders.length === 0 ? (
        <div className="py-32 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
          <ChefHat size={48} className="mx-auto mb-4 text-text-muted opacity-20" />
          <p className="text-sm font-bold uppercase tracking-widest text-text-muted">Kitchen is clear — No active orders</p>
        </div>
      ) : (
        <>
          {/* ── ORDER CARDS — Primary view, easy to scan ── */}
          <div>
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> Live Order Queue
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeOrders.map(ord => {
                const id        = ord._id || ord.id || '';
                const table     = ord.table || ord.table_number || '—';
                const timestamp = ord.timestamp || ord.created_at || new Date().toISOString();
                const customer  = ord.customerName || ord.customer_name || null;
                const total     = ord.total || (ord.items || []).reduce((s, i) => s + (i.price || i.unit_price || 0) * i.quantity, 0);
                const st        = statusStyle[ord.status] || statusStyle.pending;
                const nextLabel = st.btn;
                const nextStatus = ord.status === 'pending' ? 'preparing' : 'served';
                return (
                  <motion.div key={id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-5 flex flex-col gap-4 ${st.card}`}>

                    {/* Card top */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                          Table {table}
                        </p>
                        <h4 className="text-xl font-black text-white leading-tight">
                          {ord.order_number || `#${id.slice(-4).toUpperCase()}`}
                        </h4>
                        {customer && (
                          <p className="text-xs text-text-muted mt-0.5">{customer}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 ${st.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} animate-pulse`} />
                          {ord.status}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white/5 rounded-xl p-3 space-y-2 flex-1 max-h-44 overflow-y-auto">
                      {(ord.items || []).length === 0 ? (
                        <p className="text-xs text-text-muted italic">No items</p>
                      ) : (ord.items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary/20 text-primary text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0">
                              {item.quantity}
                            </span>
                            <span className="text-sm text-white/90 font-medium">{item.name}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${categoryColors[item.category] || 'bg-white/5 text-text-muted border-white/10'}`}>
                            {item.category || 'Item'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <span className="text-base font-black text-white">
                        ${Number(total).toFixed(2)}
                      </span>
                      {updateOrderStatus && ord.status !== 'served' && ord.status !== 'paid' && (
                        <button
                          onClick={() => updateOrderStatus(id, nextStatus)}
                          className="bg-primary hover:bg-primary-hover text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                          Mark {nextLabel} →
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── AGGREGATED ITEMS TABLE — secondary reference view ── */}
          <div className="bg-secondary/40 rounded-3xl border border-white/10 overflow-hidden">
            <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Package size={16} className="text-primary" /> Items Summary
              </h3>
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                {aggregated.length} unique dishes
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {aggregated.map((item, idx) => (
                <motion.div key={item.name}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                  className="flex items-center px-8 py-4 hover:bg-white/5 transition-all group">
                  <div className="w-[5%]">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-primary text-white' : idx === 1 ? 'bg-white/10 text-white' : 'bg-white/5 text-text-muted'}`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="w-[40%] flex items-center gap-3">
                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{item.name}</span>
                  </div>
                  <div className="w-[25%]">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${categoryColors[item.category] || 'bg-white/5 text-text-muted border-white/10'}`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="w-[15%] text-center">
                    <span className="text-2xl font-black text-white">{item.totalQty}</span>
                    <p className="text-[10px] text-text-muted">portions</p>
                  </div>
                  <div className="w-[15%] text-center">
                    <span className="text-lg font-black text-primary">{item.orderCount}</span>
                    <p className="text-[10px] text-text-muted">orders</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────── Coupon Manager ─────────────────────────────────── */
const CouponManager = () => {
  const { availableCoupons, usedCoupons, deleteUsedCoupons } = useOrders();
  const [deleted, setDeleted] = useState(false);
  const handleDeleteUsed = () => { deleteUsedCoupons(); setDeleted(true); setTimeout(() => setDeleted(false), 2500); };
  return (
    <div className="bg-secondary/40 rounded-3xl border border-white/10 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2"><Ticket size={20} className="text-primary" /> Coupon Vault</h3>
        {usedCoupons.length > 0 && (
          <button onClick={handleDeleteUsed} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-red-500/20 transition-all">
            <Trash2 size={14} />Delete Used ({usedCoupons.length})
          </button>
        )}
      </div>
      {deleted && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-xs text-green-400 font-bold">
          ✅ Used coupons deleted successfully.
        </motion.div>
      )}
      {availableCoupons.length > 0 && (
        <div>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Active Coupons</p>
          <div className="space-y-2">
            {availableCoupons.map(c => (
              <div key={c.code} className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <div><p className="text-sm font-black text-white">{c.code}</p><p className="text-[10px] text-text-muted">Milestone #{c.milestone} · {c.discount}% OFF</p></div>
                <span className="text-[10px] font-bold px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full uppercase">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {usedCoupons.length > 0 && (
        <div>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2">Used Coupons</p>
          <div className="space-y-2">
            {usedCoupons.map(c => (
              <div key={c.code} className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl px-4 py-3 opacity-50">
                <div><p className="text-sm font-black text-text-muted line-through">{c.code}</p><p className="text-[10px] text-text-muted">Milestone #{c.milestone} · Used {c.usedDate}</p></div>
                <span className="text-[10px] font-bold px-3 py-1 bg-white/5 text-text-muted border border-white/10 rounded-full uppercase">Used</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {availableCoupons.length === 0 && usedCoupons.length === 0 && (
        <p className="text-text-muted text-sm text-center py-6">No coupons in the vault.</p>
      )}
    </div>
  );
};

/* ─────────────────────── Menu Manager ───────────────────────────────────── */
const MenuManager = ({ menu, updateMenuStock, toggleMenuAvailability }) => (
  <div className="space-y-6">
    <div className="bg-secondary/30 p-6 rounded-2xl border border-white/10">
      <h3 className="text-2xl font-bold mb-4">Menu Inventory Control</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {menu.map(item => {
          const id = item._id || item.id;
          const price = item.price || 0;
          const stock = item.stock || 0;
          const minStock = item.minStock || item.min_stock || 0;
          const available = item.available ?? item.is_available ?? true;
          return (
            <div key={id} className="p-4 bg-bg-main/70 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold">{item.name}</h4>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Category: {item.category}</p>
              <p className="text-sm font-bold mb-2">Price: ${price.toFixed(2)}</p>
              <p className="text-xs text-text-muted mb-4">Stock: {stock} / Min {minStock}</p>
              <div className="flex gap-2">
                <button onClick={() => { const amount = Number(prompt('Adjust stock quantity:', stock)); if (!Number.isNaN(amount) && amount >= 0) updateMenuStock(id, amount); }}
                  className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-hover">Set Stock</button>
                <button onClick={() => toggleMenuAvailability(id)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest rounded-lg hover:border-primary hover:text-primary">
                  {available ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <div className="bg-secondary/30 p-6 rounded-2xl border border-white/10">
      <h3 className="text-2xl font-bold mb-4">Low Stock Alerts</h3>
      {menu.filter(item => (item.stock || 0) <= (item.minStock || item.min_stock || 0)).length > 0 ? (
        <ul className="space-y-2">
          {menu.filter(item => (item.stock || 0) <= (item.minStock || item.min_stock || 0)).map(item => (
            <li key={item._id || item.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-sm font-bold">{item.name}</span>
              <span className="text-xs text-red-300">Only {item.stock} left</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-text-muted">All items are above minimum stock levels.</p>}
    </div>
  </div>
);

/* ─────────────────────── Ingredient Manager ─────────────────────────────── */
const IngredientManager = ({ ingredients, updateIngredientStock, importIngredientsCSV, exportIngredientsCSV, reorderForecast }) => {
  const [message, setMessage] = React.useState('');
  const handleExport = () => {
    const csv = exportIngredientsCSV();
    const blob = new Blob([JSON.stringify(csv)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ingredient-inventory.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <div className="bg-secondary/30 p-6 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-start gap-4 justify-between mb-4">
          <h3 className="text-2xl font-bold">Ingredient Inventory</h3>
          <div className="flex gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-xl border border-primary/25 text-xs font-bold uppercase tracking-widest">
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { importIngredientsCSV(ev.target.result); setMessage('Inventory CSV imported.'); }; reader.readAsText(file); }} />
            </label>
            <button onClick={handleExport} className="px-4 py-2 bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all">Export CSV</button>
          </div>
        </div>
        {message && <p className="text-xs text-primary mb-3">{message}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ingredients.map(ing => {
            const id = ing._id || ing.id;
            const stock = typeof ing.stock === 'number' ? ing.stock : 0;
            const minStock = ing.minStock || ing.min_stock || 0;
            const prediction = reorderForecast.find(f => (f._id || f.id) === id) || ing;
            return (
              <div key={id} className="p-4 bg-bg-main/70 border border-white/10 rounded-xl">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold">{ing.name}</h4>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${prediction.needsReorder ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {prediction.needsReorder ? 'Reorder' : 'Healthy'}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-2">{stock.toFixed(2)} {ing.unit} / Min {minStock}</p>
                <p className="text-[10px] text-text-muted mt-1">Avg Daily: {prediction.avgDailyUsage?.toFixed(2) || '0.00'}</p>
                <p className="text-[10px] text-text-muted">Run-days: {Number.isFinite(prediction.projectedRunDays) ? prediction.projectedRunDays?.toFixed(1) : '∞'}</p>
                <div className="mt-3">
                  <button onClick={() => { const value = Number(window.prompt(`Set ${ing.name} stock qty`, stock)); if (!Number.isNaN(value) && value >= 0) updateIngredientStock(id, value); }}
                    className="w-full px-2 py-1 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Set Stock</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════
   Chef Kitchen Module — shows only to chef role
═══════════════════════════════════════════════════════════════════ */
const ChefKitchenModule = ({ orders, updateOrderStatus }) => {
  const activeOrders = orders.filter(o => ['pending','preparing'].includes(o.status));
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = statusFilter === 'all' ? activeOrders : activeOrders.filter(o => o.status === statusFilter);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white flex items-center gap-3"><ChefHat size={32} className="text-primary"/>My Kitchen</h2>
          <p className="text-text-muted mt-1">Orders assigned to your station — mark them as you cook</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-3 rounded-xl">
          <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"/>
          <span className="text-xs font-black text-primary uppercase tracking-widest">{activeOrders.length} ACTIVE</span>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5 w-fit">
        {['all','pending','preparing'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter===s?'bg-primary text-white':'text-text-muted hover:text-white'}`}>{s}</button>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Queue', value: orders.filter(o=>o.status==='pending').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Now Cooking',   value: orders.filter(o=>o.status==='preparing').length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Done Today',    value: orders.filter(o=>o.status==='served'||o.status==='paid').length, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map((s,i) => (
          <div key={i} className={`${s.bg} rounded-2xl border border-white/5 p-6 text-center`}>
            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Order cards */}
      {filtered.length === 0 ? (
        <div className="py-32 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
          <ChefHat size={56} className="mx-auto mb-4 text-text-muted opacity-20"/>
          <p className="text-sm font-bold uppercase tracking-widest text-text-muted">No active orders — Kitchen is clear!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(ord => {
            const id = ord._id || ord.id || '';
            const isPending = ord.status === 'pending';
            const ts = ord.timestamp || ord.created_at || new Date().toISOString();
            return (
              <motion.div key={id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                className={`rounded-3xl border p-6 space-y-4 ${isPending ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-blue-500/5 border-blue-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Order</p>
                    <h3 className="text-xl font-black text-white">{ord.order_number || `#${id.slice(-5).toUpperCase()}`}</h3>
                    {ord.customerName && ord.customerName !== 'Walk-in Guest' && (
                      <p className="text-[10px] text-text-muted mt-0.5">{ord.customerName}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase ${isPending ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {ord.status}
                  </span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                  {(ord.items||[]).map((item,i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-white/80">{item.name}</span>
                      <span className="text-sm font-black text-primary">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-muted">
                  <span>{ord.table || ord.table_number || 'Takeaway'}</span>
                  <span>{new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  {isPending ? (
                    <button onClick={() => updateOrderStatus(id, 'preparing')}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                      Start Cooking
                    </button>
                  ) : (
                    <button onClick={() => updateOrderStatus(id, 'served')}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                      Mark as Served ✓
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Staff Management — Manager: add/update captains
                    — Owner: add/update/delete managers + captains
═══════════════════════════════════════════════════════════════════ */
const StaffManagement = ({ currentUserRole }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'captain' });
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const allowedRoles = currentUserRole === 'owner' ? ['manager','captain'] : ['captain'];

  const load = () => {
    setLoading(true);
    const queries = allowedRoles.map(r => usersAPI.getAll(`?role=${r}`));
    Promise.all(queries).then(results => {
      const all = results.flatMap(r => r.data || []);
      setStaff(all);
    }).catch(() => setStaff([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name:'', email:'', phone:'', password:'', role: allowedRoles[0] });
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email, phone: u.phone||'', password:'', role: u.role });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        await usersAPI.update(editTarget._id, { name: form.name, email: form.email, phone: form.phone });
        flash('Staff member updated successfully');
      } else {
        await usersAPI.getAll; // just to check auth
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('bb_token')}` },
          body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role }),
        }).then(r => r.json()).then(d => { if (!d.success) throw new Error(d.message); });
        flash(`${form.role} added successfully`);
      }
      setShowForm(false);
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await usersAPI.delete(id);
      flash('Staff member removed');
      setDelConfirm(null);
      load();
    } catch (err) { flash(err.message, 'error'); }
  };

  const roleColor = { manager: 'text-blue-400 bg-blue-500/10 border-blue-500/20', captain: 'text-green-400 bg-green-500/10 border-green-500/20' };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading mb-1">Staff Management</h2>
          <p className="text-text-muted text-sm">
            {currentUserRole === 'owner' ? 'Add, update or remove managers and captains.' : 'Add or update captains (managers cannot delete staff).'}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary px-6 py-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
          + Add {allowedRoles[0] === 'captain' ? 'Captain' : 'Staff'}
        </button>
      </div>

      {msg.text && (
        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
          className={`px-5 py-3 rounded-xl text-sm font-bold border ${msg.type==='error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
          {msg.text}
        </motion.div>
      )}

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
            className="bg-secondary/40 rounded-3xl border border-primary/30 p-8">
            <h3 className="text-xl font-bold mb-6">{editTarget ? `Edit ${editTarget.name}` : `Add New ${form.role.charAt(0).toUpperCase()+form.role.slice(1)}`}</h3>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentUserRole === 'owner' && !editTarget && (
                <div className="col-span-full">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Role</label>
                  <div className="flex gap-3">
                    {allowedRoles.map(r => (
                      <button key={r} type="button" onClick={() => setForm(p=>({...p,role:r}))}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${form.role===r?'bg-primary border-primary text-white':'bg-white/5 border-white/10 text-text-muted hover:text-white'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {[
                {label:'Full Name', field:'name', type:'text', req:true},
                {label:'Email',     field:'email',type:'email',req:true},
                {label:'Phone',     field:'phone',type:'tel', req:false},
              ].map(({label,field,type,req}) => (
                <div key={field}>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">{label}</label>
                  <input type={type} required={req} value={form[field]} onChange={sf(field)}
                    className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm transition-all" />
                </div>
              ))}
              {!editTarget && (
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Password</label>
                  <input type="password" required value={form.password} onChange={sf('password')} placeholder="Set initial password"
                    className="w-full bg-bg-main border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm transition-all" />
                </div>
              )}
              <div className="col-span-full flex gap-3 pt-2">
                <button type="submit" className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-widest">
                  {editTarget ? 'Update' : 'Add Staff Member'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary"/></div>
      ) : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="flex px-8 py-4 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-white/5">
            <div className="w-[35%]">Staff Member</div>
            <div className="w-[20%]">Role</div>
            <div className="w-[25%]">Contact</div>
            <div className="w-[10%]">Status</div>
            <div className="w-[10%] text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/5">
            {staff.map(u => (
              <div key={u._id} className="flex items-center px-8 py-5 hover:bg-white/5 transition-all group">
                <div className="w-[35%] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt=""/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <p className="text-[10px] text-text-muted">{u.email}</p>
                  </div>
                </div>
                <div className="w-[20%]">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${roleColor[u.role] || 'text-text-muted bg-white/5 border-white/10'}`}>{u.role}</span>
                </div>
                <div className="w-[25%]">
                  <p className="text-xs text-text-muted">{u.phone || '—'}</p>
                </div>
                <div className="w-[10%]">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase border ${u.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {u.is_active ? 'Active' : 'Off'}
                  </span>
                </div>
                <div className="w-[10%] flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(u)} className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all" title="Edit">
                    <FileText size={14}/>
                  </button>
                  {currentUserRole === 'owner' && (
                    <button onClick={() => setDelConfirm(u)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Delete">
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {staff.length === 0 && (
              <div className="py-16 text-center text-text-muted">
                <Users size={40} className="mx-auto mb-3 opacity-20"/>
                <p className="text-sm font-bold uppercase tracking-widest">No staff members yet. Add your first one!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {delConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              className="bg-secondary rounded-3xl border border-red-500/30 p-10 max-w-md w-full text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={28} className="text-red-400"/>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Remove Staff?</h3>
                <p className="text-text-muted text-sm">This will permanently remove <span className="text-white font-bold">{delConfirm.name}</span> ({delConfirm.role}) from the system.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setDelConfirm(null)} className="flex-1 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest">Cancel</button>
                <button onClick={() => handleDelete(delConfirm._id)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────── User Management (real API) ─────────────────────── */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    usersAPI.getAll('?role=customer')
      .then(res => setUsers(res.data || []))
      .catch(() => setUsers([
        { _id: '1', name: 'John Doe',       email: 'john@example.com',  order_count: 12, loyalty_points: 412 },
        { _id: '2', name: 'Sarah Saffron',  email: 'sarah@biryani.com', order_count: 8,  loyalty_points: 210 },
        { _id: '3', name: 'Michael Masala', email: 'mike@tasty.com',    order_count: 5,  loyalty_points: 120 },
      ]))
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold font-heading mb-1">Access Protocol Hub</h2>
        <p className="text-text-muted text-sm font-medium">Monitoring guest activity and membership levels.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
          <div className="flex px-10 py-5 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] border-b border-white/5">
            <div className="w-[40%]">Member Identity</div>
            <div className="w-[20%]">Order Density</div>
            <div className="w-[20%]">Loyalty Points</div>
            <div className="w-[20%] text-right">Access Level</div>
          </div>
          <div className="divide-y divide-white/5">
            {users.map((u, i) => (
              <div key={u._id || i} className="flex items-center px-10 py-6 hover:bg-white/5 transition-all group">
                <div className="w-[40%] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt="User" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">{u.email}</p>
                  </div>
                </div>
                <div className="w-[20%]">
                  <span className="text-sm font-bold bg-white/5 px-3 py-1 rounded-md border border-white/10">{u.order_count || 0} Orders</span>
                </div>
                <div className="w-[20%] font-bold text-primary text-lg">{u.loyalty_points || 0} pts</div>
                <div className="w-[20%] text-right">
                  <span className="text-[9px] font-bold px-3 py-1 rounded-full uppercase border border-primary/20 text-primary bg-primary/10">Member</span>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="py-16 text-center text-text-muted"><p className="text-sm font-bold uppercase tracking-widest">No customers yet</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────── Revenue Chart ──────────────────────────────────── */
const RevenueChart = () => {
  const data = [12, 18, 15, 25, 22, 30, 28];
  const max = Math.max(...data);
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return (
    <div className="bg-secondary/40 p-10 rounded-3xl border border-white/5 shadow-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Weekly Revenue Pulse</h4>
        <span className="text-2xl font-bold font-heading text-primary">$1,240.50</span>
      </div>
      <div className="flex items-end justify-between h-48 gap-4 pt-4 px-4 overflow-hidden">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
            <div className="w-full relative flex items-end justify-center h-full">
              <motion.div initial={{ height: 0 }} animate={{ height: `${(val / max) * 100}%` }} transition={{ delay: i * 0.1, duration: 1 }}
                className="w-full max-w-[40px] bg-gradient-to-t from-primary/50 to-primary rounded-t-xl group-hover:to-white transition-all shadow-xl shadow-primary/20 relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">${val * 10}</div>
              </motion.div>
            </div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────── Misc Panels ────────────────────────────────────── */
const LoyaltySummary = ({ points = 650, setPoints }) => (
  <div className="bg-secondary/30 p-6 rounded-3xl border border-white/10 shadow-inner">
    <h3 className="text-xl font-bold mb-4">Customer Loyalty</h3>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="bg-white/5 p-4 rounded-xl">Tier: <strong>Gold</strong></div>
      <div className="bg-white/5 p-4 rounded-xl">Points: <strong>{points}</strong></div>
      <div className="bg-white/5 p-4 rounded-xl">Next: <strong>Platinum</strong></div>
      <div className="bg-white/5 p-4 rounded-xl">Exp: <strong>12 days</strong></div>
    </div>
    <button onClick={() => setPoints(points + 100)} className="mt-4 px-4 py-2 text-xs font-black uppercase tracking-widest bg-primary rounded-xl">Add +100 Points</button>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   FinancialKPIs — receives a pre-resolved plain object, NEVER a Promise.
   Shows a spinner while the data loads (financial.revenue === undefined).
══════════════════════════════════════════════════════════════════════════ */
const FinancialKPIs = ({ financial }) => {
  if (!financial || typeof financial.revenue !== 'number') {
    return (
      <div className="bg-secondary/30 p-6 rounded-3xl border border-white/10 shadow-inner flex items-center justify-center h-52">
        <Loader size={28} className="animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="bg-secondary/30 p-6 rounded-3xl border border-white/10 shadow-inner">
      <h3 className="text-xl font-bold mb-4">Financial KPIs</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-white/5 p-4 rounded-xl">Revenue<p className="mt-2 font-bold text-primary">${financial.revenue.toFixed(2)}</p></div>
        <div className="bg-white/5 p-4 rounded-xl">COGS<p className="mt-2 font-bold text-red-300">${financial.costOfGoods.toFixed(2)}</p></div>
        <div className="bg-white/5 p-4 rounded-xl">Gross Profit<p className="mt-2 font-bold text-green-300">${financial.profit.toFixed(2)}</p></div>
        <div className="bg-white/5 p-4 rounded-xl">Margin<p className="mt-2 font-bold text-primary">{financial.profitMargin.toFixed(2)}%</p></div>
      </div>
    </div>
  );
};

const KitchenWorkflow = ({ orders }) => {
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const nextTasks = activeOrders.flatMap(o => (o.items || []).map(item => ({
    orderId: o._id || o.id || '',
    orderNumber: o.order_number || null,
    dish: item.name,
    quantity: item.quantity,
  }))).slice(0, 8);
  return (
    <div className="bg-secondary/30 p-6 rounded-3xl border border-white/10 shadow-inner">
      <h3 className="text-xl font-bold mb-4">Kitchen Workflow</h3>
      <ul className="space-y-2">
        {nextTasks.length > 0 ? nextTasks.map((task, idx) => (
          <li key={`${task.orderId}-${idx}`} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-sm">
              {task.orderNumber || `#${(task.orderId || '').slice(-4)}`}: {task.quantity}× {task.dish}
            </span>
            <span className="text-[10px] text-primary uppercase font-bold">Prep now</span>
          </li>
        )) : <li className="text-text-muted text-sm font-bold">No active kitchen tasks</li>}
      </ul>
    </div>
  );
};

/* ─────────────────────── Order Booking Panel ─────────────────────────────── */
const OrderBookingPanel = ({ orders, updateOrderStatus, deleteOrder, acknowledgeOrder, user, statusColors }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const newCount = orders.filter(o => o.isNew).length;
  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <OrderIcon size={28} className="text-primary" />Order Booking
            {newCount > 0 && <span className="w-7 h-7 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center animate-bounce">{newCount}</span>}
          </h2>
          <p className="text-text-muted text-sm mt-1">{orders.length} total order{orders.length !== 1 ? 's' : ''} · {newCount} new</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
          {['all','pending','preparing','served','paid'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>{s}</button>
          ))}
        </div>
      </div>
      {newCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/30 rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-primary animate-bounce" />
            <p className="text-sm font-bold text-white"><span className="text-primary">{newCount} new order{newCount > 1 ? 's' : ''}</span> arrived from the floor!</p>
          </div>
          <button onClick={() => orders.filter(o => o.isNew).forEach(o => acknowledgeOrder(o._id || o.id))}
            className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-widest">Acknowledge All</button>
        </motion.div>
      )}
      <div className="bg-secondary/40 rounded-3xl border border-white/10 p-2 overflow-hidden shadow-2xl">
        <OrderTable orders={filtered} updateOrderStatus={updateOrderStatus} user={user} deleteOrder={deleteOrder} acknowledgeOrder={acknowledgeOrder} statusColors={statusColors} />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   Main Dashboard
══════════════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const {
    orders, menu, ingredients,
    updateOrderStatus, deleteOrder, acknowledgeOrder,
    updateMenuStock, toggleMenuAvailability, updateIngredientStock,
    importIngredientsCSV, exportIngredientsCSV,
    getReorderForecast, getFinancialMetrics,
  } = useOrders();

  const [activeTab, setActiveTab] = useState(user.role === 'chef' ? 'kitchen' : user.role === 'captain' ? 'pos' : 'overview');
  const [timeRange, setTimeRange] = useState('today');
  const [syncStatus, setSyncStatus] = useState('Idle');
  const [loyaltyPoints, setLoyaltyPoints] = useState(650);

  /* ── KEY FIX: financial is stored in state, loaded async ── */
  const [financial, setFinancial] = useState({
    revenue: 0, costOfGoods: 0, profit: 0, profitMargin: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await getFinancialMetrics();
        if (!cancelled && result && typeof result.revenue === 'number') {
          setFinancial(result);
        }
      } catch (_) {}
    };
    load();
    return () => { cancelled = true; };
  }, [orders]); // re-runs whenever orders list changes

  const statusColors = {
    pending:   'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    preparing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    served:    'bg-green-500/10 text-green-500 border-green-500/20',
    paid:      'bg-primary/20 text-primary border-primary/30',
  };

  const reorderForecast = React.useMemo(() => getReorderForecast(), [ingredients, orders]);

  const analytics = useMemo(() => {
    const pendingCount   = orders.filter(o => o.status === 'pending').length;
    const preparingCount = orders.filter(o => o.status === 'preparing').length;
    const servedCount    = orders.filter(o => o.status === 'served').length;
    const paidCount      = orders.filter(o => o.status === 'paid').length;
    const totalRev       = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue  = orders.length > 0 ? totalRev / orders.length : 0;
    const completionRate = orders.length > 0 ? (((servedCount + paidCount) / orders.length) * 100).toFixed(1) : 0;
    const itemFrequency  = {};
    orders.forEach(o => { (o.items || []).forEach(item => { itemFrequency[item.name] = (itemFrequency[item.name] || 0) + item.quantity; }); });
    const topItems = Object.entries(itemFrequency).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
    return { pendingCount, preparingCount, servedCount, paidCount, totalRev, avgOrderValue, completionRate, topItems, totalOrders: orders.length, avgCompletionTime: '18 min' };
  }, [orders]);

  return (
    <div className="min-h-screen bg-bg-main pl-72">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1">
        <Header />
        <main className="px-10 py-10">
          <AnimatePresence mode="wait">

            {/* ── COMMAND HUB ── */}
            {activeTab === 'overview' && (
              <MotionDiv key="overview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-black font-heading mb-2 text-white">Dashboard</h2>
                    <p className="text-text-muted text-sm font-medium">Real-time business intelligence & performance metrics</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    {['today','week','month'].map(range => (
                      <button key={range} onClick={() => setTimeRange(range)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-text-muted hover:text-white hover:bg-white/5'}`}>{range}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSyncStatus('Syncing...'); setTimeout(() => setSyncStatus('Synced at ' + new Date().toLocaleTimeString()), 1000); }}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-xs uppercase font-bold tracking-wide">Force Sync</button>
                    <span className="text-xs text-text-muted">{syncStatus}</span>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Revenue', value: `$${analytics.totalRev.toFixed(0)}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10', change: '+18.5%', secondary: `Avg: $${analytics.avgOrderValue.toFixed(2)}` },
                    { label: 'Active Orders', value: analytics.totalOrders, icon: Flame, color: 'text-primary', bg: 'bg-primary/10', change: `${analytics.pendingCount} pending`, secondary: `${analytics.preparingCount} in prep` },
                    { label: 'Completion Rate', value: `${analytics.completionRate}%`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10', change: '+2.3% vs yesterday', secondary: `Avg time: ${analytics.avgCompletionTime}` },
                    { label: 'Customer Satisfaction', value: '4.8★', icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-500/10', change: '+0.2 this week', secondary: `${orders.length} reviews` },
                  ].map((stat, idx) => (
                    <MotionDiv key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                      className="bg-gradient-to-br from-secondary/60 to-secondary/30 p-8 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                      <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} filter blur-3xl opacity-15 -translate-y-12 translate-x-12`} />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon size={24} /></div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${stat.bg} ${stat.color}`}>{stat.change}</span>
                        </div>
                        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                        <h3 className="text-4xl font-black mb-4">{stat.value}</h3>
                        <p className="text-xs text-text-muted font-medium">{stat.secondary}</p>
                      </div>
                    </MotionDiv>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="bg-secondary/40 rounded-3xl border border-white/10 p-8">
                    <div className="flex items-center justify-between mb-8"><h4 className="text-xl font-bold">Order Pipeline</h4><Zap size={20} className="text-primary" /></div>
                    <div className="space-y-5">
                      {[
                        { label: 'Pending',  value: analytics.pendingCount,   color: 'bg-yellow-500', icon: '📋' },
                        { label: 'Preparing',value: analytics.preparingCount, color: 'bg-blue-500',   icon: '👨‍🍳' },
                        { label: 'Served',   value: analytics.servedCount,    color: 'bg-green-500',  icon: '✅' },
                        { label: 'Paid',     value: analytics.paidCount,      color: 'bg-primary',    icon: '💰' },
                      ].map((status, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest">{status.icon} {status.label}</span>
                            <span className="text-lg font-black text-white">{status.value}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <MotionDiv initial={{ width: 0 }} animate={{ width: `${(status.value / Math.max(analytics.totalOrders, 1)) * 100}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 1 }} className={`h-full ${status.color}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </MotionDiv>

                  <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-secondary/40 rounded-3xl border border-white/10 p-8">
                    <div className="flex items-center justify-between mb-8"><h4 className="text-xl font-bold">Top Dishes</h4><BarChart3 size={20} className="text-primary" /></div>
                    <div className="space-y-5">
                      {analytics.topItems.length > 0 ? analytics.topItems.map((item, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-primary/30 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold truncate">{item.name}</span>
                            <span className="text-primary font-black text-lg">{item.count}×</span>
                          </div>
                          <p className="text-[10px] text-text-muted font-medium">Sold today</p>
                        </div>
                      )) : <p className="text-text-muted text-sm text-center py-8">No orders yet</p>}
                    </div>
                  </MotionDiv>

                  <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="bg-gradient-to-br from-primary/20 to-transparent rounded-3xl border border-primary/30 p-8 space-y-6">
                    <div className="flex items-center justify-between"><h4 className="text-xl font-bold">Quick Insights</h4><Eye size={20} className="text-primary" /></div>
                    <div className="space-y-5">
                      {[
                        { label: 'Peak Hour', value: '12:00 - 1:00 PM', color: 'text-primary' },
                        { label: 'Busiest Table', value: 'Table 3', color: 'text-white' },
                        { label: 'Average Wait Time', value: analytics.avgCompletionTime, color: 'text-green-500' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] text-text-muted font-bold uppercase mb-2">{label}</p>
                          <p className={`text-xl font-black ${color}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </MotionDiv>
                </div>

                {/* ── FIXED: financial state passed, not getFinancialMetrics() ── */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <KitchenWorkflow orders={orders} />
                  <LoyaltySummary points={loyaltyPoints} setPoints={setLoyaltyPoints} />
                  <FinancialKPIs financial={financial} />
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <RevenueChart />
                  <div className="bg-secondary/40 rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <h4 className="text-xl font-bold mb-8 flex items-center gap-3"><Calendar size={20} className="text-primary" />Revenue Trend</h4>
                    <div className="h-64 flex items-end justify-around gap-2 bg-white/5 p-6 rounded-2xl border border-white/5">
                      {[45,52,38,71,55,89,64].map((height, i) => (
                        <MotionDiv key={i} initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: i * 0.1 }}
                          className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t-xl hover:shadow-xl hover:shadow-primary/30 transition-all cursor-pointer group" title={`Day ${i+1}: $${height*100}`}>
                          <div className="h-full flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black text-white">${height*100}</span>
                          </div>
                        </MotionDiv>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/40 rounded-3xl border border-white/10 p-2 overflow-hidden shadow-2xl">
                  <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-2xl font-black flex items-center gap-3"><span className="w-3 h-3 bg-primary rounded-full animate-pulse" />Live Order Monitor</h2>
                    <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest bg-primary/10 p-2 px-4 rounded-xl border border-primary/20"><Clock size={14} />REAL-TIME</div>
                  </div>
                  <OrderTable orders={orders} updateOrderStatus={updateOrderStatus} user={user} deleteOrder={deleteOrder} acknowledgeOrder={acknowledgeOrder} statusColors={statusColors} />
                </div>

                <CouponManager />
              </MotionDiv>
            )}

            {/* ── ORDER BOOKING ── */}
            {activeTab === 'pos' && (
              <MotionDiv key="pos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {(user.role === 'owner' || user.role === 'manager') && (
                  <div className="mb-10">
                    <OrderBookingPanel orders={orders} updateOrderStatus={updateOrderStatus} deleteOrder={deleteOrder} acknowledgeOrder={acknowledgeOrder} user={user} statusColors={statusColors} />
                    <div className="my-8 border-t border-white/10" />
                    <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><OrderIcon size={20} className="text-primary" /> Place New Order</h3>
                  </div>
                )}
                <POS user={user} />
              </MotionDiv>
            )}

            {/* ── KITCHEN FLOW ── */}
            {activeTab === 'orders' && (
              <MotionDiv key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {user.role === 'captain' ? (
                  <ChefKitchenFlow orders={orders} updateOrderStatus={updateOrderStatus} />
                ) : (
                  <div className="space-y-10">
                    <ChefKitchenFlow orders={orders} updateOrderStatus={updateOrderStatus} />
                    <div className="border-t border-white/10 pt-8">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Monitor size={20} className="text-primary" /> Full Order Status Control</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map(ord => {
                          const id = ord._id || ord.id || '';
                          const table = ord.table || ord.table_number || '—';
                          return (
                            <div key={id} className="bg-secondary p-6 rounded-lg border-l-4 border-l-primary border border-white/5 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">{table}</p>
                                  <h4 className="text-lg font-bold">{ord.order_number || `#${id.slice(-4)}`}</h4>
                                  {ord.customerName && <p className="text-[10px] text-text-muted">{ord.customerName}</p>}
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 bg-white/5 rounded-full uppercase border ${statusColors[ord.status] || ''}`}>{ord.status}</span>
                              </div>
                              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                {(ord.items || []).map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-white/80">{item.quantity}x {item.name}</span>
                                    <span className="text-xs text-text-muted">${((item.price || item.unit_price || 0) * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <p className="text-xs text-text-muted font-bold uppercase">By {ord.captain || 'Staff'}</p>
                                <button onClick={() => updateOrderStatus(id, ord.status === 'pending' ? 'preparing' : 'served')}
                                  className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-4 py-2 rounded-sm uppercase tracking-widest transition-all">
                                  Mark {ord.status === 'pending' ? 'Preparing' : 'Served'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {orders.length === 0 && (
                          <div className="col-span-full h-80 flex flex-col items-center justify-center bg-white/5 rounded-lg border border-dashed border-white/20 text-text-muted space-y-4">
                            <Clock size={48} /><p className="text-sm font-bold uppercase tracking-widest">Awaiting Kitchen Orders...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </MotionDiv>
            )}

            {/* ── MENU MASTER ── */}
            {activeTab === 'menu' && (
              <MotionDiv key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <MenuManager menu={menu} updateMenuStock={updateMenuStock} toggleMenuAvailability={toggleMenuAvailability} />
                <IngredientManager ingredients={ingredients} updateIngredientStock={updateIngredientStock} importIngredientsCSV={importIngredientsCSV} exportIngredientsCSV={exportIngredientsCSV} reorderForecast={reorderForecast} />
              </MotionDiv>
            )}

            {/* ── ACCESS PROTOCOL ── */}
            {activeTab === 'users' && (
              <MotionDiv key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <UserManagement />
              </MotionDiv>
            )}

            {/* ── CHEF KITCHEN MODULE ── */}
            {activeTab === 'kitchen' && (
              <MotionDiv key="kitchen" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ChefKitchenModule orders={orders} updateOrderStatus={updateOrderStatus} />
              </MotionDiv>
            )}

            {/* ── STAFF MANAGEMENT (Owner: managers+captains / Manager: captains only) ── */}
            {activeTab === 'staffmgmt' && (
              <MotionDiv key="staffmgmt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <StaffManagement currentUserRole={user.role} />
              </MotionDiv>
            )}

            {/* ── PERSONNEL ── */}
            {activeTab === 'staff' && (
              <MotionDiv key="staff" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="max-w-2xl mx-auto glass p-12 text-center space-y-8">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.role}`} alt="Avatar" className="w-full h-full" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{user.name} Profile</h2>
                    <p className="text-primary font-bold uppercase tracking-widest">Access Role: {user.role}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-white/5 p-4 rounded-md">
                      <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">Employee ID</p>
                      <p className="font-bold">BB-00-2026-{user.role.toUpperCase()}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-md">
                      <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">Email</p>
                      <p className="font-bold text-sm">{user.email}</p>
                    </div>
                  </div>
                  <button className="w-full py-4 border border-white/10 rounded-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Update Security Token</button>
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