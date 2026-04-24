import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
const MotionButton = motion.button;
import {
  ShoppingBag, User, Menu as MenuIcon, X, ShieldCheck, ChevronDown, LogOut,
  Gift, ListOrdered, Clock, MapPin, Phone, Truck, Facebook, Instagram, ArrowRight,
  Star, CheckCircle, Search, ChevronRight, Navigation, Download,
  MessageSquare, ThumbsUp, Send,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '../context/useContextHooks';
import { feedbackAPI, announcementsAPI } from '../services/api';
import { useCart } from '../context/useContextHooks';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import heroBiryani from '../assets/hero-biryani.png';
import muttonBiryani from '../assets/mutton-biryani.png';
import chickenTikka from '../assets/chicken-tikka.png';
import rasmalai from '../assets/rasmalai.png';
import backgroundInterior from '../assets/background.png';

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = ({ navigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { title: 'Dahi Puri', subtitle: 'Street Flavor Redefined', desc: "Crispy artisan shells filled with spiced potatoes, tangy yogurt, and mother's secret chutneys.", image: backgroundInterior, tag: 'Limited Offer' },
    { title: 'Chicken Biryani', subtitle: 'The Royal Fragrance', desc: 'Saffron-infused long grain basmati rice layered with tender, marinated chicken and 24 traditional spices.', image: heroBiryani, tag: 'Best Seller' },
    { title: 'Mutton Nizam', subtitle: 'Heritage on a Plate', desc: 'A recipe passed down through generations of Nizams, slow-cooked to perfection in heavy copper pots.', image: muttonBiryani, tag: 'Premium Choice' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="relative h-screen flex items-center overflow-hidden pt-20">
      <AnimatePresence mode="wait">
        <MotionDiv key={currentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 z-0">
          <img src={slides[currentSlide].image} alt="Promotion" className="w-full h-full object-cover opacity-30 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/60 to-transparent" />
        </MotionDiv>
      </AnimatePresence>
      <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <MotionDiv key={`text-${currentSlide}`} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 animate-pulse">{slides[currentSlide].tag}</span>
          <h2 className="text-[12px] font-bold text-white/50 uppercase tracking-[0.5em] mb-2">{slides[currentSlide].subtitle}</h2>
          <h1 className="text-7xl md:text-9xl font-black font-heading leading-tight mb-8">
            {slides[currentSlide].title.split(' ')[0]} <br />
            <span className="text-primary">{slides[currentSlide].title.split(' ')[1] || ''}</span>
          </h1>
          <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-lg">{slides[currentSlide].desc}</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })} className="px-12 py-6 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-primary-hover transition-all shadow-3xl shadow-primary/20">Order Online</button>
            <button onClick={() => navigate('/profile?tab=rewards')} className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-white/10 transition-all">View Rewards</button>
          </div>
        </MotionDiv>
        <MotionDiv key={`img-${currentSlide}`} initial={{ opacity: 0, scale: 0.8, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, type: 'spring' }} className="hidden lg:block relative">
          <div className="absolute inset-0 bg-primary/20 filter blur-[150px] rounded-full animate-pulse" />
          <img src={slides[currentSlide].image} alt="Dish" className="w-[85%] mx-auto relative z-10 filter drop-shadow-[0_45px_45px_rgba(229,138,48,0.4)]" />
        </MotionDiv>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 transition-all rounded-full ${currentSlide === i ? 'w-16 bg-primary' : 'w-4 bg-white/20 hover:bg-white/40'}`} />
        ))}
      </div>
    </section>
  );
};

// ─── Restaurant Cinematic Video ───────────────────────────────────────────────
const RestaurantVideo = () => (
  <section className="relative bg-black overflow-hidden" style={{ minHeight: '70vh' }}>
    <video autoPlay muted loop playsInline poster={backgroundInterior} className="absolute inset-0 w-full h-full object-cover opacity-60">
      {/* Replace this URL with your actual restaurant video */}
      <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-black/50 to-black/20" />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="space-y-6 max-w-3xl">
        <span className="text-primary font-black uppercase tracking-[0.4em] text-[11px] block">The Experience</span>
        <h2 className="text-5xl md:text-7xl font-black font-heading text-white leading-tight">
          Where Every Bite<br /><span className="text-primary">Tells a Story</span>
        </h2>
        <p className="text-white/60 text-lg max-w-xl mx-auto">Authentic South Indian flavors crafted with love, tradition, and the finest ingredients.</p>
        <div className="flex items-center justify-center gap-8 flex-wrap pt-4">
          {[['15+', 'Years of Heritage'], ['50K+', 'Happy Customers'], ['100%', 'Halal Certified']].map(([num, lbl]) => (
            <div key={lbl} className="text-center">
              <p className="text-4xl font-black text-primary">{num}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{lbl}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── Popular & Frequently Bought ──────────────────────────────────────────────
const PopularItems = () => {
  const { menu } = useOrders();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(null);
  const popular = menu.filter(i => (i.is_available ?? i.available ?? true)).slice(0, 6);

  if (popular.length === 0) return null;

  const getImg = (item) => {
    if (item.image_url?.startsWith('http')) return item.image_url;
    if (item.category === 'Biryani') return heroBiryani;
    if (item.category === 'Desserts' || item.category === 'Dessert') return rasmalai;
    if (item.category === 'Combos') return muttonBiryani;
    return chickenTikka;
  };

  const handleAdd = (item) => {
    addToCart({ id: item.id || item._id, _id: item._id || item.id, name: item.name, price: item.price, category: item.category, image_url: item.image_url });
    setAdded(item._id || item.id);
    setTimeout(() => setAdded(null), 1500);
  };

  return (
    <section className="py-24 bg-bg-offset relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="container relative z-10">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-3 block">🔥 Most Loved</span>
            <h2 className="text-4xl md:text-5xl font-black font-heading">Popular <span className="text-primary">Right Now</span></h2>
          </div>
          <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline">View Full Menu →</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popular.map((item, i) => {
            const id = item._id || item.id;
            const isAdded = added === id;
            return (
              <motion.div key={id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="group bg-secondary/40 border border-white/8 rounded-3xl overflow-hidden hover:border-primary/40 transition-all">
                <div className="h-44 overflow-hidden relative">
                  <img src={getImg(item)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {i < 3 && <span className="bg-primary text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full">#{i + 1} Popular</span>}
                    {item.is_veg && <span className="bg-green-500/90 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full">Veg</span>}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-white text-base mb-1">{item.name}</h3>
                  <p className="text-[10px] text-text-muted mb-3">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-primary">${(item.price || 0).toFixed(0)}</span>
                    <button onClick={() => handleAdd(item)}
                      className={`px-6 py-3 rounded-xl text-sm font-black uppercase transition-all ${isAdded ? 'bg-green-500 text-white' : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white'}`}>
                      {isAdded ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ─── All Menu Items Name List ─────────────────────────────────────────────────
const AllItemsList = () => {
  const { menu } = useOrders();
  const [catFilter, setCatFilter] = useState('All');
  const categories = ['All', ...Array.from(new Set(menu.map(i => i.category).filter(Boolean)))];
  const filtered = catFilter === 'All' ? menu : menu.filter(i => i.category === catFilter);
  const grouped = {};
  filtered.forEach(item => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  if (menu.length === 0) return null;

  return (
    <section className="py-24 bg-bg-main">
      <div className="container">
        <div className="text-center mb-12">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-3 block">Complete Menu</span>
          <h2 className="text-4xl md:text-5xl font-black font-heading">Everything We <span className="text-primary">Offer</span></h2>
          <p className="text-text-muted mt-3 max-w-md mx-auto text-sm">Browse our full menu — click any item to order</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${catFilter === cat ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="max-w-5xl mx-auto">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-4 flex items-center gap-3">
                <span className="flex-1 h-px bg-primary/20" />{cat}<span className="flex-1 h-px bg-primary/20" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((item, i) => (
                  <button key={item._id || item.id || i}
                    onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-primary/8 border border-white/5 hover:border-primary/20 rounded-xl text-left transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                      <span className="text-sm font-bold text-white/80 group-hover:text-white truncate">{item.name}</span>
                      {item.is_veg && <span className="text-[8px] text-green-400 font-black shrink-0">VEG</span>}
                    </div>
                    <span className="text-sm font-black text-primary ml-3 shrink-0">${(item.price || 0).toFixed(0)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-10 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 text-sm">
            Order Now →
          </button>
        </div>
      </div>
    </section>
  );
};

// ─── Menu Categories (Order Section) ─────────────────────────────────────────
const MenuCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVeg, setFilterVeg] = useState('all');
  const [filterSpice, setFilterSpice] = useState('all');
  const [filterHalal, setFilterHalal] = useState(false);
  const { addToCart } = useCart();
  const { menu } = useOrders();

  // Read category from URL — persists across refresh
  const activeCategory = searchParams.get('category') || 'All';

  // Update URL when category changes (instead of local state)
  const setActiveCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'All') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    // Replace so back button still works naturally
    setSearchParams(params, { replace: true });
    // Scroll to menu section smoothly on category change
    const menuEl = document.getElementById('menu');
    if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Listen for navbar "Menu" click — reset everything to show all items
  useEffect(() => {
    const handleReset = () => {
      const params = new URLSearchParams(searchParams);
      params.delete('category');
      setSearchParams(params, { replace: true });
      setSearchQuery('');
      setFilterVeg('all');
      setFilterSpice('all');
      setFilterHalal(false);
    };
    window.addEventListener('bb_menu_reset', handleReset);
    return () => window.removeEventListener('bb_menu_reset', handleReset);
  }, [searchParams, setSearchParams]);

  // On mount: if a category is in the URL (e.g. after refresh),
  // scroll the menu section into view so the user lands in the right spot.
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      // Small delay so the page renders before scrolling
      const t = setTimeout(() => {
        const menuEl = document.getElementById('menu');
        if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(t);
    }
  // Only run on initial mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const categories = ['All', ...Array.from(new Set(menu.map(item => item.category)))];
  const currentItems = activeCategory === 'All' ? menu : menu.filter(item => item.category === activeCategory);
  const filteredItems = currentItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Support both camelCase (legacy) and snake_case (backend) field names
    const isVeg   = item.is_veg   ?? item.isVeg   ?? false;
    const isHalal = item.is_halal ?? item.isHalal ?? true;
    const spiceLv = item.spice_level ?? item.spiceLevel ?? 0;
    const matchesType  = filterVeg === 'all' || (filterVeg === 'veg' && isVeg) || (filterVeg === 'non-veg' && !isVeg);
    const matchesSpice = filterSpice === 'all' || spiceLv === Number(filterSpice);
    const matchesHalal = !filterHalal || isHalal;
    return matchesSearch && matchesType && matchesSpice && matchesHalal;
  });

  const getMenuItemImage = (item) => {
    if (item.image_url && item.image_url.startsWith('http')) return item.image_url;
    if (item.image && item.image.startsWith('http')) return item.image;
    const imageMap = { heroBiryani, muttonBiryani, chickenTikka, rasmalai };
    if (item.image && imageMap[item.image]) return imageMap[item.image];
    if (item.category === 'Biryani') return heroBiryani;
    if (item.category === 'Appetizers') return chickenTikka;
    if (item.category === 'Breads') return chickenTikka;
    if (item.category === 'Curries') return chickenTikka;
    if (item.category === 'Dessert' || item.category === 'Desserts') return rasmalai;
    if (item.category === 'Combos') return muttonBiryani;
    return heroBiryani;
  };

  return (
    <section id="menu" className="section-padding bg-bg-main">
      <div className="container">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
          <div>
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Artisan Selection</span>
            <h2 className="text-5xl md:text-6xl font-black font-heading">Explore Our <span className="text-primary">Flavors.</span></h2>
          </div>
          <div className="flex-1 max-w-2xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                <input type="text" placeholder="Finding your flavor identifier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-full text-sm font-bold focus:border-primary outline-none transition-all text-white placeholder:text-white/20" />
              </div>
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shrink-0">
                {['all', 'veg', 'non-veg'].map(type => (
                  <button key={type} onClick={() => setFilterVeg(type)}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterVeg === type ? 'bg-white text-black' : 'text-white/20 hover:text-white'}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shrink-0">
                <span className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/30 self-center">Spice:</span>
                {['all', '1', '2', '3'].map(spice => (
                  <button key={spice} onClick={() => setFilterSpice(spice)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black transition-all ${filterSpice === spice ? 'bg-primary text-white' : 'text-white/20 hover:text-white'}`}>
                    {spice === 'all' ? 'Any' : Array(Number(spice)).fill('🌶️').join('')}
                  </button>
                ))}
              </div>
              <button onClick={() => setFilterHalal(!filterHalal)}
                className={`px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${filterHalal ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-white/30'}`}>
                Halal Only
              </button>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide mb-16 border-b border-white/5 sticky top-24 z-30 bg-bg-main/90 backdrop-blur-xl">
          {categories.map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
              className={`whitespace-nowrap px-10 py-4 rounded-full border transition-all font-black uppercase tracking-[0.2em] text-[10px] ${activeCategory === cat ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/30' : 'border-white/10 hover:border-white/30 text-white/40'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          <AnimatePresence mode="popLayout">
            {filteredItems.length > 0 ? filteredItems.map(item => (
              <MotionDiv key={item.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-secondary/20 rounded-[40px] overflow-hidden border border-white/5 hover:border-primary/50 transition-all shadow-3xl hover:-translate-y-2">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={getMenuItemImage(item)} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    {(item.is_veg ?? item.isVeg) && <div className="px-3 py-1 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">Vegetarian</div>}
                    {(item.is_halal ?? item.isHalal) && <div className="px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">Halal Certified</div>}
                  </div>
                  <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
                    <div className={`w-6 h-6 border-2 rounded-sm flex items-center justify-center p-0.5 ${(item.is_veg ?? item.isVeg) ? 'border-green-500' : 'border-red-500'}`}>
                      <div className={`w-full h-full rounded-full ${(item.is_veg ?? item.isVeg) ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    {(item.spice_level ?? item.spiceLevel ?? 0) > 0 && (
                      <div className="flex gap-0.5 bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                        {Array(item.spice_level ?? item.spiceLevel ?? 0).fill(0).map((_, i) => <span key={i} className="text-[10px]">🌶️</span>)}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 text-[10px] font-black text-white/90 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full uppercase tracking-widest border border-white/10">
                    <Clock size={12} className="text-primary" /> {item.prep_time} min
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight">{item.name}</h3>
                    <span className="text-2xl font-bold text-primary font-heading">${Number(item.price).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed mb-10 h-12 line-clamp-2 font-medium">{item.desc}</p>
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => {
                        addToCart({
                          id: item.id, _id: item._id, name: item.name, price: item.price,
                          category: item.category, image: item.image, image_url: item.image_url,
                        });
                      }}
                      disabled={!item.available || item.stock <= 0}
                      className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl ${item.available && item.stock > 0 ? 'bg-white/5 border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:border-primary text-white' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                      {item.available && item.stock > 0 ? 'Add To Box' : item.stock <= 0 ? 'Out of Stock' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </MotionDiv>
            )) : (
              <div className="col-span-full py-32 text-center text-white/20 font-black uppercase tracking-[0.5em]">No items match your filters</div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

// ─── Welcome Blurb ────────────────────────────────────────────────────────────
const WelcomeBlurb = () => (
  <section className="section-padding bg-bg-main relative overflow-hidden">
    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
    <div className="container grid lg:grid-cols-2 gap-20 items-center">
      <MotionDiv initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
        <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Our Artisanal Roots</span>
        <h2 className="text-5xl md:text-7xl font-black font-heading mb-10 leading-tight">Heritage. Craft. <br />Deeply <span className="text-primary">Authentic.</span></h2>
        <p className="text-xl text-text-muted leading-relaxed mb-10">Biryani Box is more than a restaurant—it's a kinetic movement designed to cultivate and preserve the pure essence of Indian slow-cooking in a modern American landscape.</p>
        <p className="text-text-muted mb-12 leading-relaxed font-medium">Every grain of basmati is aged for 24 months, every masala is hand-pounded by our curators, and every shipment is a tribute to the flavor-craftsmen of the Nizam's court.</p>
        <div className="flex items-center gap-12">
          <div><p className="text-5xl font-black text-white">24</p><p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Masala Blends</p></div>
          <div className="w-px h-16 bg-white/10" />
          <div><p className="text-5xl font-black text-white">48h</p><p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Marination Hub</p></div>
        </div>
      </MotionDiv>
      <MotionDiv initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
        <div className="aspect-[4/5] rounded-[60px] overflow-hidden border border-white/10 shadow-3xl group">
          <img src={backgroundInterior} alt="Kitchen Artisan" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        </div>
        <div className="absolute -bottom-10 -left-10 bg-secondary p-10 rounded-[40px] border border-white/10 shadow-3xl max-w-sm">
          <p className="text-lg italic text-white/90 leading-relaxed font-serif">"The flavor-legacy of the Nizam's era, now synchronized with the modern Northeast grid."</p>
          <p className="mt-8 text-[12px] font-black uppercase tracking-[0.4em] text-primary">— Rabbani Basha</p>
        </div>
      </MotionDiv>
    </div>
  </section>
);

// ─── Promo Grid ───────────────────────────────────────────────────────────────
const PromoGrid = ({ navigate }) => (
  <section className="py-32 bg-bg-offset">
    <div className="container grid md:grid-cols-2 gap-10">
      <MotionDiv initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        className="p-16 rounded-[60px] bg-gradient-to-br from-primary to-primary-hover shadow-3xl shadow-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700"><Gift size={200} /></div>
        <h3 className="text-5xl font-black font-heading mb-6">Elite Nizam <br />Rewards Hub</h3>
        <p className="text-white/80 leading-relaxed text-lg mb-12 font-medium max-w-sm">Cultivate flavor-points with every artisanal shipment. Unlock exclusive territories and limited heritage spices.</p>
        <button onClick={() => navigate('/auth')} className="px-10 py-5 bg-white text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl">Initialize Membership</button>
      </MotionDiv>
      <MotionDiv initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        className="p-16 rounded-[60px] bg-secondary border border-white/5 shadow-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700"><Truck size={200} /></div>
        <h3 className="text-5xl font-black font-heading mb-6">Artisanal <br />Catering Grid</h3>
        <p className="text-text-muted leading-relaxed text-lg mb-12 font-medium max-w-sm">Synchronize our master curators with your global gathering. Bespoke menu designs from 50 to 5,000 guests.</p>
        <button onClick={() => navigate('/catering')} className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all">Request Deployment</button>
      </MotionDiv>
    </div>
  </section>
);

// ─── Testimonials ─────────────────────────────────────────────────────────────
const Testimonials = () => (
  <section className="py-32 bg-bg-main relative overflow-hidden">
    <div className="container">
      <div className="grid lg:grid-cols-2 gap-24 items-center">
        <div>
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Member Validation</span>
          <h2 className="text-5xl md:text-7xl font-black font-heading mb-12">Voices of the <br />True Connoisseurs</h2>
          <div className="space-y-10">
            {[
              { name: 'Anita S.', role: 'Scranton Foodie', text: "The Chicken Tikka Masala is legendary. It's like Bittoo's but with a modern artisan twist." },
              { name: 'Rahul V.', role: 'Biryani Critic', text: 'Truly the only place in the Northeast that understands the ritual of slow-cooked Dum Biryani.' },
            ].map((t, i) => (
              <div key={i} className="p-12 bg-secondary/20 border border-white/5 rounded-[40px] relative hover:border-primary/30 transition-all shadow-2xl group">
                <div className="absolute top-8 right-10 text-primary opacity-20 group-hover:opacity-100 transition-opacity"><Star size={32} /></div>
                <p className="text-xl text-white/80 mb-8 italic font-serif leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary">{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em]">{t.name}</p>
                    <p className="text-[10px] text-primary font-bold uppercase mt-1">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="bg-secondary/30 p-16 rounded-[60px] border border-white/5 shadow-3xl">
            <h3 className="text-4xl font-black font-heading mb-12">Deployment FAQs</h3>
            <div className="space-y-8">
              {[
                { q: 'Is the Biryani truly slow-cooked?', a: 'Absolutely. We navigate the 4-hour Dum process in sealed copper vessels with heavy clay lids.' },
                { q: 'Do you offer delivery to Dickson City?', a: 'Yes. Our logistics fleet serves Scranton, Dickson City, Dunmore, and the wider Northeast PA grid.' },
                { q: 'Can I book for high-decibel events?', a: 'We handle corporate deployments and gathering protocols for up to 5,000 guests.' },
              ].map((f, i) => (
                <details key={i} className="group border-b border-white/5 pb-8">
                  <summary className="list-none flex justify-between items-center cursor-pointer font-black uppercase tracking-[0.3em] text-[10px] text-white/40 hover:text-white transition-all">
                    {f.q}<ChevronRight className="group-open:rotate-90 transition-transform text-primary" size={20} />
                  </summary>
                  <p className="mt-8 text-sm text-text-muted leading-relaxed font-medium pl-2 border-l-2 border-primary/20">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Customer Announcements ──────────────────────────────────────────────────────
const CustomerAnnouncements = () => {
  const [items, setItems] = React.useState([]);
  const [busy,  setBusy]  = React.useState(true);
  React.useEffect(() => {
    announcementsAPI.getAll()
      .then(r => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setBusy(false));
  }, []);
  if (busy || items.length === 0) return null;

  const pBorder = p => p === 'urgent' ? 'border-red-500/40 bg-red-500/5' : p === 'high' ? 'border-orange-500/40 bg-orange-500/5' : 'border-primary/20 bg-primary/5';
  const pBadge  = p => p === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' : p === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-primary/20 text-primary border-primary/30';
  const icon    = a => a.is_festival ? '🎉' : a.has_offer ? '🎁' : a.priority === 'urgent' ? '🚨' : '📢';

  return (
    <section id="announcements" className="section-padding bg-secondary/20">
      <div className="container max-w-5xl mx-auto">
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-12">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Latest News</span>
          <h2 className="text-4xl md:text-5xl font-black font-heading mb-4">
            Announcements &amp; <span className="text-primary">Offers</span>
          </h2>
          <p className="text-text-muted text-base max-w-xl mx-auto">Stay updated with our latest deals, events and special news.</p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {items.map((a, i) => (
            <motion.div key={a._id}
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay: i * 0.07 }}
              className={`rounded-3xl border p-6 flex flex-col gap-4 ${pBorder(a.priority)}`}>

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-3xl shrink-0">{icon(a)}</span>
                  <div className="min-w-0">
                    <h3 className="text-white font-black text-base leading-tight">{a.title}</h3>
                    {a.is_festival && a.festival_name && (
                      <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{a.festival_name}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 ${pBadge(a.priority)}`}>
                  {a.priority}
                </span>
              </div>

              {/* Message */}
              <p className="text-text-muted text-sm leading-relaxed">{a.message}</p>

              {/* Offer block */}
              {a.has_offer && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black text-2xl">{a.offer_discount}% OFF</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      {a.offer_items?.includes('ALL') ? 'All Menu Items' : `${a.offer_items?.length || 0} Selected Items`}
                    </span>
                  </div>
                  <p className="text-[11px] text-primary/70 font-bold">🔖 Mention this offer when ordering to redeem!</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                <span className="text-[10px] text-text-muted">
                  {new Date(a.created_at).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}
                </span>
                {a.is_scheduled && a.scheduled_date && (
                  <span className="text-[10px] text-yellow-400 font-bold">
                    Active from {new Date(a.scheduled_date).toLocaleDateString('en-US',{day:'numeric',month:'short'})}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Customer Feedback ────────────────────────────────────────────────────────
const CustomerFeedback = () => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '', suggestion: '', category: 'general' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sf = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const categories = [
    { value: 'general',  label: '💬 General' },
    { value: 'food',     label: '🍛 Food Quality' },
    { value: 'service',  label: '⭐ Service' },
    { value: 'ambience', label: '✨ Ambience' },
    { value: 'delivery', label: '🚚 Delivery' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rating) { setError('Please select a star rating.'); return; }
    if (!form.mobile.trim()) { setError('Mobile number is required.'); return; }
    if (!form.email.trim()) { setError('Email address is required.'); return; }
    setLoading(true);
    try {
      await feedbackAPI.create({
        customer_name:  form.name,
        customer_email: form.email,
        mobile_number:  form.mobile,
        message:        form.message,
        suggestion:     form.suggestion,
        rating,
        category: form.category,
        source: 'customer_page',
      });
      setSubmitted(true);
    } catch (_) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setRating(0);
    setError('');
    setForm({ name: '', email: '', mobile: '', message: '', suggestion: '', category: 'general' });
  };

  return (
    <section id="feedback" className="section-padding bg-bg-main">
      <div className="container max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Your Voice Matters</span>
          <h2 className="text-5xl md:text-6xl font-black font-heading mb-6">Share Your <span className="text-primary">Experience.</span></h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">Your feedback goes directly to our management team and helps us serve you better.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-secondary/40 rounded-[40px] border border-white/5 p-10 md:p-16 shadow-3xl">
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ThumbsUp size={40} className="text-primary" />
              </div>
              <h4 className="text-3xl font-black mb-4 uppercase tracking-widest text-white">Thank You!</h4>
              <p className="text-text-muted font-medium mb-3">Your feedback has been sent to our team.</p>
              <p className="text-text-muted text-sm mb-10">We read every message and use it to improve your experience.</p>
              <button onClick={resetForm} className="text-primary font-black text-xs uppercase tracking-[0.4em] hover:underline">Leave Another Feedback</button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error */}
              {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">{error}</div>}

              {/* Star Rating */}
              <div className="text-center">
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-5">How would you rate us? *</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} className="transition-transform hover:scale-110">
                      <Star size={40} className={`transition-colors ${s <= (hovered || rating) ? 'fill-primary text-primary' : 'text-white/20'}`} />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-primary font-bold mt-3">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
                  </motion.p>
                )}
              </div>

              {/* Category */}
              <div>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-4">Feedback Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button key={c.value} type="button" onClick={() => setForm(p => ({ ...p, category: c.value }))}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${form.category === c.value ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/20'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Mobile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2 block">Your Name</label>
                  <input type="text" placeholder="e.g. Rahul Sharma" value={form.name} onChange={sf('name')}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none text-white text-sm placeholder:text-white/30" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2 block">Mobile Number *</label>
                  <input type="tel" required placeholder="e.g. 9876543210" value={form.mobile} onChange={sf('mobile')}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none text-white text-sm placeholder:text-white/30" />
                </div>
              </div>

              {/* Email — mandatory */}
              <div>
                <label className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2 block">
                  Email Address * <span className="text-primary text-[9px] normal-case font-normal">(owner may reply here)</span>
                </label>
                <input type="email" required placeholder="you@example.com" value={form.email} onChange={sf('email')}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none text-white text-sm placeholder:text-white/30" />
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2 block">Your Review *</label>
                <textarea required rows={4} placeholder="Tell us what you loved or how we can improve..."
                  value={form.message} onChange={sf('message')}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-sm placeholder:text-white/30 leading-relaxed" />
              </div>

              {/* Suggestions (optional) */}
              <div>
                <label className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-2 block">Suggestions (Optional)</label>
                <textarea rows={2} placeholder="Any suggestions to improve our service?"
                  value={form.suggestion} onChange={sf('suggestion')}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none text-white text-sm placeholder:text-white/30 leading-relaxed" />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || !rating}
                className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-primary-hover transition-all shadow-2xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={16} />}
                {loading ? 'Sending...' : 'Submit Feedback'}
              </button>

              {!rating && <p className="text-center text-[10px] text-red-400 font-bold">Please select a star rating to continue</p>}
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

// ─── Contact ──────────────────────────────────────────────────────────────────
const Contact = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', date_requested: '', guest_count: '', message: '' });
  const sf = f => e => setFormData(p => ({ ...p, [f]: e.target.value }));

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedbackAPI.create({ name: formData.name, email: formData.email, date_requested: formData.date_requested ? new Date(formData.date_requested) : null, guest_count: Number(formData.guest_count) || 1, message: formData.message });
      setFormSubmitted(true);
    } catch (_) { setFormSubmitted(true); }
  };

  return (
    <section id="contact" className="section-padding bg-bg-offset">
      <div className="container grid lg:grid-cols-2 gap-24 items-start">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Deployment Grid</span>
          <h2 className="text-5xl md:text-7xl font-black font-heading mb-12">Synchronize <br />Our <span className="text-primary">Curators.</span></h2>
          <div className="space-y-12">
            <div className="flex gap-8 items-start group">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-xl"><MapPin size={28} /></div>
              <div><h4 className="text-xl font-bold mb-3 uppercase tracking-widest text-white/90">Our Location</h4><p className="text-text-muted leading-relaxed font-medium">38 Waterford Rd,<br />Clarks Summit, PA 18411</p></div>
            </div>
            <div className="flex gap-8 items-start group">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-xl"><Phone size={28} /></div>
              <div>
                <h4 className="text-xl font-bold mb-3 uppercase tracking-widest text-white/90">Contact</h4>
                <p className="text-text-muted leading-relaxed font-medium">
                  <a href="tel:+15708401760" className="hover:text-primary transition-colors">(570) 840-1760</a><br />
                  <a href="https://www.biryani-box.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">www.biryani-box.com</a>
                </p>
              </div>
            </div>
            <div className="flex gap-8 items-start group">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-xl"><Clock size={28} /></div>
              <div><h4 className="text-xl font-bold mb-3 uppercase tracking-widest text-white/90">Hours</h4><p className="text-text-muted leading-relaxed font-medium">Mon – Sat: 11:30 AM — 10:00 PM<br />Sun: 12:00 PM — 9:00 PM</p></div>
            </div>
            <div className="pt-8 flex gap-6">
              <button className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"><Facebook size={20} className="text-primary" /><span className="text-[10px] font-black uppercase tracking-widest">Connect Facebook</span></button>
              <button className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"><Instagram size={20} className="text-primary" /><span className="text-[10px] font-black uppercase tracking-widest">Connect Instagram</span></button>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-secondary/40 p-12 md:p-16 rounded-[60px] border border-white/5 shadow-3xl">
          <h3 className="text-3xl font-black font-heading mb-10 text-white">Catering Reservation</h3>
          {formSubmitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
              <CheckCircle size={64} className="text-primary mx-auto mb-6" />
              <h4 className="text-2xl font-black mb-4 uppercase tracking-widest">Protocol Received!</h4>
              <p className="text-text-muted font-medium mb-10">Our deployment lead will synchronize with you shortly.</p>
              <button onClick={() => setFormSubmitted(false)} className="text-primary font-black text-xs uppercase tracking-[0.4em] hover:underline">Re-Initialize Token</button>
            </motion.div>
          ) : (
            <form className="space-y-6" onSubmit={handleContactSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="IDENTITY" value={formData.name} onChange={sf('name')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest" />
                <input required type="email" placeholder="SECURE EMAIL" value={formData.email} onChange={sf('email')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={formData.date_requested} onChange={sf('date_requested')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest" />
                <input type="number" placeholder="GUEST DENSITY" min="1" value={formData.guest_count} onChange={sf('guest_count')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest" />
              </div>
              <textarea placeholder="ADDITIONAL DEPLOYMENT INSTRUCTIONS..." rows="4" value={formData.message} onChange={sf('message')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest leading-loose" />
              <button className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.4em] text-xs rounded-2xl hover:bg-primary-hover transition-all shadow-2xl shadow-primary/20">Deliver Request</button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

// ─── Home (Main page assembly) ────────────────────────────────────────────────
const Home = () => {
  const { cart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="bg-bg-main">
      <Navbar />
      <Hero navigate={navigate} />
      <RestaurantVideo />
      <PopularItems />
      <AllItemsList />
      <MenuCategories />
      <WelcomeBlurb />
      <PromoGrid navigate={navigate} />
      <Testimonials />
      <CustomerAnnouncements />
      <CustomerFeedback />
      <Footer />

      {/* Cart Float Badge */}
      <AnimatePresence>
        {cart.length > 0 && (
          <MotionButton
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => navigate('/cart')}
            className="fixed bottom-10 right-10 z-[100] w-20 h-20 rounded-[30px] bg-primary text-white flex items-center justify-center shadow-3xl shadow-primary/30 hover:scale-110 transition-all border-4 border-white/10"
          >
            <ShoppingBag size={32} />
            <span className="absolute -top-3 -right-3 w-10 h-10 bg-white text-primary rounded-2xl flex items-center justify-center text-[14px] font-black shadow-2xl border-2 border-primary">
              {cart.length}
            </span>
          </MotionButton>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;