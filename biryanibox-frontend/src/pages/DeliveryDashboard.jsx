import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import {
  Truck, MapPin, CheckCircle, Package, Clock, Phone, Navigation,
  RefreshCw, AlertCircle, Loader, Star, ChevronRight, DollarSign,
  Activity, XCircle, User, Home, ArrowRight, LogOut, Wifi, WifiOff,
  TrendingUp, BarChart3, ChevronDown, Bell, MessageCircle, Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deliveryAPI } from '../services/api';
import { useAuth } from '../context/useContextHooks';

// ─── Auto-refresh ─────────────────────────────────────────────────────────────
const useAutoRefresh = (cb, ms = 10000) => {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
};

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = {
  dur: (mins) => {
    if (!mins) return '—';
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  },
  time: (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  date: (d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
  currency: (n) => `$${(n || 0).toLocaleString('en-US')}`,
};

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  pending:    { label: 'Waiting',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  assigned:   { label: 'Accepted',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  picked_up:  { label: 'Picked Up',  color: '#e8890c', bg: 'rgba(232,137,12,0.1)',  border: 'rgba(232,137,12,0.25)' },
  in_transit: { label: 'On the Way', color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  delivered:  { label: 'Delivered',  color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)'  },
  failed:     { label: 'Failed',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
};

const STEPS = ['assigned', 'picked_up', 'in_transit', 'delivered'];
const STEP_LABELS = ['Accepted', 'Picked Up', 'En Route', 'Delivered'];

const NEXT_ACTION = {
  assigned:   { status: 'picked_up',  label: 'Mark Picked Up',    icon: Package },
  picked_up:  { status: 'in_transit', label: 'Start Delivery',    icon: Truck   },
  in_transit: { status: 'delivered',  label: 'Confirm Delivery',  icon: CheckCircle },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════════
const StatCard = ({ label, value, sub, icon: Icon, color = '#e8890c' }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666' }}>{label}</span>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, fontFamily: 'inherit' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{sub}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// AVAILABLE ORDER CARD
// ═══════════════════════════════════════════════════════════════════════════════
const AvailableCard = ({ delivery, onAccept, onSkip, busy }) => {
  const [expanded, setExpanded] = useState(false);
  const order = delivery.order_id || {};
  const fee   = delivery.delivery_fee || 5;
  const since = delivery.order_placed_at ? Math.floor((Date.now() - new Date(delivery.order_placed_at)) / 60000) : 0;

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}
    >
      {/* Top accent */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #e8890c, #f59e0b)' }} />

      {/* Main row */}
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <Package size={14} color="#e8890c" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e8890c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {order.order_number || `BOX-${(delivery._id || '').slice(-5).toUpperCase()}`}
              </span>
              {since > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, color: since > 10 ? '#ef4444' : '#f59e0b', background: since > 10 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                  {since}m ago
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <MapPin size={13} color="#999" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#e0e0e0', lineHeight: 1.5, margin: 0 }}>{delivery.delivery_address}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', lineHeight: 1 }}>${fee}</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>YOUR EARN</div>
          </div>
        </div>

        {/* Quick info row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {delivery.customer_name && (
            <span style={{ fontSize: 11, color: '#888', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
              <User size={10} /> {delivery.customer_name}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#888', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
            <DollarSign size={10} /> Order: ${(order.total || 0).toFixed(0)}
          </span>
          {delivery.estimated_mins && (
            <span style={{ fontSize: 11, color: '#888', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={10} /> ~{delivery.estimated_mins}min
            </span>
          )}
        </div>

        {/* Notes */}
        {delivery.delivery_notes && (
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertCircle size={12} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#f59e0b', margin: 0, lineHeight: 1.5 }}>{delivery.delivery_notes}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
          <button
            onClick={() => onSkip(delivery._id)}
            disabled={busy}
            style={{ padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#666', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.color = '#ef4444'; e.target.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.target.style.color = '#666'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <XCircle size={14} /> Skip
          </button>
          <button
            onClick={() => onAccept(delivery._id)}
            disabled={busy}
            style={{ padding: '14px', borderRadius: 14, border: 'none', background: '#e8890c', color: '#000', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', boxShadow: '0 4px 20px rgba(232,137,12,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {busy ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Accepting…</> : <><CheckCircle size={16} /> Accept Order</>}
          </button>
        </div>
      </div>
    </MotionDiv>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVE DELIVERY CARD
// ═══════════════════════════════════════════════════════════════════════════════
const ActiveCard = ({ delivery, onUpdate, busy }) => {
  const order   = delivery.order_id || {};
  const stepIdx = STEPS.indexOf(delivery.status);
  const next    = NEXT_ACTION[delivery.status];
  const fee     = delivery.delivery_fee || 5;
  const cfg     = STATUS[delivery.status] || STATUS.assigned;

  const openMaps = () => {
    const q = encodeURIComponent(delivery.delivery_address || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${cfg.border}`, borderRadius: 24, overflow: 'hidden' }}
    >
      {/* Colored header */}
      <div style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}`, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Delivery</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.border}`, padding: '4px 12px', borderRadius: 20 }}>
          {cfg.label}
        </span>
      </div>

      <div style={{ padding: '22px 22px 0' }}>
        {/* Progress steps */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i <= stepIdx ? '#e8890c' : 'rgba(255,255,255,0.08)',
                    border: i === stepIdx ? '2px solid #e8890c' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: i === stepIdx ? '0 0 12px rgba(232,137,12,0.4)' : 'none',
                    transition: 'all 0.4s',
                  }}>
                    {i < stepIdx
                      ? <CheckCircle size={14} color="#fff" />
                      : i === stepIdx
                        ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                        : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                    }
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: i <= stepIdx ? '#e8890c' : '#444', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {STEP_LABELS[i]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < stepIdx ? '#e8890c' : 'rgba(255,255,255,0.08)', margin: '0 4px', marginBottom: 18, transition: 'all 0.4s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Order info */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#e8890c' }}>{order.order_number || '—'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
            <MapPin size={14} color="#e8890c" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: '#e0e0e0', margin: 0, lineHeight: 1.5 }}>{delivery.delivery_address}</p>
            </div>
          </div>
          {delivery.delivery_notes && (
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: '#f59e0b', margin: 0 }}>{delivery.delivery_notes}</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
              <User size={12} /> {delivery.customer_name || '—'}
            </div>
            {delivery.phone && (
              <a href={`tel:${delivery.phone}`}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#e8890c', textDecoration: 'none', background: 'rgba(232,137,12,0.1)', border: '1px solid rgba(232,137,12,0.2)', padding: '4px 10px', borderRadius: 20 }}>
                <Phone size={10} /> Call Customer
              </a>
            )}
          </div>
        </div>

        {/* Earnings strip */}
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#888' }}>Your earnings for this delivery</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>${fee}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '0 22px 22px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <button
          onClick={openMaps}
          style={{ padding: '14px', borderRadius: 14, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: '#60a5fa', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Navigation size={14} /> Maps
        </button>
        {next && (
          <button
            onClick={() => onUpdate(delivery._id, next.status)}
            disabled={busy}
            style={{ padding: '14px', borderRadius: 14, border: 'none', background: delivery.status === 'in_transit' ? '#10b981' : '#e8890c', color: delivery.status === 'in_transit' ? '#fff' : '#000', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: delivery.status === 'in_transit' ? '0 4px 20px rgba(16,185,129,0.3)' : '0 4px 20px rgba(232,137,12,0.25)' }}>
            {busy
              ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: delivery.status === 'in_transit' ? '#fff' : '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Updating…</>
              : <><next.icon size={16} /> {next.label}</>
            }
          </button>
        )}
        {delivery.status === 'delivered' && (
          <div style={{ gridColumn: '1/-1', padding: '14px', borderRadius: 14, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#10b981', fontWeight: 700, fontSize: 13 }}>
            <CheckCircle size={18} /> Delivery Complete! ${fee} Earned
          </div>
        )}
      </div>
    </MotionDiv>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORY ITEM
// ═══════════════════════════════════════════════════════════════════════════════
const HistoryItem = ({ delivery }) => {
  const order = delivery.order_id || {};
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CheckCircle size={18} color="#10b981" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e0e0' }}>{order.order_number || `BOX-${(delivery._id || '').slice(-5).toUpperCase()}`}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 20 }}>Delivered</span>
        </div>
        <p style={{ fontSize: 12, color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{delivery.delivery_address}</p>
        {delivery.delivered_at && (
          <p style={{ fontSize: 11, color: '#555', margin: '2px 0 0' }}>{fmt.date(delivery.delivered_at)} · {fmt.time(delivery.delivered_at)}</p>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>+${delivery.delivery_fee || 5}</div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>${(order.total || 0).toFixed(0)} order</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const DeliveryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [tab,      setTab]     = useState('queue');  // queue | active | history
  const [queue,    setQueue]   = useState([]);
  const [active,   setActive]  = useState(null);
  const [history,  setHistory] = useState([]);
  const [stats,    setStats]   = useState({});
  const [loading,  setLoading] = useState(true);
  const [busy,     setBusy]    = useState(false);
  const [toast,    setToast]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      const [qRes, aRes, sRes] = await Promise.all([
        deliveryAPI.getAvailable(),
        deliveryAPI.getMyActive(),
        deliveryAPI.getStats(),
      ]);
      setQueue(qRes.data  || []);
      setActive(aRes.data || null);
      setStats(sRes.data  || {});
    } catch (err) {
      showToast(err.message || 'Connection error', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await deliveryAPI.getCompleted();
      setHistory(res.data || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);
  useAutoRefresh(load, 10000);

  const handleAccept = async (id) => {
    setBusy(true);
    try {
      await deliveryAPI.accept(id);
      showToast('Order accepted! Head to the restaurant. 🛵');
      await load();
      setTab('active');
    } catch (err) {
      showToast(err.message || 'Could not accept this order.', 'error');
    } finally { setBusy(false); }
  };

  const handleSkip = async (id) => {
    try {
      await deliveryAPI.reject(id);
      setQueue(prev => prev.filter(d => d._id !== id));
    } catch {}
  };

  const handleUpdate = async (id, status) => {
    setBusy(true);
    try {
      await deliveryAPI.updateStatus(id, status);
      const msgs = {
        picked_up:  '📦 Picked up! Head to the customer.',
        in_transit: '🛵 En route to customer!',
        delivered:  '✅ Delivered! Great job.',
      };
      showToast(msgs[status] || 'Status updated');
      await load();
      if (status === 'delivered') { await loadHistory(); setTab('history'); }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally { setBusy(false); }
  };

  const handleRefresh = () => { setRefreshing(true); load(); };

  // Styles
  const tabStyle = (id) => ({
    flex: 1, padding: '11px 8px',
    borderRadius: 12, border: 'none',
    background: tab === id ? '#e8890c' : 'transparent',
    color: tab === id ? '#000' : '#666',
    fontSize: 11, fontWeight: 800,
    cursor: 'pointer', textTransform: 'uppercase',
    letterSpacing: '0.06em', transition: 'all 0.15s',
    boxShadow: tab === id ? '0 4px 12px rgba(232,137,12,0.3)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'fixed', top: -200, left: -200, width: 600, height: 600, background: 'radial-gradient(circle, rgba(232,137,12,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -200, right: -200, width: 500, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* CSS keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: toast.type === 'error' ? '#1a0a0a' : '#0a1a10', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`, borderRadius: 14, padding: '12px 20px', fontSize: 13, fontWeight: 600, color: toast.type === 'error' ? '#ef4444' : '#10b981', maxWidth: 360, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}
          >
            {toast.msg}
          </MotionDiv>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>

        {/* ── HEADER ── */}
        <div style={{ position: 'sticky', top: 0, background: '#0a0a0a', padding: '20px 0 16px', zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(232,137,12,0.12)', border: '1px solid rgba(232,137,12,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={20} color="#e8890c" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{user?.name || 'Rider'}</div>
                <div style={{ fontSize: 11, color: '#e8890c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                  Rider · Active
                </div>
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleRefresh}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}
              >
                <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} color={refreshing ? '#e8890c' : '#666'} />
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <LogOut size={14} color="#666" />
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '20px 0 0' }}>
          <StatCard label="Today's Deliveries" value={stats.today_deliveries || 0}     icon={Truck}       color="#e8890c" sub="completed today" />
          <StatCard label="Today's Earnings"    value={fmt.currency(stats.today_earnings)} icon={DollarSign} color="#10b981" sub="earned today" />
          <StatCard label="Total Deliveries"    value={stats.total_deliveries || 0}    icon={Activity}    color="#3b82f6" sub="all time" />
          <StatCard label="Total Earned"        value={fmt.currency(stats.total_earnings)} icon={TrendingUp}  color="#a855f7" sub="all time" />
        </div>

        {/* Active delivery alert banner */}
        {active && tab !== 'active' && (
          <button
            onClick={() => setTab('active')}
            style={{ width: '100%', marginTop: 16, background: 'rgba(232,137,12,0.08)', border: '1px solid rgba(232,137,12,0.3)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8890c', boxShadow: '0 0 8px #e8890c', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e8890c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Delivery</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{STATUS[active.status]?.label || active.status} · Tap to view</div>
            </div>
            <ChevronRight size={16} color="#e8890c" />
          </button>
        )}

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 6, margin: '16px 0' }}>
          <button style={tabStyle('queue')}   onClick={() => setTab('queue')}>
            Queue {queue.length > 0 && `(${queue.length})`}
          </button>
          <button style={tabStyle('active')}  onClick={() => setTab('active')}>
            {active ? '● Active' : 'Active'}
          </button>
          <button style={tabStyle('history')} onClick={() => setTab('history')}>
            History
          </button>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(232,137,12,0.2)', borderTopColor: '#e8890c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 12, color: '#555' }}>Loading deliveries…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* QUEUE */}
            {tab === 'queue' && (
              <MotionDiv key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {queue.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center' }}>
                    <Truck size={48} color="rgba(255,255,255,0.08)" />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No orders available</p>
                      <p style={{ fontSize: 12, color: '#444', marginTop: 6 }}>New delivery requests will appear here automatically</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#e8890c', background: 'rgba(232,137,12,0.08)', border: '1px solid rgba(232,137,12,0.2)', padding: '8px 16px', borderRadius: 20 }}>
                      <RefreshCw size={11} /> Auto-refreshing every 10s
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{queue.length} order{queue.length !== 1 ? 's' : ''} available</span>
                      <span style={{ fontSize: 10, color: '#444' }}>Most urgent first</span>
                    </div>
                    <AnimatePresence>
                      {queue.map(d => (
                        <AvailableCard key={d._id} delivery={d} onAccept={handleAccept} onSkip={handleSkip} busy={busy} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </MotionDiv>
            )}

            {/* ACTIVE */}
            {tab === 'active' && (
              <MotionDiv key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {active ? (
                  <ActiveCard delivery={active} onUpdate={handleUpdate} busy={busy} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center' }}>
                    <Shield size={48} color="rgba(255,255,255,0.08)" />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No active delivery</p>
                      <p style={{ fontSize: 12, color: '#444', marginTop: 6 }}>Accept an order from the Queue tab to get started</p>
                    </div>
                    <button
                      onClick={() => setTab('queue')}
                      style={{ background: '#e8890c', border: 'none', color: '#000', padding: '12px 28px', borderRadius: 40, fontSize: 12, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 4px 16px rgba(232,137,12,0.3)' }}>
                      View Available Orders
                    </button>
                  </div>
                )}
              </MotionDiv>
            )}

            {/* HISTORY */}
            {tab === 'history' && (
              <MotionDiv key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {history.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center' }}>
                    <CheckCircle size={48} color="rgba(255,255,255,0.08)" />
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No deliveries yet</p>
                    <p style={{ fontSize: 12, color: '#444' }}>Completed deliveries will appear here</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{history.length} completed</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>${history.reduce((s, d) => s + (d.delivery_fee || 5), 0)} total earned</span>
                    </div>
                    {history.map(d => <HistoryItem key={d._id} delivery={d} />)}
                  </div>
                )}
              </MotionDiv>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* Bottom safe area */}
      <div style={{ height: 24 }} />
    </div>
  );
};

export default DeliveryDashboard;