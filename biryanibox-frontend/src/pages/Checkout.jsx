import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import { useCart, useAuth } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { checkoutAPI, usersAPI, deliveryPricingAPI } from '../services/api';
import { getOrderType } from '../components/Navbar';
import {
  CreditCard, MapPin, CheckCircle, ChevronLeft,
  Home, ShieldCheck, Printer, Truck, Ticket, Tag, X,
} from 'lucide-react';

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [step,            setStep]            = useState(1);
  const [orderType,       setOrderType]       = useState(getOrderType());
  const [paymentMethod,   setPaymentMethod]   = useState('card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes,   setDeliveryNotes]   = useState('');

  const [knockBell,       setKnockBell]       = useState(true); // true = ring bell, false = do not disturb
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [orderNumber,     setOrderNumber]     = useState('');
  const [earnedPoints,    setEarnedPoints]    = useState(0);

  // Reward coupons
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon,    setAppliedCoupon]    = useState(null);
  const [couponLoading,    setCouponLoading]    = useState(false);

  // ── Delivery pricing (dynamic) ───────────────────────────────────────────
  const [pricingData,    setPricingData]    = useState(null);  // full API result
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError,   setPricingError]   = useState('');
  const pricingTimer = React.useRef(null);

  const couponDiscount = appliedCoupon ? appliedCoupon.amount : 0;
  const subtotal       = total;
  const dynamicFee     = pricingData?.deliveryFee ?? 0;
  const grandTotal     = Math.max(0, subtotal + (orderType === 'delivery' ? dynamicFee : 0) - couponDiscount);

  // Load user's reward coupons
  useEffect(() => {
    if (!user?._id) return;
    usersAPI.getOne(user._id)
      .then(res => {
        const coupons = (res.data?.reward_coupons || []).filter(c => !c.is_used);
        setAvailableCoupons(coupons);
      })
      .catch(() => {});
  }, [user]);

  // Stay in sync if user flips the navbar toggle while checkout is open
  useEffect(() => {
    const handler = (e) => setOrderType(e.detail);
    window.addEventListener('bb_order_mode_change', handler);
    return () => window.removeEventListener('bb_order_mode_change', handler);
  }, []);

  // ── Auto-calculate delivery fee when address changes ─────────────────────
  useEffect(() => {
    if (orderType !== 'delivery') { setPricingData(null); setPricingError(''); return; }
    if (!deliveryAddress || deliveryAddress.trim().length < 10) { setPricingData(null); setPricingError(''); return; }

    clearTimeout(pricingTimer.current);
    pricingTimer.current = setTimeout(async () => {
      setPricingLoading(true); setPricingError('');
      try {
        const res = await deliveryPricingAPI.calculate(deliveryAddress.trim(), subtotal);
        setPricingData(res.data);
      } catch (err) {
        setPricingError(err.message || 'Could not calculate delivery fee.');
        setPricingData(null);
      } finally { setPricingLoading(false); }
    }, 800);

    return () => clearTimeout(pricingTimer.current);
  }, [deliveryAddress, orderType, subtotal]);

  const applyCoupon = async (coupon) => {
    setCouponLoading(true);
    setAppliedCoupon(coupon);
    setCouponLoading(false);
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setError('Please enter your delivery address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        payment_method:   paymentMethod,
        order_type:       orderType,
        delivery_address: deliveryAddress.trim() || undefined,
        delivery_notes:   deliveryNotes.trim()   || undefined,
        knock_bell:       knockBell,
        // ── Discount fields ── now properly applied by backend ───────────
        coupon_code:      appliedCoupon?.code      || undefined,
        coupon_discount:  couponDiscount  > 0 ? couponDiscount : undefined,
        gift_card_code:   appliedGiftCard?.code    || undefined,   // if gift card used
      };
      const res = await checkoutAPI.process(payload);
      setOrderNumber(res.data?.order?.order_number || `BOX-${Math.floor(Math.random() * 90000 + 10000)}`);
      setEarnedPoints(res.data?.loyalty_points_earned || 0);
      clearCart();
      setStep(2);
      setTimeout(() => navigate('/'), 5000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step === 1) { navigate('/cart'); return null; }

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="container max-w-4xl mx-auto relative z-10">
        <button onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-10 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Cart
        </button>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <MotionDiv key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-10">
                <div>
                  <h1 className="text-4xl font-bold font-heading">Secure Checkout</h1>
                  <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${orderType === 'delivery' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-white/50'}`}>
                    {orderType === 'delivery' ? <><Truck size={13} /> Delivery Order</> : <><MapPin size={13} /> Pickup Order</>}
                  </div>
                </div>

                {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

                <form onSubmit={handleCheckout} className="space-y-8">
                  {/* Delivery address */}
                  {orderType === 'delivery' && (
                    <div className="bg-secondary/40 p-8 rounded-3xl border border-primary/20 space-y-5">
                      <div className="flex items-center gap-4 text-primary font-bold uppercase tracking-widest text-xs">
                        <Truck size={18} /> Delivery Address
                      </div>
                      <div className="space-y-4">
                        <textarea required value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                          className="w-full bg-bg-main border border-white/10 p-4 rounded-xl text-sm focus:border-primary outline-none transition-colors resize-none"
                          placeholder="House No., Street, Area, City, ZIP code…" rows={3} />
                        <textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
                          className="w-full bg-bg-main border border-white/10 p-4 rounded-xl text-sm focus:border-primary outline-none transition-colors resize-none"
                          placeholder="Delivery instructions (Gate code, landmark…)" rows={2} />
                        {/* Knock Bell / Do Not Disturb */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Arrival Preference</p>
                          <div className="flex gap-3">
                            <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${knockBell ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/50'}`}>
                              <input type="radio" name="knockBell" checked={knockBell} onChange={() => setKnockBell(true)} className="accent-orange-500" />
                              <span className="text-xs font-bold">🔔 Ring Doorbell / Knock</span>
                            </label>
                            <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${!knockBell ? 'bg-secondary/60 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/50'}`}>
                              <input type="radio" name="knockBell" checked={!knockBell} onChange={() => setKnockBell(false)} className="accent-orange-500" />
                              <span className="text-xs font-bold">🤫 Do Not Disturb</span>
                            </label>
                          </div>
                        </div>
                        {/* Dynamic Delivery Pricing Panel */}
                        <div className="rounded-xl border border-primary/20 overflow-hidden">
                          {pricingLoading && (
                            <div className="flex items-center gap-3 p-3 bg-primary/5">
                              <Truck size={14} className="text-primary shrink-0 animate-pulse" />
                              <p className="text-xs text-text-muted animate-pulse">Calculating delivery fee…</p>
                            </div>
                          )}
                          {pricingError && !pricingLoading && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10">
                              <p className="text-xs text-red-400">{pricingError}</p>
                            </div>
                          )}
                          {pricingData && !pricingLoading && (
                            <div className="bg-primary/5 p-3 space-y-2">
                              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                <Truck size={13} /> Delivery Details
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-black/20 rounded-lg p-2">
                                  <p className="text-text-muted">Distance</p>
                                  <p className="text-white font-bold">{pricingData.distance}</p>
                                </div>
                                <div className="bg-black/20 rounded-lg p-2">
                                  <p className="text-text-muted">Est. Time</p>
                                  <p className="text-white font-bold">{pricingData.duration}</p>
                                </div>
                              </div>
                              {pricingData.freeDelivery ? (
                                <p className="text-green-400 text-xs font-bold text-center">🎉 Free delivery on this order!</p>
                              ) : (
                                <div className="space-y-1 text-xs text-text-muted">
                                  <div className="flex justify-between"><span>Base ({pricingData.breakdown?.base !== undefined ? `first ${3} km` : ''})</span><span className="text-white">₹{pricingData.breakdown?.base}</span></div>
                                  {(pricingData.breakdown?.distanceCharge || 0) > 0 && (
                                    <div className="flex justify-between"><span>Distance charge</span><span className="text-white">₹{pricingData.breakdown.distanceCharge}</span></div>
                                  )}
                                  {(pricingData.breakdown?.timeCharge || 0) > 0 && (
                                    <div className="flex justify-between"><span>{pricingData.breakdown.timeLabel}</span><span className="text-yellow-400">₹{pricingData.breakdown.timeCharge}</span></div>
                                  )}
                                  {(pricingData.breakdown?.smallOrderFee || 0) > 0 && (
                                    <div className="flex justify-between"><span>Small order fee</span><span className="text-orange-400">₹{pricingData.breakdown.smallOrderFee}</span></div>
                                  )}
                                  <div className="flex justify-between border-t border-white/10 pt-1 font-bold text-primary">
                                    <span>Delivery Fee</span><span>₹{pricingData.deliveryFee}</span>
                                  </div>
                                  {pricingData.source === 'estimated' && (
                                    <p className="text-[10px] text-text-muted italic">* Estimated — add Google Maps API key for exact routing</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          {!pricingData && !pricingLoading && !pricingError && (
                            <div className="flex items-center gap-3 p-3 bg-primary/5">
                              <Truck size={14} className="text-primary shrink-0" />
                              <p className="text-xs text-text-muted">Enter your address above to see the delivery fee.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pickup info */}
                  {orderType === 'pickup' && (
                    <div className="bg-secondary/40 p-8 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-4 text-primary font-bold uppercase tracking-widest text-xs">
                        <MapPin size={18} /> Pickup Location
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <Home size={20} className="text-primary mt-1 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white">Biryani Box — Main Kitchen</p>
                          <p className="text-xs text-text-muted mt-1">Ready in 15–20 minutes after order confirmation</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reward Coupons */}
                  {availableCoupons.length > 0 && (
                    <div className="bg-secondary/40 p-6 rounded-3xl border border-yellow-500/20 space-y-4">
                      <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-widest text-xs">
                        <Ticket size={16} /> Your Reward Coupons
                      </div>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <div className="flex items-center gap-2 text-green-400 font-black text-sm">
                            <Tag size={14} /> ${appliedCoupon.amount} coupon applied — {appliedCoupon.code}
                          </div>
                          <button type="button" onClick={removeCoupon}
                            className="text-text-muted hover:text-red-400 transition-colors p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-text-muted">Click a coupon to apply it at checkout:</p>
                          <div className="flex flex-wrap gap-2">
                            {availableCoupons.map(c => (
                              <button key={c.code} type="button"
                                onClick={() => applyCoupon(c)}
                                disabled={couponLoading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl text-sm font-black hover:bg-yellow-500/20 transition-all">
                                <Ticket size={13} /> ${c.amount} off · {c.code}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment */}
                  <div className="bg-secondary/40 p-8 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-4 text-primary font-bold uppercase tracking-widest text-xs">
                      <CreditCard size={18} /> Payment Method
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['card', 'upi', 'cash'].map(p => (
                        <button key={p} type="button" onClick={() => setPaymentMethod(p)}
                          className={`py-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${paymentMethod === p ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20'}`}>
                          <div className="text-xs font-bold uppercase tracking-widest">{p === 'upi' ? 'UPI' : p === 'card' ? 'Card' : 'Cash'}</div>
                          <ShieldCheck size={20} className={paymentMethod === p ? 'opacity-100' : 'opacity-20'} />
                        </button>
                      ))}
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5 border-dashed">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest text-center">Secured by Stripe Encryption Standard</p>
                    </div>
                  </div>

                  <button type="submit" id="checkoutSubmit" className="hidden" />
                </form>
              </div>

              {/* Order Summary sidebar */}
              <div className="lg:col-span-1 space-y-8 h-fit lg:sticky lg:top-12">
                <div className="bg-secondary p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <h2 className="text-xl font-bold font-heading mb-6">Order Summary</h2>
                  <div className="space-y-3 mb-6 max-h-52 overflow-y-auto">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-text-muted">
                        <span className="truncate mr-2">{item.name} ×{item.quantity}</span>
                        <span className="shrink-0">${((item.price || item.unit_price || 0) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 mb-4 text-sm text-text-muted border-t border-white/10 pt-4">
                    <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-primary">
                        <span className="flex items-center gap-1"><Truck size={12} /> Delivery fee</span>
                        <span>{pricingLoading ? '…' : pricingData ? `+₹${dynamicFee}` : '—'}</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-400 font-bold">
                        <span className="flex items-center gap-1"><Tag size={12} /> Reward Coupon</span>
                        <span>-${couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xl font-bold mb-6">
                    <span>Total</span>
                    <span className="text-primary">${grandTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => document.getElementById('checkoutSubmit').click()}
                    disabled={loading}
                    className="btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-60">
                    {loading ? 'Processing…' : orderType === 'delivery' ? '🚴 Place Delivery Order' : '✓ Place Pickup Order'}
                  </button>
                </div>
              </div>
            </MotionDiv>
          ) : (
            <MotionDiv key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="py-28 text-center space-y-8">
              <div className="relative inline-block">
                <CheckCircle size={96} className="text-primary mx-auto relative z-10" />
                <div className="absolute inset-x-0 bottom-0 top-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
              </div>
              <div>
                <h2 className="text-4xl font-bold font-heading mb-3">Order Confirmed!</h2>
                <p className="text-text-muted text-sm font-medium">
                  {orderType === 'delivery'
                    ? '🚴 Your order is in the queue — a rider will pick it up shortly.'
                    : '⏱ Your order is being prepared. Ready for pickup in ~15 min.'}
                </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 bg-white/5 py-2.5 px-6 rounded-full border border-white/10">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Order #{orderNumber} Confirmed</span>
                </div>
                {earnedPoints > 0 && (
                  <div className="flex items-center gap-2 text-xs text-primary font-bold bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                    🎉 +{earnedPoints} loyalty points earned!
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex items-center gap-2 text-xs text-green-400 font-bold bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                    <Ticket size={13} /> ${couponDiscount} reward coupon redeemed!
                  </div>
                )}
                <div className="flex gap-4 mt-2">
                  <button onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                    <Printer size={14} /> Print Invoice
                  </button>
                  <button onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary-hover transition-all">
                    Back to Home
                  </button>
                </div>
                <p className="text-[10px] text-text-muted italic">Returning to home in 5 seconds…</p>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Checkout;