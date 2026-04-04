import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/useContextHooks';
import {
  Truck, MapPin, CheckCircle, Navigation,
  ExternalLink, Package, ShieldCheck, Loader,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      ordersAPI.getAll(`?order_type=delivery&status=pending`),
      ordersAPI.getAll(`?order_type=delivery&status=paid`),
    ]).then(([pendRes, compRes]) => {
      setPending(pendRes.data || []);
      setCompleted(compRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePickup = async (id) => {
    try {
      await ordersAPI.updateStatus(id, 'served');
      load();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="container max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold font-heading mb-3">Courier Hub</h1>
            <p className="text-text-muted font-medium">Navigating artisan flavors to their destinations.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl">
            {['pending', 'completed'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${activeTab === tab ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader size={32} className="animate-spin text-primary" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'pending' && !loading && (
            <motion.div key="pending" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              {pending.length === 0 ? (
                <div className="text-center py-20 text-text-muted">
                  <Truck size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-bold uppercase tracking-widest">No pending deliveries</p>
                </div>
              ) : pending.map(ord => (
                <div key={ord._id} className="bg-secondary/40 p-10 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/20">
                          <Package size={32} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none mb-1">Assigned Shipment</p>
                          <p className="text-2xl font-bold font-heading">{ord.order_number || ord._id?.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm font-medium">
                          <MapPin size={18} className="text-primary" />
                          <span>{ord.delivery_address || ord.table_number || 'Address not provided'}</span>
                          <button className="text-primary hover:text-white transition-colors"><Navigation size={16} /></button>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                          <Truck size={18} className="text-primary" />
                          <span className="text-xs uppercase tracking-widest font-bold">
                            Order Type: {ord.order_type?.toUpperCase() || 'DELIVERY'}
                          </span>
                        </div>
                        {ord.customer_id?.name && (
                          <div className="flex items-center gap-4 text-sm font-medium text-text-muted">
                            Customer: <span className="text-white">{ord.customer_id.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full md:w-64 space-y-4">
                      <button onClick={() => handlePickup(ord._id)} className="btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl shadow-primary/20 group">
                        Pickup Successful
                        <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                        <ShieldCheck size={16} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Secured</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'completed' && !loading && (
            <motion.div key="completed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {completed.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <CheckCircle size={48} className="mx-auto text-primary opacity-20" />
                  <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Your complete movements will appear here.</p>
                </div>
              ) : completed.map(ord => (
                <div key={ord._id} className="flex items-center gap-6 bg-secondary/30 p-6 rounded-2xl border border-white/5">
                  <CheckCircle size={28} className="text-green-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">{ord.order_number || ord._id?.slice(-8)}</p>
                    <p className="text-xs text-text-muted">{ord.delivery_address || ord.table_number}</p>
                  </div>
                  <div className="text-right text-xs text-text-muted">
                    {ord.updated_at ? new Date(ord.updated_at).toLocaleDateString() : 'Delivered'}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeliveryDashboard;