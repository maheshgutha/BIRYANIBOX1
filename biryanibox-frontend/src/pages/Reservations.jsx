import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { reservationsAPI } from '../services/api';

import {
  Calendar,
  User,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useDemoData } from '../context/useContextHooks';

const Reservations = () => {
  const { reservations: demoRes, addReservation } = useDemoData();
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [formData, setFormData] = useState({ customer_name: '', email: '', date: '', time: '', guests: 1, phone: '', notes: '' });
  const [formSuccess, setFormSuccess] = useState(false);
  const setField = (f) => (e) => setFormData(prev => ({ ...prev, [f]: e.target.value }));

  React.useEffect(() => { setReservations(demoRes || []); }, [demoRes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await addReservation({
      ...formData,
      guests: Number(formData.guests),
      date: formData.date ? new Date(formData.date).toISOString() : undefined,
    });
    if (res.success) {
      setFormSuccess(true);
      setFormData({ customer_name: '', email: '', date: '', time: '', guests: 1, phone: '', notes: '' });
      setTimeout(() => setFormSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-white pt-24 pb-20 relative overflow-hidden">
      <Navbar />
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      <div className="container relative z-10 px-6 max-w-6xl mx-auto mt-20">
        <div className="text-center mb-16">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[12px] mb-4 block">
            Dining Experience
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Table <span className="text-primary">Reservations</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Book your perfect dining experience at Biryani Box
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Reservation Cards */}
          <div className="lg:col-span-2 space-y-6">
            {reservations.map((res, idx) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedReservation(res)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                  selectedReservation?.id === res.id
                    ? 'bg-primary/20 border-primary'
                    : 'bg-secondary/20 border-white/10 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{res.customer_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-text-muted mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        {res.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        {res.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        {res.guests} guests
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${
                      res.status === 'confirmed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {res.status === 'confirmed' ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                  </div>
                </div>
                {res.table_assigned && (
                  <div className="text-sm text-primary font-semibold">
                    Table {res.table_assigned}
                  </div>
                )}
                <p className="text-sm text-text-muted mt-2">{res.notes}</p>
              </motion.div>
            ))}
          </div>

          {/* Reservation Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24 h-fit p-8 bg-secondary/30 rounded-2xl border border-white/10"
          >
            {selectedReservation ? (
              <>
                <h3 className="text-2xl font-bold mb-6">Reservation Details</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-text-muted text-sm mb-2">Guest Name</p>
                    <p className="text-lg font-bold">{selectedReservation.customerName}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-text-muted text-sm mb-2">Date</p>
                      <p className="font-bold">{selectedReservation.date}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-text-muted text-sm mb-2">Time</p>
                      <p className="font-bold">{selectedReservation.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-text-muted text-sm mb-2">Guests</p>
                      <p className="font-bold">{selectedReservation.guests}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-text-muted text-sm mb-2">Table</p>
                      <p className="font-bold text-primary">
                        {selectedReservation.tableAssigned || 'TBD'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-text-muted text-sm mb-2">Contact</p>
                    <p className="flex items-center gap-2 mb-2">
                      <Phone size={14} className="text-primary" />
                      {selectedReservation.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={14} className="text-primary" />
                      {selectedReservation.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted text-sm mb-2">Special Requests</p>
                    <p className="text-sm">{selectedReservation.notes}</p>
                  </div>
                  <button className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-all mt-6">
                    Manage Reservation
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Calendar size={48} className="mx-auto text-text-muted/50 mb-4" />
                <p className="text-text-muted">Select a reservation to view details</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Make New Reservation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20"
        >
          <h3 className="text-2xl font-bold mb-4">Make a New Reservation</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {formSuccess && <div className="col-span-full p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm font-bold text-center">Reservation submitted successfully!</div>}
            <input type="text" required placeholder="Your Name" value={formData.customer_name} onChange={setField('customer_name')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <input type="email" required placeholder="Email" value={formData.email} onChange={setField('email')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <input type="date" required value={formData.date} onChange={setField('date')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" />
            <input type="time" required value={formData.time} onChange={setField('time')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" />
            <input type="number" placeholder="Number of Guests" min="1" max="50" value={formData.guests} onChange={setField('guests')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={setField('phone')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <textarea placeholder="Special Requests" rows="1" value={formData.notes} onChange={setField('notes')} className="lg:col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none" />
            <button type="submit" className="lg:col-span-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-all">Reserve Table</button>
          </form>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Reservations;