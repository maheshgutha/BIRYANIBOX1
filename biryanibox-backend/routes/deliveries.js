const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const { protect, authorize } = require('../middleware/auth');

// GET /api/deliveries/completed  (before /:id)
router.get('/completed', protect, async (req, res, next) => {
  try {
    const filter = { status: 'delivered' };
    if (req.user.role === 'delivery') filter.driver_id = req.user._id;
    const items = await Delivery.find(filter).populate('order_id', 'order_number total').populate('driver_id', 'name').sort({ delivered_at: -1 });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

// GET /api/deliveries
router.get('/', protect, async (req, res, next) => {
  try {
    const { driver_id, status } = req.query;
    const filter = {};
    if (driver_id) filter.driver_id = driver_id;
    else if (req.user.role === 'delivery') filter.driver_id = req.user._id;
    if (status) filter.status = status;
    const items = await Delivery.find(filter).populate('order_id', 'order_number total items').populate('driver_id', 'name phone').sort({ order_placed_at: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// GET /api/deliveries/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await Delivery.findById(req.params.id).populate('order_id').populate('driver_id', 'name phone driver_rating');
    if (!item) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// POST /api/deliveries
router.post('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await Delivery.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PATCH /api/deliveries/:id/status
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const update = { status: req.body.status };
    if (req.body.status === 'delivered') update.delivered_at = new Date();
    if (req.body.current_location) update.current_location = req.body.current_location;
    const item = await Delivery.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PATCH /api/deliveries/:id/assign
router.patch('/:id/assign', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await Delivery.findByIdAndUpdate(req.params.id, { driver_id: req.body.driver_id, status: 'assigned' }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

module.exports = router;
