import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const MotionDiv = motion.div;
import {
  ShoppingBag, X, Menu as MenuIcon, ShieldCheck, ChevronDown,
  LogOut, ListOrdered, Clock, User, Star, UtensilsCrossed, Truck,
  Bell, LayoutDashboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../context/useContextHooks';

// ── Order type helpers ────────────────────────────────────────────────────────
// 'dinein' | 'delivery'
export const getOrderMode   = () => localStorage.getItem('bb_order_mode')  || 'dinein';
export const setOrderModeLS = (mode) => {
  localStorage.setItem('bb_order_mode', mode);
  window.dispatchEvent(new CustomEvent('bb_order_mode_change', { detail: mode }));
};

// Sub-type for delivery: 'pickup' | 'home_delivery'
export const getDeliveryType   = () => localStorage.getItem('bb_delivery_type') || 'pickup';
export const setDeliveryTypeLS = (t) => {
  localStorage.setItem('bb_delivery_type', t);
  window.dispatchEvent(new CustomEvent('bb_delivery_type_change', { detail: t }));
};

const Navbar = () => {
  const [isScrolled,       setIsScrolled]       = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen,    setIsProfileOpen]    = useState(false);
  const [orderMode,        setOrderMode]        = useState(getOrderMode);
  const { user, logout } = useAuth();
  const { cart }         = useCart();
  const navigate         = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const h = (e) => setOrderMode(e.detail);
    window.addEventListener('bb_order_mode_change', h);
    return () => window.removeEventListener('bb_order_mode_change', h);
  }, []);

  const handleModeChange = (mode) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setOrderMode(mode);
    setOrderModeLS(mode);
  };

  const navLinks = [
    { name: 'Home',         href: '/'             },
    { name: 'Menu',         href: '/#menu'        },
    { name: 'Reservations', href: '/reservations' },
    { name: 'Gift Cards',   href: '/gift-cards'   },
    { name: 'Catering',     href: '/catering'     },
  ];

  const handleNavClick = (href) => {
    if (href === '/') {
      // HOME — always scroll to top from anywhere on the page
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (href === '/#menu') {
      // MENU — reset category filter to "All", then scroll to menu section
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('bb_menu_reset'));
          document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
        }, 400);
      } else {
        window.dispatchEvent(new CustomEvent('bb_menu_reset'));
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (href.startsWith('/#')) {
      const sectionId = href.split('#')[1];
      if (window.location.pathname === '/') {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 400);
      }
    } else {
      navigate(href);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-bg-main/80 backdrop-blur-xl py-4 shadow-2xl border-b border-white/5' : 'py-6'}`}>
      <div className="container flex justify-between items-center">

        {/* Logo */}
        <a onClick={() => navigate('/')} className="text-3xl font-black flex items-center gap-2 group cursor-pointer">
          <span className="text-primary group-hover:scale-110 transition-transform">BIRYANI</span>
          <span className="text-white">BOX</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">

          {/* ── Dine-In / Delivery toggle ── */}
          {/* <div className="flex bg-white/5 p-1 rounded-full border border-white/10 mr-2">
            <button
              onClick={() => handleModeChange('dinein')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderMode === 'dinein' ? 'bg-primary text-white shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              <UtensilsCrossed size={13} /> Dine-In
            </button>
            <button
              onClick={() => handleModeChange('delivery')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderMode === 'delivery' ? 'bg-primary text-white shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              <Truck size={13} /> Delivery
            </button>
          </div> */}

          {/* Nav links */}
          {navLinks.map(link => (
            <button key={link.name} onClick={() => handleNavClick(link.href)}
              className="text-[10px] font-black hover:text-primary transition-colors uppercase tracking-[0.3em] text-white/60">
              {link.name}
            </button>
          ))}

          {/* Right actions */}
          <div className="flex items-center gap-4 pl-8 border-l border-white/10">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] bg-primary/10 px-3 py-2 rounded-full border border-primary/20">
              <Clock size={12} /> Open Now
            </div>

            {/* Cart */}
            <button onClick={() => navigate('/cart')} className="relative p-2 text-white hover:text-primary transition-colors">
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-black flex items-center justify-center border-2 border-bg-main shadow-lg">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Profile / Auth */}
            {user ? (
              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 p-1.5 pr-4 rounded-full hover:border-primary/50 transition-all group">
                  <div className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden shadow-inner">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full" alt="User" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80 group-hover:text-primary">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className={`text-white/30 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-4 w-64 bg-secondary border border-white/10 rounded-2xl shadow-3xl p-2 z-50">

                      {/* Profile Hub */}
                      <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white border-b border-white/5 mb-1">
                        <User size={16} className="text-primary" /> Profile Hub
                      </button>

                      {/* Staff dashboard link */}
                      {user.role && user.role !== 'customer' && (
                        <button onClick={() => { navigate('/dashboard'); setIsProfileOpen(false); }}
                          className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white border-b border-white/5 mb-1">
                          <LayoutDashboard size={16} className="text-primary" /> Dashboard
                        </button>
                      )}

                      {/* Logout */}
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 hover:bg-red-500/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-red-400/70 hover:text-red-400 mt-1">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all">
                <User size={13} /> Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg-main/95 backdrop-blur-xl border-t border-white/10 overflow-hidden">
            <div className="container py-6 flex flex-col gap-4">
              {/* Mode toggle mobile */}
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 self-start">
                <button onClick={() => handleModeChange('dinein')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderMode === 'dinein' ? 'bg-primary text-white' : 'text-white/40'}`}>
                  <UtensilsCrossed size={12} /> Dine-In
                </button>
                <button onClick={() => handleModeChange('delivery')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderMode === 'delivery' ? 'bg-primary text-white' : 'text-white/40'}`}>
                  <Truck size={12} /> Delivery
                </button>
              </div>
              {navLinks.map(link => (
                <button key={link.name} onClick={() => handleNavClick(link.href)}
                  className="text-left text-sm font-black uppercase tracking-widest text-white/60 hover:text-primary py-2 border-b border-white/5">
                  {link.name}
                </button>
              ))}
              {user ? (
                <>
                  <button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} className="text-left text-sm font-black uppercase tracking-widest text-white/60 hover:text-primary py-2 border-b border-white/5">Profile Hub</button>
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="text-left text-sm font-black uppercase tracking-widest text-red-400 py-2">Sign Out</button>
                </>
              ) : (
                <button onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }} className="text-left text-sm font-black uppercase tracking-widest text-primary py-2">Sign In</button>
              )}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

// ── Backward-compatible aliases (Checkout.jsx and Cart.jsx use old names) ──
export const getOrderType   = getOrderMode;
export const setOrderTypeLS = setOrderModeLS;