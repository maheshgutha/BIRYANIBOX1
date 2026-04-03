import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, useAuth } from '../context/useContextHooks';
import { ordersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Plus, Minus, ArrowRight, ChevronLeft,
  Tag, CheckCircle, XCircle, Gift, Copy, User, TrendingUp, Loader, Package,
} from 'lucide-react';

import heroBiryani   from '../assets/hero-biryani.png';
import muttonBiryani from '../assets/mutton-biryani.png';
import chickenTikka  from '../assets/chicken-tikka.png';
import rasmalai      from '../assets/rasmalai.png';
import heroImg       from '../assets/hero.png';

const IMAGE_MAP = { heroBiryani, muttonBiryani, chickenTikka, rasmalai, hero: heroImg };

const ITEM_IMAGE_MAP = {
  // Biryanis
  'Chicken Dum Biryani':   'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=80',
  'Mutton Dum Biryani':    'https://images.unsplash.com/photo-1701579231349-d7459d8e56c6?w=600&q=80',
  'Shrimp Biryani':        'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80',
  'Vegetable Dum Biryani': 'https://images.unsplash.com/photo-1604579839218-8fe4bf350b99?w=600&q=80',
  'Egg Biryani':           'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
  // Appetizers
  'Chicken Tikka':         'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  'Paneer 65':             'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
  'Lamb Seekh Kabab':      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
  'Chicken Lollipop':      'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80',
  'Samosa (3pc)':          'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'Paneer Tikka Masala':   'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80',
  'Dal Makhani':           'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  // Breads
  'Garlic Naan':           'https://images.unsplash.com/photo-1584717781292-ab7e0dc74f3c?w=600&q=80',
  'Butter Naan':           'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
  'Roti':                  'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=600&q=80',
  'Kulcha (Cheese)':       'https://images.unsplash.com/photo-1607301405399-5401f543f84a?w=600&q=80',
  'Paratha':               'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=80',
  // Curries
  'Butter Chicken':        'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80',
  'Lamb Rogan Josh':       'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
  'Chole Bhature':         'https://images.unsplash.com/photo-1626132647523-66c2bf9b8a9e?w=600&q=80',
  // Desserts
  'Rasmalai':              'https://images.unsplash.com/photo-1571101421849-ee5b29c00c02?w=600&q=80',
  'Gulab Jamun':           'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80',
  'Gulab Jamun (3pc)':     'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80',
  'Kheer':                 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
  'Ice Cream Kulfi':       'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&q=80',
  // Drinks
  'Mango Lassi':           'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80',
  'Sweet Lassi':           'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=80',
  'Masala Chai':           'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=600&q=80',
  'Rose Sharbat':          'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
  // Combos
  'Family Combo (4)':      'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=80',
  'Couple Combo (2)':      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
  'Couple Combo':          'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
  'Party Pack (6)':        'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=80',
  'Veg Combo':             'https://images.unsplash.com/photo-1604579839218-8fe4bf350b99?w=600&q=80',
};

const getItemImage = (item) => {
  if (item.name && ITEM_IMAGE_MAP[item.name]) return ITEM_IMAGE_MAP[item.name];
  if (item.image_url && item.image_url.startsWith('http')) return item.image_url;
  if (item.image && IMAGE_MAP[item.image]) return IMAGE_MAP[item.image];
  if (item.category === 'Biryani')    return heroBiryani;
  if (item.category === 'Appetizers') return chickenTikka;
  if (item.category === 'Desserts' || item.category === 'Dessert') return rasmalai;
  if (item.category === 'Combos')     return muttonBiryani;
  if (item.category === 'Breads')     return heroBiryani;
  return heroBiryani;
};

const genCode = (userId, cycle) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand  = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const seg   = (userId || 'USR').toString().slice(-4).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  return `BB-${seg}-C${cycle}-${rand(4)}`;
};

const KEY_HISTORY = (uid) => `bb_history_${uid}`;

const getHistory = (uid) => {
  try {
    const d = localStorage.getItem(KEY_HISTORY(uid));
    return d ? JSON.parse(d) : { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] };
  } catch {
    return { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] };
  }
};

const saveHistory = (uid, data) => localStorage.setItem(KEY_HISTORY(uid), JSON.stringify(data));

const SERVICE_FEE = 2;
const REWARD_MILESTONE = 1000;
const REWARD_AMOUNT = 200;

