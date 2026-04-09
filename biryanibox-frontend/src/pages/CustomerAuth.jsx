import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, ChevronRight, UserPlus, LogIn, ShieldCheck, User, KeyRound, RefreshCw } from 'lucide-react';
import { authAPI } from '../services/api';

const CustomerAuth = () => {
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [error, setError] = useState('');
  const [info,  setInfo]  = useState('');
  const [busy,  setBusy]  = useState(false);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', otp: '',
  });
  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  // ── Login ──────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) navigate('/');
    else setError(result.error || 'Invalid credentials');
  };

  // ── Send OTP for registration ──────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.first_name.trim()) { setError('First name is required'); return; }
    if (!form.email.trim())       { setError('Email is required'); return; }
    setBusy(true);
    try {
      const fullName = `${form.first_name} ${form.last_name}`.trim();
      await authAPI.sendOTP(form.email, fullName);
      setInfo(`OTP sent to ${form.email}. Check your inbox.`);
      setMode('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally { setBusy(false); }
  };

  // ── Verify OTP and complete registration ───────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.otp.trim()) { setError('Enter the OTP from your email'); return; }
    setBusy(true);
    try {
      const fullName = `${form.first_name} ${form.last_name}`.trim();
      const res = await authAPI.verifyOTP({
        email:    form.email,
        otp:      form.otp,
        name:     fullName,
        phone:    form.phone,
        password: form.password,
      });
      if (res.success && res.token) {
        localStorage.setItem('bb_token', res.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally { setBusy(false); }
  };

  const resendOTP = async () => {
    setError('');
    setBusy(true);
    try {
      const fullName = `${form.first_name} ${form.last_name}`.trim();
      await authAPI.sendOTP(form.email, fullName);
      setInfo('New OTP sent to your email.');
    } catch (err) { setError('Failed to resend OTP'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-bg-main text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            <span className="text-primary">BIRYANI</span> BOX
          </h1>
          <p className="text-text-muted font-medium">Artisanal Taste, Securely Delivered</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/5 shadow-2xl">
          {/* Tab bar */}
          {mode !== 'otp' && (
            <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
              <button onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold tracking-wide ${mode === 'login' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
                <LogIn size={18} /> Login
              </button>
              <button onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold tracking-wide ${mode === 'register' ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
                <UserPlus size={18} /> Join Us
              </button>
            </div>
          )}

          {/* Error / info */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">{error}</div>
          )}
          {info && !error && (
            <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-bold">{info}</div>
          )}

          {/* ── LOGIN FORM ───────────────────────────────────────── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input type="email" required placeholder="you@example.com"
                    value={form.email} onChange={set('email')}
                    className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input type="password" required placeholder="••••••••"
                    value={form.password} onChange={set('password')}
                    className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3 disabled:opacity-60">
                {loading ? 'Signing in…' : 'Enter The Hub'} <ChevronRight size={20} />
              </button>
            </form>
          )}

          {/* ── REGISTER FORM ────────────────────────────────────── */}
          {mode === 'register' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              {/* First + Last name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
                    <input type="text" required placeholder="First"
                      value={form.first_name} onChange={set('first_name')}
                      className="w-full bg-bg-main border border-white/10 p-3.5 pl-10 rounded-2xl focus:border-primary outline-none transition-all text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Last Name</label>
                  <input type="text" placeholder="Last"
                    value={form.last_name} onChange={set('last_name')}
                    className="w-full bg-bg-main border border-white/10 p-3.5 rounded-2xl focus:border-primary outline-none transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input type="email" required placeholder="you@example.com"
                    value={form.email} onChange={set('email')}
                    className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input type="tel" placeholder="+1 555 000 0000"
                    value={form.phone} onChange={set('phone')}
                    className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input type="password" required placeholder="Min 6 characters" minLength={6}
                    value={form.password} onChange={set('password')}
                    className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="px-2 py-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-primary font-bold flex items-center gap-2">
                <ShieldCheck size={14} /> An OTP will be sent to your email to verify your account
              </div>
              <button type="submit" disabled={busy}
                className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3 disabled:opacity-60">
                {busy ? 'Sending OTP…' : 'Send OTP to Email'} <ChevronRight size={20} />
              </button>
            </form>
          )}

          {/* ── OTP VERIFICATION FORM ────────────────────────────── */}
          {mode === 'otp' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 border border-primary/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={28} className="text-primary" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Check Your Email</h3>
                <p className="text-sm text-text-muted">
                  We sent a 6-digit code to <span className="text-primary font-bold">{form.email}</span>
                </p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Enter OTP *</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                    <input
                      type="text"
                      maxLength={6}
                      pattern="\d{6}"
                      required
                      placeholder="6-digit code"
                      value={form.otp}
                      onChange={set('otp')}
                      className="w-full bg-bg-main border border-white/10 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all text-center text-xl font-black tracking-[0.4em]"
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" disabled={busy}
                  className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3 disabled:opacity-60">
                  {busy ? 'Verifying…' : 'Verify & Create Account'} <ChevronRight size={20} />
                </button>
              </form>
              <div className="flex items-center justify-between text-xs">
                <button onClick={() => { setMode('register'); setError(''); setInfo(''); }}
                  className="text-text-muted hover:text-white font-bold uppercase tracking-widest">← Back</button>
                <button onClick={resendOTP} disabled={busy}
                  className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-widest hover:underline disabled:opacity-60">
                  <RefreshCw size={12} /> Resend OTP
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 justify-center opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secured Member Access</span>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => navigate('/')}
              className="px-5 py-3 border border-white/20 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              Back To Home
            </button>
            <button onClick={() => navigate('/login')}
              className="px-5 py-3 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all">
              Staff Login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerAuth;