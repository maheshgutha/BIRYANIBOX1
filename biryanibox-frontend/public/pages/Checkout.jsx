import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
const MotionButton = motion.button;
import { useCart } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  MapPin,
  CheckCircle,
  ChevronLeft,
  Building,
  Home,
  ShieldCheck,
  Printer,
  Download,
} from 'lucide-react';

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const [orderNumber] = useState(() => `BOX-${Math.floor(Math.random() * 90000 + 10000)}`);

  const handleCheckout = (e) => {
    e.preventDefault();
    setStep(2);
    setTimeout(() => {
      clearCart();
      navigate('/');
    }, 4000);
  };

  if (cart.length === 0 && step === 1) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="container max-w-4xl mx-auto relative z-10">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-10 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Flavor Box
        </button>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <MotionDiv
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-10">
                <h1 className="text-4xl font-bold font-heading">Secure Checkout</h1>

                <div className="space-y-8">
                  {/* Address Section */}
                  <div className="bg-secondary/40 p-8 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-4 text-primary font-bold uppercase tracking-widest text-xs">
                      <MapPin size={18} /> Delivery Coordinates
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <button className="flex items-center gap-4 p-4 rounded-xl border border-primary/50 bg-primary/5 text-left transition-all">
                        <Home size={20} className="text-primary" />
                        <div>
                          <p className="text-sm font-bold text-white">Home Address</p>
                          <p className="text-xs text-text-muted">742 Evergreen Terrace</p>
                        </div>
                      </button>
                      <button className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 text-left hover:border-white/30 transition-all opacity-50 grayscale">
                        <Building size={20} />
                        <div>
                          <p className="text-sm font-bold text-white">Office</p>
                          <p className="text-xs text-text-muted">Awaiting setup...</p>
                        </div>
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">
                        Detailed Instructions
                      </label>
                      <textarea
                        className="w-full bg-bg-main border border-white/10 p-4 rounded-xl text-sm focus:border-primary outline-none transition-colors"
                        placeholder="Drop at the gate / Gate code 1234..."
                        rows="2"
                      />
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="bg-secondary/40 p-8 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-4 text-primary font-bold uppercase tracking-widest text-xs">
                      <CreditCard size={18} /> Payment Protocol
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['upi', 'card', 'cash'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPaymentMethod(p)}
                          className={`py-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${paymentMethod === p ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20'}`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest">{p}</div>
                          <ShieldCheck
                            size={20}
                            className={paymentMethod === p ? 'opacity-100' : 'opacity-20'}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5 border-dashed">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest text-center">
                        Secured by Razorpay Encryption Standard
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-8 h-fit lg:sticky lg:top-12">
                <div className="bg-secondary p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <h2 className="text-xl font-bold font-heading mb-8">Summary</h2>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm text-text-muted">
                      <span>Box Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-text-muted">
                      <span>Surcharge</span>
                      <span>$2.00</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex justify-between items-center text-xl font-bold mb-8">
                    <span>Payable</span>
                    <span className="text-primary">${(total + 2).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                  >
                    Process Transaction
                  </button>
                </div>
              </div>
            </MotionDiv>
          ) : (
            <MotionDiv
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-32 text-center space-y-8"
            >
              <div className="relative inline-block">
                <CheckCircle size={96} className="text-primary mx-auto relative z-10" />
                <div className="absolute inset-x-0 bottom-0 top-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
              </div>
              <div>
                <h2 className="text-4xl font-bold font-heading mb-4">Transmission Success!</h2>
                <p className="text-text-muted text-sm font-medium tracking-wide">
                  Payment confirmed. Your box is now being prepared in the kitchen.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-3 bg-white/5 py-2 px-6 rounded-full border border-white/10 animate-fade-in">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    ORDER #{orderNumber} CONFIRMED
                  </span>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <Printer size={14} /> Print Invoice
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary-hover transition-all"
                  >
                    Track Movement
                  </button>
                </div>
                <p className="text-[10px] text-text-muted italic">
                  Returning you to the home hub in seconds...
                </p>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Checkout;
