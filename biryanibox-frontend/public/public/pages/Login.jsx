import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck } from 'lucide-react';

const UserIcon = () => <User size={20} />;
const SecurityIcon = () => <ShieldCheck size={20} />;
const ListIcon = () => <Lock size={20} />;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('owner');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    login(activeTab);
    navigate('/dashboard');
  };

  const roles = [
    { id: 'owner', label: 'Owner', icon: SecurityIcon, desc: 'Full business control & reports' },
    { id: 'manager', label: 'Manager', icon: UserIcon, desc: 'Status updates & daily ops' },
    { id: 'captain', label: 'Captain', icon: ListIcon, desc: 'Order booking & table management' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main relative p-6">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-accent blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass p-10 rounded-lg relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-primary">BIRYANI</span>
            <span className="text-white">BOX</span>
          </h1>
          <p className="text-text-muted">Staff Management Portal</p>
        </div>

        <div className="flex gap-4 mb-8">
          {['owner', 'manager', 'captain'].map((role) => (
            <button
              key={role}
              onClick={() => setActiveTab(role)}
              className={`flex-1 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${activeTab === role ? 'bg-primary text-white' : 'bg-white/5 border border-white/10 hover:border-primary/50'}`}
            >
              {role}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              ID / Email
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
              <input
                type="text"
                defaultValue={`${activeTab}@biryanibox.com`}
                readOnly
                className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-sm focus:border-primary outline-none"
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
                placeholder="********"
                className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-sm focus:border-primary outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
          >
            <ShieldCheck size={20} />
            AUTHENTICATE {activeTab.toUpperCase()}
          </button>
        </form>

        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest"
          >
            Back To Home
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all text-xs font-black uppercase tracking-widest"
          >
            Customer Mode
          </button>
        </div>

        <p className="text-center text-xs text-text-muted mt-8">
          Authorized personnel only. Secure connection enabled.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
