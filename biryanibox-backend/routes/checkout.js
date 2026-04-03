const express = require('express');
const router = express.Router();
const CartItem = require('../models/CartItem');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const MenuItem = require('../models/MenuItem');
const MenuRecipe = require('../models/MenuRecipe');
const Ingredient = require('../models/Ingredient');
const GiftCard = require('../models/GiftCard');
const GiftCardTransaction = require('../models/GiftCardTransaction');
const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const { protect } = require('../middleware/auth');

// POST /api/checkout/validate
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

// GET /api/checkout/invoice/:orderId
router.get('/invoice/:orderId', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('customer_id', 'name email phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await OrderItem.find({ order_id: order._id });
    res.json({
      success: true,
      data: {
        invoice_number: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
        order,
        items,
        subtotal: order.total,
        tax: +(order.total * 0.05).toFixed(2),
        grand_total: +(order.total * 1.05).toFixed(2),
        issued_at: new Date()
      }
    });
  } catch (err) { next(err); }
});

// POST /api/checkout
router.post('/', protect, async (req, res, next) => {
  try {
    const { payment_method, address_id, gift_card_code, order_type, delivery_instructions } = req.body;
    const cartItems = await CartItem.find({ user_id: req.user._id }).populate('menu_item_id');
    if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

    let total = cartItems.reduce((s, i) => s + i.menu_item_id.price * i.quantity, 0);
    let giftCard = null;
    let giftCardUsed = 0;

    // Handle gift card
    if (gift_card_code) {
      giftCard = await GiftCard.findOne({ code: gift_card_code, status: 'active' });
      if (!giftCard) return res.status(400).json({ success: false, message: 'Invalid or expired gift card' });
      giftCardUsed = Math.min(giftCard.balance, total);
      total -= giftCardUsed;
    }

    // Stock check
    for (const ci of cartItems) {
      const recipes = await MenuRecipe.find({ menu_item_id: ci.menu_item_id._id }).populate('ingredient_id');
      for (const r of recipes) {
        if (r.ingredient_id && r.ingredient_id.stock < r.qty_per_serving * ci.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock: ${r.ingredient_id.name}` });
        }
      }
    }

    // Create order
    const order = await Order.create({
      customer_id: req.user._id,
      total: +total.toFixed(2),
      status: 'pending',
      order_type: order_type || 'delivery',
      payment_method: gift_card_code ? 'gift_card' : (payment_method || 'cash')
    });

    // Create order items + deduct ingredients
    for (const ci of cartItems) {
      await OrderItem.create({ order_id: order._id, menu_item_id: ci.menu_item_id._id, name: ci.menu_item_id.name, quantity: ci.quantity, unit_price: ci.menu_item_id.price });
      const recipes = await MenuRecipe.find({ menu_item_id: ci.menu_item_id._id });
      for (const r of recipes) {
        await Ingredient.findByIdAndUpdate(r.ingredient_id, { $inc: { stock: -(r.qty_per_serving * ci.quantity) } });
      }
    }

    // Gift card deduction
    if (giftCard && giftCardUsed > 0) {
      giftCard.balance -= giftCardUsed;
      if (giftCard.balance <= 0) giftCard.status = 'used';
      await giftCard.save();
      await GiftCardTransaction.create({ gift_card_id: giftCard._id, order_id: order._id, amount_used: giftCardUsed });
    }

    // Award loyalty points
    const points = Math.floor(order.total);
    await User.findByIdAndUpdate(req.user._id, { $inc: { loyalty_points: points, order_count: 1 } });
    await LoyaltyTransaction.create({ user_id: req.user._id, order_id: order._id, type: 'earn', points, description: `Points for order #${order.order_number}` });

    // Clear cart
    await CartItem.deleteMany({ user_id: req.user._id });

    res.status(201).json({ success: true, data: { order, message: 'Order placed successfully', loyalty_points_earned: points } });
  } catch (err) { next(err); }
});

module.exports = router;
