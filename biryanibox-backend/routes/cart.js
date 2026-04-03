const express = require('express');
const router = express.Router();
const CartItem = require('../models/CartItem');
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth');

// GET /api/cart
router.get('/', protect, async (req, res, next) => {
  try {
    const items = await CartItem.find({ user_id: req.user._id }).populate('menu_item_id', 'name price image_url category is_available');
    const total = items.reduce((sum, i) => sum + (i.menu_item_id?.price || 0) * i.quantity, 0);
    res.json({ success: true, data: items, total: +total.toFixed(2) });
  } catch (err) { next(err); }
});

// POST /api/cart/items
router.post('/items', protect, async (req, res, next) => {
  try {
    const { menu_item_id, quantity = 1 } = req.body;
    const menuItem = await MenuItem.findById(menu_item_id);
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });
    if (!menuItem.is_available) return res.status(400).json({ success: false, message: 'Item not available' });
    const existing = await CartItem.findOne({ user_id: req.user._id, menu_item_id });
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return res.json({ success: true, data: existing });
    }
    const item = await CartItem.create({ user_id: req.user._id, menu_item_id, quantity });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PUT /api/cart/items/:menuItemId
router.put('/items/:menuItemId', protect, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      await CartItem.findOneAndDelete({ user_id: req.user._id, menu_item_id: req.params.menuItemId });
      return res.json({ success: true, message: 'Item removed' });
    }
    const item = await CartItem.findOneAndUpdate(
      { user_id: req.user._id, menu_item_id: req.params.menuItemId },
      { quantity }, { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// DELETE /api/cart/items/:menuItemId
router.delete('/items/:menuItemId', protect, async (req, res, next) => {
  try {
    await CartItem.findOneAndDelete({ user_id: req.user._id, menu_item_id: req.params.menuItemId });
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) { next(err); }
});

// DELETE /api/cart
router.delete('/', protect, async (req, res, next) => {
  try {
    await CartItem.deleteMany({ user_id: req.user._id });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
});

module.exports = router;
