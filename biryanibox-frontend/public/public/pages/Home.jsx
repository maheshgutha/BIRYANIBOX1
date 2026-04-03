import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
const MotionButton = motion.button;
import {
  ShoppingBag,
  User,
  Menu as MenuIcon,
  X,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Gift,
  ListOrdered,
  Clock,
  MapPin,
  Truck,
  Facebook,
  Instagram,
  ArrowRight,
  Star,
  CheckCircle,
  Search,
  ChevronRight,
  Navigation,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/useContextHooks';
import { useCart } from '../context/useContextHooks';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Images
import heroBiryani from '../assets/hero-biryani.png';
import muttonBiryani from '../assets/mutton-biryani.png';
import chickenTikka from '../assets/chicken-tikka.png';
import rasmalai from '../assets/rasmalai.png';
import backgroundInterior from '../assets/background.png';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: 'Dahi Puri',
      subtitle: 'Street Flavor Redefined',
      desc: 'Crispy artisan shells filled with spiced potatoes, tangy yogurt, and mother’s secret chutneys.',
      image: backgroundInterior,
      tag: 'Limited Offer',
    },
    {
      title: 'Chicken Biryani',
      subtitle: 'The Royal Fragrance',
      desc: 'Saffron-infused long grain basmati rice layered with tender, marinated chicken and 24 traditional spices.',
      image: heroBiryani,
      tag: 'Best Seller',
    },
    {
      title: 'Mutton Nizam',
      subtitle: 'Heritage on a Plate',
      desc: 'A recipe passed down through generations of Nizams, slow-cooked to perfection in heavy copper pots.',
      image: muttonBiryani,
      tag: 'Premium Choice',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="relative h-screen flex items-center overflow-hidden pt-20">
      <AnimatePresence mode="wait">
        <MotionDiv
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={slides[currentSlide].image}
            alt="Promotion"
            className="w-full h-full object-cover opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/60 to-transparent" />
        </MotionDiv>
      </AnimatePresence>

      <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <MotionDiv
          key={`text-${currentSlide}`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 animate-pulse">
            {slides[currentSlide].tag}
          </span>
          <h2 className="text-[12px] font-bold text-white/50 uppercase tracking-[0.5em] mb-2">
            {slides[currentSlide].subtitle}
          </h2>
          <h1 className="text-7xl md:text-9xl font-black font-heading leading-tight mb-8">
            {slides[currentSlide].title.split(' ')[0]} <br />
            <span className="text-primary">{slides[currentSlide].title.split(' ')[1] || ''}</span>
          </h1>
          <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-lg">
            {slides[currentSlide].desc}
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}
              className="px-12 py-6 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-primary-hover transition-all shadow-3xl shadow-primary/20"
            >
              Order Online
            </button>
            <button className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-white/10 transition-all">
              View Rewards
            </button>
          </div>
        </MotionDiv>

        <MotionDiv
          key={`img-${currentSlide}`}
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: 'spring' }}
          className="hidden lg:block relative"
        >
          <div className="absolute inset-0 bg-primary/20 filter blur-[150px] rounded-full animate-pulse" />
          <img
            src={slides[currentSlide].image}
            alt="Dish"
            className="w-[85%] mx-auto relative z-10 filter drop-shadow-[0_45px_45px_rgba(229,138,48,0.4)]"
          />
        </MotionDiv>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-2 transition-all rounded-full ${currentSlide === i ? 'w-16 bg-primary' : 'w-4 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </section>
  );
};

