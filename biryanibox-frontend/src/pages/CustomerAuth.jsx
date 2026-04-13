import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, ChevronRight, UserPlus, LogIn, KeyRound, RefreshCw, Eye, EyeOff, Clock } from 'lucide-react';
import { authAPI } from '../services/api';

const OTP_DURATION = 60;

// Input styles as a constant — outside component so no re-creation
const inputCls = "w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all";

const CustomerAuth = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [mode,     setMode]     = useState('login');
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');
  const [busy,     setBusy]     = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend,setCanResend]= useState(false);
  const timerRef = useRef(null);

  // Use separate state per field to avoid full-form re-render on each keystroke
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [password,   setPassword]   = useState('');
  const [otp,        setOtp]        = useState('');

  const startTimer = useCallback(() => {
    setOtpTimer(OTP_DURATION);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim())    { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
    setError('');
    const result = await login(email, password);
    if (result.success) navigate('/');
    else setError(result.error || 'Invalid credentials');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!email.trim())     { setError('Email is required'); return; }
    if (!password.trim())  { setError('Password is required'); return; }
    setBusy(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await authAPI.sendOTP(email, fullName);
      setInfo(`OTP sent to ${email}. Check your inbox.`);
      setMode('otp');
      startTimer();
    } catch (err) { setError(err.message || 'Failed to send OTP'); }
    finally { setBusy(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) { setError('Enter the OTP from your email'); return; }
    setBusy(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const res = await authAPI.verifyOTP({ email, otp, name: fullName, phone, password });
      if (res.success && res.token) {
        localStorage.setItem('bb_token', res.token);
        navigate('/');
      }
    } catch (err) { setError(err.message || 'Invalid or expired OTP'); }
    finally { setBusy(false); }
  };

  const resendOTP = async () => {
    if (!canResend) return;
    setError(''); setBusy(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await authAPI.sendOTP(email, fullName);
      setInfo('New OTP sent to your email.');
      startTimer();
    } catch { setError('Failed to resend OTP'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main relative p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/8 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span className="text-primary">BIRYANI</span><span className="text-white">BOX</span>
          </h1>
          <p className="text-text-muted text-sm font-medium">
            {mode === 'login' ? 'Welcome back!' : mode === 'otp' ? 'Verify your email' : 'Create your account'}
          </p>
        </div>

        <div className="bg-secondary/40 border border-white/10 rounded-3xl p-8">
          {mode !== 'otp' && (
            <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10">
              {[['login', LogIn, 'Sign In'], ['register', UserPlus, 'Register']].map(([m, Icon, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); setInfo(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
                {error}
              </motion.div>
            )}
            {info && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-5 p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-bold">
                {info}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" autoComplete="email"
                    className={`${inputCls} pl-11 pr-4`} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Your password" autoComplete="current-password"
                    className={`${inputCls} pl-11 pr-12`} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={busy}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2">
                {busy ? 'Signing in…' : <><LogIn size={15} /> Sign In</>}
              </button>
            </form>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Anjali" autoComplete="given-name" className={`${inputCls} px-4`} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Sharma" autoComplete="family-name" className={`${inputCls} px-4`} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" autoComplete="email" className={`${inputCls} pl-11 pr-4`} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Phone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210" autoComplete="tel" className={`${inputCls} pl-11 pr-4`} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Create a password" autoComplete="new-password" className={`${inputCls} pl-11 pr-12`} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={busy}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {busy ? 'Sending OTP…' : <><ChevronRight size={15} /> Send OTP</>}
              </button>
            </form>
          )}

          {/* ── OTP ── */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="text-center mb-2">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={28} className="text-primary" />
                </div>
                <p className="text-sm text-white/60">Enter the 6-digit code sent to</p>
                <p className="font-black text-primary mt-1">{email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">OTP Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                  placeholder="______" maxLength={6} autoComplete="one-time-code"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-center text-2xl font-black tracking-[0.5em] text-white placeholder-white/15 focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock size={14} className={otpTimer > 0 ? 'text-primary' : 'text-white/30'} />
                {otpTimer > 0 ? (
                  <span className="text-xs font-bold text-white/50">Resend in <span className="text-primary font-black">{otpTimer}s</span></span>
                ) : (
                  <button type="button" onClick={resendOTP} disabled={busy || !canResend}
                    className="text-xs font-black text-primary hover:underline flex items-center gap-1 disabled:opacity-40">
                    <RefreshCw size={12} /> Resend OTP
                  </button>
                )}
              </div>
              <button type="submit" disabled={busy}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {busy ? 'Verifying…' : 'Verify & Create Account'}
              </button>
              <button type="button" onClick={() => { setMode('register'); setError(''); setInfo(''); clearInterval(timerRef.current); }}
                className="w-full text-center text-[10px] text-white/30 hover:text-white/60 font-bold uppercase tracking-widest">
                ← Back to Registration
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6">
          Staff?{' '}
          <button onClick={() => navigate('/login')} className="text-primary hover:underline font-bold">
            Staff login here
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default CustomerAuth;