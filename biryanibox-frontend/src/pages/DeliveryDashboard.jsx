import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useContextHooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deliveryAPI, notificationsAPI } from '../services/api';
import {
  Package, MapPin, Clock, CheckCircle, XCircle, LogOut, Bell, RefreshCw,
  Truck, DollarSign, TrendingUp, Loader, Navigation, Phone, User,
  Activity, CheckSquare, ArrowRight, Info, SkipForward, History,
  Award, Zap, Shield, Star, ChevronRight, AlertTriangle, Map,
} from 'lucide-react';

const useAutoRefresh = (cb, ms = 5000) => {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
};

// Fires callback immediately whenever the browser tab becomes visible again
// (rider switches back from another app / screen)
const useVisibilityRefresh = (cb) => {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    const h = () => { if (document.visibilityState === 'visible') ref.current(); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);
};

// Haversine distance (km) between two lat/lng pairs
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Fee based on distance tiers
const calcFee = (km) => {
  if (!km || km <= 0) return 40;
  if (km <= 2)  return 40;
  if (km <= 5)  return 60;
  if (km <= 10) return 80;
  if (km <= 15) return 100;
  return Math.round(100 + (km - 15) * 8);
};

const STATUS_CONFIG = {
  pending:    { label: 'Available',  color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/40',   dot: 'bg-amber-400',   glow: 'shadow-amber-500/30' },
  assigned:   { label: 'Accepted',   color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/40',    dot: 'bg-blue-400',    glow: 'shadow-blue-500/30' },
  picked_up:  { label: 'Picked Up',  color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/40', dot: 'bg-orange-400',  glow: 'shadow-orange-500/30' },
  in_transit: { label: 'On the Way', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/30' },
  delivered:  { label: 'Delivered',  color: 'text-green-400',   bg: 'bg-green-500/15 border-green-500/40',  dot: 'bg-green-400',   glow: 'shadow-green-500/30' },
  failed:     { label: 'Failed',     color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/40',    dot: 'bg-red-400',     glow: 'shadow-red-500/30' },
};

// ── Mini Map Component ────────────────────────────────────────────────────
// window.L (Leaflet) is loaded via index.html — no dynamic injection needed
const DeliveryMap = ({ address, label = 'Delivery Location', onDistanceCalc }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address || !mapRef.current) return;
    if (!window.L) { setError('Map library not loaded'); setLoading(false); return; }
    let cancelled = false;

    const init = async () => {
      setLoading(true); setError('');
      try {
        const L = window.L;

        // Geocode via backend proxy — avoids Nominatim blocking localhost/browser requests
        const geoRes = await deliveryAPI.geocode(address);
        if (cancelled) return;

        const geoData = geoRes.data || [];
        if (!geoData[0]) {
          setError('Address not found on map');
          setLoading(false);
          return;
        }
        const latNum = parseFloat(geoData[0].lat);
        const lonNum = parseFloat(geoData[0].lon);

        // Destroy any existing map instance before creating a new one
        if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
        if (!mapRef.current || cancelled) return;

        mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([latNum, lonNum], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current);
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
        // Recalculate tile layout after container dimensions settle
        requestAnimationFrame(() => { if (mapInstance.current) mapInstance.current.invalidateSize(); });

        // Destination pin
        const destIcon = L.divIcon({
          html: `<div style="background:#ef4444;color:white;border-radius:50% 50% 50% 0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.5)"><span style="transform:rotate(45deg)">📍</span></div>`,
          className: '', iconSize: [32, 32], iconAnchor: [16, 32],
        });
        L.marker([latNum, lonNum], { icon: destIcon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${label}</b><br>${address}`).openPopup();

        // Rider's current GPS position — distance calculation + route line
        if (navigator.geolocation && onDistanceCalc) {
          navigator.geolocation.getCurrentPosition((pos) => {
            if (cancelled || !mapInstance.current) return;
            const userLat = pos.coords.latitude;
            const userLon = pos.coords.longitude;
            onDistanceCalc(haversine(userLat, userLon, latNum, lonNum));
            const userIcon = L.divIcon({
              html: `<div style="background:#3b82f6;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)">🏍️</div>`,
              className: '', iconSize: [24, 24], iconAnchor: [12, 12],
            });
            L.marker([userLat, userLon], { icon: userIcon }).addTo(mapInstance.current).bindPopup('You (Rider)');
            L.polyline([[userLat, userLon], [latNum, lonNum]], { color: '#f97316', weight: 3, dashArray: '8,6' }).addTo(mapInstance.current);
            mapInstance.current.fitBounds([[userLat, userLon], [latNum, lonNum]], { padding: [30, 30] });
          }, () => {}); // geolocation denied → skip rider marker, still show destination
        }
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError('Map unavailable — ' + (e.message || 'check connection')); setLoading(false); }
      }
    };

    init();
    return () => {
      cancelled = true;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [address]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 relative" style={{ height: 220 }}>
      {loading && (
        <div className="absolute inset-0 bg-[#111] flex items-center justify-center z-10">
          <Loader size={20} className="animate-spin text-orange-400" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-[#111] flex flex-col items-center justify-center z-10">
          <Map size={28} className="text-white/20 mb-2" />
          <p className="text-white/30 text-xs">{error}</p>
        </div>
      )}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

// ── Notification Bell ──────────────────────────────────────────────────────
const NotifBell = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const load = useCallback(async () => {
    try { const r = await notificationsAPI.getAll(); setNotifs(r.data || []); setUnread(r.unreadCount || 0); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, 15000);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(o => !o); load(); }}
        className="relative w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-orange-400 hover:bg-orange-500/10 transition-all">
        <Bell size={16} />
        {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0d0d0d]">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 bg-[#181818] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-widest text-white/50">Notifications</span>
              {unread > 0 && <button onClick={() => { notificationsAPI.markAllRead(); setUnread(0); }} className="text-[10px] text-orange-400 font-bold hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.length === 0 ? <div className="py-8 text-center text-white/30 text-xs font-bold">No notifications</div> :
                notifs.slice(0, 15).map(n => (
                  <div key={n._id} className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer ${!n.is_read ? 'bg-orange-500/5' : ''}`}>
                    <p className={`text-xs font-bold ${!n.is_read ? 'text-white' : 'text-white/50'}`}>{n.title}</p>
                    <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[9px] text-white/20 mt-1">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = 'text-orange-400', bg = 'bg-orange-500/10', border = 'border-orange-500/20' }) => (
  <div className={`${bg} border ${border} rounded-2xl p-4 flex items-center gap-3`}>
    <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center ${color} shrink-0`}><Icon size={18} /></div>
    <div>
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-white/40 font-semibold leading-tight">{label}</p>
    </div>
  </div>
);

// ── Delivery Card ──────────────────────────────────────────────────────────
const DeliveryCard = ({ delivery, onAccept, onSkip, onPickup, onTransit, onDeliver, onFail, onRefresh, actLoading }) => {
  const order = delivery.order_id || {};
  const cfg = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.pending;
  const canAccept  = delivery.status === 'pending';
  const canPickup  = delivery.status === 'assigned';
  const dispatched = !!delivery.captain_dispatched;
  const canTransit = delivery.status === 'picked_up';
  const canDeliver = delivery.status === 'in_transit';
  const [distKm, setDistKm] = useState(delivery.distance_km || 0);
  const [showMap, setShowMap] = useState(false);

  const fee = delivery.delivery_fee || calcFee(distKm);

  const handleDistanceCalc = useCallback((km) => {
    setDistKm(parseFloat(km.toFixed(1)));
  }, []);

  const STEPS = [
    { status: 'assigned',   label: 'Accepted',  icon: '✅' },
    { status: 'picked_up',  label: 'Picked Up', icon: '📦' },
    { status: 'in_transit', label: 'On the Way',icon: '🛵' },
    { status: 'delivered',  label: 'Delivered', icon: '🏠' },
  ];
  const STEP_ORDER = ['assigned','picked_up','in_transit','delivered'];
  const curIdx = STEP_ORDER.indexOf(delivery.status);

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-3xl overflow-hidden border-2 ${
        delivery.status === 'pending'    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent' :
        delivery.status === 'assigned'   ? 'border-blue-500/40 bg-gradient-to-b from-blue-500/5 to-transparent' :
        delivery.status === 'picked_up'  ? 'border-orange-500/40 bg-gradient-to-b from-orange-500/5 to-transparent' :
        delivery.status === 'in_transit' ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 to-transparent' :
        'border-white/10 bg-[#111]'
      }`}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
            delivery.status === 'pending' ? 'bg-amber-500/20' :
            delivery.status === 'assigned' ? 'bg-blue-500/20' :
            delivery.status === 'picked_up' ? 'bg-orange-500/20' :
            'bg-emerald-500/20'
          }`}>
            {delivery.status === 'pending' ? '📦' : delivery.status === 'assigned' ? '🏍️' : delivery.status === 'picked_up' ? '🚀' : '🛵'}
          </div>
          <div>
            <p className="text-white font-black text-sm">Order #{order.order_number || '—'}</p>
            <p className="text-white/40 text-[10px] font-bold">{new Date(delivery.order_placed_at || delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Address */}
        <div className="flex items-start gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
          <MapPin size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
          <span className="text-white/80 text-sm leading-relaxed">{delivery.delivery_address || order.delivery_address || '—'}</span>
        </div>

        {/* Arrival Preference — critical info for rider */}
        {(() => {
          const doNotDisturb = delivery.knock_bell === false || order.knock_bell === false;
          return (
            <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 border ${
              doNotDisturb
                ? 'bg-purple-500/10 border-purple-500/40'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <span className="text-lg leading-none">{doNotDisturb ? '🤫' : '🔔'}</span>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${doNotDisturb ? 'text-purple-300' : 'text-blue-300'}`}>
                  {doNotDisturb ? 'Do Not Disturb' : 'Ring Bell / Knock'}
                </p>
                <p className={`text-[10px] mt-0.5 ${doNotDisturb ? 'text-purple-400/70' : 'text-blue-400/70'}`}>
                  {doNotDisturb
                    ? 'Customer requested no doorbell or knocking. Leave food at door quietly.'
                    : 'Customer requested you ring the bell or knock on arrival.'}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Delivery notes if any */}
        {(delivery.delivery_notes || order.delivery_notes) && (
          <div className="flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2.5">
            <span className="text-yellow-400 text-sm">📝</span>
            <div>
              <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest mb-0.5">Delivery Note</p>
              <p className="text-xs text-white/70">{delivery.delivery_notes || order.delivery_notes}</p>
            </div>
          </div>
        )}

        {/* Customer + Fee row */}
        <div className="flex items-center gap-3 flex-wrap">
          {delivery.customer_name && (
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
              <User size={11} className="text-white/40" />
              <span className="text-white/60 text-xs font-bold">{delivery.customer_name}</span>
              {delivery.phone && (
                <a href={`tel:${delivery.phone}`} className="flex items-center gap-1 text-blue-400 text-[10px] hover:underline ml-1">
                  <Phone size={9} />{delivery.phone}
                </a>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 rounded-lg px-3 py-1.5">
            <DollarSign size={12} className="text-green-400" />
            <span className="text-green-400 font-black text-sm">${fee}</span>
            {distKm > 0 && <span className="text-green-400/60 text-[10px]">· {distKm}km</span>}
          </div>
          {distKm > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1.5">
              <Navigation size={11} className="text-blue-400" />
              <span className="text-blue-400 text-[10px] font-bold">~{Math.round(distKm / 20 * 60)} min</span>
            </div>
          )}
        </div>

        {/* Items */}
        {order.items?.length > 0 && (
          <div className="bg-white/5 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-white/30 font-black uppercase mb-1">Order Items</p>
            <p className="text-xs text-white/60">{order.items.slice(0,3).map(i=>`${i.name} ×${i.quantity}`).join(' · ')}{order.items.length>3?` +${order.items.length-3} more`:''}</p>
          </div>
        )}

        {/* Dispatch status alert */}
        {canPickup && !dispatched && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-amber-300 font-bold">Waiting for Dispatch</p>
              <p className="text-[10px] text-amber-400/70 mt-0.5">Captain, manager, or owner must dispatch this order before you can pick it up. You'll get a notification.</p>
            </div>
          </div>
        )}
        {canPickup && dispatched && (
          <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2.5">
            <CheckCircle size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-green-300 font-bold">Dispatched! Head to restaurant 🏍️</p>
              <p className="text-[10px] text-green-400/70 mt-0.5">Order is packed and ready for pickup. Ride safe!</p>
            </div>
          </div>
        )}

        {/* Map toggle */}
        {(delivery.delivery_address || order.delivery_address) && (
          <button onClick={() => setShowMap(m => !m)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white/50 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
            <Map size={12} /> {showMap ? 'Hide Map' : 'Show Map & Distance'}
          </button>
        )}
        {showMap && (
          <DeliveryMap
            address={delivery.delivery_address || order.delivery_address}
            label="Delivery Destination"
            onDistanceCalc={handleDistanceCalc}
          />
        )}
      </div>

      {/* Step Progress Tracker */}
      <div className="px-5 pb-3">
        <div className="flex items-center">
          {STEPS.map((step, i) => {
            const stepIdx = STEP_ORDER.indexOf(step.status);
            const done   = curIdx > stepIdx;
            const active = curIdx === stepIdx;
            return (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] border-2 transition-all ${
                    done   ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/40' :
                    active ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/40 animate-pulse' :
                    'bg-white/5 border-white/15'
                  }`}>{done ? '✓' : step.icon}</div>
                  <span className={`text-[8px] font-black uppercase tracking-wider ${active ? 'text-orange-400' : done ? 'text-green-400' : 'text-white/20'}`}>{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${done ? 'bg-green-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-5 flex flex-wrap gap-2">
        {canAccept && (
          <>
            <button onClick={() => onAccept(delivery._id)} disabled={actLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-500/30">
              <CheckSquare size={14} /> Accept Delivery
            </button>
            <button onClick={() => onSkip(delivery._id)} disabled={actLoading}
              className="px-4 py-3 bg-white/8 border border-white/15 text-white/50 text-xs font-black rounded-xl hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all flex items-center gap-1.5">
              <SkipForward size={12} /> Skip
            </button>
          </>
        )}
        {canPickup && !dispatched && (
          <button
            onClick={() => onRefresh && onRefresh()}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black py-3 px-4 rounded-xl hover:bg-amber-500/20 transition-all">
            <RefreshCw size={13} className="animate-spin" style={{ animationDuration: '3s' }} />
            🔒 Waiting for Dispatch — Tap to Check
          </button>
        )}
        {canPickup && dispatched && (
          <button onClick={() => onPickup(delivery._id)} disabled={actLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-black py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30">
            <Package size={14} /> 📦 Mark Picked Up
          </button>
        )}
        {canTransit && (
          <button onClick={() => onTransit(delivery._id)} disabled={actLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white text-xs font-black py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30">
            <Navigation size={14} /> 🛵 I'm On the Way
          </button>
        )}
        {canDeliver && (
          <>
            <button onClick={() => onDeliver(delivery._id)} disabled={actLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-black py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-500/30">
              <CheckCircle size={14} /> 🏠 Mark Delivered!
            </button>
            <button onClick={() => onFail(delivery._id)} disabled={actLoading}
              className="px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black rounded-xl hover:bg-red-500 hover:text-white transition-all">
              Failed
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ── Skipped History Card ───────────────────────────────────────────────────
const SkippedCard = ({ delivery }) => {
  const order = delivery.order_id || {};
  return (
    <div className="bg-[#111] border border-red-500/15 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-lg flex-shrink-0">⏭️</div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-sm">Order #{order.order_number || '—'}</p>
            <span className="text-[9px] px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/20 rounded-full font-black uppercase">Skipped</span>
          </div>
          <p className="text-white/40 text-[10px] mt-0.5 truncate max-w-[180px]">{(delivery.delivery_address || '—').slice(0,40)}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-red-400/60 text-xs font-bold">—</p>
        <p className="text-white/20 text-[10px]">Skipped</p>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTabState] = useState(searchParams.get('tab') || 'available');

  const setTab = useCallback((t) => {
    setTabState(t);
    setSearchParams({ tab: t }, { replace: false });
  }, [setSearchParams]);

  const urlTab = searchParams.get('tab');
  useEffect(() => { if (urlTab && urlTab !== tab) setTabState(urlTab); }, [urlTab]);

  const [available, setAvailable] = useState([]);
  const [myActive,  setMyActive]  = useState(null);
  const [completed, setCompleted] = useState([]);
  const [skipped,   setSkipped]   = useState([]);
  const [stats,     setStats]     = useState({});
  const [actLoading, setActLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [flash, setFlash] = useState({ text: '', type: '' });

  const showFlash = (text, type = 'success') => {
    setFlash({ text, type });
    setTimeout(() => setFlash({ text: '', type: '' }), 4000);
  };

  const loadAll = useCallback(async () => {
    try {
      const [avail, active, done, st, skip] = await Promise.allSettled([
        deliveryAPI.getAvailable(),
        deliveryAPI.getMyActive(),
        deliveryAPI.getCompleted(),
        deliveryAPI.getStats(),
        deliveryAPI.getMySkipped(),
      ]);
      if (avail.status === 'fulfilled')  setAvailable(avail.value.data || []);
      if (active.status === 'fulfilled') setMyActive(active.value.data || null);
      if (done.status === 'fulfilled')   setCompleted(done.value.data || []);
      if (st.status === 'fulfilled')     setStats(st.value.data || {});
      if (skip.status === 'fulfilled')   setSkipped(skip.value.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useAutoRefresh(loadAll, 5000);        // poll every 5 s for fast pickup button enable
  useVisibilityRefresh(loadAll);        // immediate refresh when rider switches back to app

  // Poll notifications every 4 s — when a 'dispatch' notification arrives,
  // call loadAll() immediately so the Pickup button enables without waiting
  useEffect(() => {
    let lastNotifId = null;
    const checkDispatch = async () => {
      try {
        const r = await notificationsAPI.getAll();
        const notifs = r.data || [];
        const dispatchNotif = notifs.find(n =>
          n.type === 'delivery' &&
          n.title?.toLowerCase().includes('dispatch') &&
          !n.is_read
        );
        if (dispatchNotif && dispatchNotif._id !== lastNotifId) {
          lastNotifId = dispatchNotif._id;
          loadAll(); // immediately refresh delivery data
        }
      } catch {}
    };
    const id = setInterval(checkDispatch, 4000);
    return () => clearInterval(id);
  }, [loadAll]);

  const refresh = async () => { setRefreshing(true); await loadAll(); setRefreshing(false); };

  const handleAccept = async (id) => {
    setActLoading(true);
    try {
      await deliveryAPI.accept(id);
      showFlash('✅ Accepted! Waiting for captain to dispatch before pickup.', 'success');
      await loadAll(); setTab('active');
    } catch (e) { showFlash(e.message || 'Failed to accept', 'error'); }
    finally { setActLoading(false); }
  };

  const handleSkip = async (id) => {
    try {
      await deliveryAPI.skip(id);
      showFlash('⏭️ Order skipped. Owner & manager notified.', 'info');
      await loadAll();
    } catch (e) { showFlash(e.message || 'Error', 'error'); }
  };

  const handlePickup = async (id) => {
    setActLoading(true);
    try {
      await deliveryAPI.updateStatus(id, 'picked_up');
      showFlash('📦 Picked up! Now on the way to customer.', 'success');
      await loadAll();
    } catch (e) { showFlash(e.message || 'Cannot pick up yet — captain must dispatch first!', 'error'); }
    finally { setActLoading(false); }
  };

  const handleTransit = async (id) => {
    setActLoading(true);
    try {
      await deliveryAPI.updateStatus(id, 'in_transit');
      showFlash('🛵 You\'re on the way! Ride safe.', 'success');
      await loadAll();
    } catch (e) { showFlash(e.message || 'Failed', 'error'); }
    finally { setActLoading(false); }
  };

  const handleDeliver = async (id) => {
    setActLoading(true);
    try {
      await deliveryAPI.updateStatus(id, 'delivered');
      showFlash('🎉 Delivery completed! Great job!', 'success');
      await loadAll(); setTab('done');
    } catch (e) { showFlash(e.message || 'Failed', 'error'); }
    finally { setActLoading(false); }
  };

  const handleFail = async (id) => {
    setActLoading(true);
    try {
      await deliveryAPI.updateStatus(id, 'failed');
      showFlash('Delivery marked as failed.', 'error');
      await loadAll();
    } catch (e) { showFlash(e.message || 'Failed', 'error'); }
    finally { setActLoading(false); }
  };

  const TABS = [
    { id: 'available', label: 'Available', icon: '📦', count: available.length },
    { id: 'active',    label: 'Active',    icon: '🛵', count: myActive ? 1 : 0 },
    { id: 'done',      label: 'History',   icon: '✅', count: null },
    { id: 'skipped',   label: 'Skipped',   icon: '⏭️', count: skipped.length > 0 ? skipped.length : null },
    { id: 'stats',     label: 'Stats',     icon: '📊', count: null },
  ];

  const tierInfo = (() => {
    const e = stats.total_earnings || 0;
    if (e >= 500) return { label: 'Gold Rider', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '🥇' };
    if (e >= 200) return { label: 'Silver Rider', color: 'text-slate-300', bg: 'bg-slate-500/10', icon: '🥈' };
    return { label: 'Bronze Rider', color: 'text-amber-600', bg: 'bg-amber-700/10', icon: '🥉' };
  })();

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #111218 50%, #0a0f0d 100%)' }}>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: 'rgba(13,13,13,0.92)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}>🛵</div>
            <div>
              <p className="text-white font-black text-sm leading-none">Rider Hub</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>{user?.name || 'Rider'} · {tierInfo.icon} {tierInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} disabled={refreshing}
              className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-orange-400 transition-all">
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

      <div className="max-w-2xl mx-auto px-4 pb-12">

        {/* Flash Message */}
        <AnimatePresence>
          {flash.text && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 border ${
                flash.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                flash.type === 'info'  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
              {flash.type === 'error' ? <XCircle size={15} /> : flash.type === 'info' ? <Info size={15} /> : <CheckCircle size={15} />}
              {flash.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <StatCard icon={DollarSign} label="Today's Earnings" value={`$${(stats.today_earnings||0).toFixed(2)}`} color="text-green-400" bg="bg-green-500/10" border="border-green-500/20" />
          <StatCard icon={Truck} label="Today's Trips" value={stats.today_deliveries||0} color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" />
        </div>

        {/* Active delivery banner */}
        {myActive && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setTab('active')}
            className="mt-3 w-full flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-3 hover:bg-orange-500/15 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-orange-300">Active delivery in progress</span>
              <span className="text-[10px] text-orange-400/60">#{myActive.order_id?.order_number || '—'}</span>
            </div>
            <div className="flex items-center gap-1 text-orange-400">
              <span className="text-xs font-black">View</span>
              <ArrowRight size={13} />
            </div>
          </motion.button>
        )}

        {/* Tab Bar */}
        <div className="flex gap-1 mt-4 p-1.5 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
                tab === t.id
                  ? 'text-white shadow-lg'
                  : 'text-white/30 hover:text-white/60'
              }`}
              style={tab === t.id ? { background: 'linear-gradient(135deg,#f97316,#ef4444)', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' } : {}}>
              <span className="text-base leading-none">{t.icon}</span>
              <span>{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black leading-none ${tab === t.id ? 'bg-white/20' : 'bg-orange-500 text-white'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4 space-y-4">

          {/* AVAILABLE */}
          {tab === 'available' && (
            <AnimatePresence mode="popLayout">
              {available.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📭</div>
                  <p className="text-white/40 font-bold text-sm">No available deliveries</p>
                  <p className="text-white/20 text-xs mt-1">New orders appear here when food is ready</p>
                </motion.div>
              ) : available.map(d => (
                <DeliveryCard key={d._id} delivery={d} onAccept={handleAccept} onSkip={handleSkip}
                  onPickup={handlePickup} onTransit={handleTransit} onDeliver={handleDeliver} onFail={handleFail} onRefresh={refresh} actLoading={actLoading} />
              ))}
            </AnimatePresence>
          )}

          {/* ACTIVE */}
          {tab === 'active' && (
            <AnimatePresence mode="popLayout">
              {!myActive ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🏍️</div>
                  <p className="text-white/40 font-bold text-sm">No active delivery</p>
                  <p className="text-white/20 text-xs mt-1">Accept an order from the Available tab</p>
                  <button onClick={() => setTab('available')} className="mt-4 px-5 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all">
                    Browse Available
                  </button>
                </motion.div>
              ) : (
                <DeliveryCard key={myActive._id} delivery={myActive} onAccept={handleAccept} onSkip={handleSkip}
                  onPickup={handlePickup} onTransit={handleTransit} onDeliver={handleDeliver} onFail={handleFail} onRefresh={refresh} actLoading={actLoading} />
              )}
            </AnimatePresence>
          )}

          {/* HISTORY / DONE */}
          {tab === 'done' && (
            <AnimatePresence mode="popLayout">
              {completed.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">✅</div>
                  <p className="text-white/40 font-bold text-sm">No completed deliveries yet</p>
                </motion.div>
              ) : completed.map(d => {
                const o = d.order_id || {};
                return (
                  <motion.div key={d._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-[#111] border border-green-500/15 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-green-500/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">✅</div>
                      <div>
                        <p className="text-white font-bold text-sm">Order #{o.order_number || '—'}</p>
                        <p className="text-white/40 text-[10px] mt-0.5">{(d.delivery_address || '').slice(0, 40)}</p>
                        {d.delivered_at && <p className="text-white/25 text-[10px]">{new Date(d.delivered_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-black text-base">+${d.delivery_fee || 0}</p>
                      <p className="text-white/20 text-[10px]">Earned</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {/* SKIPPED */}
          {tab === 'skipped' && (
            <AnimatePresence mode="popLayout">
              {skipped.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">⏭️</div>
                  <p className="text-white/40 font-bold text-sm">No skipped orders</p>
                  <p className="text-white/20 text-xs mt-1">Orders you skip will appear here</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/15 rounded-2xl">
                    <AlertTriangle size={14} className="text-red-400" />
                    <p className="text-red-400 text-xs font-bold">{skipped.length} skipped order{skipped.length !== 1 ? 's' : ''} — managers have been notified</p>
                  </div>
                  {skipped.map(d => <SkippedCard key={d._id} delivery={d} />)}
                </>
              )}
            </AnimatePresence>
          )}

          {/* STATS */}
          {tab === 'stats' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Tier card */}
              <div className={`${tierInfo.bg} border border-white/10 rounded-3xl p-6 text-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at center, #f97316, transparent 70%)' }} />
                <p className="text-5xl mb-3 relative z-10">{tierInfo.icon}</p>
                <p className={`text-2xl font-black ${tierInfo.color} relative z-10`}>{tierInfo.label}</p>
                <p className="text-white/40 text-xs mt-1 relative z-10">Based on total earnings</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Truck}      label="Total Deliveries" value={stats.total_deliveries||0}                     color="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" />
                <StatCard icon={DollarSign} label="Total Earned"     value={`$${(stats.total_earnings||0).toFixed(2)}`}    color="text-green-400"  bg="bg-green-500/10"  border="border-green-500/20" />
                <StatCard icon={Activity}   label="Today's Trips"    value={stats.today_deliveries||0}                     color="text-blue-400"   bg="bg-blue-500/10"   border="border-blue-500/20" />
                <StatCard icon={SkipForward}label="Skipped Orders"   value={stats.total_skipped||0}                        color="text-red-400"    bg="bg-red-500/10"    border="border-red-500/20" />
              </div>

              {/* Delivery fee guide */}
              <div className="bg-[#111] border border-white/8 rounded-3xl p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2"><DollarSign size={12} /> Distance-Based Delivery Fees</p>
                <div className="space-y-2">
                  {[
                    ['0–2 km',  '$40',  'bg-blue-500/20 text-blue-400'],
                    ['2–5 km',  '$60',  'bg-green-500/20 text-green-400'],
                    ['5–10 km', '$80',  'bg-yellow-500/20 text-yellow-400'],
                    ['10–15 km','$100', 'bg-orange-500/20 text-orange-400'],
                    ['15+ km',  '$100 + $8/km', 'bg-red-500/20 text-red-400'],
                  ].map(([range, fee, cls]) => (
                    <div key={range} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation size={11} className="text-white/30" />
                        <span className="text-white/60 text-sm">{range}</span>
                      </div>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${cls}`}>{fee}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="bg-[#111] border border-white/8 rounded-3xl p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">How Delivery Works</p>
                <div className="space-y-3">
                  {[
                    { icon: '🍳', step: 'Chef starts cooking',    desc: 'Order shows in your Available tab' },
                    { icon: '✋', step: 'Accept the order',        desc: 'Reserved for you — hidden from others' },
                    { icon: '📡', step: 'Captain dispatches',      desc: 'You\'ll get a notification — pickup unlocked' },
                    { icon: '📦', step: 'Pick up from restaurant', desc: 'Head to restaurant and collect order' },
                    { icon: '🛵', step: 'Mark "On the Way"',       desc: 'Customer knows you\'re coming' },
                    { icon: '🏠', step: 'Mark Delivered',          desc: 'Earn your delivery fee!' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-base flex-shrink-0">{s.icon}</div>
                      <div>
                        <p className="text-white text-sm font-bold">{s.step}</p>
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