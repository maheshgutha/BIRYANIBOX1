import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationsAPI } from '../services/api';
import { useAuth } from '../context/useContextHooks';
import {
  Calendar, User, Clock, Users, CheckCircle, AlertCircle,
  Phone, Mail, Loader, Plus, X, RefreshCw, Utensils,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MotionDiv = motion.div;

const STATUS_STYLES = {
  pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-white/10 text-text-muted border-white/20',
};

// ─── Time Slots: every 30 minutes from 11:30 AM to 9:00 PM ──────────────────
const generateTimeSlots = () => {
  const slots = [];
  // Operating hours: 11:30 AM – 10:00 PM, step = 30 min
  const ranges = [
    { startH: 11, startM: 30, endH: 22, endM: 0 },
  ];
  for (const rng of ranges) {
    let h = rng.startH, m = rng.startM;
    while (h < rng.endH || (h === rng.endH && m <= rng.endM)) {
      const ampm = h < 12 ? 'AM' : 'PM';
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
      slots.push(label);
      m += 30;
      if (m >= 60) { m = 0; h++; }
    }
  }
  return slots;
};
const ALL_TIME_SLOTS = generateTimeSlots();

const ScrollTimePicker = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const listRef = React.useRef(null);

  const filtered = search
    ? ALL_TIME_SLOTS.filter(t => t.toLowerCase().includes(search.toLowerCase()))
    : ALL_TIME_SLOTS;

  // Scroll to selected on open
  React.useEffect(() => {
    if (open && listRef.current && value) {
      const idx = filtered.indexOf(value);
      if (idx !== -1) {
        listRef.current.scrollTop = Math.max(0, idx * 40 - 80);
      }
    }
  }, [open, value]);

  return (
    <div className="relative">
      <Clock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 z-10 pointer-events-none" />
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-left focus:outline-none focus:border-primary/50 transition-all text-white">
        {value || <span className="text-white/30">Select time</span>}
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-2 w-full bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <input
              autoFocus
              type="text"
              placeholder="e.g. 3:45"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '280px' }}>
            {filtered.length === 0 && (
              <p className="text-center text-white/30 py-6 text-sm">No matching time</p>
            )}
            {filtered.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-6 py-2.5 text-sm font-bold transition-colors
                  ${value === t
                    ? 'bg-primary/20 text-primary'
                    : 'text-white hover:bg-white/5'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Flash = ({ msg }) => msg.text ? (
  <MotionDiv initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className={`px-5 py-3 rounded-xl text-sm font-bold border ${msg.type === 'error'
      ? 'bg-red-500/10 border-red-500/30 text-red-400'
      : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
    {msg.text}
  </MotionDiv>
) : null;

const Reservations = () => {
  const { user } = useAuth();
  const [myReservations, setMyReservations] = useState([]);
  const [loadingList,    setLoadingList]    = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [msg,            setMsg]            = useState({ text: '', type: '' });
  const [activeView,     setActiveView]     = useState('new');

  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    email:         user?.email || '',
    phone:         user?.phone || '',
    guests: 2, date: '', time: '', notes: '',
  });

  // Pre-fill form with logged-in user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.name  || prev.customer_name,
        email:         user.email || prev.email,
        phone:         user.phone || prev.phone,
      }));
    }
  }, [user]);

  const setField = (f) => (e) => setFormData(prev => ({ ...prev, [f]: e.target.value }));
  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // Load reservations — STRICT: only show this logged-in user's reservations
  const loadMyReservations = useCallback(async () => {
    // Only load if user is logged in — never show other customers' reservations
    if (!user?.email) { setMyReservations([]); return; }
    const myEmail = user.email.toLowerCase().trim();
    setLoadingList(true);
    try {
      const res = await reservationsAPI.getAll(`?email=${encodeURIComponent(myEmail)}`);
      // Hard client-side filter — ONLY exact email match against logged-in user
      // This is the safety net in case backend returns extra records
      const list = (res.data || []).filter(r =>
        r.email?.toLowerCase().trim() === myEmail
      );
      // Sort: most recent date first
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMyReservations(list);
    } catch {
      setMyReservations([]);
    } finally { setLoadingList(false); }
  }, [user?.email]);

  useEffect(() => {
    if (activeView === 'my') loadMyReservations();
  }, [activeView, loadMyReservations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) { flash('Name is required', 'error'); return; }
    if (!formData.email.trim())         { flash('Email is required', 'error'); return; }
    if (!formData.phone.trim())         { flash('Mobile number is required', 'error'); return; }
    if (!formData.date)                 { flash('Date is required', 'error'); return; }
    if (!formData.time)                 { flash('Time is required', 'error'); return; }

    setSubmitting(true);
    try {
      await reservationsAPI.create(formData);
      flash('Reservation submitted! We will confirm shortly.');
      setShowForm(false);
      setFormData(prev => ({ ...prev, date: '', time: '', notes: '', guests: 2 }));
      setActiveView('my');
      setTimeout(loadMyReservations, 500);
    } catch (err) {
      flash(err.message || 'Failed to submit reservation', 'error');
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await reservationsAPI.update(id, { status: 'cancelled' });
      flash('Reservation cancelled.');
      loadMyReservations();
    } catch { flash('Could not cancel', 'error'); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-bg-main text-white">
      <Navbar/>
      <div className="pt-32 pb-20 container max-w-4xl mx-auto px-6">

        {/* Header */}
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 mt-32">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-3 block">Reserve a Table</span>
          <h1 className="text-5xl md:text-6xl font-black font-heading mb-4">
            Book Your <span className="text-primary">Experience.</span>
          </h1>
          <p className="text-text-muted max-w-lg">
            Reserve your perfect table at Biryani Box. We'll confirm within 30 minutes.
          </p>
        </MotionDiv>

        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10 w-fit ">
          {[['new', Plus, 'New Reservation'], ['my', Utensils, 'My Reservations']].map(([v, Icon, label]) => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {msg.text && (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-5">
              <Flash msg={msg} />
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* NEW RESERVATION FORM */}
        {activeView === 'new' && (
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/40 border border-white/10 rounded-3xl p-8">
            <h2 className="text-xl font-black mb-6">Reservation Details</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={formData.customer_name} onChange={setField('customer_name')}
                      placeholder="Your name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Email *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="email" value={formData.email} onChange={setField('email')}
                      placeholder="you@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Mobile Number *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="tel" required value={formData.phone} onChange={setField('phone')}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Guests *</label>
                  <div className="relative">
                    <Users size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <select value={formData.guests} onChange={setField('guests')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all">
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="bg-secondary">{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Date *</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="date" value={formData.date} onChange={setField('date')} min={today}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Time *</label>
                  <ScrollTimePicker
                    value={formData.time}
                    onChange={v => setFormData(prev => ({ ...prev, time: v }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Special Requests</label>
                <textarea value={formData.notes} onChange={setField('notes')} rows={3}
                  placeholder="Any dietary preferences, special occasions, seating preference…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {submitting ? 'Submitting…' : 'Submit Reservation'}
              </button>
            </form>
          </MotionDiv>
        )}

        {/* MY RESERVATIONS — strictly for the logged-in user's email only */}
        {activeView === 'my' && (
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {!user ? (
              <div className="bg-secondary/40 border border-white/10 rounded-3xl p-10 text-center">
                <AlertCircle size={40} className="text-white/20 mx-auto mb-4" />
                <p className="text-white/40 font-bold">Please sign in to view your reservations.</p>
                <button onClick={() => window.location.href = '/auth'}
                  className="mt-4 px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full">
                  Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-black">{user.name}'s Reservations</h2>
                    <p className="text-[10px] text-white/30 mt-0.5">Showing reservations for {user.email}</p>
                  </div>
                  <button onClick={loadMyReservations} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>

                {loadingList ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader size={32} className="animate-spin text-primary" />
                  </div>
                ) : myReservations.length === 0 ? (
                  <div className="bg-secondary/40 border border-white/10 rounded-3xl p-10 text-center">
                    <Calendar size={40} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 font-bold">No reservations found for {user.email}</p>
                    <button onClick={() => setActiveView('new')}
                      className="mt-5 px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full">
                      Make a Reservation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myReservations.map(r => (
                      <MotionDiv key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-secondary/40 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <p className="font-black text-lg mb-1">{r.customer_name}</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50">
                              <span className="flex items-center gap-1.5"><Calendar size={13} />
                                {r.date ? new Date(r.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : r.date}
                              </span>
                              <span className="flex items-center gap-1.5"><Clock size={13} /> {r.time}</span>
                              <span className="flex items-center gap-1.5"><Users size={13} /> {r.guests} guests</span>
                            </div>
                            {r.notes && <p className="text-xs text-white/30 mt-2 italic">"{r.notes}"</p>}
                            {r.table_assigned && <p className="text-[10px] text-primary font-black mt-1">🪑 Table: {r.table_assigned}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}>
                              {r.status}
                            </span>
                            {r.status === 'pending' && (
                              <button onClick={() => handleCancel(r._id)}
                                className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </MotionDiv>
                    ))}
                  </div>
                )}
              </>
            )}
          </MotionDiv>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Reservations;