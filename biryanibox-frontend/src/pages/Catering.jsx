import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import {
  Users, Truck, Utensils, Star, Calendar,
  DollarSign, ChefHat, Plus, Minus, ShoppingBag,
  CheckCircle, Package, Search, Filter,
} from 'lucide-react';
import { useDemoData } from '../context/useContextHooks';
import { menuAPI } from '../services/api';

// ─── Catering Packages ───────────────────────────────────────────────────────
const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Spread',
    desc: 'Perfect for small gatherings',
    guests: '50–100',
    price_per_head: 18,
    items: ['Chicken Biryani', 'Dal Makhani', 'Raita', 'Roti', 'Gulab Jamun'],
    badge: 'Popular',
    color: 'border-primary/40 bg-primary/5',
    badgeColor: 'bg-primary/20 text-primary',
  },
  {
    id: 'premium',
    name: 'Premium Feast',
    desc: 'Full service for weddings & events',
    guests: '100–300',
    price_per_head: 28,
    items: ['Mutton Biryani', 'Chicken Tikka', 'Dal Makhani', 'Paneer Butter Masala', 'Raita', 'Naan', 'Pulao', 'Haleem', 'Kheer'],
    badge: 'Best Value',
    color: 'border-yellow-500/40 bg-yellow-500/5',
    badgeColor: 'bg-yellow-500/20 text-yellow-400',
  },
  {
    id: 'royal',
    name: 'Royal Banquet',
    desc: 'Complete luxury catering experience',
    guests: '300–1000+',
    price_per_head: 45,
    items: ['Dum Mutton Biryani', 'Chicken Tikka', 'Seekh Kebab', 'Dal Makhani', 'Paneer Hyderabadi', 'Raita', 'Garlic Naan', 'Zafrani Pulao', 'Haleem', 'Kheer', 'Double Ka Meetha', 'Live Counter'],
    badge: 'Luxury',
    color: 'border-purple-500/40 bg-purple-500/5',
    badgeColor: 'bg-purple-500/20 text-purple-400',
  },
];

