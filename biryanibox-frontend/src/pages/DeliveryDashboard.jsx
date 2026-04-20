import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deliveryAPI, notificationsAPI } from '../services/api';
import {
  Package, MapPin, Clock, CheckCircle, XCircle, LogOut, Bell, RefreshCw,
  Truck, DollarSign, TrendingUp, ChevronRight, Loader,
  Navigation, Phone, User, Activity, CheckSquare, ArrowRight, Info,
} from 'lucide-react';

const useAutoRefresh = (cb, ms = 15000) => {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
};

const STATUS_CONFIG = {
  pending:    { label: 'Available',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  assigned:   { label: 'Accepted',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',   dot: 'bg-blue-400' },
  picked_up:  { label: 'Picked Up',  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-400' },
  in_transit: { label: 'In Transit', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', dot: 'bg-purple-400' },
  delivered:  { label: 'Delivered',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  dot: 'bg-green-400' },
  failed:     { label: 'Failed',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',    dot: 'bg-red-400' },
};

const NotifBell = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const load = useCallback(async (silent = false) => {
    try { const r = await notificationsAPI.getAll(); setNotifs(r.data || []); setUnread(r.unreadCount || 0); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, 20000);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-orange-400 transition-all">
        <Bell size={16} />
        {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-full mt-2 w-80 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-widest text-white/60">Notifications</span>
              {unread > 0 && <button onClick={() => { notificationsAPI.markAllRead(); setUnread(0); }} className="text-[10px] text-orange-400 font-bold">Mark all read</button>}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.length === 0 ? <div className="py-8 text-center text-white/30 text-xs">No notifications</div> :
                notifs.slice(0, 15).map(n => (
                  <div key={n._id} className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 ${!n.is_read ? 'bg-orange-500/5' : ''}`}>
                    <p className={`text-xs font-bold ${!n.is_read ? 'text-white' : 'text-white/50'}`}>{n.title}</p>
                    <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color = 'text-orange-400' }) => (
  <div className="bg-[#111] border border-white/8 rounded-2xl p-4 flex items-center gap-3">
    <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center ${color}`}><Icon size={18} /></div>
    <div>
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-xs text-white/40 font-semibold">{label}</p>
    </div>
  </div>
);

const DeliveryCard = ({ delivery, onAccept, onSkip, onPickup, onTransit, onDeliver, onFail, actLoading }) => {
  const order = delivery.order_id || {};
  const cfg = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.pending;
  const canAccept     = delivery.status === 'pending';
  const canPickup     = delivery.status === 'assigned';          // show always once accepted
  const dispatched    = delivery.captain_dispatched;             // visual hint only
  const canTransit    = delivery.status === 'picked_up';
  const canDeliver    = delivery.status === 'in_transit';

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-[#111] border rounded-2xl overflow-hidden ${delivery.status === 'pending' ? 'border-yellow-500/30' : delivery.status === 'assigned' ? 'border-blue-500/30' : 'border-white/8'}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
          <span className="text-white font-bold text-sm">Order #{order.order_number || '—'}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-orange-400 mt-0.5 flex-shrink-0" />
          <span className="text-white/70 text-sm leading-relaxed">{delivery.delivery_address || order.delivery_address || '—'}</span>
        </div>
        {delivery.customer_name && (
          <div className="flex items-center gap-2">
            <User size={13} className="text-white/30" />
            <span className="text-white/50 text-sm">{delivery.customer_name}</span>
            {delivery.phone && <a href={`tel:${delivery.phone}`} className="flex items-center gap-1 text-orange-400 text-xs hover:underline ml-1"><Phone size={10} />{delivery.phone}</a>}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
            <DollarSign size={11} className="text-green-400" />
            <span className="text-green-400 font-black text-sm">${delivery.delivery_fee || 0}</span>
          </div>
          {delivery.distance_km > 0 && <span className="text-white/30 text-xs flex items-center gap-1"><Navigation size={10} />{delivery.distance_km} km</span>}
        </div>
        {order.items?.length > 0 && (
          <div className="bg-white/3 rounded-xl px-3 py-2">
            <p className="text-[10px] text-white/30 font-bold mb-0.5">Items</p>
            <p className="text-xs text-white/60">{order.items.slice(0,3).map(i=>`${i.name} x${i.quantity}`).join(', ')}{order.items.length>3?` +${order.items.length-3} more`:''}</p>
          </div>
        )}
        {canPickup && !dispatched && (
          <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
            <Info size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-300">Waiting for captain to dispatch — you can still mark picked up once you have the order.</p>
          </div>
        )}
        {canPickup && dispatched && (
          <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
            <CheckCircle size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-300">Captain dispatched! Head to restaurant and pick up the order now.</p>
          </div>
        )}
      </div>
      {/* ── Step progress tracker ─────────────────────────────────────── */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-0">
          {[
            { status: 'assigned',   label: 'Accepted',   icon: '✅' },
            { status: 'picked_up',  label: 'Picked Up',  icon: '📦' },
            { status: 'in_transit', label: 'On the Way', icon: '🛵' },
            { status: 'delivered',  label: 'Delivered',  icon: '🏠' },
          ].map((step, i, arr) => {
            const statOrder = ['assigned', 'picked_up', 'in_transit', 'delivered'];
            const curIdx = statOrder.indexOf(delivery.status);
            const stepIdx = statOrder.indexOf(step.status);
            const done    = curIdx > stepIdx;
            const active  = curIdx === stepIdx;
            return (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 transition-all ${done ? 'bg-green-500 border-green-500' : active ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/40' : 'bg-white/5 border-white/20'}`}>
                    {done ? '✓' : step.icon}
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-wider ${active ? 'text-orange-400' : done ? 'text-green-400' : 'text-white/20'}`}>{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-1 ${done ? 'bg-green-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-4 flex flex-wrap gap-2">
        {canAccept && (
          <>
            <button onClick={() => onAccept(delivery._id)} disabled={actLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all disabled:opacity-50">
              <CheckSquare size={13} /> Accept Delivery
            </button>
            <button onClick={() => onSkip(delivery._id)} disabled={actLoading}
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/50 text-xs font-black rounded-xl hover:bg-white/10 transition-all">Skip</button>
          </>
        )}
        {canPickup && (
          <button onClick={() => onPickup(delivery._id)} disabled={actLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20">
            <Package size={13} /> 📦 Picked Up — Start Delivery
          </button>
        )}
        {canTransit && (
          <button onClick={() => onTransit(delivery._id)} disabled={actLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all disabled:opacity-50">
            <Navigation size={13} /> 🛵 On the Way
          </button>
        )}
        {canDeliver && (
          <>
            <button onClick={() => onDeliver(delivery._id)} disabled={actLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all disabled:opacity-50">
              <CheckCircle size={13} /> 🏠 Mark Delivered
            </button>
            <button onClick={() => onFail(delivery._id)} disabled={actLoading}
              className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black rounded-xl hover:bg-red-500 hover:text-white transition-all">Failed</button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTabState] = useState(searchParams.get('tab') || 'available');

  // Push tab changes to browser history so back/forward works
  const setTab = React.useCallback((t) => {
    setTabState(t);
    setSearchParams({ tab: t }, { replace: false });
  }, [setSearchParams]);

  // Sync when browser navigates back/forward
  const urlTab = searchParams.get('tab');
  React.useEffect(() => {
    if (urlTab && urlTab !== tab) setTabState(urlTab);
  }, [urlTab]);
  const [available, setAvailable] = useState([]);
  const [myActive, setMyActive]   = useState(null);
  const [completed, setCompleted] = useState([]);
  const [stats, setStats]         = useState({});
  const [actLoading, setActLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [flash, setFlash]         = useState({ text: '', type: '' });

  const showFlash = (text, type = 'success') => {
    setFlash({ text, type });
    setTimeout(() => setFlash({ text: '', type: '' }), 3500);
  };

  const loadAll = useCallback(async (silent = false) => {
    try {
      const [avail, active, done, st] = await Promise.allSettled([
        deliveryAPI.getAvailable(),
        deliveryAPI.getMyActive(),
        deliveryAPI.getCompleted(),
        deliveryAPI.getStats(),
      ]);
      if (avail.status === 'fulfilled')  setAvailable(avail.value.data || []);
      if (active.status === 'fulfilled') setMyActive(active.value.data || null);
      if (done.status === 'fulfilled')   setCompleted(done.value.data || []);
      if (st.status === 'fulfilled')     setStats(st.value.data || {});
    } catch {}
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useAutoRefresh(loadAll, 12000);

  const refresh = async () => { setRefreshing(true); await loadAll(); setRefreshing(false); };

  const handleAccept = async (id) => {
    setActLoading(true);
    try { await deliveryAPI.accept(id); showFlash('✅ Accepted! Wait for captain to dispatch before pickup.'); await loadAll(); setTab('active'); }
    catch (e) { showFlash(e.message || 'Failed to accept', 'error'); }
    finally { setActLoading(false); }
  };
  const handleSkip = async (id) => {
    try { await deliveryAPI.skip(id); await loadAll(); }
    catch (e) { showFlash(e.message || 'Error', 'error'); }
  };
  const handlePickup = async (id) => {
    setActLoading(true);
    try { await deliveryAPI.updateStatus(id, 'picked_up'); showFlash('📦 Picked up! Deliver to customer.'); await loadAll(); }
    catch (e) { showFlash(e.message || 'Failed', 'error'); }
    finally { setActLoading(false); }
  };
  const handleTransit = async (id) => {
    setActLoading(true);
    try { await deliveryAPI.updateStatus(id, 'in_transit'); showFlash('🛵 On the way! Ride safe.'); await loadAll(); }
    catch (e) { showFlash(e.message || 'Failed', 'error'); }
    finally { setActLoading(false); }
  };
  const handleDeliver = async (id) => {
    setActLoading(true);
    try { await deliveryAPI.updateStatus(id, 'delivered'); showFlash('🎉 Delivery completed! Well done.'); await loadAll(); setTab('done'); }
    catch (e) { showFlash(e.message || 'Failed', 'error'); }
    finally { setActLoading(false); }
  };
  const handleFail = async (id) => {
    setActLoading(true);
    try { await deliveryAPI.updateStatus(id, 'failed'); showFlash('Delivery marked as failed.', 'error'); await loadAll(); }
    catch (e) { showFlash(e.message || 'Failed', 'error'); }
    finally { setActLoading(false); }
  };

  const TABS = [
    { id: 'available', label: 'Available', count: available.length },
    { id: 'active',    label: 'Active',    count: myActive ? 1 : 0 },
    { id: 'done',      label: 'History',   count: null },
    { id: 'stats',     label: 'Stats',     count: null },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center"><Truck size={16} className="text-white" /></div>
            <div>
              <p className="text-white font-black text-sm leading-none">Rider Hub</p>
              <p className="text-orange-400 text-[10px] font-bold uppercase tracking-widest">{user?.name || 'Rider'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} disabled={refreshing}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-orange-400 transition-all">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <NotifBell />
            <button onClick={() => { logout(); navigate('/login'); }}
              className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        <AnimatePresence>
          {flash.text && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${flash.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-green-500/10 border border-green-500/30 text-green-400'}`}>
              {flash.type === 'error' ? <XCircle size={15} /> : <CheckCircle size={15} />} {flash.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <StatCard icon={DollarSign} label="Today's Earnings"   value={`$${(stats.today_earnings||0).toFixed(2)}`} color="text-green-400" />
          <StatCard icon={Truck}      label="Today's Deliveries" value={stats.today_deliveries||0} color="text-orange-400" />
        </div>

        {myActive && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-orange-300">Active delivery in progress</span>
            </div>
            <button onClick={() => setTab('active')} className="text-orange-400 text-xs font-black flex items-center gap-1 hover:text-orange-300">
              View <ArrowRight size={12} />
            </button>
          </motion.div>
        )}

        <div className="flex gap-1 bg-white/5 p-1.5 rounded-2xl mt-4 border border-white/8">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${tab === t.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? 'bg-white/20' : 'bg-orange-500 text-white'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {tab === 'available' && (
            <AnimatePresence mode="popLayout">
              {available.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
                  <Truck size={40} className="mx-auto mb-3 text-white/10" />
                  <p className="text-white/30 font-bold text-sm">No available deliveries</p>
                  <p className="text-white/20 text-xs mt-1">New orders appear here when chef starts cooking</p>
                </motion.div>
              ) : available.map(d => (
                <DeliveryCard key={d._id} delivery={d} onAccept={handleAccept} onSkip={handleSkip}
                  onPickup={handlePickup} onTransit={handleTransit} onDeliver={handleDeliver} onFail={handleFail} actLoading={actLoading} />
              ))}
            </AnimatePresence>
          )}

          {tab === 'active' && (
            <AnimatePresence mode="popLayout">
              {!myActive ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <Package size={40} className="mx-auto mb-3 text-white/10" />
                  <p className="text-white/30 font-bold text-sm">No active delivery</p>
                  <p className="text-white/20 text-xs mt-1">Accept an order from the Available tab</p>
                </motion.div>
              ) : (
                <DeliveryCard key={myActive._id} delivery={myActive} onAccept={handleAccept} onSkip={handleSkip}
                  onPickup={handlePickup} onTransit={handleTransit} onDeliver={handleDeliver} onFail={handleFail} actLoading={actLoading} />
              )}
            </AnimatePresence>
          )}

          {tab === 'done' && (
            <AnimatePresence mode="popLayout">
              {completed.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <CheckCircle size={40} className="mx-auto mb-3 text-white/10" />
                  <p className="text-white/30 font-bold text-sm">No completed deliveries yet</p>
                </motion.div>
              ) : completed.map(d => {
                const o = d.order_id || {};
                return (
                  <motion.div key={d._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-[#111] border border-white/8 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                        <CheckCircle size={16} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Order #{o.order_number || '—'}</p>
                        <p className="text-white/40 text-xs">{(d.delivery_address || '').slice(0, 40)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-black">${d.delivery_fee || 0}</p>
                      <p className="text-white/30 text-[10px]">{d.delivered_at ? new Date(d.delivered_at).toLocaleDateString() : '—'}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {tab === 'stats' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Truck}      label="Total Deliveries" value={stats.total_deliveries||0} color="text-orange-400" />
                <StatCard icon={DollarSign} label="Total Earnings"   value={`$${(stats.total_earnings||0).toFixed(2)}`} color="text-green-400" />
                <StatCard icon={Activity}   label="Today's Trips"    value={stats.today_deliveries||0} color="text-blue-400" />
                <StatCard icon={TrendingUp} label="Today's Earnings" value={`$${(stats.today_earnings||0).toFixed(2)}`} color="text-purple-400" />
              </div>
              <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">How Delivery Works</p>
                <div className="space-y-3">
                  {[
                    { icon: '🍳', title: 'Chef starts cooking',   desc: 'Order appears in Available tab for all riders' },
                    { icon: '✋', title: 'You accept it',          desc: 'Order reserved for you — hidden from others' },
                    { icon: '📦', title: 'Captain dispatches',    desc: 'Captain confirms order packed & ready' },
                    { icon: '🏍️', title: 'You pick up',           desc: 'Head to restaurant, collect the order' },
                    { icon: '🏠', title: 'Deliver to customer',   desc: 'Mark delivered to complete and earn fee' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-base flex-shrink-0">{s.icon}</div>
                      <div>
                        <p className="text-white text-sm font-bold">{s.title}</p>
                        <p className="text-white/40 text-xs">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}