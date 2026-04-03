const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');

// GET /api/menu
router.get('/', async (req, res, next) => {
  try {
    const { category, isVeg, isHalal, spiceLevel, search, available } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isVeg !== undefined) filter.is_veg = isVeg === 'true';
    if (isHalal !== undefined) filter.is_halal = isHalal === 'true';
    if (spiceLevel) filter.spice_level = Number(spiceLevel);
    if (available !== undefined) filter.is_available = available === 'true';
    if (search) filter.$text = { $search: search };
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// GET /api/menu/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// POST /api/menu
router.post('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PUT /api/menu/:id
router.put('/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PATCH /api/menu/:id/availability
router.patch('/:id/availability', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    item.is_available = !item.is_available;
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PATCH /api/menu/:id/stock
router.patch('/:id/stock', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { stock: req.body.stock }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// DELETE /api/menu/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