// ─────────────────────────────────────────────────────────────────────────────
const Cart = () => {
  const { cart, addToCart, removeFromCart, clearCart, total } = useCart();
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const userId    = user?._id || user?.id || user?.email || null;

  // ── ALL HOOKS MUST BE AT TOP — NO CONDITIONAL CALLS ──────────────────────
  const [history,       setHistory]       = useState(() => userId ? getHistory(userId) : { runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput,   setCouponInput]   = useState('');
  const [couponError,   setCouponError]   = useState('');
  const [copiedCode,    setCopiedCode]    = useState('');
  const [placing,       setPlacing]       = useState(false);
  const [orderSuccess,  setOrderSuccess]  = useState(false);
  const [orderNumber,   setOrderNumber]   = useState('');
  const [newCoupon,     setNewCoupon]     = useState(null); // coupon unlocked on this order

  // Reload history when userId changes
  useEffect(() => {
    if (userId) {
      setHistory(getHistory(userId));
    } else {
      setHistory({ runningTotal: 0, nextMilestone: 1000, entries: [], coupons: [] });
    }
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  }, [userId]);

  // ── Derived values (computed from state — safe after all hooks) ───────────
  const runningTotal    = parseFloat((history.runningTotal + total).toFixed(2));
  const nextMilestone   = history.nextMilestone || REWARD_MILESTONE;
  const remainingToNext = Math.max(nextMilestone - runningTotal, 0);
  const isUnlocked      = runningTotal >= nextMilestone;
  const activeCoupon    = history.coupons?.find((c) => !c.used) || null;
  const discountAmt     = appliedCoupon ? Math.min(REWARD_AMOUNT, parseFloat(total.toFixed(2))) : 0;
  const grandTotal      = parseFloat((total + SERVICE_FEE - discountAmt).toFixed(2));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCouponInput(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const input = couponInput.trim().toUpperCase();
    if (!input)        { setCouponError('Please enter a coupon code.'); return; }
    if (!userId)       { setCouponError('Please sign in to use coupons.'); return; }
    if (!activeCoupon) { setCouponError('No active coupon on your account.'); return; }
    if (activeCoupon.code.toUpperCase() !== input) {
      setCouponError('Invalid code. This coupon does not match your account.');
      return;
    }
    setAppliedCoupon(activeCoupon);
    setCouponInput('');
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponError(''); };

  const updateRewards = (orderTotal) => {
    if (!userId || orderTotal <= 0) return null;
    const current = getHistory(userId);
    const newTotal = parseFloat((current.runningTotal + orderTotal).toFixed(2));
    const newEntry = { date: new Date().toLocaleDateString(), amount: parseFloat(orderTotal.toFixed(2)), runningAfter: newTotal };
    let updatedCoupons = [...(current.coupons || [])];
    let newNextMilestone = current.nextMilestone || REWARD_MILESTONE;
    let newlyUnlocked = null;

    if (appliedCoupon) {
      updatedCoupons = updatedCoupons.map((c) =>
        c.code === appliedCoupon.code ? { ...c, used: true, usedAt: new Date().toISOString() } : c
      );
    }

    if (newTotal >= newNextMilestone) {
      while (newTotal >= newNextMilestone) {
        const cycle = Math.floor(newNextMilestone / REWARD_MILESTONE);
        const newCode = genCode(userId, cycle);
        if (!updatedCoupons.find((c) => c.cycle === cycle)) {
          const couponObj = { code: newCode, cycle, used: false, usedAt: null, generatedAt: new Date().toISOString(), rewardAmount: REWARD_AMOUNT };
          updatedCoupons.push(couponObj);
          newlyUnlocked = couponObj;
        }
        newNextMilestone += REWARD_MILESTONE;
      }
    }

    const visibleCoupons = updatedCoupons.filter((c) => !c.used);
    const updated = { runningTotal: newTotal, nextMilestone: newNextMilestone, entries: [...(current.entries || []), newEntry], coupons: visibleCoupons };
    saveHistory(userId, updated);
    setHistory(updated);
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    return newlyUnlocked;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const payload = {
        items: cart.map(i => ({ menu_item_id: i._id || i.id, quantity: i.quantity })),
        order_type: 'dine-in',
        customer_id: user?._id || user?.id,
        total: grandTotal,
      };
      const res = await ordersAPI.create(payload);
      const num = res.data?.order_number || res.data?.order?.order_number || ('BOX-' + Date.now().toString().slice(-5));
      setOrderNumber(num);
      const unlocked = updateRewards(grandTotal);
      setNewCoupon(unlocked);
      clearCart();
      setOrderSuccess(true);
    } catch (err) {
      alert('Failed to place order: ' + err.message);
    } finally {
      setPlacing(false);
    }
  };

  // ── ALL HOOKS DONE — safe to do conditional returns now ───────────────────

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-bg-main text-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-md w-full">
          <div className="relative inline-block">
            <CheckCircle size={96} className="text-primary mx-auto relative z-10" />
            <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-4xl font-bold font-heading mb-3">Order Placed!</h2>
            <p className="text-text-muted">Order <span className="text-primary font-black">#{orderNumber}</span> sent to kitchen.</p>
          </div>

          {/* New reward coupon unlocked */}
          {newCoupon && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-primary/20 to-yellow-500/10 border border-primary/40 rounded-3xl p-8 space-y-4">
              <div className="text-4xl">🎉</div>
              <h3 className="text-2xl font-black text-white">$200 Reward Unlocked!</h3>
              <p className="text-text-muted text-sm">You crossed <span className="text-primary font-bold">${REWARD_MILESTONE}</span> in total orders. Use this code on your next order:</p>
              <div className="bg-bg-main/70 border border-primary/30 rounded-2xl p-4">
                <p className="text-primary font-black text-xl tracking-widest">{newCoupon.code}</p>
                <p className="text-text-muted text-xs mt-1">Saves up to ${REWARD_AMOUNT} · One-time use</p>
              </div>
              <button onClick={() => handleCopy(newCoupon.code)}
                className="w-full py-3 bg-primary/20 border border-primary/30 rounded-xl text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                <Copy size={14} />{copiedCode === newCoupon.code ? 'Copied!' : 'Copy Code'}
              </button>
            </motion.div>
          )}

          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/')} className="btn-primary px-8 py-4">Back to Menu</button>
            <button onClick={() => navigate('/history')} className="px-8 py-4 border border-white/20 rounded-xl hover:bg-white/5 transition-all text-sm font-bold">Track Order</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12">
      <div className="container max-w-4xl mx-auto">

        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-10 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Menu
        </button>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left column ── */}
          <div className="flex-1 space-y-8">
            <h1 className="text-4xl font-bold font-heading">Your Flavor Box</h1>

            {/* Spend Tracker */}
            {userId && (
              <div className="bg-secondary/30 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                    <TrendingUp size={14} className="text-primary" />
                    Rewards Tracker — $200 at ${REWARD_MILESTONE}
                  </div>
                  <span className="text-xs font-black text-primary">${history.runningTotal.toFixed(2)} spent</span>
                </div>

                {history.entries.length > 0 && (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 text-[10px] font-black text-text-muted uppercase tracking-widest pb-1 border-b border-white/5">
                      <span>Date</span>
                      <span className="text-center">Amount</span>
                      <span className="text-right">Running Total</span>
                    </div>
                    {history.entries.map((e, i) => (
                      <div key={i} className="grid grid-cols-3 text-[11px]">
                        <span className="text-text-muted">{e.date}</span>
                        <span className="text-center text-white font-bold">+${e.amount.toFixed(2)}</span>
                        <span className="text-right text-primary font-bold">${e.runningAfter.toFixed(2)}</span>
                      </div>
                    ))}
                    {total > 0 && (
                      <div className="grid grid-cols-3 text-[11px] border-t border-white/5 pt-2">
                        <span className="text-green-400 font-bold">Now</span>
                        <span className="text-center text-green-400 font-bold">+${total.toFixed(2)}</span>
                        <span className="text-right text-green-400 font-bold">${runningTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {history.entries.length === 0 && total > 0 && (
                  <div className="grid grid-cols-3 text-[11px]">
                    <span className="text-green-400 font-bold">Now</span>
                    <span className="text-center text-green-400 font-bold">+${total.toFixed(2)}</span>
                    <span className="text-right text-green-400 font-bold">${runningTotal.toFixed(2)}</span>
                  </div>
                )}

                {history.entries.length === 0 && total === 0 && (
                  <p className="text-[11px] text-text-muted">Place your first order to start tracking. Earn a <span className="text-primary font-bold">$200 reward</span> at ${REWARD_MILESTONE}!</p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>Next reward at ${nextMilestone.toFixed(0)}</span>
                    <span className={isUnlocked ? 'text-green-400 font-black' : ''}>
                      {isUnlocked ? '✅ Reward unlocked!' : `$${remainingToNext.toFixed(2)} to go`}
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.min(((runningTotal % REWARD_MILESTONE) / REWARD_MILESTONE) * 100, 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${isUnlocked ? 'bg-green-500' : 'bg-gradient-to-r from-primary/60 to-primary'}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Active Coupon Banner */}
            <AnimatePresence>
              {activeCoupon && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-gradient-to-r from-primary/20 to-yellow-500/10 border border-primary/40 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Gift size={24} className="text-primary shrink-0" />
                    <div>
                      <p className="font-black text-white uppercase tracking-widest text-xs">
                        🎉 $200 Reward Ready!
                        <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-[9px] font-black">Milestone #{activeCoupon.cycle}</span>
                      </p>
                      <p className="text-text-muted text-xs mt-0.5">For <span className="text-primary font-bold">{user?.name || 'your account'}</span> · One-time use · Copy and paste below</p>
                    </div>
                  </div>
                  <div className="bg-bg-main/70 border border-primary/30 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">$200 Off Your Order</p>
                      <p className="font-black text-white text-base tracking-widest">{activeCoupon.code}</p>
                      <p className="text-[10px] text-text-muted mt-1">Saves up to ${REWARD_AMOUNT}</p>
                    </div>
                    <button onClick={() => handleCopy(activeCoupon.code)}
                      className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                      {copiedCode === activeCoupon.code ? <CheckCircle size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Not signed in */}
            {!userId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <Gift size={18} className="text-yellow-400 shrink-0" />
                <p className="text-yellow-400 text-xs font-bold flex-1">
                  Sign in to track spend &amp; earn a <strong>$200 reward</strong> when you hit $1,000 in total orders.
                </p>
                <button onClick={() => navigate('/auth')}
                  className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-yellow-500/30 transition-all">
                  Sign In
                </button>
              </motion.div>
            )}

            {/* Cart Items */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="py-20 text-center bg-secondary/30 rounded-3xl border-2 border-dashed border-white/5">
                    <ShoppingBag size={48} className="mx-auto mb-4 text-text-muted opacity-20" />
                    <p className="text-text-muted font-bold uppercase tracking-widest text-xs">The box is empty</p>
                    <button onClick={() => navigate('/')} className="mt-6 text-primary font-bold hover:underline">Start adding masterpieces</button>
                  </motion.div>
                ) : cart.map((item) => {
                  const itemId = item._id || item.id;
                  return (
                    <motion.div key={itemId} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-6 bg-secondary/40 p-6 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-bg-main border border-white/10 shrink-0">
                        <img src={getItemImage(item)} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = heroBiryani; }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                        <p className="text-xs text-text-muted uppercase tracking-widest">{item.category}</p>
                        <p className="text-xs text-text-muted mt-1">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className="text-lg font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-3 bg-bg-main/50 p-1.5 rounded-full border border-white/10">
                          <button onClick={() => removeFromCart(itemId)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500 transition-colors"><Minus size={12} /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary transition-colors"><Plus size={12} /></button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: Summary ── */}
          {cart.length > 0 && (
            <div className="w-full lg:w-80 h-fit bg-secondary/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl sticky top-12 space-y-6">
              <h2 className="text-xl font-bold font-heading">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Subtotal</span><span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Service Fee</span><span>${SERVICE_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Delivery</span><span className="text-green-500 font-bold uppercase text-[10px]">Free</span>
                </div>
                {appliedCoupon && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between text-sm text-green-400 font-bold">
                    <span>Reward Coupon (-$200)</span><span>-${discountAmt.toFixed(2)}</span>
                  </motion.div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">${grandTotal.toFixed(2)}</span>
              </div>

              {/* Reward progress in summary */}
              {userId && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Rewards Progress</p>
                  <p className="text-sm font-black text-white">${runningTotal.toFixed(2)} / ${nextMilestone}</p>
                  <p className="text-[10px] text-text-muted">
                    {isUnlocked ? '✅ $200 reward ready!' : `$${remainingToNext.toFixed(2)} until $200 reward`}
                  </p>
                </div>
              )}

              {/* Coupon input */}
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted">
                  <Tag size={14} className="text-primary" /> Coupon Code
                </div>
                {appliedCoupon ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-400 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-green-400 tracking-widest">{appliedCoupon.code}</p>
                        <p className="text-[10px] text-text-muted">$200 discount applied</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-text-muted hover:text-red-400 transition-colors ml-2">
                      <XCircle size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter coupon code..."
                      className="flex-1 bg-bg-main border border-white/10 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-primary transition-all tracking-widest placeholder:tracking-normal placeholder:text-text-muted/50" />
                    <button onClick={handleApplyCoupon}
                      className="px-4 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/80 transition-all">
                      Apply
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-400 text-[11px] font-bold flex items-center gap-1"><XCircle size={12} /> {couponError}</p>
                )}
                {activeCoupon && !appliedCoupon && (
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest animate-pulse">
                    🎉 $200 coupon ready — copy from above!
                  </p>
                )}
                {!activeCoupon && !isUnlocked && userId && (
                  <p className="text-[10px] text-text-muted">${remainingToNext.toFixed(2)} more to unlock $200 reward</p>
                )}
              </div>

              {/* Place Order button */}
              <button onClick={handlePlaceOrder} disabled={placing || cart.length === 0}
                className="btn-primary w-full py-5 flex items-center justify-center gap-3 group disabled:opacity-60">
                {placing
                  ? <><Loader size={20} className="animate-spin" /> Placing Order...</>
                  : <><Package size={20} />Place Order<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;