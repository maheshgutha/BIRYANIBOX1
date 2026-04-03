import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
import {
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  Users,
  Settings,
  LogOut,
  Search,
  Plus,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Bell,
  ChevronDown,
  Monitor,
  Command,
  PieChart,
  ShoppingBag as OrderIcon,
  Zap,
  Target,
  Award,
  BarChart3,
  TrendingDown,
  Calendar,
  DollarSign,
  Flame,
  Eye,
} from 'lucide-react';
import { useAuth, useOrders } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import POS from '../components/POS';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Command Hub', icon: PieChart, roles: ['owner', 'manager'] },
    { id: 'pos', label: 'Order Booking', icon: OrderIcon, roles: ['owner', 'manager', 'captain'] },
    { id: 'orders', label: 'Kitchen Flow', icon: Monitor, roles: ['owner', 'manager', 'captain'] },
    { id: 'menu', label: 'Menu Master', icon: FileText, roles: ['owner', 'manager'] },
    { id: 'users', label: 'Access Protocol', icon: Users, roles: ['owner'] },
    { id: 'staff', label: 'Personnel', icon: Users, roles: ['owner', 'manager', 'captain'] },
  ];

  const filteredMenu = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="w-72 bg-bg-main border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-8 mb-8">
        <div className="flex items-center gap-4 bg-gradient-to-br from-primary/20 to-transparent p-4 rounded-xl border border-primary/20">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            <Command size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">BIRYANI</h1>
            <h2 className="text-xs text-primary font-bold tracking-widest leading-none">
              SYSTEM.v1
            </h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-2">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-sm font-semibold transition-all relative group ${activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
          >
            <item.icon
              size={20}
              className={
                activeTab === item.id
                  ? 'text-white'
                  : 'text-primary/70 group-hover:text-primary transition-colors'
              }
            />
            {item.label}
            {activeTab === item.id && (
              <motion.div
                layoutId="active"
                className="absolute left-[-24px] w-2 h-8 bg-primary rounded-r-full"
              />
            )}
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
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={20} />
          Sign Out Portal
        </button>
      </div>
    </div>
  );
};

