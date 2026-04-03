import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  CreditCard,
  ChevronRight,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const GiftCards = () => {
  const [step, setStep] = useState(1); // 1: Select, 2: Details, 3: Payment, 4: Success
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState('email');
  const navigate = useNavigate();

  const amounts = [10, 25, 50, 100, 250];

  return (
    <div className="min-h-screen bg-bg-main text-white pt-32 pb-20 relative overflow-hidden">
      <Navbar />
      {/* Ambient Glow */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      <div className="container max-w-6xl mx-auto relative z-10 px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div>
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">
              Artisan Currency
            </span>
            <h1 className="text-6xl md:text-8xl font-black font-heading mb-6">
              Gift of <span className="text-primary">Flavors.</span>
            </h1>
            <p className="text-xl text-text-muted max-w-xl font-medium leading-relaxed">
              Cultivate joy for your network. Deliver a bespoke flavor-token valid across all
              Biryani Box dispatch hubs.
            </p>
          </div>
          <div className="w-16 h-px bg-white/10 hidden md:block flex-1 mx-10 mb-8" />
          <div className="bg-secondary/40 border border-white/10 p-6 rounded-3xl flex items-center gap-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
              <Gift size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                Total Balance
              </p>
              <p className="text-2xl font-black font-heading">$0.00</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-20 items-start">
          {/* Left: Card Preview */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative aspect-[16/10] bg-gradient-to-br from-primary via-primary-hover to-secondary rounded-[40px] shadow-3xl overflow-hidden p-12 group perspective-1000">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-all duration-1000 rotate-12">
                <Gift size={280} />
              </div>
              <div className="h-full flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start">
                  <div className="text-3xl font-black italic tracking-tighter">BIRYANI BOX</div>
                  <div className="w-12 h-12 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase">GOLD</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-60">
                    Value Token Identifier
                  </p>
                  <h2 className="text-7xl font-black font-heading">${amount}</h2>
                </div>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="p-8 bg-secondary/20 rounded-3xl border border-white/5 space-y-4">
                <Smartphone size={24} className="text-primary" />
                <h4 className="text-sm font-black uppercase tracking-widest">Instant Delivery</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tokens are dispatched via SMS or Secure Email within 120 seconds of protocol
                  confirmation.
                </p>
              </div>
              <div className="p-8 bg-secondary/20 rounded-3xl border border-white/5 space-y-4">
                <ShieldCheck size={24} className="text-primary" />
                <h4 className="text-sm font-black uppercase tracking-widest">No Expiry</h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Artisan flavor tokens never expire. Redeem at any terminal, anytime, indefinitely.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Checkout Flow */}
          <div className="bg-secondary/40 border border-white/10 rounded-[60px] p-12 shadow-3xl">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="text-3xl font-black font-heading mb-10 text-white">
                    Select Value Protocol
                  </h3>
                  <div className="flex flex-wrap gap-4 mb-12">
                    {amounts.map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmount(val)}
                        className={`px-10 py-5 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${amount === val ? 'bg-primary border-primary text-white shadow-xl' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'}`}
                      >
                        ${val}
                      </button>
                    ))}
                    <button className="px-10 py-5 rounded-2xl border border-white/10 bg-white/5 text-white/40 font-black text-xs uppercase tracking-widest">
                      Custom
                    </button>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.4em] text-xs rounded-2xl hover:bg-primary-hover transition-all flex items-center justify-center gap-4"
                  >
                    Proceed to Details <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <h3 className="text-3xl font-black font-heading mb-2 text-white">
                    Recipient Data
                  </h3>
                  <p className="text-sm text-text-muted mb-8 italic">
                    Where should we dispatch this flavor token?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="RECIPIENT NAME"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest"
                    />
                    <input
                      type="text"
                      placeholder="SENDER IDENTITY"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">
                      Dispatch Route
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setMethod('email')}
                        className={`p-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${method === 'email' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                      >
                        Secure Email
                      </button>
                      <button
                        onClick={() => setMethod('sms')}
                        className={`p-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${method === 'sms' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                      >
                        Direct SMS
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={method === 'email' ? 'RECIPIENT@MAIL.HUB' : '+1 (___) ___ - ____'}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-6 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-[2] py-6 bg-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all"
                    >
                      Continue To Secure Payment
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-black font-heading text-white">Secure Terminal</h3>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
                        PCI COMPLIANT HUB
                      </span>
                    </div>
                  </div>
                  <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-white/40">Token Value</span>
                      <span>${amount}.00</span>
                    </div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-white/40">Processing Fee</span>
                      <span>$1.50</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between text-xl font-black">
                      <span className="text-primary uppercase tracking-[0.4em]">
                        Total Protocol
                      </span>
                      <span>${amount + 1.5}.00</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <CreditCard
                        size={18}
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type="text"
                        placeholder="CARD NUMBER (VISA/MASTER/AMEX)"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pl-16 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-primary outline-none font-black text-[10px] uppercase tracking-widest"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(4)}
                    className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.4em] text-xs rounded-2xl hover:bg-primary-hover transition-all flex items-center justify-center gap-4"
                  >
                    Deploy Flavor Token <ShieldCheck size={18} />
                  </button>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-20 text-center"
                >
                  <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-10">
                    <CheckCircle size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-5xl font-black font-heading mb-6">Token Dispatched.</h3>
                  <p className="text-text-muted font-medium mb-12 max-w-sm mx-auto leading-relaxed">
                    The artisanal currency has been securely injected into the recipient's hub.
                    Confirmation ID: #GB-9921-BOX
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => window.print()}
                      className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                    >
                      <Download size={16} /> Print Token
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Return To Hub
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GiftCards;