const WelcomeBlurb = () => (
  <section className="section-padding bg-bg-main relative overflow-hidden">
    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
    <div className="container grid lg:grid-cols-2 gap-20 items-center">
      <MotionDiv
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">
          Our Artisanal Roots
        </span>
        <h2 className="text-5xl md:text-7xl font-black font-heading mb-10 leading-tight">
          Heritage. Craft. <br />
          Deeply <span className="text-primary">Authentic.</span>
        </h2>
        <p className="text-xl text-text-muted leading-relaxed mb-10">
          Biryani Box is more than a restaurant—it's a kinetic movement designed to cultivate and
          preserve the pure essence of Indian slow-cooking in a modern American landscape.
        </p>
        <p className="text-text-muted mb-12 leading-relaxed font-medium">
          Every grain of basmati is aged for 24 months, every masala is hand-pounded by our
          curators, and every shipment is a tribute to the flavor-craftsmen of the Nizam's court.
        </p>
        <div className="flex items-center gap-12">
          <div>
            <p className="text-5xl font-black text-white">24</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">
              Masala Blends
            </p>
          </div>
          <div className="w-px h-16 bg-white/10" />
          <div>
            <p className="text-5xl font-black text-white">48h</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">
              Marination Hub
            </p>
          </div>
        </div>
      </MotionDiv>
      <MotionDiv
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative"
      >
        <div className="aspect-[4/5] rounded-[60px] overflow-hidden border border-white/10 shadow-3xl group">
          <img
            src={backgroundInterior}
            alt="Kitchen Artisan"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          />
        </div>
        <div className="absolute -bottom-10 -left-10 bg-secondary p-10 rounded-[40px] border border-white/10 shadow-3xl max-w-sm">
          <p className="text-lg italic text-white/90 leading-relaxed font-serif">
            "The flavor-legacy of the Nizam's era, now synchronized with the modern Northeast grid."
          </p>
          <p className="mt-8 text-[12px] font-black uppercase tracking-[0.4em] text-primary">
            — Rabbani Basha
          </p>
        </div>
      </MotionDiv>
    </div>
  </section>
);

