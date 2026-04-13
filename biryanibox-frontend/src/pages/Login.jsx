import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, ChefHat, Truck, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('owner');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');

  const roles = [
    { id: 'owner',    label: 'Owner',   icon: ShieldCheck, color: 'text-yellow-400', access: 'Full Access',    redirect: '/dashboard' },
    { id: 'manager',  label: 'Manager', icon: User,        color: 'text-blue-400',   access: 'Ops Access',     redirect: '/dashboard' },
    { id: 'captain',  label: 'Captain', icon: Lock,        color: 'text-green-400',  access: 'Table Access',   redirect: '/dashboard' },
    { id: 'chef',     label: 'Chef',    icon: ChefHat,     color: 'text-orange-400', access: 'Kitchen Access', redirect: '/dashboard' },
    { id: 'delivery', label: 'Rider',   icon: Truck,       color: 'text-primary',    access: 'Rider Portal',   redirect: '/rider'     },
  ];

  const active = roles.find(r => r.id === activeTab);

  const handleTabChange = (roleId) => {
    setActiveTab(roleId);
    setEmail('');
    setPassword('');
    setError('');
    setShowPass(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim())    { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
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

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative z-10">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span className="text-primary">BIRYANI</span><span className="text-white">BOX</span>
          </h1>
          <p className="text-text-muted text-sm font-medium">Staff Management Portal</p>
        </div>

        <div className="bg-secondary/40 border border-white/10 rounded-3xl overflow-hidden">
          {/* Role tabs */}
          <div className="grid grid-cols-5 border-b border-white/10">
            {roles.map(role => {
              const Icon = role.icon;
              return (
                <button key={role.id} onClick={() => handleTabChange(role.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${
                    activeTab === role.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-white/30 hover:text-white/60 hover:bg-white/5'
                  }`}>
                  <Icon size={16} className={activeTab === role.id ? 'text-primary' : role.color + ' opacity-60'} />
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* Login form */}
          <div className="p-8">
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{active?.access}</span>
              <h2 className="text-xl font-black mt-1">Sign in as {active?.label}</h2>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={`Enter your email`}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {loading ? 'Signing In…' : `Sign In as ${active?.label}`}
              </button>
            </form>

            <p className="text-center text-[10px] text-white/20 font-bold mt-6">
              Customer?{' '}
              <button onClick={() => navigate('/auth')} className="text-primary hover:underline">
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;