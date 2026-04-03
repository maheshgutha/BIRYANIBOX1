import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
import {
  ShoppingBag,
  X,
  Menu as MenuIcon,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Gift,
  ListOrdered,
  Clock,
  MapPin,
  Truck,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../context/useContextHooks';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [orderType, setOrderType] = useState('pickup');
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/#menu' },
    { name: 'Rewards', href: '/auth' },
    { name: 'Gift Cards', href: '/gift-cards' },
    { name: 'Catering', href: '/catering' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-bg-main/80 backdrop-blur-xl py-4 shadow-2xl border-b border-white/5' : 'py-6'}`}
    >
      <div className="container flex justify-between items-center">
        <a
          onClick={() => navigate('/')}
          className="text-3xl font-black flex items-center gap-2 group cursor-pointer"
        >
          <span className="text-primary group-hover:scale-110 transition-transform">BIRYANI</span>
          <span className="text-white">BOX</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 mr-4">
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderType === 'pickup' ? 'bg-primary text-white shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              <MapPin size={14} /> Pickup
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${orderType === 'delivery' ? 'bg-primary text-white shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              <Truck size={14} /> Delivery
            </button>
          </div>

          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => {
                if (link.href.includes('#') && window.location.pathname === '/') {
                  document
                    .getElementById(link.href.split('#')[1])
                    .scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate(link.href);
                }
              }}
              className="text-[10px] font-black hover:text-primary transition-colors uppercase tracking-[0.3em] text-white/60"
            >
              {link.name}
            </button>
          ))}

          <div className="flex items-center gap-4 pl-8 border-l border-white/10">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] bg-primary/10 px-3 py-2 rounded-full border border-primary/20">
              <Clock size={12} /> Open Now
            </div>

            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 text-white hover:text-primary transition-colors"
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-black flex items-center justify-center border-2 border-bg-main shadow-lg">
                  {cart.length}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 p-1.5 pr-4 rounded-full hover:border-primary/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden shadow-inner">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.role}`}
                      className="w-full h-full"
                      alt="User"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80 group-hover:text-primary">
                    {user.name.split(' ')[0]} Hub
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-white/30 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <MotionDiv
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-4 w-60 bg-secondary border border-white/10 rounded-2xl shadow-3xl p-2 z-50"
                    >
                      <button
                        onClick={() => {
                          navigate('/history');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white border-b border-white/5 mb-1"
                      >
                        <ListOrdered size={16} className="text-primary" /> My Orders
                      </button>
                      <button
                        onClick={() => {
                          navigate('/history');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white mb-1"
                      >
                        <Gift size={16} className="text-primary" /> My Rewards
                      </button>
                      <button
                        onClick={() => {
                          navigate('/auth');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                      >
                        <User size={16} className="text-primary" /> Profile Hub
                      </button>
                      <div className="h-px bg-white/5 my-2" />
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-red-500/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-red-500"
                      >
                        <LogOut size={16} /> Logout Hub
                      </button>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="text-[10px] font-black text-white uppercase tracking-[0.2em] hover:text-primary transition-colors border border-white/10 px-8 py-3 rounded-full hover:border-primary shadow-xl"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => navigate('/login')}
              className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-all group opacity-20 hover:opacity-100"
            >
              <ShieldCheck size={18} />
            </button>
          </div>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={32} /> : <MenuIcon size={32} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MotionDiv
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-bg-main z-50 p-10 flex flex-col"
          >
            <div className="flex justify-between items-center mb-16">
              <span className="text-2xl font-black">NAV HUB</span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={40} />
              </button>
            </div>
            <div className="space-y-6">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  className="block text-4xl font-black uppercase text-white/40 hover:text-primary text-left"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate(link.href);
                  }}
                >
                  {link.name}
                </button>
              ))}
            </div>
            <div className="mt-auto py-10 border-t border-white/5 space-y-4">
              <button onClick={() => navigate('/auth')} className="btn-primary w-full py-5 text-xl">
                Sign In Portal
              </button>
              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Truck size={16} /> Delivery
                </button>
                <button className="flex-1 py-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-primary border-primary/50">
                  <MapPin size={16} /> Pickup
                </button>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