const MenuCategories = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVeg, setFilterVeg] = useState('all');
  const [filterSpice, setFilterSpice] = useState('all');
  const [filterHalal, setFilterHalal] = useState(false);
  const { addToCart } = useCart();
  const { menu } = useOrders();

  const categories = ['All', ...Array.from(new Set(menu.map((item) => item.category)))];

  const currentItems =
    activeCategory === 'All' ? menu : menu.filter((item) => item.category === activeCategory);

  const filteredItems = currentItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterVeg === 'all' ||
      (filterVeg === 'veg' && item.isVeg) ||
      (filterVeg === 'non-veg' && !item.isVeg);
    const matchesSpice = filterSpice === 'all' || item.spiceLevel === Number(filterSpice);
    const matchesHalal = !filterHalal || item.isHalal;
    return matchesSearch && matchesType && matchesSpice && matchesHalal;
  });

  const getMenuItemImage = (item) => {
    const imageMap = {
      'heroBiryani': heroBiryani,
      'muttonBiryani': muttonBiryani,
      'chickenTikka': chickenTikka,
      'rasmalai': rasmalai,
    };
    
    if (item.image && imageMap[item.image]) return imageMap[item.image];
    if (item.category === 'Biryani') return heroBiryani;
    if (item.category === 'Appetizers') return chickenTikka;
    if (item.category === 'Dessert') return rasmalai;
    if (item.category === 'Combos') return muttonBiryani;
    return heroBiryani;
  };

  return (
    <section id="menu" className="section-padding bg-bg-main">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
          <div>
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">
              Artisan Selection
            </span>
            <h2 className="text-5xl md:text-6xl font-black font-heading">
              Explore Our <span className="text-primary">Flavors.</span>
            </h2>
          </div>
          <div className="flex-1 max-w-2xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Finding your flavor identifier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-full text-sm font-bold focus:border-primary outline-none transition-all text-white placeholder:text-white/20"
                />
              </div>
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shrink-0">
                {['all', 'veg', 'non-veg'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterVeg(type)}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterVeg === type ? 'bg-white text-black' : 'text-white/20 hover:text-white'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shrink-0">
                <span className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/30 self-center">Spice:</span>
                {['all', '1', '2', '3'].map((spice) => (
                  <button
                    key={spice}
                    onClick={() => setFilterSpice(spice)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black transition-all ${filterSpice === spice ? 'bg-primary text-white' : 'text-white/20 hover:text-white'}`}
                  >
                    {spice === 'all' ? 'Any' : Array(Number(spice)).fill('🌶️').join('')}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setFilterHalal(!filterHalal)}
                className={`px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${filterHalal ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-white/30'}`}
              >
                Halal Only
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide mb-16 border-b border-white/5 sticky top-24 z-30 bg-bg-main/90 backdrop-blur-xl">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery('');
              }}
              className={`whitespace-nowrap px-10 py-4 rounded-full border transition-all font-black uppercase tracking-[0.2em] text-[10px] ${activeCategory === cat ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/30' : 'border-white/10 hover:border-white/30 text-white/40'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          <AnimatePresence mode="popLayout">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <MotionDiv
                  key={item.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-secondary/20 rounded-[40px] overflow-hidden border border-white/5 hover:border-primary/50 transition-all shadow-3xl hover:-translate-y-2"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={getMenuItemImage(item)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      {item.isVeg && (
                        <div className="px-3 py-1 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                          Vegetarian
                        </div>
                      )}
                      {item.isHalal && (
                        <div className="px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                          Halal Certified
                        </div>
                      )}
                    </div>
                    <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
                      <div
                        className={`w-6 h-6 border-2 rounded-sm flex items-center justify-center p-0.5 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}
                      >
                        <div
                          className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                      </div>
                      {item.spiceLevel > 0 && (
                        <div className="flex gap-0.5 bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                          {Array(item.spiceLevel).fill(0).map((_, i) => (
                            <span key={i} className="text-[10px]">🌶️</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 text-[10px] font-black text-white/90 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full uppercase tracking-widest border border-white/10">
                      <Clock size={12} className="text-primary" />{' '}
                      {item.prep_time} min
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight">
                        {item.name}
                      </h3>
                      <span className="text-2xl font-bold text-primary font-heading">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed mb-10 h-12 line-clamp-2 font-medium">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs text-text-muted">Stock: {item.stock}</div>
                      <button
                        onClick={() =>
                          addToCart({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            category: item.category,
                          })
                        }
                        disabled={!item.available || item.stock <= 0}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl ${item.available && item.stock > 0 ? 'bg-white/5 border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:border-primary text-white' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                      >
                        {item.available && item.stock > 0
                          ? 'Add To Box'
                          : item.stock <= 0
                            ? 'Out of Stock'
                            : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </MotionDiv>
              ))
            ) : (
              <div className="col-span-full py-32 text-center text-white/20 font-black uppercase tracking-[0.5em]">
                Awaiting Dispatch Hub Response...
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const PromoGrid = () => (
  <section className="py-32 bg-bg-offset">
    <div className="container grid md:grid-cols-2 gap-10">
      <MotionDiv
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="p-16 rounded-[60px] bg-gradient-to-br from-primary to-primary-hover shadow-3xl shadow-primary/20 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
          <Gift size={200} />
        </div>
        <h3 className="text-5xl font-black font-heading mb-6">
          Elite Nizam <br />
          Rewards Hub
        </h3>
        <p className="text-white/80 leading-relaxed text-lg mb-12 font-medium max-w-sm">
          Cultivate flavor-points with every artisansal shipment. Unlock exclusive territories and
          limited heritage spices.
        </p>
        <button className="px-10 py-5 bg-white text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl">
          Initialize Membership
        </button>
      </MotionDiv>

      <MotionDiv
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="p-16 rounded-[60px] bg-secondary border border-white/5 shadow-3xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700">
          <Truck size={200} />
        </div>
        <h3 className="text-5xl font-black font-heading mb-6">
          Artisanal <br />
          Catering Grid
        </h3>
        <p className="text-text-muted leading-relaxed text-lg mb-12 font-medium max-w-sm">
          Synchronize our master curators with your global gathering. Bespoke menu designs from 50
          to 5,000 guests.
        </p>
        <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
          Request Deployment
        </button>
      </MotionDiv>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-32 bg-bg-main relative overflow-hidden">
    <div className="container">
      <div className="grid lg:grid-cols-2 gap-24 items-center">
        <div>
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">
            Member Validation
          </span>
          <h2 className="text-5xl md:text-7xl font-black font-heading mb-12">
            Voices of the <br />
            True Connoisseurs
          </h2>
          <div className="space-y-10">
            {[
              {
                name: 'Anita S.',
                role: 'Scranton Foodie',
                text: 'The Chicken Tikka Masala is legendary. It’s like Bittoo’s but with a modern artisan twist.',
              },
              {
                name: 'Rahul V.',
                role: 'Biryani Critic',
                text: 'Truly the only place in the Northeast that understands the ritual of slow-cooked Dum Biryani.',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-12 bg-secondary/20 border border-white/5 rounded-[40px] relative hover:border-primary/30 transition-all shadow-2xl group"
              >
                <div className="absolute top-8 right-10 text-primary opacity-20 group-hover:opacity-100 transition-opacity">
                  <Star size={32} />
                </div>
                <p className="text-xl text-white/80 mb-8 italic font-serif leading-relaxed">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary">
                    {t.name.charAt(0)}
                  </div>
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
                {
                  q: 'Is the Biryani truly slow-cooked?',
                  a: 'Absoultely. We navigate the 4-hour Dum process in sealed copper vessels with heavy clay lids.',
                },
                {
                  q: 'Do you offer delivery to Dickson City?',
                  a: 'Yes. Our logistics fleet serves Scranton, Dickson City, Dunmore, and the wider Northeast PA grid.',
                },
                {
                  q: 'Can I book for high-decibel events?',
                  a: 'We handle corporate deployments and gathering protocols for up to 5,000 guests.',
                },
              ].map((f, i) => (
                <details key={i} className="group border-b border-white/5 pb-8">
                  <summary className="list-none flex justify-between items-center cursor-pointer font-black uppercase tracking-[0.3em] text-[10px] text-white/40 hover:text-white transition-all">
                    {f.q}
                    <ChevronRight
                      className="group-open:rotate-90 transition-transform text-primary"
                      size={20}
                    />
                  </summary>
                  <p className="mt-8 text-sm text-text-muted leading-relaxed font-medium pl-2 border-l-2 border-primary/20">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Contact = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  return (
    <section id="contact" className="section-padding bg-bg-offset">
      <div className="container grid lg:grid-cols-2 gap-24 items-start">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">
            Deployment Grid
          </span>
          <h2 className="text-5xl md:text-7xl font-black font-heading mb-12">
            Synchronize <br />
            Our <span className="text-primary">Curators.</span>
          </h2>

          <div className="space-y-12">
            <div className="flex gap-8 items-start group">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                <MapPin size={28} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-3 uppercase tracking-widest text-white/90">
                  Strategic Hub
                </h4>
                <p className="text-text-muted leading-relaxed font-medium">
                  123 Artisan Lane, Heritage Square,
                  <br />
                  Scranton, PA 18503
                </p>
              </div>
            </div>

            <div className="flex gap-8 items-start group">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                <Clock size={28} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-3 uppercase tracking-widest text-white/90">
                  Dispatch Hours
                </h4>
                <p className="text-text-muted leading-relaxed font-medium">
                  Mon - Sat: 11:30 AM — 10:00 PM
                  <br />
                  Sun: 12:00 PM — 9:00 PM
                </p>
              </div>
            </div>

            <div className="pt-8 flex gap-6">
              <button className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                <Facebook size={20} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Connect Facebook
                </span>
              </button>
              <button className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                <Instagram size={20} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Connect Instagram
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-secondary/40 p-12 md:p-16 rounded-[60px] border border-white/5 shadow-3xl"
        >
          <h3 className="text-3xl font-black font-heading mb-10 text-white">
            Catering Reservation
          </h3>
          {formSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <CheckCircle size={64} className="text-primary mx-auto mb-6" />
              <h4 className="text-2xl font-black mb-4 uppercase tracking-widest">
                Protocol Received!
              </h4>
              <p className="text-text-muted font-medium mb-10">
                Our deployment lead will synchronize with you shortly.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                className="text-primary font-black text-xs uppercase tracking-[0.4em] hover:underline"
              >
                Re-Initialize Token
              </button>
            </motion.div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                setFormSubmitted(true);
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="IDENTITY"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest"
                />
                <input
                  required
                  type="email"
                  placeholder="SECURE EMAIL"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="DATE (MM/DD)"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest"
                />
                <input
                  required
                  type="text"
                  placeholder="GUEST DENSITY"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest"
                />
              </div>
              <textarea
                placeholder="ADDITIONAL DEPLOYMENT INSTRUCTIONS..."
                rows="4"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 focus:border-primary outline-none text-white text-[10px] font-black uppercase tracking-widest leading-loose"
              ></textarea>
              <button className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.4em] text-xs rounded-2xl hover:bg-primary-hover transition-all shadow-2xl shadow-primary/20">
                Deliver Request
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

const Home = () => {
  const { cart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="bg-bg-main">
      <Navbar />
      <Hero />
      <MenuCategories />
      <WelcomeBlurb />
      <PromoGrid />
      <Testimonials />
      <Contact />
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
