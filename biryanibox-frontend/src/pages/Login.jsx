import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, ChefHat } from 'lucide-react';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('owner');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const roles = [
    { id: 'owner',   label: 'Owner',   icon: ShieldCheck, color: 'text-yellow-400', email: 'owner@biryanibox.com',   defaultPass: 'owner123'   },
    { id: 'manager', label: 'Manager', icon: User,        color: 'text-blue-400',   email: 'manager@biryanibox.com', defaultPass: 'manager123' },
    { id: 'captain', label: 'Captain', icon: Lock,        color: 'text-green-400',  email: 'captain@biryanibox.com', defaultPass: 'captain123' },
    { id: 'chef',    label: 'Chef',    icon: ChefHat,     color: 'text-orange-400', email: 'chef@biryanibox.com',    defaultPass: 'chef123'   },
  ];

  const active = roles.find(r => r.id === activeTab);

  const handleTabChange = (roleId) => {
    setActiveTab(roleId);
    setPassword('');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(active.email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main relative p-6">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-accent blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass p-10 rounded-2xl relative z-10 border border-white/10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-primary">BIRYANI</span>
            <span className="text-white">BOX</span>
          </h1>
          <p className="text-text-muted text-sm">Staff Management Portal</p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {roles.map(role => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => handleTabChange(role.id)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  activeTab === role.id
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-primary/40 hover:text-white'
                }`}
              >
                <Icon size={16} className={activeTab === role.id ? 'text-white' : role.color} />
                {role.label}
              </button>
            );
          })}
        </div>

        {/* Active Role Badge */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
          {active && <active.icon size={18} className="text-primary" />}
          <div>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Logging in as</p>
            <p className="text-sm font-black text-white uppercase tracking-wider">{active?.label}</p>
          </div>
          <span className="ml-auto px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
            {activeTab === 'owner' && 'Full Access'}
            {activeTab === 'manager' && 'Ops Access'}
            {activeTab === 'captain' && 'Table Access'}
            {activeTab === 'chef' && 'Kitchen Access'}
          </span>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              ID / Email
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
              <input
                type="text"
                value={active?.email || ''}
                readOnly
                className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-xl focus:border-primary outline-none text-white/70 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              Secure Token
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={`Enter password (default: ${active?.defaultPass})`}
                required
                className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-xl focus:border-primary outline-none text-white text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-sm font-black flex items-center justify-center gap-3 rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-60"
          >
            <ShieldCheck size={20} />
            {loading ? 'AUTHENTICATING...' : `AUTHENTICATE ${activeTab.toUpperCase()}`}
          </button>
        </form>

        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-white/20 rounded-xl hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest text-white/60 hover:text-white"
          >
            Back To Home
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            Customer Mode
          </button>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Authorized personnel only. Secure connection enabled.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;