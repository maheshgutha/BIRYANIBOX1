import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, ChevronRight, UserPlus, LogIn, ShieldCheck, User } from 'lucide-react';

const CustomerAuth = () => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState('email');
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let result;
    if (isLogin) {
      result = await login(form.email, form.password);
    } else {
      result = await register(form.name, form.email, form.phone, form.password);
    }
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            <span className="text-primary">BIRYANI</span> BOX
          </h1>
          <p className="text-text-muted font-medium">Artisinal Taste, Securely Delivered</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold tracking-wide ${isLogin ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
            >
              <LogIn size={18} /> Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold tracking-wide ${!isLogin ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
            >
              <UserPlus size={18} /> Join Us
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={form.name}
                    onChange={set('name')}
                    className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {authMethod === 'email' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Access Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="chef@biryanibox.com"
                    value={form.email}
                    onChange={set('email')}
                    className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={set('phone')}
                    className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Verification Secret</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                <input
                  type="password"
                  required
                  placeholder="********"
                  value={form.password}
                  onChange={set('password')}
                  className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setAuthMethod(authMethod === 'email' ? 'phone' : 'email')}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
              >
                Use {authMethod === 'email' ? 'Phone' : 'Email'} Login
              </button>
              {isLogin && (
                <button type="button" className="text-[10px] font-bold text-text-muted uppercase tracking-widest hover:underline">
                  Forgot Secret?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Enter The Hub' : 'Register Account')}
              <ChevronRight size={20} />
            </button>
          </form>

          <div className="mt-8 flex items-center gap-2 justify-center opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secured Member Access</span>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-3 border border-white/20 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Back To Home
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-3 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all"
            >
              Staff Login
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-text-muted text-xs">
          Restoring your taste history in seconds.
        </p>
      </motion.div>
    </div>
  );
};

export default CustomerAuth;
