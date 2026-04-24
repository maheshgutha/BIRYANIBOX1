import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, ChefHat, Truck, Eye, EyeOff, Mail, Loader, KeyRound, RefreshCw, AlertTriangle } from 'lucide-react';
import { authAPI } from '../services/api';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('owner');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  // Forgot-password OTP state
  const [fpMode,   setFpMode]   = useState('idle'); // idle | sending | otp_sent | resetting | done
  const [fpEmail,  setFpEmail]  = useState('');
  const [fpOtp,    setFpOtp]    = useState('');
  const [fpNew,    setFpNew]    = useState('');
  const [fpConfirm,setFpConfirm]= useState('');
  const [fpMsg,    setFpMsg]    = useState('');
  const [fpError,  setFpError]  = useState('');
  const [fpBusy,   setFpBusy]   = useState(false);
  const [showFP,   setShowFP]   = useState(false); // toggle forgot-password panel

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

  // Staff role allowed to login through each tab
  const ROLE_PERMISSIONS = {
    owner:    ['owner'],
    manager:  ['manager'],
    captain:  ['captain'],
    chef:     ['chef'],
    delivery: ['delivery'],
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim())    { setError('Email is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
    setError('');
    const result = await login(email.trim(), password);
    if (result.success) {
      const loggedRole = result.user?.role || result.data?.role;
      const allowed = ROLE_PERMISSIONS[activeTab] || [];
      // Role mismatch — logged in but wrong tab selected
      if (loggedRole && !allowed.includes(loggedRole)) {
        // Log them out of context and show clear error
        localStorage.removeItem('bb_token');
        const roleLabel = loggedRole.charAt(0).toUpperCase() + loggedRole.slice(1);
        const tabLabel  = active?.label;
        setError(`These credentials belong to a ${roleLabel} account. Please select the ${roleLabel} tab to sign in.`);
        return;
      }
      navigate(active.redirect);
    } else {
      setError(result.error || 'Invalid email or password. Please try again.');
    }
  };

  const handleSendFpOTP = async () => {
    setFpError(''); setFpMsg('');
    if (!fpEmail.trim()) { setFpError('Enter your email address'); return; }
    setFpBusy(true);
    try {
      await authAPI.forgotPasswordOTP(fpEmail.trim());
      setFpMode('otp_sent');
      setFpMsg('OTP sent to ' + fpEmail + '. Check your inbox.');
    } catch (err) {
      setFpError(err.message || 'Failed to send OTP');
    } finally { setFpBusy(false); }
  };

  const handleResetFpPass = async (e) => {
    e.preventDefault();
    setFpError('');
    if (!fpOtp.trim())   { setFpError('Enter the OTP'); return; }
    if (!fpNew.trim())   { setFpError('Enter a new password'); return; }
    if (fpNew.length < 6){ setFpError('Password must be at least 6 characters'); return; }
    if (fpNew !== fpConfirm) { setFpError('Passwords do not match'); return; }
    setFpBusy(true);
    try {
      await authAPI.resetPasswordOTP({ email: fpEmail, otp: fpOtp, new_password: fpNew });
      setFpMode('done');
      setFpMsg('Password updated successfully! You can now sign in.');
      setFpOtp(''); setFpNew(''); setFpConfirm('');
    } catch (err) {
      setFpError(err.message || 'Invalid OTP or error resetting password');
    } finally { setFpBusy(false); }
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
              <button type="button" onClick={() => { setShowFP(p => !p); setFpMode('idle'); setFpError(''); setFpMsg(''); setFpEmail(''); }}
                className="w-full text-center text-[10px] text-white/30 hover:text-primary font-bold uppercase tracking-widest transition-colors mt-1">
                Forgot Password?
              </button>
            </form>

            {/* ── Forgot Password OTP Panel ── */}
            {showFP && (
              <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Reset Password</h3>
                  <button onClick={() => setShowFP(false)} className="text-white/30 hover:text-white text-xs">✕</button>
                </div>

                {fpError && <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">{fpError}</p>}
                {fpMsg   && <p className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">{fpMsg}</p>}

                {fpMode === 'done' ? (
                  <button onClick={() => { setShowFP(false); setFpMode('idle'); }}
                    className="w-full py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all">
                    Back to Sign In
                  </button>
                ) : fpMode === 'idle' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Your Email</label>
                      <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all" />
                    </div>
                    <button type="button" disabled={fpBusy} onClick={handleSendFpOTP}
                      className="w-full py-3 bg-primary/10 border border-primary/30 text-primary font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-primary/20 transition-all">
                      {fpBusy ? <Loader size={13} className="animate-spin" /> : <Mail size={13} />}
                      {fpBusy ? 'Sending…' : 'Send OTP to Email'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetFpPass} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">OTP Code</label>
                      <input type="text" inputMode="numeric" maxLength={6}
                        value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g,''))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white text-center tracking-[0.3em] font-black focus:outline-none focus:border-primary/50 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">New Password <span className="text-white/20">(min 6)</span></label>
                      <input type="password" value={fpNew} onChange={e => setFpNew(e.target.value)}
                        placeholder="New password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Confirm Password</label>
                      <input type="password" value={fpConfirm} onChange={e => setFpConfirm(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setFpMode('idle'); setFpError(''); setFpMsg(''); }}
                        className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 font-black text-xs uppercase rounded-xl hover:bg-white/10 transition-all">
                        Back
                      </button>
                      <button type="submit" disabled={fpBusy}
                        className="flex-1 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-primary-hover transition-all">
                        {fpBusy ? <Loader size={13} className="animate-spin" /> : <Lock size={13} />}
                        {fpBusy ? 'Saving…' : 'Set Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

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