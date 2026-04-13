const express  = require('express');
const router   = express.Router();
const Delivery = require('../models/Delivery');
const Order    = require('../models/Order');
const User     = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/deliveries/available
// ALL riders see ALL pending deliveries immediately when placed.
// Once a rider accepts (status→assigned), it disappears from this list.
// Frontend gates the Accept button until order.status === 'completed_cooking'.
router.get('/available', protect, async (req, res, next) => {
  try {
    const filter = { status: 'pending' };
    // Exclude deliveries this rider already skipped
    if (req.user.role === 'delivery') {
      filter.rejected_by = { $nin: [req.user._id] };
    }
    const items = await Delivery.find(filter)
      .populate({
        path: 'order_id',
        // Include ALL orders regardless of cooking status — let frontend gate it
        select: 'order_number total items created_at delivery_address order_type status',
      })
      .sort({ order_placed_at: 1 });

    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries/all-pending  — for riders: all delivery orders (cooking complete)
router.get('/all-pending', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({
      order_type: { $in: ['delivery', 'takeaway'] },
      status: 'completed_cooking',
    }).populate('customer_id', 'name phone').sort({ created_at: -1 });
    res.json({ success: true, count: orders.length, data: orders });
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
    }).populate('order_id', 'order_number total items delivery_address');
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
      .populate('order_id', 'order_number total items delivery_address')
      .populate('driver_id', 'name phone');
    if (!item) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── POST /api/deliveries/:id/accept  — rider accepts: becomes theirs only
router.post('/:id/accept', protect, authorize('delivery'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (delivery.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Delivery already taken' });
    // Verify cooking is complete before allowing accept
    if (delivery.order_id) {
      const ord = await Order.findById(delivery.order_id);
      if (ord && !['completed_cooking', 'served', 'paid'].includes(ord.status)) {
        return res.status(400).json({ success: false, message: 'Order is still being cooked. Please wait for kitchen to complete.' });
      }
    }
    delivery.status = 'assigned';
    delivery.driver_id = req.user._id;
    delivery.assigned_at = new Date();
    await delivery.save();
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

// ── PATCH /api/deliveries/:id/status  — advance delivery status
router.patch('/:id/status', protect, authorize('delivery', 'manager', 'owner'), async (req, res, next) => {
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

    delivery.status = status;
    if (status === 'picked_up')  delivery.picked_up_at  = new Date();
    if (status === 'in_transit') delivery.in_transit_at = new Date();
    if (status === 'delivered')  delivery.delivered_at  = new Date();
    await delivery.save();
    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries — list with optional ?status= filter
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    // Riders only see their own assigned deliveries in general list
    if (req.user.role === 'delivery' && req.query.status !== 'pending') {
      filter.driver_id = req.user._id;
    }
    const items = await Delivery.find(filter)
      .populate({ path: 'order_id', select: 'order_number total delivery_address order_type status' })
      .populate('driver_id', 'name phone vehicle_type')
      .sort({ order_placed_at: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// ── GET /api/deliveries  — list with optional ?status= filter ─────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    // For pending status: all riders see all pending deliveries
    // For other statuses: riders only see their own
    if (req.user.role === 'delivery' && req.query.status !== 'pending') {
      filter.driver_id = req.user._id;
    }
    // Exclude skipped deliveries when fetching pending
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

// ── POST /api/deliveries  — create delivery record (auto on order)
router.post('/', protect, async (req, res, next) => {
  try {
    const delivery = await Delivery.create({
      ...req.body,
      order_placed_at: new Date(),
      status: 'pending',
    });
    res.status(201).json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

module.exports = router;