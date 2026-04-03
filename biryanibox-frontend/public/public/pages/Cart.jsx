import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/useContextHooks';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ChevronLeft } from 'lucide-react';

const Cart = () => {
  const { cart, addToCart, removeFromCart, total } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-12">
      <div className="container max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-10 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Menu
        </button>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Items List */}
          <div className="flex-1 space-y-8">
            <h1 className="text-4xl font-bold font-heading">Your Flavor Box</h1>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 text-center bg-secondary/30 rounded-3xl border-2 border-dashed border-white/5"
                  >
                    <ShoppingBag size={48} className="mx-auto mb-4 text-text-muted opacity-20" />
                    <p className="text-text-muted font-bold uppercase tracking-widest text-xs">
                      The box is empty
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-6 text-primary font-bold hover:underline"
                    >
                      Start adding masterpieces
                    </button>
                  </motion.div>
                ) : (
                  cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-6 bg-secondary/40 p-6 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-bg-main border border-white/10 shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                        <p className="text-xs text-text-muted uppercase tracking-widest">
                          {item.category}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className="text-lg font-bold text-primary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-3 bg-bg-main/50 p-1.5 rounded-full border border-white/10">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Checkout Summary */}
          {cart.length > 0 && (
            <div className="w-full lg:w-80 h-fit bg-secondary/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl sticky top-12">
              <h2 className="text-xl font-bold font-heading mb-8">Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Service Fee</span>
                  <span>$2.00</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Delivery</span>
                  <span className="text-green-500 font-bold uppercase text-[10px]">Free</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-between items-center text-xl font-bold mb-8">
                <span>Total</span>
                <span className="text-primary">${(total + 2).toFixed(2)}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full py-5 flex items-center justify-center gap-3 group"
              >
                Checkout Terminal
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
