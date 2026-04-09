import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, ChefHat, Truck } from 'lucide-react';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('owner');
  const [email,    setEmail]    = useState('owner@biryanibox.com');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const roles = [
    { id: 'owner',    label: 'Owner',   icon: ShieldCheck, color: 'text-yellow-400', defaultEmail: 'owner@biryanibox.com',    defaultPass: 'owner123',   access: 'Full Access',    redirect: '/dashboard' },
    { id: 'manager',  label: 'Manager', icon: User,        color: 'text-blue-400',   defaultEmail: 'manager@biryanibox.com',  defaultPass: 'manager123', access: 'Ops Access',     redirect: '/dashboard' },
    { id: 'captain',  label: 'Captain', icon: Lock,        color: 'text-green-400',  defaultEmail: 'captain@biryanibox.com',  defaultPass: 'captain123', access: 'Table Access',   redirect: '/dashboard' },
    { id: 'chef',     label: 'Chef',    icon: ChefHat,     color: 'text-orange-400', defaultEmail: 'chef@biryanibox.com',     defaultPass: 'chef123',    access: 'Kitchen Access', redirect: '/dashboard' },
    { id: 'delivery', label: 'Rider',   icon: Truck,       color: 'text-primary',    defaultEmail: 'rider@biryanibox.com',    defaultPass: 'rider123',   access: 'Rider Portal',   redirect: '/rider'     },
  ];

  const active = roles.find(r => r.id === activeTab);

  const handleTabChange = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    setActiveTab(roleId);
    setEmail(role?.defaultEmail || '');
    setPassword('');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email.trim(), password);
    if (result.success) {
      navigate(active.redirect);
    } else {
      setError(result.error || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main relative p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/8 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span className="text-primary">BIRYANI</span>
            <span className="text-white">BOX</span>
          </h1>
          <p className="text-text-muted text-sm font-medium">Staff Management Portal</p>
        </div>

        <div className="bg-secondary/40 border border-white/10 rounded-3xl overflow-hidden">
          {/* Role tabs */}
          <div className="grid grid-cols-5 border-b border-white/10">
            {roles.map(role => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => handleTabChange(role.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${
                    activeTab === role.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-white/30 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} className={activeTab === role.id ? 'text-primary' : role.color + ' opacity-60'} />
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* Form body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-8"
            >
              {/* Role badge */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 mb-7">
                {active && <active.icon size={18} className="text-primary shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Signing in as</p>
                  <p className="text-sm font-black text-white uppercase tracking-wider">{active?.label}</p>
                </div>
                <span className="shrink-0 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                  {active?.access}
                </span>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email — always editable */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={`e.g. ${active?.defaultEmail}`}
                      className="w-full bg-bg-main border border-white/10 p-3.5 pl-11 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-text-muted px-1">
                    Default: <code className="text-primary font-mono">{active?.defaultEmail}</code>
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={`Default: ${active?.defaultPass}`}
                      className="w-full bg-bg-main border border-white/10 p-3.5 pl-11 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-text-muted px-1">
                    Default pass: <code className="text-primary font-mono">{active?.defaultPass}</code>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 bg-primary hover:bg-primary-hover text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating…</>
                  ) : (
                    <>{active && <active.icon size={16} />} Enter {active?.label} Portal</>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="text-center mt-6 space-y-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs text-primary hover:text-yellow-400 font-bold uppercase tracking-widest transition-colors"
          >
            ← Back to Customer Page
          </a>
          <p className="text-[11px] text-text-muted">
            Secure access · Biryani Box Management System v2
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;