const Catering = () => {
  const { cateringOrders, addCateringOrder } = useDemoData();

  // Menu items from API
  const [menuItems,     setMenuItems]     = useState([]);
  const [menuLoading,   setMenuLoading]   = useState(true);
  const [menuSearch,    setMenuSearch]    = useState('');
  const [menuCatFilter, setMenuCatFilter] = useState('all');

  // Chosen items (custom menu)
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: qty }
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [builderMode,   setBuilderMode]   = useState('packages'); // 'packages' | 'custom'

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '', email: '', event_date: '', guest_count: 50,
    event_type: '', phone: '', notes: '',
  });
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError,   setFormError]   = useState('');
  const sf = (f) => (e) => setFormData(prev => ({ ...prev, [f]: e.target.value }));

  useEffect(() => {
    menuAPI.getAll()
      .then(r => setMenuItems(r.data || []))
      .catch(() => {})
      .finally(() => setMenuLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map(i => i.category).filter(Boolean))];
    return cats;
  }, [menuItems]);

  const filteredMenu = menuItems.filter(item => {
    const matchSearch = !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchCat    = menuCatFilter === 'all' || item.category === menuCatFilter;
    return matchSearch && matchCat && (item.is_available ?? true);
  });

  const adjustQty = (id, delta) => {
    setSelectedItems(prev => {
      const qty = (prev[id] || 0) + delta;
      if (qty <= 0) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: qty };
    });
  };

  const totalCustomItems = Object.values(selectedItems).reduce((a, b) => a + b, 0);

  const selectedItemNames = Object.entries(selectedItems)
    .map(([id, qty]) => {
      const item = menuItems.find(i => (i._id || i.id) === id);
      return item ? `${item.name} ×${qty}` : null;
    })
    .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const menuSelections = builderMode === 'packages' && selectedPackage
      ? `Package: ${selectedPackage.name} | Items: ${selectedPackage.items.join(', ')}`
      : selectedItemNames.length > 0
        ? `Custom Menu: ${selectedItemNames.join(', ')}`
        : '';

    if (!menuSelections) {
      setFormError('Please select a package or at least one menu item.');
      return;
    }

    const payload = {
      ...formData,
      guest_count:     Number(formData.guest_count),
      menu_selection:  menuSelections,
      package_id:      selectedPackage?.id || null,
    };

    const res = await addCateringOrder(payload);
    if (res.success) {
      setFormSuccess(true);
      setFormData({ customer_name: '', email: '', event_date: '', guest_count: 50, event_type: '', phone: '', notes: '' });
      setSelectedItems({});
      setSelectedPackage(null);
      setTimeout(() => setFormSuccess(false), 4000);
    } else {
      setFormError(res.error || 'Failed to submit');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-white pt-24 pb-20 relative overflow-hidden">
      <Navbar />
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="container relative z-10 px-6 max-w-7xl mx-auto mt-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[12px] mb-4 block">Bulk Orders</span>
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Corporate <span className="text-primary">Catering</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Choose your package or build a custom menu — perfect for 50 to 1000+ guests
          </p>
        </div>

        {/* ── STEP 1: Choose menu ── */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <ChefHat className="text-primary" size={32} /> Step 1 — Choose Your Menu
            </h2>
            {/* Toggle: packages vs custom */}
            <div className="flex gap-1 bg-white/5 p-1.5 rounded-xl border border-white/5">
              {[['packages', '🎁 Packages'], ['custom', '✏️ Build Custom']].map(([v, l]) => (
                <button key={v} onClick={() => setBuilderMode(v)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${builderMode === v ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Packages mode */}
          {builderMode === 'packages' && (
            <div className="grid md:grid-cols-3 gap-6">
              {PACKAGES.map(pkg => (
                <MotionDiv key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedPackage(selectedPackage?.id === pkg.id ? null : pkg)}
                  className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${pkg.color} ${selectedPackage?.id === pkg.id ? 'ring-2 ring-primary scale-[1.02]' : 'hover:scale-[1.01]'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${pkg.badgeColor} mb-2 inline-block`}>{pkg.badge}</span>
                      <h3 className="text-xl font-black text-white">{pkg.name}</h3>
                      <p className="text-text-muted text-sm">{pkg.desc}</p>
                    </div>
                    {selectedPackage?.id === pkg.id && (
                      <CheckCircle size={22} className="text-primary shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={14} className="text-text-muted" />
                    <span className="text-xs text-text-muted">{pkg.guests} guests</span>
                    <span className="ml-auto text-lg font-black text-primary">${pkg.price_per_head}<span className="text-xs text-text-muted font-normal">/head</span></span>
                  </div>
                  <div className="space-y-1.5">
                    {pkg.items.map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-white/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" /> {item}
                      </div>
                    ))}
                  </div>
                  {selectedPackage?.id === pkg.id && (
                    <div className="mt-4 pt-3 border-t border-white/10 text-xs font-black text-primary flex items-center gap-1">
                      <CheckCircle size={12} /> Selected
                    </div>
                  )}
                </MotionDiv>
              ))}
            </div>
          )}

          {/* Custom menu builder mode */}
          {builderMode === 'custom' && (
            <div className="space-y-4">
              {totalCustomItems > 0 && (
                <div className="flex items-center gap-3 px-5 py-3 bg-primary/10 border border-primary/30 rounded-xl text-sm text-primary font-black">
                  <ShoppingBag size={16} /> {totalCustomItems} item type{totalCustomItems !== 1 ? 's' : ''} selected: {selectedItemNames.slice(0, 3).join(', ')}{selectedItemNames.length > 3 && ` +${selectedItemNames.length - 3} more`}
                </div>
              )}

              {/* Search + category filter */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="text" placeholder="Search menu items…"
                    value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
                    className="w-full bg-secondary/40 border border-white/10 pl-10 pr-4 py-3 rounded-xl focus:border-primary outline-none text-white text-sm placeholder:text-text-muted" />
                </div>
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto">
                  {['all', ...categories].map(cat => (
                    <button key={cat} onClick={() => setMenuCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${menuCatFilter === cat ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {menuLoading ? (
                <div className="py-12 text-center text-text-muted">Loading menu…</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMenu.map(item => {
                    const id  = item._id || item.id;
                    const qty = selectedItems[id] || 0;
                    return (
                      <div key={id} className={`p-4 rounded-2xl border transition-all ${qty > 0 ? 'bg-primary/5 border-primary/40' : 'bg-secondary/30 border-white/10 hover:border-white/20'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="font-bold text-white text-sm truncate">{item.name}</p>
                            <p className="text-[10px] text-text-muted">{item.category}</p>
                          </div>
                          <span className="text-primary font-black text-sm shrink-0">${(item.price || 0).toFixed(0)}</span>
                        </div>
                        {item.description && <p className="text-[10px] text-text-muted mb-3 line-clamp-1">{item.description}</p>}
                        {qty === 0 ? (
                          <button onClick={() => adjustQty(id, 1)}
                            className="w-full py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1">
                            <Plus size={12} /> Add to Menu
                          </button>
                        ) : (
                          <div className="flex items-center justify-between">
                            <button onClick={() => adjustQty(id, -1)}
                              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-400 transition-all">
                              <Minus size={14} />
                            </button>
                            <span className="font-black text-primary">{qty} servings</span>
                            <button onClick={() => adjustQty(id, 1)}
                              className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredMenu.length === 0 && (
                    <div className="col-span-full py-12 text-center text-text-muted">
                      <Utensils size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="font-bold text-sm uppercase tracking-widest">No items found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STEP 2: Request form ── */}
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 mb-16">
          <h2 className="text-2xl font-bold mb-2">Step 2 — Request Your Quote</h2>
          <p className="text-text-muted text-sm mb-6">We'll contact you within 24 hours with a detailed quote.</p>

          {/* Selection summary */}
          {(selectedPackage || totalCustomItems > 0) && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-black text-green-400">Menu Selection Ready</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {selectedPackage
                    ? `${selectedPackage.name} package · $${selectedPackage.price_per_head}/head`
                    : `${totalCustomItems} item type${totalCustomItems !== 1 ? 's' : ''} selected`}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formSuccess && (
              <div className="col-span-full p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-bold text-center">
                ✓ Quote request submitted! We'll contact you shortly.
              </div>
            )}
            {formError && (
              <div className="col-span-full p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{formError}</div>
            )}

            {[
              { ph: 'Your Name *',         f: 'customer_name', type: 'text',  req: true },
              { ph: 'Email Address *',      f: 'email',         type: 'email', req: true },
              { ph: 'Phone Number *',       f: 'phone',         type: 'tel',   req: true },
              { ph: 'Event Type (Wedding…)',f: 'event_type',    type: 'text',  req: false },
            ].map(({ ph, f, type, req }) => (
              <input key={f} type={type} placeholder={ph} required={req} value={formData[f]} onChange={sf(f)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary transition-all" />
            ))}

            <input type="date" required value={formData.event_date} onChange={sf('event_date')}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary transition-all" />

            <input type="number" placeholder="Number of Guests *" min="10" required value={formData.guest_count} onChange={sf('guest_count')}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary transition-all" />

            <textarea placeholder="Special Requirements / Notes" rows={2} value={formData.notes} onChange={sf('notes')}
              className="col-span-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none transition-all" />

            <button type="submit"
              className="col-span-full md:col-span-1 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
              <ChefHat size={16} /> Submit Quote Request
            </button>
          </form>
        </MotionDiv>

        {/* Current Orders */}
        {cateringOrders.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Package className="text-primary" size={24} /> Your Catering Orders
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cateringOrders.map((order, idx) => (
                <MotionDiv key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-secondary/30 border border-white/10 rounded-2xl hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{order.event_type || 'Event'}</h3>
                      <p className="text-text-muted text-sm">{order.customer_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${order.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Calendar size={14} className="text-primary" /> {order.event_date}
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Users size={14} className="text-primary" /> {order.guest_count} guests
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <DollarSign size={14} className="text-primary" />
                      {order.total_price ? `$${order.total_price.toFixed(0)}` : 'Quote pending'}
                    </div>
                  </div>
                </MotionDiv>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users,    title: 'Custom Menus',         desc: 'Choose from our full menu' },
            { icon: Truck,    title: 'Full Service Delivery', desc: 'On-time guarantee' },
            { icon: Utensils, title: 'Live Cooking',          desc: 'Tandoor on-site available' },
            { icon: Star,     title: 'Expert Team',           desc: '50–1000+ guests capacity' },
          ].map((item, i) => (
            <MotionDiv key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-6 bg-secondary/30 border border-white/10 rounded-2xl text-center">
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