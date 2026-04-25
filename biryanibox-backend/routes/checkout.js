const express = require('express');
const router  = express.Router();
const CartItem         = require('../models/CartItem');
const Order            = require('../models/Order');
const OrderItem        = require('../models/OrderItem');
const MenuItem         = require('../models/MenuItem');
const MenuRecipe       = require('../models/MenuRecipe');
const Ingredient       = require('../models/Ingredient');
const GiftCard         = require('../models/GiftCard');
const GiftCardTransaction = require('../models/GiftCardTransaction');
const User             = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const Delivery         = require('../models/Delivery');
const { protect } = require('../middleware/auth');

// ── POST /api/checkout/validate
router.post('/validate', protect, async (req, res, next) => {
  try {
    const cartItems = await CartItem.find({ user_id: req.user._id }).populate('menu_item_id');
    if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty' });
    const issues = [];
    for (const ci of cartItems) {
      if (!ci.menu_item_id.is_available) {
        issues.push(`${ci.menu_item_id.name} is no longer available`);
        continue;
      }
      const recipes = await MenuRecipe.find({ menu_item_id: ci.menu_item_id._id }).populate('ingredient_id');
      for (const r of recipes) {
        if (r.ingredient_id && r.ingredient_id.stock < r.qty_per_serving * ci.quantity) {
          issues.push(`Insufficient stock for ${r.ingredient_id.name}`);
        }
      }
    }
    if (issues.length) return res.status(400).json({ success: false, issues });
    const total = cartItems.reduce((s, i) => s + i.menu_item_id.price * i.quantity, 0);
    res.json({ success: true, message: 'Cart is valid', total: +total.toFixed(2) });
  } catch (err) { next(err); }
});

// ── GET /api/checkout/invoice/:orderId
router.get('/invoice/:orderId', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('customer_id', 'name email phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await OrderItem.find({ order_id: order._id });

    // Use stored subtotal if available; fall back to order.total for legacy orders
    const subtotal = order.subtotal || order.total;

    res.json({
      success: true,
      data: {
        invoice_number:   `INV-${order._id.toString().slice(-8).toUpperCase()}`,
        order,
        items,
        subtotal,
        coupon_discount:    order.coupon_discount    || 0,
        gift_card_discount: order.gift_card_discount || 0,
        delivery_fee:       order.delivery_fee       || 0,
        grand_total:        order.total,
        issued_at:          new Date(),
      },
    });
  } catch (err) { next(err); }
});

