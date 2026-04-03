import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;
import {
  Users,
  Truck,
  Utensils,
  Star,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  ChefHat,
} from 'lucide-react';
import { useDemoData } from '../context/useContextHooks';

const Catering = () => {
  const { cateringOrders, addCateringOrder } = useDemoData();
  const [formData, setFormData] = useState({ customer_name:'', email:'', event_date:'', guest_count:50, event_type:'', phone:'', notes:'' });
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const sf = (f) => (e) => setFormData(prev => ({ ...prev, [f]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    const res = await addCateringOrder({ ...formData, guest_count: Number(formData.guest_count) });
    if (res.success) { setFormSuccess(true); setFormData({ customer_name:'', email:'', event_date:'', guest_count:50, event_type:'', phone:'', notes:'' }); setTimeout(() => setFormSuccess(false), 3000); }
    else setFormError(res.error || 'Failed to submit');
  };

  return (
    <div className="min-h-screen bg-bg-main text-white pt-24 pb-20 relative overflow-hidden">
      <Navbar />
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="container relative z-10 px-6 max-w-7xl mx-auto mt-20">
        <div className="text-center mb-16">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[12px] mb-4 block">
            Bulk Orders
          </span>
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Corporate <span className="text-primary">Catering</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Perfect for events from 50 to 500+ guests with customized menus and full service
          </p>
        </div>

        {/* Current Orders */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <ChefHat className="text-primary" size={32} />
            Current Catering Orders
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cateringOrders.map((order, idx) => (
              <MotionDiv
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 bg-secondary/30 border border-white/10 rounded-2xl hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{order.event_type}</h3>
                    <p className="text-text-muted text-sm">{order.customer_name}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      order.status === 'confirmed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {order.status}
                  </div>
                </div>
                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Calendar size={16} className="text-primary" />
                    {order.event_date} at {order.delivery_time}
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <Users size={16} className="text-primary" />
                    {order.guest_count} guests
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <DollarSign size={16} className="text-primary" />$
                    {order.total_price ? order.total_price.toFixed(2) : 'Quote pending'}
                  </div>
                </div>
                <button className="w-full py-2 bg-primary/20 text-primary font-bold rounded-lg hover:bg-primary/30 transition-all text-sm">
                  View Details
                </button>
              </MotionDiv>
            ))}
          </div>
        </div>
        {/* Request Form */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20"
        >
          <h3 className="text-2xl font-bold mb-6">Request a Quote</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {formSuccess && <div className="col-span-full p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm font-bold text-center">Quote request submitted! We will contact you shortly.</div>}
            {formError && <div className="col-span-full p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{formError}</div>}
            <input type="text" placeholder="Your Name" required value={formData.customer_name} onChange={sf('customer_name')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <input type="email" placeholder="Email" required value={formData.email} onChange={sf('email')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <input type="date" required value={formData.event_date} onChange={sf('event_date')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" />
            <input type="number" placeholder="Number of Guests" min="50" required value={formData.guest_count} onChange={sf('guest_count')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <input type="text" placeholder="Event Type" value={formData.event_type} onChange={sf('event_type')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={sf('phone')} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <textarea placeholder="Special Requirements" rows="1" value={formData.notes} onChange={sf('notes')} className="lg:col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none" />
            <button type="submit" className="lg:col-span-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-all">Get Quote</button>
          </form>
        </MotionDiv>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, title: 'Custom Menus', desc: 'Tailored to your event' },
            { icon: Truck, title: 'Full Service Delivery', desc: 'On-time guarantee' },
            { icon: Utensils, title: 'Live Cooking', desc: 'Tandoor on-site available' },
            { icon: Star, title: 'Expert Team', desc: '50-500+ guests capacity' },
          ].map((item, i) => (
            <MotionDiv
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-secondary/30 border border-white/10 rounded-2xl text-center"
            >
              <item.icon size={32} className="text-primary mx-auto mb-3" />
              <h4 className="font-bold mb-2">{item.title}</h4>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </MotionDiv>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Catering;
