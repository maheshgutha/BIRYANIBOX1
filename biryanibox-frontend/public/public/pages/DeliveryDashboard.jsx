import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  CheckCircle,
  Navigation,
  ExternalLink,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');

  const mockAssigned = [
    {
      id: 'BOX-12948',
      customer: 'John Doe',
      address: '742 Evergreen Terrace',
      status: 'ready',
      distance: '3.2 km',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      <div className="container max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold font-heading mb-3">Courier Hub</h1>
            <p className="text-text-muted font-medium">
              Navigating artisan flavors to their destinations.
            </p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl">
            {['pending', 'completed'].map((tab) => (
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
          {activeTab === 'pending' ? (
            <motion.div
              key="pending"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {mockAssigned.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-secondary/40 p-10 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/20">
                          <Package size={32} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">
                            Assigned Shipment
                          </p>
                          <p className="text-2xl font-bold font-heading">{ord.id}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm font-medium">
                          <MapPin size={18} className="text-primary" />
                          <span>{ord.address}</span>
                          <button className="text-primary hover:text-white transition-colors">
                            <Navigation size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                          <Truck size={18} className="text-primary" />
                          <span className="text-xs uppercase tracking-widest font-bold">
                            Estimated Path: {ord.distance}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-64 space-y-4">
                      <button className="btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl shadow-primary/20 group">
                        Pickup Successful
                        <ExternalLink
                          size={18}
                          className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                        />
                      </button>
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                        <ShieldCheck size={16} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Protocol Secured
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-20 text-center space-y-4"
            >
              <CheckCircle size={48} className="mx-auto text-primary opacity-20" />
              <p className="text-text-muted text-sm font-bold uppercase tracking-widest">
                Your complete movements will appear here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
