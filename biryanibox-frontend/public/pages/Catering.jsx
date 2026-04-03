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
  // const [formSubmitted, setFormSubmitted] = useState(false);
  const { cateringOrders } = useDemoData();
  // const navigate = useNavigate();

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
                    <h3 className="font-bold text-lg mb-1">{order.eventType}</h3>
                    <p className="text-text-muted text-sm">{order.customerName}</p>
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
                    {order.eventDate} at {order.deliveryTime}
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <Users size={16} className="text-primary" />
                    {order.guestCount} guests
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <DollarSign size={16} className="text-primary" />$
                    {order.totalPrice ? order.totalPrice.toFixed(2) : 'Quote pending'}
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
          <form className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Your Name"
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
              required
            />
            <input
              type="date"
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
              required
            />
            <input
              type="number"
              placeholder="Number of Guests"
              min="50"
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
              required
            />
            <input
              type="text"
              placeholder="Event Type"
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
              required
            />
            <textarea
              placeholder="Special Requirements"
              rows="1"
              className="lg:col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none"
            />
            <button
              type="submit"
              className="lg:col-span-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-all"
            >
              Get Quote
            </button>
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
