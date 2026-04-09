import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationsAPI } from '../services/api';
import {
  Calendar, User, Clock, Users, CheckCircle, AlertCircle,
  Phone, Mail, MapPin, Loader, Plus, X, Star, ChefHat,
  RefreshCw, Utensils, ClipboardList, Edit3,
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

const TIMES = [
  '11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM',
  '2:00 PM','2:30 PM','3:00 PM','7:00 PM','7:30 PM','8:00 PM',
  '8:30 PM','9:00 PM','9:30 PM',
];

const Flash = ({ msg }) => msg.text ? (
  <MotionDiv initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className={`px-5 py-3 rounded-xl text-sm font-bold border ${msg.type === 'error'
      ? 'bg-red-500/10 border-red-500/30 text-red-400'
      : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
    {msg.text}
  </MotionDiv>
) : null;

const Reservations = () => {
  const [myReservations, setMyReservations] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [activeView, setActiveView] = useState('new'); // 'new' | 'my'

  const [formData, setFormData] = useState({
    customer_name: '', email: '', phone: '', guests: 2,
    date: '', time: '', notes: '',
  });

  const setField = (f) => (e) => setFormData(prev => ({ ...prev, [f]: e.target.value }));
  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const loadMyReservations = useCallback(async () => {
    const name = formData.customer_name || '';
    const phone = formData.phone || '';
    if (!name && !phone) { setMyReservations([]); return; }
    setLoadingList(true);
    try {
      const res = await reservationsAPI.publicSearch(name, phone);
      setMyReservations(res.data || []);
    } catch { setMyReservations([]); }
    finally { setLoadingList(false); }
  }, [formData.customer_name, formData.phone]);

  useEffect(() => {
    if (activeView === 'my') loadMyReservations();
  }, [activeView]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email,
        guests: Number(formData.guests),
        date: formData.date ? new Date(formData.date).toISOString() : undefined,
        time: formData.time,
        notes: formData.notes,
        status: 'pending',
      };
      await reservationsAPI.create(payload);
      flash('🎉 Reservation request submitted! We will confirm your table shortly.');
      setShowForm(false);
      setFormData({ customer_name: '', email: '', phone: '', guests: 2, date: '', time: '', notes: '' });
    } catch (err) {
      flash(err.message || 'Failed to submit reservation. Please try again.', 'error');
    } finally { setSubmitting(false); }
  };

  const handleLookup = async () => {
    setActiveView('my');
    await loadMyReservations();
  };

  const features = [
    { icon: ChefHat, title: 'Expert Chefs', desc: 'Our chefs bring 15+ years of authentic biryani expertise' },
    { icon: Utensils, title: 'Premium Dining', desc: 'Hand-picked ingredients from local farms, cooked fresh daily' },
    { icon: Star, title: 'Special Occasions', desc: 'Birthday setups, anniversary decorations, group dining' },
    { icon: MapPin, title: 'Central Location', desc: 'Easy parking, accessible by all transport modes' },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-white relative overflow-hidden">
      <Navbar />

      {/* Background glows */}
      <div className="absolute top-0 left-0 w-[900px] h-[900px] bg-primary/5 blur-[200px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 pt-28 pb-20">

        {/* ── Hero ── */}
        <div className="container px-6 max-w-7xl mx-auto text-center mb-16">
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[12px] mb-4 block">
              Reserve Your Seat
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Table <span className="text-primary">Reservations</span>
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
              Book your perfect dining experience at Biryani Box. Authentic flavors, warm ambiance,
              unforgettable moments — all reserved just for you.
            </p>
          </MotionDiv>

          <MotionDiv initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex justify-center gap-4 mt-8 flex-wrap">
            <button onClick={() => { setShowForm(true); setActiveView('new'); }}
              className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/20">
              <Plus size={18} /> Reserve a Table
            </button>
            <button onClick={handleLookup}
              className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all">
              <ClipboardList size={18} /> My Reservations
            </button>
          </MotionDiv>
        </div>

        {/* ── Flash message ── */}
        <div className="container px-6 max-w-3xl mx-auto mb-4">
          <AnimatePresence>{msg.text && <Flash msg={msg} />}</AnimatePresence>
        </div>

        {/* ── Reservation Form Modal ── */}
        <AnimatePresence>
          {showForm && (
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
              <MotionDiv initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0 }} transition={{ type: 'spring', damping: 22 }}
                className="bg-[#1a1a1a] rounded-3xl border border-white/10 w-full max-w-lg shadow-2xl my-4 overflow-hidden">
                {/* Modal header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-black text-white">Book a Table</h3>
                    <p className="text-xs text-text-muted mt-0.5">We'll confirm within 30 minutes</p>
                  </div>
                  <button onClick={() => setShowForm(false)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Name + Phone row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Full Name *</label>
                      <div className="relative">
                        <input type="text" required value={formData.customer_name} onChange={setField('customer_name')}
                          placeholder="e.g. Ravi Kumar"
                          className="w-full bg-[#252525] border border-white/10 p-3 pl-10 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Phone *</label>
                      <div className="relative">
                        <input type="tel" required value={formData.phone} onChange={setField('phone')}
                          placeholder="+91 98765 43210"
                          className="w-full bg-[#252525] border border-white/10 p-3 pl-10 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Email (for confirmation)</label>
                    <div className="relative">
                      <input type="email" value={formData.email} onChange={setField('email')}
                        placeholder="ravi@example.com"
                        className="w-full bg-[#252525] border border-white/10 p-3 pl-10 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    </div>
                  </div>

                  {/* Guests + Date + Time */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Guests *</label>
                      <div className="relative">
                        <input type="number" min={1} max={20} required value={formData.guests} onChange={setField('guests')}
                          className="w-full bg-[#252525] border border-white/10 p-3 pl-10 rounded-xl focus:border-primary outline-none text-white text-sm" />
                        <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Date *</label>
                      <div className="relative">
                        <input type="date" required value={formData.date} onChange={setField('date')}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-[#252525] border border-white/10 p-3 pl-10 rounded-xl focus:border-primary outline-none text-white text-sm" />
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Time *</label>
                      <div className="relative">
                        <select required value={formData.time} onChange={setField('time')}
                          className="w-full bg-[#252525] border border-white/10 p-3 pl-10 rounded-xl focus:border-primary outline-none text-white text-sm appearance-none">
                          <option value="">Select</option>
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Special Requests</label>
                    <textarea value={formData.notes} onChange={setField('notes')} rows={2}
                      placeholder="Birthday setup, dietary needs, high chair..."
                      className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20 resize-none" />
                  </div>

                  {/* Info note */}
                  <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-xl p-3">
                    <AlertCircle size={14} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-primary/80">Reservations are subject to availability. We'll call or WhatsApp you to confirm within 30 minutes of your request.</p>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={submitting}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50">
                    {submitting ? <><RefreshCw size={15} className="animate-spin" /> Submitting...</> : <><CheckCircle size={15} /> Confirm Reservation</>}
                  </button>
                </form>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* ── My Reservations Lookup ── */}
        {activeView === 'my' && (
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="container px-6 max-w-4xl mx-auto mb-12">
            <div className="bg-[#1a1a1a] rounded-3xl border border-white/10 p-6 mb-6">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <ClipboardList size={16} className="text-primary" /> Look Up Your Reservations
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Your Name</label>
                  <input type="text" value={formData.customer_name} onChange={setField('customer_name')}
                    placeholder="Enter your name"
                    className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-2 block">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={setField('phone')}
                    placeholder="Enter your phone"
                    className="w-full bg-[#252525] border border-white/10 p-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-white/20" />
                </div>
              </div>
              <button onClick={loadMyReservations}
                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 flex items-center gap-2">
                <RefreshCw size={13} /> Search
              </button>
            </div>

            {loadingList ? (
              <div className="flex justify-center py-10"><Loader size={24} className="animate-spin text-primary" /></div>
            ) : myReservations.length === 0 ? (
              <div className="py-12 text-center text-text-muted bg-[#1a1a1a] rounded-3xl border border-white/10">
                <Calendar size={36} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">No reservations found</p>
                <p className="text-xs mt-2">Enter your name or phone to look up reservations</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{myReservations.length} reservation{myReservations.length !== 1 ? 's' : ''} found</p>
                {myReservations.map((res, idx) => (
                  <MotionDiv key={res._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                    className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{res.customer_name}</h3>
                          <p className="text-xs text-text-muted mt-0.5">{res.phone} {res.email && `· ${res.email}`}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${STATUS_STYLES[res.status] || 'bg-white/10 text-text-muted border-white/20'}`}>
                          {res.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-[9px] text-text-muted uppercase font-bold mb-1 flex items-center gap-1"><Calendar size={9} /> Date</p>
                          <p className="text-sm font-bold text-white">{res.date ? new Date(res.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-[9px] text-text-muted uppercase font-bold mb-1 flex items-center gap-1"><Clock size={9} /> Time</p>
                          <p className="text-sm font-bold text-white">{res.time || '—'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-[9px] text-text-muted uppercase font-bold mb-1 flex items-center gap-1"><Users size={9} /> Guests</p>
                          <p className="text-sm font-bold text-white">{res.guests}</p>
                        </div>
                      </div>
                      {res.table_assigned && (
                        <div className="mt-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5">
                          <p className="text-xs text-primary font-bold flex items-center gap-2">
                            <MapPin size={12} /> Table {res.table_assigned} assigned
                          </p>
                        </div>
                      )}
                      {res.notes && (
                        <div className="mt-3">
                          <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Special Requests</p>
                          <p className="text-xs text-white/70 italic">"{res.notes}"</p>
                        </div>
                      )}
                    </div>
                    {res.status === 'confirmed' && (
                      <div className="px-5 pb-4">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                          <CheckCircle size={14} className="text-green-400 shrink-0" />
                          <p className="text-xs text-green-400 font-bold">Your table is confirmed! Please arrive 5–10 minutes early.</p>
                        </div>
                      </div>
                    )}
                  </MotionDiv>
                ))}
              </div>
            )}
          </MotionDiv>
        )}

        {/* ── Features grid ── */}
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((f, idx) => (
              <MotionDiv key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="p-6 bg-secondary/20 border border-white/10 rounded-2xl hover:border-primary/40 transition-all group">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all">
                  <f.icon size={22} className="text-primary" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
              </MotionDiv>
            ))}
          </div>

          {/* ── Dining info ── */}
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-secondary/20 border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-primary font-black uppercase tracking-[0.4em] text-[11px] mb-3 block">Hours & Info</span>
                <h2 className="text-3xl md:text-4xl font-black mb-6">Visit <span className="text-primary">Biryani Box</span></h2>
                <div className="space-y-4">
                  {[
                    { icon: Clock, label: 'Lunch', value: '11:00 AM – 3:30 PM' },
                    { icon: Clock, label: 'Dinner', value: '7:00 PM – 10:30 PM' },
                    { icon: MapPin, label: 'Location', value: 'Vijayawada, Andhra Pradesh' },
                    { icon: Phone, label: 'Reservations', value: '+91 98765 43210' },
                    { icon: Mail, label: 'Email', value: 'reservations@biryanibox.in' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-primary" />
                      </div>
                      <div>
                        <span className="text-text-muted">{label}: </span>
                        <span className="text-white font-bold">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Star size={16} className="text-primary" /> Reservation Policy
                  </h4>
                  <ul className="space-y-2 text-sm text-text-muted">
                    <li className="flex items-start gap-2"><CheckCircle size={13} className="text-primary mt-0.5 shrink-0" />Tables are held for 15 minutes after booking time</li>
                    <li className="flex items-start gap-2"><CheckCircle size={13} className="text-primary mt-0.5 shrink-0" />For groups of 8+, please call us directly</li>
                    <li className="flex items-start gap-2"><CheckCircle size={13} className="text-primary mt-0.5 shrink-0" />Cancellation 1 hour before is appreciated</li>
                    <li className="flex items-start gap-2"><CheckCircle size={13} className="text-primary mt-0.5 shrink-0" />We accommodate dietary restrictions with advance notice</li>
                  </ul>
                </div>
                <button onClick={() => setShowForm(true)}
                  className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  <Plus size={16} /> Book Your Table Now
                </button>
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Reservations;