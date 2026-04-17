import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { giftCardsAPI } from '../services/api';
import { useAuth } from '../context/useContextHooks';
import {
  Gift, Mail, CheckCircle, Copy, ShieldCheck, Smartphone,
  Loader, Eye, Send, AlertCircle, XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ── GiftCardItem: shows balance, copy code, and partial-use input ─────────────
const GiftCardItem = ({ card, copyCode, copied, onRefresh }) => {
  const [useAmount, setUseAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState('');
  const [showUse, setShowUse] = useState(false);

  const handleRedeem = async () => {
    const amt = parseFloat(useAmount);
    if (!amt || amt <= 0 || amt > card.balance) {
      setRedeemMsg('Enter a valid amount (max $' + card.balance + ')');
      return;
    }
    setRedeeming(true); setRedeemMsg('');
    try {
      const res = await giftCardsAPI.redeem({ code: card.code, amount_to_use: amt });
      const data = res.data || res;
      setRedeemMsg(`✓ $${data.amount_used?.toFixed(2)} used. Remaining: $${data.remaining_balance?.toFixed(2)}`);
      setUseAmount('');
      setShowUse(false);
      setTimeout(() => { setRedeemMsg(''); onRefresh(); }, 2500);
    } catch (err) {
      setRedeemMsg('❌ ' + (err.message || 'Redeem failed'));
    } finally { setRedeeming(false); }
  };

  const isFullyUsed = card.status === 'used' || (card.balance !== undefined && card.balance <= 0);
  const statusBadge = (s) =>
    isFullyUsed ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : s === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : 'bg-white/10 text-white/40 border-white/20';

  return (
    <div className={`bg-secondary/40 border rounded-3xl p-6 space-y-4 ${isFullyUsed ? 'border-red-500/20 opacity-70' : 'border-white/10'}`}>
      {/* Balance + Status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">
            {isFullyUsed ? 'Gift Card Expired' : 'Available Balance'}
          </p>
          <span className={`text-3xl font-black ${isFullyUsed ? 'text-red-400 line-through' : 'text-primary'}`}>
            ${card.balance?.toFixed(2)}
          </span>
          {card.denomination && (
            <span className="text-xs text-text-muted ml-2">/ ${card.denomination} total</span>
          )}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusBadge(card.status, card.balance)}`}>
          {isFullyUsed ? '✗ Fully Used' : '✓ Active'}
        </span>
      </div>

      {/* Progress bar — shows how much has been used */}

      {card.denomination && (
        <div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (card.balance / card.denomination) * 100)}%` }} />
          </div>
          <p className="text-[10px] text-text-muted mt-1">${(card.denomination - card.balance).toFixed(2)} used of ${card.denomination}</p>
        </div>
      )}

      {/* Code row */}
      <div className="flex items-center gap-2 font-mono text-sm font-black text-white/80 tracking-widest bg-white/5 px-4 py-3 rounded-xl">
        <span className="flex-1">{card.code}</span>
        {!isFullyUsed && (
          <button onClick={() => copyCode(card.code)} className="text-white/40 hover:text-primary transition-colors">
            {copied === card.code ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        )}
      </div>

      {/* Status info banner */}
      {isFullyUsed ? (
        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          <XCircle size={11} className="text-red-400 shrink-0" />
          <p className="text-[10px] font-bold text-red-300">This gift card has been fully used (${card.denomination} of ${card.denomination} spent). No balance remaining.</p>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
          <CheckCircle size={11} className="text-green-400 shrink-0" />
          <p className="text-[10px] font-bold text-green-300">Use any amount per order — remaining balance stays on your card!</p>
        </div>
      )}

      {/* Use partial amount — only show if card is still active */}
      {!isFullyUsed && (
        <div>
          <button onClick={() => setShowUse(s => !s)}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
            <Gift size={12} /> {showUse ? 'Hide' : 'Redeem Amount Now'}
          </button>
          {showUse && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={card.balance}
                  step="0.01"
                  placeholder={`Amount (max $${card.balance})`}
                  value={useAmount}
                  onChange={e => setUseAmount(e.target.value)}
                  className="flex-1 bg-bg-main border border-white/10 px-3 py-2 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all"
                />
                <button onClick={handleRedeem} disabled={redeeming}
                  className="px-4 py-2 bg-primary text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-primary/80 transition-all disabled:opacity-50">
                  {redeeming ? '...' : 'Use'}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 100].filter(v => v <= card.balance).map(v => (
                  <button key={v} onClick={() => setUseAmount(String(v))}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-text-muted hover:text-primary hover:border-primary/30 transition-all">
                    ${v}
                  </button>
                ))}
                <button onClick={() => setUseAmount(String(card.balance))}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-text-muted hover:text-primary hover:border-primary/30 transition-all">
                  Full (${card.balance})
                </button>
              </div>
              {redeemMsg && <p className={`text-[11px] font-bold ${redeemMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{redeemMsg}</p>}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-white/30">From: {card.sender_name || card.purchased_by || 'Someone'}</p>
      {card.expiry_date && <p className="text-xs text-white/20">Expires: {new Date(card.expiry_date).toLocaleDateString()}</p>}
    </div>
  );
};

const GiftCards = () => {
  const { user }     = useAuth();
  const navigate     = useNavigate();

  // Purchase flow
  const [step,    setStep]    = useState(1);
  const [amount,  setAmount]  = useState(500);
  const [form,    setForm]    = useState({ sender_name: '', sender_email: '', receiver_name: '', receiver_email: '' });
  const [cardCode, setCardCode] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [copied,   setCopied]   = useState('');

  // Tabs
  const [viewTab,   setViewTab]   = useState('buy');  // 'buy' | 'mine' | 'sent'
  const [myCards,   setMyCards]   = useState([]);
  const [sentCards, setSentCards] = useState([]);

  const amounts = [100, 250, 500, 1000, 2000, 5000];
  const sf = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  // Pre-fill sender from logged-in user
  useEffect(() => {
    if (user) setForm(p => ({ ...p, sender_name: user.name || p.sender_name, sender_email: user.email || p.sender_email }));
  }, [user]);

  useEffect(() => {
    if (viewTab === 'mine' && user)
      giftCardsAPI.myCards().then(r => setMyCards(r.data || [])).catch(() => setMyCards([]));
    if (viewTab === 'sent' && user)
      giftCardsAPI.sentCards().then(r => setSentCards(r.data || [])).catch(() => setSentCards([]));
  }, [viewTab, user]);

  const handlePurchase = async () => {
    if (!form.sender_name.trim())    { setError('Your name is required'); return; }
    if (!form.sender_email.trim())   { setError('Your email is required'); return; }
    if (!form.receiver_email.trim()) { setError('Receiver email is required'); return; }
    if (!form.receiver_name.trim())  { setError('Receiver name is required');  return; }
    setLoading(true); setError('');
    try {
      const res = await giftCardsAPI.purchase({
        denomination:    amount,
        sender_name:     form.sender_name,
        sender_email:    form.sender_email,
        receiver_name:   form.receiver_name,
        receiver_email:  form.receiver_email,
        delivery_method: 'email',
      });
      setCardCode(res.data.code);
      setStep(4);
      if (user) giftCardsAPI.sentCards().then(r => setSentCards(r.data || [])).catch(() => {});
    } catch (err) {
      setError(err.message || 'Purchase failed');
    } finally { setLoading(false); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const statusBadge = (status, balance) =>
    (status === 'used' || balance === 0)
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : status === 'active'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-white/10 text-white/40 border-white/20';

  return (
    <div className="min-h-screen bg-bg-main text-white pt-32 pb-20 relative overflow-hidden">
      <Navbar />
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="container max-w-5xl mx-auto relative z-10 px-6">

        {/* Header */}
        <div className="mb-14">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Artisan Currency</span>
          <h1 className="text-6xl md:text-7xl font-black font-heading mb-4">Gift of <span className="text-primary">Flavors.</span></h1>
          <p className="text-lg text-text-muted max-w-xl">Send a gift card — the recipient can use any amount per order and the balance carries over until fully spent.</p>
        </div>

        {/* Divisible use notice */}
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-3 mb-8 w-fit">
          <CheckCircle size={14} className="text-green-400 shrink-0" />
          <p className="text-xs font-bold text-green-300">Gift cards support <strong>partial use</strong> — use any amount and the remaining balance stays for future orders!</p>
        </div>

        {/* Main Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-10 border border-white/10 w-fit gap-1">
          {[
            ['buy',  Gift, 'Send Gift Card'],
            ['mine', Eye,  'Received Cards'],
            ['sent', Send, 'Sent Cards'],
          ].map(([t, Icon, label]) => (
            <button key={t} onClick={() => setViewTab(t)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewTab === t ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ── RECEIVED CARDS ── */}
        {viewTab === 'mine' && (
          <div>
            {!user ? (
              <div className="text-center py-16 bg-secondary/40 border border-white/10 rounded-3xl">
                <Gift size={40} className="mx-auto mb-4 text-white/20" />
                <p className="text-white/40 font-bold mb-4">Sign in to view your received gift cards.</p>
                <button onClick={() => navigate('/auth')}
                  className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full">Sign In</button>
              </div>
            ) : myCards.length === 0 ? (
              <div className="text-center py-16 bg-secondary/40 border border-white/10 rounded-3xl">
                <Gift size={40} className="mx-auto mb-4 text-white/20" />
                <p className="text-white/40 font-bold">No active gift cards in your inbox.</p>
                <p className="text-white/20 text-xs mt-2">Gift cards are matched to your email address.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {myCards.map(card => (
                  <GiftCardItem key={card._id} card={card} copyCode={copyCode} copied={copied} onRefresh={() => {
                    giftCardsAPI.myCards().then(r => setMyCards(r.data || [])).catch(() => {});
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SENT CARDS ── */}
        {viewTab === 'sent' && (
          <div>
            {!user ? (
              <div className="text-center py-16 bg-secondary/40 border border-white/10 rounded-3xl">
                <Send size={40} className="mx-auto mb-4 text-white/20" />
                <p className="text-white/40 font-bold mb-4">Sign in to view sent cards.</p>
                <button onClick={() => navigate('/auth')}
                  className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full">Sign In</button>
              </div>
            ) : sentCards.length === 0 ? (
              <div className="text-center py-16 bg-secondary/40 border border-white/10 rounded-3xl">
                <Send size={40} className="mx-auto mb-4 text-white/20" />
                <p className="text-white/40 font-bold">No gift cards sent yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {sentCards.map(card => (
                  <div key={card._id} className="bg-secondary/40 border border-white/10 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl font-black text-primary">₹{card.denomination}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusBadge(card.status, card.balance)}`}>
                        {(card.status === 'used' || card.balance === 0) ? '✗ Fully Used' : '✓ Active'}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mb-3">
                      To: <span className="text-white/80 font-bold">{card.receiver_name || card.recipient_name || '—'}</span>
                      {card.receiver_email && <span className="text-white/30"> ({card.receiver_email})</span>}
                    </p>
                    {/* Unique code visible to sender */}
                    <div className="flex items-center gap-2 font-mono text-sm font-black text-white/70 tracking-widest bg-white/5 px-4 py-3 rounded-xl mb-2">
                      <span className="flex-1">{card.code}</span>
                      <button onClick={() => copyCode(card.code)} className="text-white/40 hover:text-primary transition-colors">
                        {copied === card.code ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-white/20">Status: {card.status === 'used' ? 'Redeemed ✗' : 'Not yet used ✓'}</p>
                    {card.redeemed_at && <p className="text-[10px] text-white/20 mt-0.5">Used on: {new Date(card.redeemed_at).toLocaleDateString()}</p>}
                    {card.expiry_date && <p className="text-[10px] text-white/20 mt-0.5">Expires: {new Date(card.expiry_date).toLocaleDateString()}</p>}
                    <p className="text-[10px] text-white/20 mt-0.5">Sent: {new Date(card.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BUY FLOW ── */}
        {viewTab === 'buy' && (
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Card preview */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <div className="relative aspect-[16/10] bg-gradient-to-br from-primary via-primary-hover to-secondary rounded-[40px] shadow-3xl overflow-hidden p-10">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Gift size={260} /></div>
                <div className="h-full flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="text-2xl font-black italic tracking-tighter">BIRYANI BOX</div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center">
                      <span className="text-[9px] font-black uppercase">1×USE</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Gift Card Value</p>
                    <h2 className="text-6xl font-black font-heading">₹{amount}</h2>
                  </div>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-6 bg-secondary/20 rounded-2xl border border-white/5 space-y-3">
                  <Smartphone size={20} className="text-primary" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Instant Email</h4>
                  <p className="text-xs text-text-muted">Unique code emailed immediately.</p>
                </div>
                <div className="p-6 bg-secondary/20 rounded-2xl border border-white/5 space-y-3">
                  <ShieldCheck size={20} className="text-primary" />
                  <h4 className="text-sm font-black uppercase tracking-widest">One-Time Use</h4>
                  <p className="text-xs text-text-muted">Full value applied in a single use.</p>
                </div>
              </div>
            </motion.div>

            {/* Purchase flow */}
            <div className="bg-secondary/40 border border-white/10 rounded-[40px] p-10 shadow-3xl">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <AnimatePresence mode="wait">

                {/* STEP 1 — Amount */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h3 className="text-2xl font-black font-heading mb-8">1. Select Amount</h3>
                    <div className="flex flex-wrap gap-3 mb-8">
                      {amounts.map(val => (
                        <button key={val} onClick={() => setAmount(val)}
                          className={`px-6 py-3 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${amount === val ? 'bg-primary border-primary text-white shadow-xl' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'}`}>
                          ₹{val}
                        </button>
                      ))}
                    </div>
                    <div className="mb-6">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Custom amount (₹)</label>
                      <input type="number" min="10" max="100000" value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-primary/50" />
                    </div>
                    <button onClick={() => setStep(2)}
                      className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-primary-hover transition-all">
                      Next: Recipient Details →
                    </button>
                  </motion.div>
                )}

                {/* STEP 2 — Sender & Receiver */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h3 className="text-2xl font-black font-heading mb-8">2. Sender & Recipient</h3>
                    <div className="space-y-4 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">From (Sender)</p>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Your Name</label>
                        <input value={form.sender_name} onChange={sf('sender_name')} placeholder="Your name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Your Email</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                          <input type="email" value={form.sender_email} onChange={sf('sender_email')} placeholder="your@email.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50" />
                        </div>
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-3">To (Recipient)</p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">Recipient Name *</label>
                            <input value={form.receiver_name} onChange={sf('receiver_name')} placeholder="Friend's name"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">
                              Recipient Email * <span className="text-primary">(code sent here)</span>
                            </label>
                            <div className="relative">
                              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60" />
                              <input type="email" value={form.receiver_email} onChange={sf('receiver_email')} placeholder="friend@email.com"
                                className="w-full bg-primary/5 border border-primary/30 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/60" />
                            </div>
                            <p className="text-[10px] text-white/20 mt-1.5 flex items-center gap-1">
                              <Mail size={9} /> The gift card code will be emailed here instantly.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/10">← Back</button>
                      <button onClick={() => setStep(3)} className="flex-1 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover">Review →</button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 — Review */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h3 className="text-2xl font-black font-heading mb-8">3. Review & Send</h3>
                    <div className="space-y-3 mb-6">
                      {[
                        ['Value',         `₹${amount}`],
                        ['From',          `${form.sender_name} (${form.sender_email})`],
                        ['To',            form.receiver_name],
                        ['Send to email', form.receiver_email],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between items-start py-3 border-b border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{k}</span>
                          <span className="text-sm font-bold text-right max-w-[60%]">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-4 flex items-start gap-3">
                      <CheckCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-green-300 font-bold">
                        This gift card supports <strong>partial use</strong> — the recipient can spend any amount per order and the remaining balance carries over to future orders.
                      </p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-6 flex items-start gap-3">
                      <Mail size={14} className="text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-white/60">
                        Code will be emailed to <strong className="text-primary">{form.receiver_email}</strong> immediately.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(2)} className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/10">← Back</button>
                      <button onClick={handlePurchase} disabled={loading}
                        className="flex-1 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader size={14} className="animate-spin" /> : <Gift size={14} />}
                        {loading ? 'Sending…' : 'Send Gift Card'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4 — Success */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                    <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={36} className="text-green-400" />
                    </div>
                    <h3 className="text-2xl font-black mb-3">Gift Card Sent! 🎉</h3>
                    <p className="text-white/50 text-sm mb-6">
                      Code emailed to <strong className="text-primary">{form.receiver_email}</strong>.
                    </p>
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-6 mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Gift Card Code</p>
                      <p className="text-xl font-black font-mono tracking-widest text-primary mb-4">{cardCode}</p>
                      <button onClick={() => copyCode(cardCode)}
                        className="flex items-center gap-2 mx-auto text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                        {copied === cardCode ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                        {copied === cardCode ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 justify-center bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 mb-6">
                      <CheckCircle size={12} className="text-green-400" />
                      <p className="text-[10px] font-bold text-green-300">Partial use supported — balance carries over each order</p>
                    </div>
                    <p className="text-xs text-white/30 mb-6">View this code anytime under <strong className="text-primary">Sent Cards</strong>.</p>
                    <button onClick={() => {
                      setStep(1);
                      setForm({ sender_name: user?.name||'', sender_email: user?.email||'', receiver_name: '', receiver_email: '' });
                      setCardCode(''); setError('');
                    }} className="w-full py-4 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all">
                      Send Another Gift Card
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default GiftCards;