// ── POST /api/checkout
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      payment_method,
      gift_card_code,
      order_type,          // 'delivery' | 'pickup' | 'dine-in'
      delivery_address,    // required when order_type === 'delivery'
      delivery_notes,
      knock_bell,          // true = ring bell/knock, false = do not disturb (delivery only)
      pickup_extra_items,  // extra items requested at pickup (e.g. spoons, sambar)
      // ── DISCOUNT FIELDS (sent from Checkout.jsx) ──────────────────────────
      coupon_code,         // reward coupon code used
      coupon_discount: rawCouponDiscount, // discount amount from reward coupon ($200 etc.)
    } = req.body;

    // Validate delivery address
    if (order_type === 'delivery' && !delivery_address) {
      return res.status(400).json({ success: false, message: 'Delivery address is required for delivery orders.' });
    }

    const cartItems = await CartItem.find({ user_id: req.user._id }).populate('menu_item_id');
    if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

    // ── 1. Calculate base subtotal from cart ──────────────────────────────
    const subtotal = +cartItems.reduce((s, i) => s + i.menu_item_id.price * i.quantity, 0).toFixed(2);

    // ── 2. Gift card handling ──────────────────────────────────────────────
    let giftCard     = null;
    let giftCardUsed = 0;
    if (gift_card_code) {
      giftCard = await GiftCard.findOne({ code: gift_card_code.toUpperCase().trim(), status: 'active' });
      if (!giftCard) return res.status(400).json({ success: false, message: 'Invalid or expired gift card' });
      if (giftCard.expiry_date && giftCard.expiry_date < new Date()) {
        giftCard.status = 'expired';
        await giftCard.save();
        return res.status(400).json({ success: false, message: 'Gift card has expired' });
      }
      // Deduct gift card BEFORE coupon so coupon applies to the already-reduced price
      giftCardUsed = +Math.min(giftCard.balance, subtotal).toFixed(2);
    }

    // ── 3. Reward coupon discount ──────────────────────────────────────────
    // Only trust non-negative values; cap at remaining price after gift card
    const afterGiftCard  = subtotal - giftCardUsed;
    const couponDiscount = +Math.max(0, Math.min(
      parseFloat(rawCouponDiscount) || 0,
      afterGiftCard
    )).toFixed(2);

    // ── 4. Delivery fee ────────────────────────────────────────────────────
    const DELIVERY_FEE = 40;
    const deliveryFee  = order_type === 'delivery' ? DELIVERY_FEE : 0;

    // ── 5. Final total ─────────────────────────────────────────────────────
    const finalTotal = +Math.max(0, subtotal - giftCardUsed - couponDiscount + deliveryFee).toFixed(2);

    // ── 6. Stock check ─────────────────────────────────────────────────────
    for (const ci of cartItems) {
      const recipes = await MenuRecipe.find({ menu_item_id: ci.menu_item_id._id }).populate('ingredient_id');
      for (const r of recipes) {
        if (r.ingredient_id && r.ingredient_id.stock < r.qty_per_serving * ci.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock: ${r.ingredient_id.name}` });
        }
      }
    }

    // ── 7. Determine payment method ────────────────────────────────────────
    let finalPaymentMethod = payment_method || 'cash';
    if (giftCardUsed > 0 && couponDiscount > 0) finalPaymentMethod = 'mixed';
    else if (giftCardUsed > 0) finalPaymentMethod = 'gift_card';

    // ── 8. Create order with correct total ────────────────────────────────
    const order = await Order.create({
      customer_id:        req.user._id,
      subtotal,                                    // pre-discount item total
      coupon_discount:    couponDiscount,           // reward coupon deduction
      gift_card_discount: giftCardUsed,             // gift card deduction
      delivery_fee:       deliveryFee,
      total:              finalTotal,               // ← CORRECT final amount
      coupon_code:        couponDiscount > 0 ? (coupon_code || null) : null,
      gift_card_code:     giftCardUsed > 0 ? gift_card_code : null,
      status:             'pending',
      order_type:         order_type || 'dine-in',
      payment_method:     finalPaymentMethod,
      delivery_address:   order_type === 'delivery' ? delivery_address : undefined,
      delivery_notes:     order_type === 'delivery' ? (delivery_notes || '') : undefined,
      knock_bell:         order_type === 'delivery' ? (knock_bell !== false) : undefined,
      pickup_extra_items: order_type === 'pickup' ? (pickup_extra_items || '') : undefined,
    });

    // ── 9. Create order items + deduct ingredients ─────────────────────────
    for (const ci of cartItems) {
      await OrderItem.create({
        order_id:     order._id,
        menu_item_id: ci.menu_item_id._id,
        name:         ci.menu_item_id.name,
        quantity:     ci.quantity,
        unit_price:   ci.menu_item_id.price,
      });
      const recipes = await MenuRecipe.find({ menu_item_id: ci.menu_item_id._id });
      for (const r of recipes) {
        await Ingredient.findByIdAndUpdate(r.ingredient_id, {
          $inc: { stock: -(r.qty_per_serving * ci.quantity) },
        });
      }
    }

    // ── 10. Commit gift card deduction ─────────────────────────────────────
    if (giftCard && giftCardUsed > 0) {
      giftCard.balance = +(giftCard.balance - giftCardUsed).toFixed(2);
      if (giftCard.balance <= 0) {
        giftCard.status = 'used';
        giftCard.redeemed_by_order_id = order._id;
        giftCard.redeemed_at = new Date();
      }
      await giftCard.save();
      await GiftCardTransaction.create({
        gift_card_id: giftCard._id,
        order_id:     order._id,
        amount_used:  giftCardUsed,
      });
    }

    // ── 11. Award loyalty points (based on final amount paid, not subtotal) ─
    const points = Math.floor(finalTotal);
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { loyalty_points: points, order_count: 1 },
    });
    await LoyaltyTransaction.create({
      user_id:     req.user._id,
      order_id:    order._id,
      type:        'earn',
      points,
      description: `Points for order #${order.order_number}`,
    });

    // ── 12. Auto-create delivery record ────────────────────────────────────
    let deliveryRecord = null;
    if (order_type === 'delivery') {
      const customer = await User.findById(req.user._id).select('name phone');
      deliveryRecord = await Delivery.create({
        order_id:         order._id,
        customer_id:      req.user._id,
        customer_name:    customer?.name || '',
        phone:            customer?.phone || '',
        delivery_address,
        delivery_notes:   delivery_notes || '',
        knock_bell:       knock_bell !== false,
        delivery_fee:     DELIVERY_FEE,
        status:           'pending',
        order_placed_at:  new Date(),
      });
    }

    // ── 13. Clear cart ──────────────────────────────────────────────────────
    await CartItem.deleteMany({ user_id: req.user._id });

    res.status(201).json({
      success: true,
      data: {
        order,
        delivery:              deliveryRecord,
        message:               'Order placed successfully',
        loyalty_points_earned: points,
        delivery_fee:          deliveryFee,
        // Discount summary for frontend confirmation screen
        discount_summary: {
          subtotal,
          coupon_discount:    couponDiscount,
          gift_card_discount: giftCardUsed,
          delivery_fee:       deliveryFee,
          final_total:        finalTotal,
        },
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;