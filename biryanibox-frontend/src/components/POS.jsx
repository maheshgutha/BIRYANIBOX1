import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
import { useOrders } from '../context/useContextHooks';
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  Bell,
  X,
  Package,
  User,
  Clock,
  DollarSign,
} from 'lucide-react';

// Images
import heroBiryani from '../assets/hero-biryani.png';
import muttonBiryani from '../assets/mutton-biryani.png';
import chickenTikka from '../assets/chicken-tikka.png';
import rasmalai from '../assets/rasmalai.png';

/* ─── Customer Notification Toast ─────────────────────────────────────────── */
const CustomerNotificationToast = ({ notification, onDismiss }) => {
  if (!notification) return null;
  const totalItems = notification.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <AnimatePresence>
      <MotionDiv
        key="customer-notif"
        initial={{ opacity: 0, y: -80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -80, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed top-6 right-6 z-[9999] w-[420px] bg-[#1a1a0e] border border-primary/40 rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden"
      >
        {/* Glow top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-yellow-400 to-primary animate-pulse" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary animate-bounce">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.25em]">
                  🎉 Order Confirmed!
                </p>
                <h3 className="text-white font-black text-lg leading-tight">
                  Your order is placed
                </h3>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Order Meta */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: Package, label: 'Order ID', value: `#${notification.orderId.slice(-6).toUpperCase()}` },
              { icon: User, label: 'Captain', value: notification.captain },
              { icon: Clock, label: 'Table', value: notification.table },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <Icon size={12} className="text-primary mb-1" />
                <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">{label}</p>
                <p className="text-xs text-white font-bold truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="bg-white/5 rounded-2xl border border-white/5 divide-y divide-white/5 mb-4 max-h-40 overflow-y-auto">
            {notification.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 text-primary text-[10px] font-black rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <span className="text-xs text-white/90 font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-primary">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total + Summary */}
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest">
              <DollarSign size={14} className="text-primary" />
              Total — {totalItems} item{totalItems > 1 ? 's' : ''}
            </div>
            <span className="text-primary text-xl font-black">${notification.total.toFixed(2)}</span>
          </div>

          <p className="text-[10px] text-text-muted text-center mt-3 uppercase tracking-widest">
            Sent to Owner & Manager Dashboards
          </p>
        </div>
      </MotionDiv>
    </AnimatePresence>
  );
};

/* ─── POS Component ────────────────────────────────────────────────────────── */
const POS = ({ user }) => {
  const { menu, createOrder, customerNotification, dismissCustomerNotification } = useOrders();
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState('Table 1');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPlaceOrderConfirm, setShowPlaceOrderConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);

  // Derive all categories from menu dynamically
  const categories = useMemo(() => {
    const cats = [...new Set(menu.map(i => i.category).filter(Boolean))];
    return cats;
  }, [menu]);

  // Auto-select first category when menu loads
  useEffect(() => {
    if (categories.length > 0 && !activeTab) setActiveTab(categories[0]);
  }, [categories]);

  const getCategoryImage = (item) => {
    if (item.image_url && item.image_url.startsWith('http')) return item.image_url;
    if (item.image && item.image.startsWith('http')) return item.image;
    const imageMap = { heroBiryani, muttonBiryani, chickenTikka, rasmalai };
    if (item.image && imageMap[item.image]) return imageMap[item.image];
    if (item.category === 'Biryani')    return heroBiryani;
    if (item.category === 'Appetizers') return chickenTikka;
    if (item.category === 'Breads')     return chickenTikka;
    if (item.category === 'Curries')    return chickenTikka;
    if (item.category === 'Dessert')    return rasmalai;
    if (item.category === 'Desserts')   return rasmalai;
    if (item.category === 'Combos')     return muttonBiryani;
    return heroBiryani;
  };

  const filteredMenu = activeTab
    ? menu.filter((item) => (item.category || '').toLowerCase() === activeTab.toLowerCase())
    : menu;

  const isItemAvailable = (item) => {
    const avail = item.is_available ?? item.available ?? true;
    return avail && (item.stock == null || item.stock > 0);
  };

  const addToCart = (item) => {
    if (!isItemAvailable(item)) return;
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find((i) => i.id === itemId);
    if (!existing) return;
    if (existing.quantity > 1) {
      setCart(cart.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)));
    } else {
      setCart(cart.filter((i) => i.id !== itemId));
    }
  };

  const rawTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = couponApplied ? (rawTotal * couponApplied.discount) / 100 : 0;
  const total = rawTotal - discount;

  // "Place an Order" opens a confirmation modal
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    setShowPlaceOrderConfirm(true);
  };

  // After confirmation, calls createOrder which fires the notification
  const confirmPlaceOrder = async () => {
    setShowPlaceOrderConfirm(false);
    const result = await createOrder(cart, selectedTable, user.name);
    if (result && result.error) {
      alert(result.error);
      return;
    }
    setCart([]);
    setCouponApplied(null);
    setCouponInput('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      {/* Customer Notification Toast – visible globally at top-right */}
      <CustomerNotificationToast
        notification={customerNotification}
        onDismiss={dismissCustomerNotification}
      />

      {/* Place-Order Confirmation Modal */}
      <AnimatePresence>
        {showPlaceOrderConfirm && (
          <MotionDiv
            key="confirm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
            onClick={() => setShowPlaceOrderConfirm(false)}
          >
            <MotionDiv
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1a0e] border border-primary/30 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Confirm Order</h3>
                  <p className="text-xs text-text-muted uppercase tracking-widest">
                    {selectedTable} · {cart.length} item type{cart.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Items summary */}
              <div className="bg-white/5 rounded-2xl border border-white/5 divide-y divide-white/5 mb-4 max-h-48 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary/20 text-primary text-xs font-black rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <span className="text-sm text-white font-medium">{item.name}</span>
                    </div>
                    <span className="text-primary font-bold text-sm">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {couponApplied && (
                <div className="flex justify-between items-center px-4 py-2 mb-2 bg-green-500/10 border border-green-500/20 rounded-xl text-sm">
                  <span className="text-green-400 font-bold">Coupon ({couponApplied.discount}% OFF)</span>
                  <span className="text-green-400 font-bold">-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl mb-6">
                <span className="text-text-muted font-bold uppercase tracking-widest text-xs">Total</span>
                <span className="text-primary text-2xl font-black">${total.toFixed(2)}</span>
              </div>

              <p className="text-xs text-text-muted text-center mb-6">
                Placing this order will notify the customer and send it to Owner & Manager dashboards.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPlaceOrderConfirm(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-bold uppercase tracking-widest text-text-muted hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPlaceOrder}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/20"
                >
                  Place Order
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-4 gap-8 h-[calc(100vh-160px)]">
        {/* ── Menu Area ── */}
        <div className="lg:col-span-3 space-y-8 overflow-y-auto pr-4 scrollbar-hide">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-bold font-heading mb-1 text-white">Gourmet Selection</h2>
              <p className="text-text-muted text-sm font-medium">
                Add premium boxes to the active booking.
              </p>
            </div>
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 bg-white/5 p-4 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted shrink-0">
              Target Table:
            </span>
            <div className="flex gap-2 font-bold shrink-0">
              {['Table 1', 'Table 2', 'VIP 1', 'VIP 2', 'Takeaway'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition-all border whitespace-nowrap ${selectedTable === t ? 'bg-primary text-white border-primary border-0' : 'bg-transparent text-text-muted border-white/10 hover:border-white/30'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {filteredMenu.map((item) => {
                const available = isItemAvailable(item);
                return (
                  <MotionDiv
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={available ? { y: -8 } : {}}
                    onClick={() => available && addToCart(item)}
                    className={`rounded-3xl border p-5 flex flex-col gap-4 relative overflow-hidden transition-all
                      ${available
                        ? 'bg-secondary/40 border-white/5 cursor-pointer group hover:border-primary/50'
                        : 'bg-white/3 border-white/5 cursor-not-allowed opacity-60'}`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary filter blur-3xl opacity-0 group-hover:opacity-10 transition-opacity" />

                    {/* UNAVAILABLE overlay badge */}
                    {!available && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span className="bg-red-600/90 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-red-500/50 shadow-lg rotate-[-10deg]">
                          Unavailable
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="aspect-video bg-bg-main rounded-2xl mb-4 overflow-hidden relative border border-white/5">
                        <img
                          src={getCategoryImage(item)}
                          alt={item.name}
                          className={`w-full h-full object-cover transition-transform duration-500 ${available ? 'group-hover:scale-110' : 'grayscale'}`}
                        />
                        <div className="absolute bottom-2 right-2 bg-primary/20 backdrop-blur-md text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20">
                          {item.category}
                        </div>
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-lg font-bold leading-tight ${available ? 'text-white group-hover:text-primary transition-colors' : 'text-white/50'}`}>
                          {item.name}
                        </h3>
                        <p className="text-lg font-bold text-white">${item.price}</p>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                        Authentic recipe crafted with premium saffron and heritage spices.
                      </p>
                    </div>
                    <button
                      disabled={!available}
                      className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all
                        ${available
                          ? 'bg-white/5 border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:border-primary'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400 cursor-not-allowed'}`}>
                      {available ? <><Plus size={16} /> Add to Box</> : 'Currently Unavailable'}
                    </button>
                  </MotionDiv>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Cart Area ── */}
        <div className="lg:col-span-1 bg-secondary/40 backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold font-heading text-white">Cart Summary</h3>
              <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-1">
                Status: Active Booking
              </p>
            </div>
            <span className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner relative">
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto mb-6 pr-2 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-30 space-y-4">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <Plus size={32} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">The Box is Empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <MotionDiv
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 group hover:border-primary/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-bg-main overflow-hidden border border-white/10 shrink-0">
                    <img src={getCategoryImage(item)} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    <p className="text-[10px] text-text-muted">{item.category}</p>
                    <p className="text-[10px] text-primary font-bold tracking-wider">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-bg-main/50 p-1.5 rounded-full border border-white/10">
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                      className="w-6 h-6 text-white flex items-center justify-center rounded-full hover:bg-red-500 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="w-6 h-6 text-white flex items-center justify-center rounded-full hover:bg-primary transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </MotionDiv>
              ))
            )}
          </div>

          {/* Coupon input */}
          {cart.length > 0 && (
            <div className="mb-4">
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                  <p className="text-xs text-green-400 font-bold">
                    🎉 {couponApplied.code} — {couponApplied.discount}% OFF
                  </p>
                  <button
                    onClick={() => setCouponApplied(null)}
                    className="text-text-muted hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code..."
                    className="flex-1 bg-bg-main/60 border border-white/10 rounded-xl text-xs text-white placeholder-text-muted px-3 py-2 outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (!couponInput.trim()) return;
                      // simple local check for demo
                      const knownCoupons = [
                        { code: 'BB-RX1-C5-VGK3', discount: 20 },
                      ];
                      const found = knownCoupons.find((c) => c.code === couponInput.trim());
                      if (found) {
                        setCouponApplied(found);
                        setCouponInput('');
                      } else {
                        alert('Invalid or already used coupon.');
                      }
                    }}
                    className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-primary-hover transition-all"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Bottom section ── */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-text-muted font-bold uppercase tracking-wider">
                <span>Service Table</span>
                <span className="text-white">{selectedTable}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between items-center text-xs text-green-400 font-bold">
                  <span>Discount ({couponApplied.discount}%)</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold text-white font-heading">
                <span>Settlement</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* PLACE AN ORDER button */}
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all shadow-xl text-sm ${
                cart.length === 0
                  ? 'bg-white/5 text-text-muted cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-primary to-yellow-500 text-white hover:shadow-primary/30 hover:scale-[1.02] active:scale-100'
              }`}
            >
              <CheckCircle size={22} />
              PLACE AN ORDER
            </button>
          </div>

          {/* Success toast */}
          <AnimatePresence>
            {showSuccess && (
              <MotionDiv
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-x-4 bottom-6 bg-green-500 text-white p-5 rounded-2xl shadow-2xl flex items-center gap-4 z-50 overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/50 animate-pulse" />
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm tracking-tight">Order Placed!</p>
                  <p className="text-[10px] font-medium opacity-90 uppercase tracking-widest">
                    Sent to Owner & Manager Dashboards
                  </p>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default POS;