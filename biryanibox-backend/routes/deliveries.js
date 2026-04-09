const express = require('express');
const router  = express.Router();
const Delivery = require('../models/Delivery');
const User     = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/deliveries/available
// Returns all 'pending' deliveries not yet rejected by the requesting rider.
// Riders see only orders they haven't rejected. Owner/manager see all pending.
router.get('/available', protect, async (req, res, next) => {
  try {
    const filter = { status: 'pending' };
    if (req.user.role === 'delivery') {
      filter.rejected_by = { $nin: [req.user._id] };
    }
    const items = await Delivery.find(filter)
      .populate('order_id', 'order_number total items created_at')
      .sort({ order_placed_at: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries/completed
router.get('/completed', protect, async (req, res, next) => {
  try {
    const filter = { status: 'delivered' };
    if (req.user.role === 'delivery') filter.driver_id = req.user._id;
    const items = await Delivery.find(filter)
      .populate('order_id', 'order_number total')
      .populate('driver_id', 'name')
      .sort({ delivered_at: -1 });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries/my-active
// Returns the current rider's active (assigned / picked_up / in_transit) delivery
router.get('/my-active', protect, async (req, res, next) => {
  try {
    const item = await Delivery.findOne({
      driver_id: req.user._id,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] },
    }).populate('order_id', 'order_number total items');
    res.json({ success: true, data: item || null });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries/stats
// Rider earnings and delivery count
router.get('/stats', protect, async (req, res, next) => {
  try {
    const filter = { driver_id: req.user._id };
    const all    = await Delivery.find({ ...filter, status: 'delivered' });
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    const todayDeliveries = all.filter(d => new Date(d.delivered_at) >= today);
    const earnings        = all.reduce((s, d) => s + (d.delivery_fee || 0), 0);
    const todayEarnings   = todayDeliveries.reduce((s, d) => s + (d.delivery_fee || 0), 0);
    res.json({
      success: true,
      data: {
        total_deliveries: all.length,
        today_deliveries: todayDeliveries.length,
        total_earnings:   earnings,
        today_earnings:   todayEarnings,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries
router.get('/', protect, async (req, res, next) => {
  try {
    const { driver_id, status } = req.query;
    const filter = {};
    if (driver_id) filter.driver_id = driver_id;
    else if (req.user.role === 'delivery') filter.driver_id = req.user._id;
    if (status) filter.status = status;
    const items = await Delivery.find(filter)
      .populate('order_id', 'order_number total items created_at')
      .populate('driver_id', 'name phone')
      .sort({ order_placed_at: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await Delivery.findById(req.params.id)
      .populate('order_id')
      .populate('driver_id', 'name phone driver_rating');
    if (!item) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── POST /api/deliveries  (owner/manager create manual delivery)
router.post('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const item = await Delivery.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── PATCH /api/deliveries/:id/accept
// Rider self-assigns. Fails if already taken or if rider has another active delivery.
router.patch('/:id/accept', protect, async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (delivery.status !== 'pending') return res.status(400).json({ success: false, message: 'This delivery has already been accepted.' });

    // Check rider doesn't have another active delivery
    const existing = await Delivery.findOne({
      driver_id: req.user._id,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] },
    });
    if (existing) return res.status(400).json({ success: false, message: 'Complete your current delivery first.' });

    delivery.driver_id  = req.user._id;
    delivery.status     = 'assigned';
    delivery.accepted_at = new Date();
    await delivery.save();

    // Increment driver delivery_count
    await User.findByIdAndUpdate(req.user._id, { $inc: { delivery_count: 1 } });

    const populated = await delivery.populate([
      { path: 'order_id', select: 'order_number total items' },
      { path: 'driver_id', select: 'name phone' },
    ]);
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
});

// ── PATCH /api/deliveries/:id/reject
// Rider rejects — adds them to rejected_by so it hides from them
router.patch('/:id/reject', protect, async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (!delivery.rejected_by.includes(req.user._id)) {
      delivery.rejected_by.push(req.user._id);
      await delivery.save();
    }
    res.json({ success: true, message: 'Delivery skipped' });
  } catch (err) { next(err); }
});

// ── PATCH /api/deliveries/:id/status
// Rider updates status along the lifecycle
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, current_location } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    // Only the assigned rider or owner/manager can update
    if (
      req.user.role === 'delivery' &&
      String(delivery.driver_id) !== String(req.user._id)
    ) return res.status(403).json({ success: false, message: 'Not your delivery' });

    const update = { status };
    if (current_location) update.current_location = current_location;
    if (status === 'picked_up')  update.picked_up_at = new Date();
    if (status === 'delivered')  update.delivered_at = new Date();

    const updated = await Delivery.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('order_id', 'order_number total items')
      .populate('driver_id', 'name phone');
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── PATCH /api/deliveries/:id/assign  (manual assign by owner/manager)
router.patch('/:id/assign', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const item = await Delivery.findByIdAndUpdate(
      req.params.id,
      { driver_id: req.body.driver_id, status: 'assigned', accepted_at: new Date() },
      { new: true }
    ).populate('driver_id', 'name phone');
    if (!item) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

module.exports = router;