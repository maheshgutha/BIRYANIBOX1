import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import {
  Truck, MapPin, CheckCircle, Package, Clock, Phone, RefreshCw,
  AlertCircle, Loader, Star, DollarSign, Activity, XCircle,
  Home, LogOut, TrendingUp, Bell, ChefHat, Navigation, User,
  Lock, Eye, EyeOff, Save, ToggleLeft, ToggleRight, History,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deliveryAPI, shiftsAPI_ext, usersAPI } from '../services/api';
import { useAuth } from '../context/useContextHooks';

const useAutoRefresh = (cb, ms = 12000) => {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
};

const fmt = {
  time:     (d) => new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  currency: (n) => `$${(n || 0).toFixed(2)}`,
};

const STATUS = {
  pending:    { label: 'Waiting for pickup',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  assigned:   { label: 'Accepted',            color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  picked_up:  { label: 'Picked Up',           color: '#e8890c', bg: 'rgba(232,137,12,0.12)'  },
  in_transit: { label: 'On the Way',          color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  delivered:  { label: 'Delivered',           color: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
  failed:     { label: 'Failed',              color: '#ef4444', bg: 'rgba(239,68,68,0.1)'    },
};

const STEPS   = ['assigned', 'picked_up', 'in_transit', 'delivered'];
const SLABELS = ['Accepted', 'Picked Up', 'En Route', 'Delivered'];

const NEXT = {
  assigned:   { status: 'picked_up',  label: 'Mark Picked Up',   icon: Package    },
  picked_up:  { status: 'in_transit', label: 'Start Delivery',   icon: Truck      },
  in_transit: { status: 'delivered',  label: 'Mark Delivered',   icon: CheckCircle },
};

// ── Components ───────────────────────────────────────────────────────────────
const Stat = ({ label, value, icon: Icon, color = '#e8890c' }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666' }}>{label}</span>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={13} color={color} />
      </div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
  </div>
);

// Available order card — shown when cooking is complete
const AvailableCard = ({ delivery, onAccept, onSkip, busy }) => {
  const order = delivery.order_id || {};
  const fee   = delivery.delivery_fee || 40;
  // Gate: rider can only ACCEPT once cooking is complete
  const cookingDone = order.status === 'completed_cooking' || order.status === 'served' || order.status === 'paid';
  const canAccept   = cookingDone && !busy;

  return (
    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${cookingDone ? 'rgba(16,185,129,0.4)' : 'rgba(232,137,12,0.25)'}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#e8890c' }}>
            #{order.order_number || delivery._id?.slice(-6).toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{fmt.time(delivery.order_placed_at || delivery.created_at)}</div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {delivery.order_type === 'delivery' ? '🛵 Home Delivery' : '📦 Pickup'}
          </div>
        </div>
        {/* Cooking status badge */}
        <div style={{
          background: cookingDone ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)',
          border: `1px solid ${cookingDone ? 'rgba(16,185,129,0.4)' : 'rgba(234,179,8,0.4)'}`,
          borderRadius: 20, padding: '5px 11px', fontSize: 10, fontWeight: 700,
          color: cookingDone ? '#10b981' : '#eab308', letterSpacing: '0.05em',
        }}>
          {cookingDone ? '✅ READY FOR PICKUP' : '🍳 COOKING...'}
        </div>
      </div>

      {(delivery.delivery_address || order.delivery_address) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10 }}>
          <MapPin size={13} color="#888" style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>
            {delivery.delivery_address || order.delivery_address}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: '#888' }}>
          Total: <strong style={{ color: '#fff' }}>{fmt.currency(order.total || 0)}</strong>
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#e8890c' }}>
          Delivery Fee: {fmt.currency(fee)}
        </span>
      </div>

      {!cookingDone && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(234,179,8,0.08)', borderRadius: 10, border: '1px solid rgba(234,179,8,0.2)' }}>
          <p style={{ fontSize: 11, color: '#eab308', margin: 0, fontWeight: 600 }}>
            ⏳ Waiting for kitchen to finish cooking. You can accept once it's ready.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSkip(delivery._id)} disabled={busy}
          style={{ flex: 1, padding: '10px 0', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
          Skip
        </button>
        <button
          onClick={() => canAccept && onAccept(delivery._id)}
          disabled={!canAccept}
          title={!cookingDone ? 'Wait for cooking to complete' : ''}
          style={{
            flex: 2, padding: '10px 0', borderRadius: 12, fontWeight: 800, fontSize: 12, letterSpacing: '0.05em',
            cursor: canAccept ? 'pointer' : 'not-allowed',
            background: canAccept ? '#e8890c' : 'rgba(255,255,255,0.08)',
            border: 'none',
            color: canAccept ? '#fff' : '#555',
          }}>
          {busy ? '⏳ Processing...' : cookingDone ? 'Accept Order →' : '⏳ Wait for Kitchen'}
        </button>
      </div>
    </MotionDiv>
  );
};

// Active delivery tracker
const ActiveDelivery = ({ delivery, onUpdate, busy }) => {
  const order  = delivery.order_id || {};
  const status = delivery.status;
  const sc     = STATUS[status] || STATUS.assigned;
  const next   = NEXT[status];
  const step   = STEPS.indexOf(status);

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${sc.color}40`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: sc.color }}>#{order.order_number}</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Active delivery</div>
        </div>
        <div style={{ background: sc.bg, border: `1px solid ${sc.color}40`, borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: sc.color }}>
          {sc.label}
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 18 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= step ? '#e8890c' : 'rgba(255,255,255,0.06)', border: `2px solid ${i <= step ? '#e8890c' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                {i < step ? <CheckCircle size={14} color="#fff" /> : <span style={{ fontSize: 9, fontWeight: 800, color: i === step ? '#fff' : '#444' }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 8, color: i <= step ? '#e8890c' : '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>{SLABELS[i]}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#e8890c' : 'rgba(255,255,255,0.08)', marginBottom: 18 }} />}
          </React.Fragment>
        ))}
      </div>

      {order.delivery_address && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <MapPin size={13} color="#888" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>{order.delivery_address}</span>
        </div>
      )}

      {/* Google Maps navigation button */}
      {order.delivery_address && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', marginBottom: 12, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 12, color: '#3b82f6', fontWeight: 800, fontSize: 12, textDecoration: 'none', cursor: 'pointer' }}>
          📍 Navigate with Google Maps
        </a>
      )}

      {next && (
        <button onClick={() => onUpdate(delivery._id, next.status)} disabled={busy}
          style={{ width: '100%', padding: '14px 0', background: '#e8890c', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <next.icon size={16} />
          {busy ? 'Updating…' : next.label}
        </button>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
const DeliveryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab,       setTab]       = useState('available'); // 'available' | 'active' | 'history' | 'profile'
  const [history,   setHistory]   = useState([]);
  const [histLoading,setHistLoading] = useState(false);
  const [available, setAvailable] = useState([]);
  const [active,    setActive]    = useState(null);
  const [allActive,  setAllActive]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [busy,      setBusy]      = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passForm,    setPassForm]    = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPass,    setShowPass]    = useState(false);
  const [profileMsg,  setProfileMsg]  = useState('');
  const [profBusy,    setProfBusy]    = useState(false);

  // Check-in status on mount — check both user object and server
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
      // First set from user object, then verify with server
      const localState = user.is_checked_in || false;
      setIsCheckedIn(localState);
      // Always verify actual status from server
      shiftsAPI_ext?.checkinStatus?.()
        .then(r => {
          const serverState = r.data?.is_checked_in ?? r.data?.active ?? false;
          setIsCheckedIn(serverState);
        })
        .catch(() => {
          // If API fails, keep local state and try active shift check
          shiftsAPI_ext?.checkin?.()
            .then(() => setIsCheckedIn(true))
            .catch(e => {
              const msg = (e.message || '').toLowerCase();
              if (msg.includes('already') || msg.includes('active')) setIsCheckedIn(true);
            });
        });
    }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!isCheckedIn) return;
    try {
      const [avRes, actRes, stRes] = await Promise.allSettled([
        deliveryAPI.getAll('?status=pending'),  // ALL pending deliveries shown to all riders
        deliveryAPI.getMyActive(),
        deliveryAPI.getAll('?status=assigned,picked_up,in_transit').catch(() => ({ data: [] })),
        deliveryAPI.getStats(),
      ]);
      if (avRes.status === 'fulfilled')  setAvailable(avRes.value.data  || []);
      if (actRes.status === 'fulfilled') setActive(actRes.value.data    || null);
      // Also set all-active list for multi-order display
      try {
        const allActD = await deliveryAPI.getAll('?status=pending').catch(()=>({data:[]}));
        // Filter to only this rider's assigned/in-progress orders
        const myActive = (allActD.data||[]).filter(d => d.driver_id && (d.driver_id._id || d.driver_id) === user?._id?.toString());
        setAllActive(myActive.length ? myActive : (actRes.value.data ? [actRes.value.data] : []));
      } catch {}
      if (stRes.status === 'fulfilled')  setStats(stRes.value.data      || null);
    } finally { setLoading(false); }
  }, [isCheckedIn]);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const r = await deliveryAPI.getCompleted();
      setHistory(r.data || []);
    } catch { setHistory([]); }
    finally { setHistLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  useEffect(() => { if (isCheckedIn) { setLoading(true); loadData(); } else { setLoading(false); } }, [isCheckedIn]);
  useAutoRefresh(loadData, 12000);

  const handleCheckin = async () => {
    setCheckinBusy(true);
    try {
      await shiftsAPI_ext.checkin();
      setIsCheckedIn(true);
    } catch (err) {
      // If already checked in on server, just update local state — no alert needed
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already checked in') || msg.includes('already') || msg.includes('active shift')) {
        setIsCheckedIn(true);
      } else {
        alert(err.message || 'Check-in failed. Please try again.');
      }
    } finally { setCheckinBusy(false); }
  };

  const handleCheckout = async () => {
    setCheckinBusy(true);
    try {
      await shiftsAPI_ext.checkout();
      setIsCheckedIn(false);
      setAvailable([]); setActive(null);
    } catch (err) { alert(err.message); }
    finally { setCheckinBusy(false); }
  };

  const handleAccept = async (id) => {
    setBusy(true);
    try {
      await deliveryAPI.accept(id);
      await loadData();   // Reload — this delivery now disappears from available list
      setTab('active');   // Switch to My Delivery tab automatically
    } catch (err) { alert(err.message || 'Could not accept delivery. It may have already been taken.'); }
    finally { setBusy(false); }
  };

  const handleSkip = async (id) => {
    try { await deliveryAPI.skip(id); await loadData(); } catch {}
  };

  const handleUpdate = async (id, status) => {
    setBusy(true);
    try {
      await deliveryAPI.updateStatus(id, status);
      await loadData();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setProfBusy(true); setProfileMsg('');
    try {
      await usersAPI.update(user.id, { name: profileForm.name, phone: profileForm.phone });
      setProfileMsg('Profile updated!');
    } catch { setProfileMsg('Update failed'); }
    finally { setProfBusy(false); }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm) { setProfileMsg('Passwords do not match'); return; }
    setProfBusy(true); setProfileMsg('');
    try {
      await usersAPI.changePassword(user.id, { current_password: passForm.current_password, new_password: passForm.new_password });
      setProfileMsg('Password updated!');
      setPassForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { setProfileMsg(err.message || 'Failed'); }
    finally { setProfBusy(false); }
  };

  const S = { background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'inherit', padding: '0 0 32px' };
  const primary = '#e8890c';

  return (
    <div style={S}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: primary, letterSpacing: '-0.01em' }}>BIRYANIBOX</div>
          <div style={{ fontSize: 10, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rider Portal</div>
          {user?.id && (
            <div style={{ fontSize: 9, color: primary, fontWeight: 700, letterSpacing: '0.1em', marginTop: 2 }}>
              RIDER ID: RDR-{(user.id || '').slice(-6).toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Check-in / Checkout toggle */}
          <button onClick={isCheckedIn ? handleCheckout : handleCheckin} disabled={checkinBusy}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: `1px solid ${isCheckedIn ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`, background: isCheckedIn ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', color: isCheckedIn ? '#10b981' : '#888', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {isCheckedIn ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {checkinBusy ? '...' : isCheckedIn ? 'Checked In' : 'Check In'}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {/* CHECK-IN GATE */}
      {!isCheckedIn && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(232,137,12,0.12)', border: '2px solid rgba(232,137,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Lock size={32} color={primary} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Check In to Start</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 28, maxWidth: 280, lineHeight: 1.6 }}>You must check in before you can see and accept delivery orders.</p>
          <button onClick={handleCheckin} disabled={checkinBusy}
            style={{ padding: '16px 40px', background: primary, border: 'none', borderRadius: 50, color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', letterSpacing: '0.05em' }}>
            {checkinBusy ? 'Checking In…' : 'Check In Now'}
          </button>
        </div>
      )}

      {/* DASHBOARD (only when checked in) */}
      {isCheckedIn && (
        <div style={{ padding: '20px 16px 0' }}>

          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
              <Stat label="Today"    value={stats.today_deliveries}                    icon={Truck}     />
              <Stat label="Total"    value={stats.total_deliveries}                    icon={CheckCircle} color="#10b981" />
              <Stat label="Today $" value={fmt.currency(stats.today_earnings)}        icon={DollarSign} />
              <Stat label="Total $"  value={fmt.currency(stats.total_earnings)}        icon={TrendingUp}  color="#3b82f6" />
            </div>
          )}

          {/* Active order alert */}
          {active && tab !== 'active' && (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setTab('active')}
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="#3b82f6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>Active delivery in progress</span>
              </div>
              <span style={{ fontSize: 10, color: '#3b82f6' }}>View →</span>
            </MotionDiv>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {[['available', Package, 'Available'], ['active', Truck, 'My Delivery'], ['history', CheckCircle, 'History'], ['profile', User, 'Profile']].map(([t, Icon, label]) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 12, border: `1px solid ${tab === t ? primary : 'rgba(255,255,255,0.08)'}`, background: tab === t ? `${primary}18` : 'rgba(255,255,255,0.03)', color: tab === t ? primary : '#666', fontWeight: 700, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <Icon size={13} />{label}
                {t === 'available' && available.length > 0 && (
                  <span style={{ background: primary, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{available.length}</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader size={28} color={primary} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* AVAILABLE ORDERS — only cooking-complete orders */}
              {tab === 'available' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>
                      Available Orders ({available.length})
                    </h3>
                    <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {available.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <ChefHat size={36} color="#333" style={{ margin: '0 auto 16px' }} />
                      <p style={{ color: '#555', fontWeight: 700, fontSize: 13 }}>No orders ready for pickup</p>
                      <p style={{ color: '#444', fontSize: 11, marginTop: 6 }}>Orders will appear here once cooking is complete</p>
                    </div>
                  ) : (
                    available.map(d => (
                      <AvailableCard key={d._id} delivery={d} onAccept={handleAccept} onSkip={handleSkip} busy={busy} />
                    ))
                  )}
                </div>
              )}

              {/* ACTIVE DELIVERIES — show all active */}
              {tab === 'active' && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: 14 }}>My Active Deliveries</h3>
                  {!active ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <Truck size={36} color="#333" style={{ margin: '0 auto 16px' }} />
                      <p style={{ color: '#555', fontWeight: 700, fontSize: 13 }}>No active delivery</p>
                      <p style={{ color: '#444', fontSize: 11, marginTop: 6 }}>Accept an order from Available tab</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Show primary active delivery */}
                      <ActiveDelivery delivery={active} onUpdate={handleUpdate} busy={busy} />
                      {/* Show any additional active deliveries */}
                      {allActive.filter(d => d._id !== active._id && ['assigned','picked_up','in_transit'].includes(d.status)).map(d => (
                        <ActiveDelivery key={d._id} delivery={d} onUpdate={handleUpdate} busy={busy} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* HISTORY */}
              {tab === 'history' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888' }}>
                      Delivery History
                    </h3>
                    <button onClick={loadHistory} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RefreshCw size={11} /> Refresh
                    </button>
                  </div>
                  {histLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                      <Loader size={24} color={primary} />
                    </div>
                  ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <CheckCircle size={36} color="#333" style={{ margin: '0 auto 12px' }} />
                      <p style={{ color: '#555', fontWeight: 700, fontSize: 13 }}>No deliveries completed yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Summary */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 6 }}>Total Delivered</p>
                          <p style={{ fontSize: 22, fontWeight: 900, color: primary }}>{history.length}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 6 }}>Total Earned</p>
                          <p style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>₹{history.reduce((s, d) => s + (d.delivery_fee || 0), 0).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      {/* History cards */}
                      {history.map(d => {
                        const order = d.order_id || {};
                        return (
                          <div key={d._id} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>#{order.order_number || 'N/A'}</p>
                                <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                                  {d.delivered_at ? new Date(d.delivered_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 14, fontWeight: 900, color: primary }}>+₹{d.delivery_fee || 0}</p>
                                <p style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Delivery fee</p>
                              </div>
                            </div>
                            {d.delivery_address && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                                <MapPin size={11} color="#888" style={{ marginTop: 2, flexShrink: 0 }} />
                                <span style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{d.delivery_address}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PROFILE */}
              {tab === 'profile' && (
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: 14 }}>Update Profile</h3>
                  {profileMsg && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: profileMsg.includes('!') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${profileMsg.includes('!') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: profileMsg.includes('!') ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700 }}>
                      {profileMsg}
                    </div>
                  )}
                  <form onSubmit={handleSaveProfile} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 14, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Info</p>
                    {[['Name', 'name', 'text', 'Your name'], ['Phone', 'phone', 'tel', '+91 98765 43210']].map(([label, field, type, ph]) => (
                      <div key={field} style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', display: 'block', marginBottom: 6 }}>{label}</label>
                        <input type={type} value={profileForm[field]} onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))} placeholder={ph}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <button type="submit" disabled={profBusy}
                      style={{ width: '100%', padding: '12px', background: primary, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                      {profBusy ? 'Saving…' : 'Save Profile'}
                    </button>
                  </form>

                  <form onSubmit={handleChangePass} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 14, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Password</p>
                    {[['Current Password', 'current_password'], ['New Password', 'new_password'], ['Confirm New Password', 'confirm']].map(([label, field]) => (
                      <div key={field} style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555', display: 'block', marginBottom: 6 }}>{label}</label>
                        <input type={showPass ? 'text' : 'password'} value={passForm[field]} onChange={e => setPassForm(p => ({ ...p, [field]: e.target.value }))}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} />
                      <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Show passwords</span>
                    </label>
                    <button type="submit" disabled={profBusy}
                      style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#aaa', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                      {profBusy ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;