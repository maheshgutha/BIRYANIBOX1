const express  = require('express');
const router   = express.Router();
const Delivery = require('../models/Delivery');
const Order    = require('../models/Order');
const User     = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/deliveries/available
// Riders see deliveries that are pending AND not already assigned to someone else
router.get('/available', protect, async (req, res, next) => {
  try {
    const filter = { status: 'pending' };
    if (req.user.role === 'delivery') {
      filter.rejected_by = { $nin: [req.user._id] };
    }
    const items = await Delivery.find(filter)
      .populate({ path: 'order_id', select: 'order_number total items created_at delivery_address order_type status' })
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

// ── GET /api/deliveries/my-active  — current rider's active delivery
router.get('/my-active', protect, async (req, res, next) => {
  try {
    const item = await Delivery.findOne({
      driver_id: req.user._id,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] },
    }).populate('order_id', 'order_number total items delivery_address status');
    res.json({ success: true, data: item || null });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const all        = await Delivery.find({ driver_id: req.user._id, status: 'delivered' });
    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const todayD     = all.filter(d => new Date(d.delivered_at) >= today);
    const earnings   = all.reduce((s, d) => s + (d.delivery_fee || 0), 0);
    const todayEarn  = todayD.reduce((s, d) => s + (d.delivery_fee || 0), 0);
    res.json({ success: true, data: { total_deliveries: all.length, today_deliveries: todayD.length, total_earnings: earnings, today_earnings: todayEarn } });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await Delivery.findById(req.params.id)
      .populate('order_id', 'order_number total items delivery_address status')
      .populate('driver_id', 'name phone');
    if (!item) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── POST /api/deliveries/:id/accept  — rider accepts: becomes theirs; hides from all others
router.post('/:id/accept', protect, authorize('delivery'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, status: 'pending' });
    if (!delivery) return res.status(400).json({ success: false, message: 'Delivery no longer available — already taken' });

    delivery.status = 'assigned';
    delivery.driver_id = req.user._id;
    delivery.assigned_at = new Date();
    await delivery.save();

    // Notify owner/manager that rider accepted
    const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
    await Notification.insertMany(managers.map(u => ({
      user_id: u._id, type: 'delivery', title: '🚴 Rider Accepted Delivery',
      message: `${req.user.name} accepted Order #${delivery.order_id} — waiting for captain to dispatch.`,
    })));

    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

// ── POST /api/deliveries/:id/skip  — rider skips/rejects this delivery
router.post('/:id/skip', protect, authorize('delivery'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { rejected_by: req.user._id } },
      { new: true }
    );
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

// ── PATCH /api/deliveries/:id/dispatch  — captain marks order dispatched (enables rider pickup)
router.patch('/:id/dispatch', protect, authorize('captain', 'manager', 'owner'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate('order_id', 'order_number');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (delivery.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Delivery must be accepted by a rider before dispatch.' });
    }

    delivery.captain_dispatched = true;
    delivery.dispatched_at = new Date();
    delivery.dispatched_by = req.user._id;
    await delivery.save();

    // Notify the assigned rider
    if (delivery.driver_id) {
      await Notification.create({
        user_id: delivery.driver_id, type: 'delivery',
        title: '✅ Order Dispatched — Go Pickup!',
        message: `Order #${delivery.order_id?.order_number || ''} has been dispatched by captain. Please pick up the order now!`,
      });
    }

    res.json({ success: true, data: delivery, message: 'Order dispatched. Rider can now pickup.' });
  } catch (err) { next(err); }
});

// ── PATCH /api/deliveries/:id/status  — advance delivery status
router.patch('/:id/status', protect, authorize('delivery', 'manager', 'owner', 'captain'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID = ['picked_up', 'in_transit', 'delivered', 'failed'];
    if (!VALID.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Not found' });

    // Rider can only update their own delivery
    if (req.user.role === 'delivery' && delivery.driver_id?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your delivery' });

    // Rider cannot pickup until captain dispatches
    if (status === 'picked_up' && req.user.role === 'delivery' && !delivery.captain_dispatched)
      return res.status(400).json({ success: false, message: 'Cannot pickup until captain dispatches the order.' });

    delivery.status = status;
    if (status === 'picked_up')  { delivery.picked_up_at  = new Date(); delivery.in_transit_at = new Date(); }
    if (status === 'in_transit') delivery.in_transit_at = new Date();
    if (status === 'delivered')  delivery.delivered_at  = new Date();
    await delivery.save();

    // Notify managers on delivery complete
    if (status === 'delivered') {
      const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
      await Notification.insertMany(managers.map(u => ({
        user_id: u._id, type: 'delivery', title: '✅ Delivery Completed',
        message: `Order delivered by ${req.user.name}. Fee: $${delivery.delivery_fee || 0}`,
      })));
    }

    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries — list with optional ?status= filter
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === 'delivery' && req.query.status !== 'pending') {
      filter.driver_id = req.user._id;
    }
    if (req.query.status === 'pending' && req.user.role === 'delivery') {
      filter.rejected_by = { $nin: [req.user._id] };
    }
    const items = await Delivery.find(filter)
      .populate({ path: 'order_id', select: 'order_number total delivery_address order_type status' })
      .populate('driver_id', 'name phone vehicle_type')
      .sort({ order_placed_at: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// ── POST /api/deliveries  — create delivery record manually
router.post('/', protect, async (req, res, next) => {
  try {
    const delivery = await Delivery.create({ ...req.body, order_placed_at: new Date(), status: 'pending' });
    res.status(201).json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

module.exports = router;