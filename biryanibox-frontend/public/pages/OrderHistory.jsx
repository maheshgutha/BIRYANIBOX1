import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
import {
  Truck,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  ChevronRight,
  Home,
  Building,
  Plus,
} from 'lucide-react';

const OrderHistory = () => {
  // const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // active, history, addresses

  const mockActiveOrders = [
    {
      id: 'BOX-12948',
      status: 'preparing',
      items: '2x Special Chicken Biryani',
      total: '$31.98',
      eta: '12-15 min',
    },
  ];

  const mockHistory = [
    {
      id: 'BOX-09284',
      date: 'Oct 12, 2026',
      total: '$25.99',
      items: 'Family Combo',
      status: 'delivered',
    },
  ];

  const mockAddresses = [
    { id: 1, label: 'Home', address: '742 Evergreen Terrace, Springfield', type: 'home' },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="container max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold font-heading mb-3">Your Movement Hub</h1>
            <p className="text-text-muted font-medium">Tracking your flavors across the city.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl">
            {['active', 'history', 'addresses'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${activeTab === tab ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'active' && (
            <MotionDiv
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {mockActiveOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-secondary/40 rounded-[40px] border border-white/5 shadow-3xl overflow-hidden relative"
                >
                  {/* Top Header */}
                  <div className="bg-primary/10 border-b border-white/5 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30">
                        <Truck size={32} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">
                          Movement Protocol
                        </p>
                        <h2 className="text-2xl font-black font-heading">{order.id}</h2>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                          Est. Injection
                        </p>
                        <p className="text-xl font-bold text-white">{order.eta}</p>
                      </div>
                      <div className="h-10 w-px bg-white/10" />
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                          Total Value
                        </p>
                        <p className="text-xl font-black text-primary font-heading">
                          {order.total}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Progress */}
                  <div className="p-10 md:p-16">
                    <div className="relative mb-16">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full" />
                      <MotionDiv
                        initial={{ width: '40%' }}
                        animate={{ width: '45%' }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full shadow-[0_0_20px_rgba(229,138,48,0.5)]"
                      />
                      <div className="relative flex justify-between">
                        {[
                          { label: 'Received', status: 'completed' },
                          { label: 'Preparing', status: 'active' },
                          { label: 'Dispatch', status: 'pending' },
                          { label: 'Delivered', status: 'pending' },
                        ].map((step, i) => (
                          <div key={i} className="flex flex-col items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-500 z-10 ${
                                step.status === 'completed'
                                  ? 'bg-primary border-primary shadow-xl shadow-primary/20'
                                  : step.status === 'active'
                                    ? 'bg-bg-main border-primary animate-pulse'
                                    : 'bg-bg-main border-white/10'
                              }`}
                            >
                              {step.status === 'completed' && (
                                <CheckCircle size={16} className="text-white" />
                              )}
                              {step.status === 'active' && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest ${
                                step.status !== 'pending' ? 'text-white' : 'text-white/20'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                      {/* Items */}
                      <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-4 flex items-center gap-2">
                          <Package size={14} className="text-primary" /> Payload Data
                        </h4>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-primary border border-white/10">
                            2x
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight">
                              Special Chicken Dum Biryani
                            </p>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
                              Double Masala • Extra Raita
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Curator Card */}
                      <div className="p-8 bg-primary/5 rounded-3xl border border-primary/20 flex items-center gap-8">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-secondary border border-white/10 flex items-center justify-center font-black text-primary text-2xl shadow-2xl overflow-hidden">
                            <span className="relative z-10">RB</span>
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-bg-main flex items-center justify-center shadow-lg">
                            <CheckCircle size={12} className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">
                            Assigned Curator
                          </p>
                          <h4 className="text-xl font-black font-heading mb-2">Rabbani B.</h4>
                          <div className="flex gap-4">
                            <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                              Message Hub
                            </button>
                            <button className="px-6 py-2 bg-primary text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                              Direct Sync
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer */}
                  <div className="p-8 border-t border-white/5 flex justify-center">
                    <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-primary transition-all group">
                      <MapPin size={16} className="group-hover:animate-bounce" />
                      View Full Logistic Grid
                    </button>
                  </div>
                </div>
              ))}
            </MotionDiv>
          )}

          {activeTab === 'history' && (
            <MotionDiv
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {mockHistory.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-8 bg-secondary/30 p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    <CheckCircle size={28} />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold mb-1">{order.items}</p>
                    <p className="text-xs text-text-muted uppercase tracking-widest">
                      {order.date} • {order.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary font-heading mb-1">
                      {order.total}
                    </p>
                    <button className="text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-white flex items-center gap-1 justify-end">
                      Re-Order Hub <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </MotionDiv>
          )}

          {activeTab === 'addresses' && (
            <MotionDiv
              key="addresses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {mockAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-secondary/40 p-8 rounded-3xl border border-white/5 relative group"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      {addr.type === 'home' ? <Home size={24} /> : <Building size={24} />}
                    </div>
                    <h3 className="text-xl font-bold">{addr.label}</h3>
                  </div>
                  <p className="text-sm text-text-muted font-medium mb-8">{addr.address}</p>
                  <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                    Revise Protocol
                  </button>
                </div>
              ))}
              <button className="h-full min-h-[160px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-text-muted hover:border-primary/50 hover:text-primary transition-all">
                <Plus size={32} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  New Coordinate Hub
                </span>
              </button>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderHistory;