const Header = () => {
  const { user } = useAuth();
  return (
    <div className="h-24 flex items-center justify-between px-10 border-b border-white/5 bg-bg-main/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
          Administrative Hub
        </h3>
        <span className="hidden md:block w-px h-6 bg-white/10 mx-6" />
        <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-text-muted bg-white/5 py-1 px-3 rounded-full border border-white/10 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white hover:border-primary/50 transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-4 ring-bg-main" />
          </button>
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="text-right">
            <p className="text-sm font-bold text-white uppercase tracking-wider">{user.name}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mt-1">
              {user.role}
            </p>
          </div>
          <button className="flex items-center gap-2 group p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.role}`}
                alt="Profile"
                className="w-full h-full"
              />
            </div>
            <ChevronDown
              size={14}
              className="text-text-muted group-hover:text-primary transition-all"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderTable = ({ orders, updateOrderStatus, user, deleteOrder, statusColors }) => {
  const getNextStatus = (current) => {
    const statuses = ['pending', 'preparing', 'served', 'paid'];
    const idx = statuses.indexOf(current);
    return idx < statuses.length - 1 ? statuses[idx + 1] : null;
  };

  return (
    <div className="bg-transparent overflow-hidden px-4 pb-4">
      <div className="flex px-10 py-4 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-widest bg-white/5 rounded-xl border border-white/5">
        <div className="w-[30%]">Order Identification</div>
        <div className="w-[15%]">Placement</div>
        <div className="w-[15%]">Amount</div>
        <div className="w-[15%]">Timeline</div>
        <div className="w-[15%] text-center">Lifecycle</div>
        <div className="w-[10%] text-right">Action</div>
      </div>

      <div className="space-y-3">
        {orders.map((ord) => (
          <motion.div
            key={ord.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center px-10 py-5 bg-secondary/30 rounded-2xl border border-white/5 hover:border-primary/20 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-[30%] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary border border-white/10 group-hover:scale-110 transition-transform">
                <ShoppingCart size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  #{ord.id.slice(-6).toUpperCase()}
                </p>
                <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">
                  By Captain {ord.captain}
                </p>
              </div>
            </div>

            <div className="w-[15%]">
              <span className="text-xs font-bold px-3 py-1 bg-white/5 rounded-md border border-white/10 text-white group-hover:bg-primary group-hover:text-white transition-colors">
                {ord.table}
              </span>
            </div>

            <div className="w-[15%]">
              <p className="text-sm font-bold text-primary">${ord.total.toFixed(2)}</p>
              <p className="text-[10px] text-text-muted">{ord.items.length} items</p>
            </div>

            <div className="w-[15%]">
              <p className="text-xs text-text-muted flex items-center gap-2 font-medium">
                <Clock size={12} className="text-primary/50" />
                {new Date(ord.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="w-[15%] flex justify-center">
              <span
                className={`text-[9px] font-bold px-4 py-1.5 rounded-full uppercase border shadow-sm ${statusColors[ord.status]}`}
              >
                {ord.status}
              </span>
            </div>

            <div className="w-[10%] flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
              {getNextStatus(ord.status) && (
                <button
                  onClick={() => updateOrderStatus(ord.id, getNextStatus(ord.status))}
                  className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                >
                  <ChevronRight size={18} />
                </button>
              )}
              {user.role === 'owner' && (
                <button
                  onClick={() => deleteOrder(ord.id)}
                  className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </motion.div>
        ))}

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

const MenuManager = ({ menu, updateMenuStock, toggleMenuAvailability }) => {
  return (
    <div className="space-y-6">
      <div className="bg-secondary/30 p-6 rounded-2xl border border-white/10">
        <h3 className="text-2xl font-bold mb-4">Menu Inventory Control</h3>
        <p className="text-text-muted text-sm mb-4">
          Manage kitchen items, stock levels, and availability from a centralized dashboard
          (Owner/Manager).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {menu.map((item) => (
            <div key={item.id} className="p-4 bg-bg-main/70 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold">{item.name}</h4>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${item.available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                >
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="text-xs text-text-muted uppercase tracking-widest mb-1">
                Category: {item.category}
              </p>
              <p className="text-sm font-bold mb-2">Price: ${item.price.toFixed(2)}</p>
              <p className="text-xs text-text-muted mb-4">
                Stock: {item.stock} / Min {item.minStock}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const amount = Number(prompt('Adjust stock quantity (numeric):', item.stock));
                    if (!Number.isNaN(amount) && amount >= 0) {
                      updateMenuStock(item.id, amount);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-hover"
                >
                  Set Stock
                </button>
                <button
                  onClick={() => toggleMenuAvailability(item.id)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest rounded-lg hover:border-primary hover:text-primary"
                >
                  {item.available ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-secondary/30 p-6 rounded-2xl border border-white/10">
        <h3 className="text-2xl font-bold mb-4">Low Stock Alerts</h3>
        {menu.filter((item) => item.stock <= item.minStock).length > 0 ? (
          <ul className="space-y-2">
            {menu
              .filter((item) => item.stock <= item.minStock)
              .map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                >
                  <span className="text-sm font-bold">{item.name}</span>
                  <span className="text-xs text-red-300">Only {item.stock} left</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-text-muted">All items are above minimum stock levels.</p>
        )}
      </div>
    </div>
  );
};

const IngredientManager = ({
  ingredients,
  updateIngredientStock,
  importIngredientsCSV,
  exportIngredientsCSV,
  reorderForecast,
}) => {
  const [message, setMessage] = React.useState('');

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const result = importIngredientsCSV(content);
      setMessage(result.error ? `Error: ${result.error}` : 'Inventory CSV imported successfully.');
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const csv = exportIngredientsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ingredient-inventory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const forecast = reorderForecast;

  return (
    <div className="space-y-6">
      <div className="bg-secondary/30 p-6 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-start gap-4 justify-between mb-4">
          <h3 className="text-2xl font-bold">Ingredient Inventory</h3>
          <div className="flex gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-xl border border-primary/25 text-xs font-bold uppercase tracking-widest">
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all"
            >
              Export CSV
            </button>
          </div>
        </div>

        {message && <p className="text-xs text-primary mb-3">{message}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ingredients.map((ing) => {
            const prediction = forecast.find((f) => f.id === ing.id) || ing;
            return (
              <div key={ing.id} className="p-4 bg-bg-main/70 border border-white/10 rounded-xl">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold">{ing.name}</h4>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${prediction.needsReorder ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}
                  >
                    {prediction.needsReorder ? 'Reorder' : 'Healthy'}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-2">
                  {ing.stock.toFixed(2)} {ing.unit} / Min {ing.minStock}
                </p>
                <p className="text-[10px] text-text-muted mt-1">
                  Avg Daily: {prediction.avgDailyUsage.toFixed(2)}
                </p>
                <p className="text-[10px] text-text-muted">
                  Run-days:{' '}
                  {Number.isFinite(prediction.projectedRunDays)
                    ? prediction.projectedRunDays.toFixed(1)
                    : '∞'}
                </p>
                <p className="text-[10px] text-text-muted">
                  Reorder in{' '}
                  {Number.isFinite(prediction.daysUntilReorder)
                    ? prediction.daysUntilReorder.toFixed(1)
                    : '∞'}{' '}
                  day(s)
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      const value = Number(window.prompt(`Set ${ing.name} stock qty`, ing.stock));
                      if (!Number.isNaN(value) && value >= 0) updateIngredientStock(ing.id, value);
                    }}
                    className="flex-1 px-2 py-1 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
                  >
                    Set Stock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const users = [
    { name: 'John Doe', email: 'john@example.com', orders: 12, total: '$412.00', role: 'customer' },
    {
      name: 'Sarah Saffron',
      email: 'sarah@biryani.com',
      orders: 8,
      total: '$210.50',
      role: 'customer',
    },
    {
      name: 'Michael Masala',
      email: 'mike@tasty.com',
      orders: 5,
      total: '$120.00',
      role: 'customer',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-heading mb-1">Access Protocol Hub</h2>
          <p className="text-text-muted text-sm font-medium">
            Monitoring guest activity and membership levels.
          </p>
        </div>
      </div>

      <div className="bg-secondary/40 rounded-3xl border border-white/5 overflow-hidden">
        <div className="flex px-10 py-5 bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] border-b border-white/5">
          <div className="w-[40%]">Member Identity</div>
          <div className="w-[20%]">Order Density</div>
          <div className="w-[20%]">Contribution</div>
          <div className="w-[20%] text-right">Access Level</div>
        </div>
        <div className="divide-y divide-white/5">
          {users.map((u, i) => (
            <div
              key={i}
              className="flex items-center px-10 py-6 hover:bg-white/5 transition-all group"
            >
              <div className="w-[40%] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-primary/30 overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                    alt="User"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{u.name}</p>
                  <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">
                    {u.email}
                  </p>
                </div>
              </div>
              <div className="w-[20%]">
                <span className="text-sm font-bold bg-white/5 px-3 py-1 rounded-md border border-white/10">
                  {u.orders} Orders
                </span>
              </div>
              <div className="w-[20%] font-bold text-primary font-heading text-lg">{u.total}</div>
              <div className="w-[20%] text-right">
                <span className="text-[9px] font-bold px-3 py-1 rounded-full uppercase border border-primary/20 text-primary bg-primary/10">
                  Member
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RevenueChart = () => {
  const data = [12, 18, 15, 25, 22, 30, 28]; // Sample daily sales
  const max = Math.max(...data);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-secondary/40 p-10 rounded-3xl border border-white/5 shadow-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" /> Weekly Revenue Pulse
        </h4>
        <span className="text-2xl font-bold font-heading text-primary">$1,240.50</span>
      </div>

      <div className="flex items-end justify-between h-48 gap-4 pt-4 px-4 overflow-hidden">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
            <div className="w-full relative flex items-end justify-center h-full">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(val / max) * 100}%` }}
                transition={{ delay: i * 0.1, duration: 1 }}
                className="w-full max-w-[40px] bg-gradient-to-t from-primary/50 to-primary rounded-t-xl group-hover:to-white transition-all shadow-xl shadow-primary/20 relative"
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  ${val * 10}
                </div>
              </motion.div>
            </div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {labels[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const KitchenWorkflow = ({ orders }) => {
  const activeOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing');
  const nextTasks = activeOrders
    .flatMap((o) =>
      o.items.map((item) => ({ orderId: o.id, dish: item.name, quantity: item.quantity }))
    )
    .slice(0, 8);

  return (
    <div className="bg-secondary/30 p-6 rounded-3xl border border-white/10 shadow-inner">
      <h3 className="text-xl font-bold mb-4">Kitchen Workflow</h3>
      <p className="text-xs text-text-muted mb-4">
        Optimized production checklist and in-kitchen queue.
      </p>
      <ul className="space-y-2">
        {nextTasks.length > 0 ? (
          nextTasks.map((task, idx) => (
            <li
              key={`${task.orderId}-${idx}`}
              className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10"
            >
              <span className="text-sm">
                #{task.orderId.slice(-4)}: {task.quantity}× {task.dish}
              </span>
              <span className="text-[10px] text-primary uppercase font-bold">Prep now</span>
            </li>
          ))
        ) : (
          <li className="text-text-muted text-sm font-bold">No active kitchen tasks</li>
        )}
      </ul>
    </div>
  );
};

const LoyaltySummary = ({ points = 650, setPoints }) => {
  return (
    <div className="bg-secondary/30 p-6 rounded-3xl border border-white/10 shadow-inner">
      <h3 className="text-xl font-bold mb-4">Customer Loyalty</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-white/5 p-4 rounded-xl">
          Tier: <strong>Gold</strong>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          Points: <strong>{points}</strong>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          Next Tier: <strong>Platinum</strong>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          Exp timeline: <strong>12 days</strong>
        </div>
      </div>
      <button
        onClick={() => setPoints(points + 100)}
        className="mt-4 px-4 py-2 text-xs font-black uppercase tracking-widest bg-primary rounded-xl"
      >
        Add +100 Points
      </button>
    </div>
  );
};

const FinancialKPIs = ({ financial }) => {
  return (
    <div className="bg-secondary/30 p-6 rounded-3xl border border-white/10 shadow-inner">
      <h3 className="text-xl font-bold mb-4">Financial KPIs</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white/5 p-4 rounded-xl">
          Revenue<p className="mt-2 font-bold text-primary">${financial.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          COGS<p className="mt-2 font-bold text-red-300">${financial.costOfGoods.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          Gross Profit
          <p className="mt-2 font-bold text-green-300">${financial.profit.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl">
          Margin<p className="mt-2 font-bold text-primary">{financial.profitMargin.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const {
    orders,
    menu,
    ingredients,
    updateOrderStatus,
    deleteOrder,
    updateMenuStock,
    toggleMenuAvailability,
    updateIngredientStock,
    importIngredientsCSV,
    exportIngredientsCSV,
    getReorderForecast,
    getFinancialMetrics,
  } = useOrders();
  const [activeTab, setActiveTab] = useState(user.role === 'captain' ? 'pos' : 'overview');
  const [timeRange, setTimeRange] = useState('today'); // today, week, month
  const [syncStatus, setSyncStatus] = useState('Idle');
  const [loyaltyPoints, setLoyaltyPoints] = useState(650);

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    preparing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    served: 'bg-green-500/10 text-green-500 border-green-500/20',
    paid: 'bg-primary/20 text-primary border-primary/30',
  };

  const reorderForecast = React.useMemo(
    () => getReorderForecast(),
    [ingredients, orders, menu, getReorderForecast]
  );

  // Enhanced Analytics Calculations
  const analytics = useMemo(() => {
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const preparingCount = orders.filter((o) => o.status === 'preparing').length;
    const servedCount = orders.filter((o) => o.status === 'served').length;
    const paidCount = orders.filter((o) => o.status === 'paid').length;

    const totalRev = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = orders.length > 0 ? totalRev / orders.length : 0;

    // Calculate completion time (mock data)
    const completionRate =
      orders.length > 0 ? (((servedCount + paidCount) / orders.length) * 100).toFixed(1) : 0;

    // Popular items
    const itemFrequency = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        itemFrequency[item.name] = (itemFrequency[item.name] || 0) + item.quantity;
      });
    });
    const topItems = Object.entries(itemFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return {
      pendingCount,
      preparingCount,
      servedCount,
      paidCount,
      totalRev,
      avgOrderValue,
      completionRate,
      topItems,
      totalOrders: orders.length,
      avgCompletionTime: '18 min',
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-bg-main pl-72">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1">
        <Header />

        <main className="px-10 py-10">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <MotionDiv
                key="overview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-10"
              >
                {/* Header with Time Range Selection */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-black font-heading mb-2 text-white">Dashboard</h2>
                    <p className="text-text-muted text-sm font-medium">
                      Real-time business intelligence & performance metrics
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    {['today', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSyncStatus('Syncing...');
                        setTimeout(
                          () => setSyncStatus('Synced at ' + new Date().toLocaleTimeString()),
                          1000
                        );
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-xs uppercase font-bold tracking-wide"
                    >
                      Force Sync
                    </button>
                    <span className="text-xs text-text-muted">{syncStatus}</span>
                  </div>
                </div>

                {/* Primary Metrics - Enhanced */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: 'Total Revenue',
                      value: `$${analytics.totalRev.toFixed(0)}`,
                      icon: DollarSign,
                      color: 'text-green-500',
                      bg: 'bg-green-500/10',
                      change: '+18.5%',
                      secondary: `Avg: $${analytics.avgOrderValue.toFixed(2)}`,
                    },
                    {
                      label: 'Active Orders',
                      value: analytics.totalOrders,
                      icon: Flame,
                      color: 'text-primary',
                      bg: 'bg-primary/10',
                      change: `${analytics.pendingCount} pending`,
                      secondary: `${analytics.preparingCount} in prep`,
                    },
                    {
                      label: 'Completion Rate',
                      value: `${analytics.completionRate}%`,
                      icon: Target,
                      color: 'text-blue-500',
                      bg: 'bg-blue-500/10',
                      change: `+2.3% vs yesterday`,
                      secondary: `Avg time: ${analytics.avgCompletionTime}`,
                    },
                    {
                      label: 'Customer Satisfaction',
                      value: '4.8★',
                      icon: Award,
                      color: 'text-yellow-500',
                      bg: 'bg-yellow-500/10',
                      change: '+0.2 this week',
                      secondary: `${orders.length} reviews`,
                    },
                    {
                      label: 'Reorder Alerts',
                      value: `${reorderForecast.filter((inv) => inv.needsReorder).length}`,
                      icon: Bell,
                      color: 'text-red-500',
                      bg: 'bg-red-500/10',
                      change: 'Auto-predicted',
                      secondary: 'Item level supply risk',
                    },
                  ].map((stat, idx) => (
                    <MotionDiv
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="bg-gradient-to-br from-secondary/60 to-secondary/30 p-8 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-primary/10"
                    >
                      <div
                        className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} filter blur-3xl opacity-15 -translate-y-12 translate-x-12 group-hover:opacity-30 transition-opacity`}
                      />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                          </div>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${stat.bg} ${stat.color}`}
                          >
                            {stat.change}
                          </span>
                        </div>

                        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-2">
                          {stat.label}
                        </p>
                        <h3 className="text-4xl font-black mb-4">{stat.value}</h3>
                        <p className="text-xs text-text-muted font-medium">{stat.secondary}</p>
                      </div>
                    </MotionDiv>
                  ))}
                </div>

                {/* Secondary Metrics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Status Breakdown */}
                  <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 }}
                    className="bg-secondary/40 rounded-3xl border border-white/10 p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-xl font-bold">Order Pipeline</h4>
                      <Zap size={20} className="text-primary" />
                    </div>

                    <div className="space-y-5">
                      {[
                        {
                          label: 'Pending',
                          value: analytics.pendingCount,
                          color: 'bg-yellow-500',
                          icon: '📋',
                        },
                        {
                          label: 'Preparing',
                          value: analytics.preparingCount,
                          color: 'bg-blue-500',
                          icon: '👨‍🍳',
                        },
                        {
                          label: 'Served',
                          value: analytics.servedCount,
                          color: 'bg-green-500',
                          icon: '✅',
                        },
                        {
                          label: 'Paid',
                          value: analytics.paidCount,
                          color: 'bg-primary',
                          icon: '💰',
                        },
                      ].map((status, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <span>{status.icon}</span> {status.label}
                            </span>
                            <span className="text-lg font-black text-white">{status.value}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <MotionDiv
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(status.value / Math.max(analytics.totalOrders, 1)) * 100}%`,
                              }}
                              transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                              className={`h-full ${status.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </MotionDiv>

                  {/* Top Performing Items */}
                  <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-secondary/40 rounded-3xl border border-white/10 p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-xl font-bold">Top Dishes</h4>
                      <BarChart3 size={20} className="text-primary" />
                    </div>

                    <div className="space-y-5">
                      {analytics.topItems.length > 0 ? (
                        analytics.topItems.map((item, i) => (
                          <div
                            key={i}
                            className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-primary/30 transition-all"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-bold truncate">{item.name}</span>
                              <span className="text-primary font-black text-lg">{item.count}×</span>
                            </div>
                            <p className="text-[10px] text-text-muted font-medium">Sold today</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-text-muted text-sm text-center py-8">No orders yet</p>
                      )}
                    </div>
                  </MotionDiv>

                  {/* Quick Stats */}
                  <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.48 }}
                    className="bg-gradient-to-br from-primary/20 to-transparent rounded-3xl border border-primary/30 p-8 shadow-2xl space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold">Quick Insights</h4>
                      <Eye size={20} className="text-primary" />
                    </div>

                    <div className="space-y-5">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-text-muted font-bold uppercase mb-2">
                          Peak Hour
                        </p>
                        <p className="text-2xl font-black text-primary">12:00 - 1:00 PM</p>
                      </div>

                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-text-muted font-bold uppercase mb-2">
                          Busiest Table
                        </p>
                        <p className="text-xl font-black">Table 3</p>
                      </div>

                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-text-muted font-bold uppercase mb-2">
                          Average Wait Time
                        </p>
                        <p className="text-xl font-black text-green-500">
                          {analytics.avgCompletionTime}
                        </p>
                      </div>
                    </div>
                  </MotionDiv>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <KitchenWorkflow orders={orders} />
                  <LoyaltySummary points={loyaltyPoints} setPoints={setLoyaltyPoints} />
                  <FinancialKPIs
                    financial={
                      getFinancialMetrics
                        ? getFinancialMetrics()
                        : { revenue: 0, costOfGoods: 0, profit: 0, profitMargin: 0 }
                    }
                  />
                </div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="lg:col-span-1">
                    <RevenueChart />
                  </div>
                  <div className="lg:col-span-1 bg-secondary/40 rounded-3xl border border-white/10 p-8 shadow-2xl">
                    <h4 className="text-xl font-bold mb-8 flex items-center gap-3">
                      <Calendar size={20} className="text-primary" />
                      Revenue Trend
                    </h4>
                    <div className="h-64 flex items-end justify-around gap-2 bg-white/5 p-6 rounded-2xl border border-white/5">
                      {[45, 52, 38, 71, 55, 89, 64].map((height, i) => (
                        <MotionDiv
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: i * 0.1 }}
                          className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t-xl hover:shadow-xl hover:shadow-primary/30 transition-all cursor-pointer group"
                          title={`Day ${i + 1}: $${height * 100}`}
                        >
                          <div className="h-full flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black text-white">
                              ${height * 100}
                            </span>
                          </div>
                        </MotionDiv>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-muted font-medium mt-4 text-center">
                      Last 7 days revenue
                    </p>
                  </div>
                </div>

                {/* Live Orders Section */}
                <div className="bg-secondary/40 rounded-3xl border border-white/10 p-2 overflow-hidden shadow-2xl">
                  <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-2xl font-black flex items-center gap-3">
                      <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                      Live Order Monitor
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest bg-primary/10 p-2 px-4 rounded-xl border border-primary/20">
                        <Clock size={14} />
                        REAL-TIME
                      </div>
                    </div>
                  </div>
                  <OrderTable
                    orders={orders}
                    updateOrderStatus={updateOrderStatus}
                    user={user}
                    deleteOrder={deleteOrder}
                    statusColors={statusColors}
                  />
                </div>
              </MotionDiv>
            )}

            {activeTab === 'pos' && (
              <MotionDiv
                key="pos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <POS user={user} />
              </MotionDiv>
            )}

            {activeTab === 'orders' && (
              <MotionDiv
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h2 className="text-2xl font-bold">Kitchen Display System (KDS)</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-secondary p-6 rounded-lg border-l-4 border-l-primary border border-white/5 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">
                            {ord.table}
                          </p>
                          <h4 className="text-lg font-bold">Booking #{ord.id.slice(-4)}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-3 py-1 bg-white/5 rounded-full uppercase border ${statusColors[ord.status]}`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-hide">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-white/80">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-xs text-text-muted">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest leading-none mt-auto">
                          By {ord.captain}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateOrderStatus(
                                ord.id,
                                ord.status === 'pending' ? 'preparing' : 'served'
                              )
                            }
                            className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-4 py-2 rounded-sm uppercase tracking-widest transition-all"
                          >
                            Mark {ord.status === 'pending' ? 'Preparing' : 'Served'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="col-span-full h-80 flex flex-col items-center justify-center bg-white/5 rounded-lg border border-dashed border-white/20 text-text-muted space-y-4">
                      <Clock size={48} />
                      <p className="text-sm font-bold uppercase tracking-widest">
                        Awaiting Kitchen Orders...
                      </p>
                    </div>
                  )}
                </div>
              </MotionDiv>
            )}

            {activeTab === 'users' && (
              <MotionDiv
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <UserManagement />
              </MotionDiv>
            )}

            {activeTab === 'menu' && (
              <MotionDiv
                key="menu"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <MenuManager
                  menu={menu}
                  updateMenuStock={updateMenuStock}
                  toggleMenuAvailability={toggleMenuAvailability}
                />
                <IngredientManager
                  ingredients={ingredients}
                  updateIngredientStock={updateIngredientStock}
                  importIngredientsCSV={importIngredientsCSV}
                  exportIngredientsCSV={exportIngredientsCSV}
                  reorderForecast={reorderForecast}
                />
              </MotionDiv>
            )}

            {activeTab === 'staff' && (
              <MotionDiv
                key="staff"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="max-w-2xl mx-auto glass p-12 text-center space-y-8">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.role}`}
                      alt="Avatar"
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{user.name} Profile</h2>
                    <p className="text-primary font-bold uppercase tracking-widest">
                      Access Role: {user.role}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-white/5 p-4 rounded-md">
                      <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">
                        Employee ID
                      </p>
                      <p className="font-bold">BB-00-2026-{user.role.toUpperCase()}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-md">
                      <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">
                        Shift Type
                      </p>
                      <p className="font-bold">Master / All-Day</p>
                    </div>
                  </div>
                  <button className="w-full py-4 border border-white/10 rounded-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                    Update Security Token
                  </button>
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
