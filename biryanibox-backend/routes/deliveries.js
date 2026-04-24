const express  = require('express');
const router   = express.Router();
const Delivery = require('../models/Delivery');
const Order    = require('../models/Order');
const User     = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// GET /api/deliveries/available
router.get('/available', protect, async (req, res, next) => {
  try {
    const filter = { status: 'pending' };
    if (req.user.role === 'delivery') filter.rejected_by = { $nin: [req.user._id] };
    const items = await Delivery.find(filter)
      .populate({ path: 'order_id', select: 'order_number total items created_at delivery_address order_type status' })
      .sort({ order_placed_at: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// GET /api/deliveries/completed
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

// GET /api/deliveries/my-active
router.get('/my-active', protect, async (req, res, next) => {
  try {
    const item = await Delivery.findOne({
      driver_id: req.user._id,
      status: { $in: ['assigned', 'picked_up', 'in_transit'] },
    }).populate('order_id', 'order_number total items delivery_address status');
    res.json({ success: true, data: item || null });
  } catch (err) { next(err); }
});

// GET /api/deliveries/my-skipped — deliveries this rider skipped
router.get('/my-skipped', protect, authorize('delivery'), async (req, res, next) => {
  try {
    const items = await Delivery.find({ rejected_by: req.user._id })
      .populate('order_id', 'order_number total delivery_address')
      .sort({ updatedAt: -1 })
      .limit(30);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

// GET /api/deliveries/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const all      = await Delivery.find({ driver_id: req.user._id, status: 'delivered' });
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const todayD   = all.filter(d => new Date(d.delivered_at) >= today);
    const earnings = all.reduce((s, d) => s + (d.delivery_fee || 0), 0);
    const todayEarn= todayD.reduce((s, d) => s + (d.delivery_fee || 0), 0);
    const skipped  = await Delivery.countDocuments({ rejected_by: req.user._id });
    res.json({ success: true, data: {
      total_deliveries: all.length, today_deliveries: todayD.length,
      total_earnings: earnings, today_earnings: todayEarn, total_skipped: skipped,
    }});
  } catch (err) { next(err); }
});

// GET /api/deliveries/live-locations — for owner/manager live map
router.get('/live-locations', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const active = await Delivery.find({ status: { $in: ['assigned', 'picked_up', 'in_transit'] } })
      .populate('order_id', 'order_number total delivery_address')
      .populate('driver_id', 'name phone vehicle_type')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: active });
  } catch (err) { next(err); }
});

// PATCH /api/deliveries/:id/location — rider updates location
router.patch('/:id/location', protect, authorize('delivery'), async (req, res, next) => {
  try {
    const { lat, lng, address } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Not found' });
    if (delivery.driver_id?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    delivery.current_location = address || (lat && lng ? `${lat},${lng}` : delivery.current_location);
    if (lat) delivery.rider_lat = lat;
    if (lng) delivery.rider_lng = lng;
    await delivery.save();
    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

// GET /api/deliveries/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await Delivery.findById(req.params.id)
      .populate('order_id', 'order_number total items delivery_address status')
      .populate('driver_id', 'name phone');
    if (!item) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// POST /api/deliveries/:id/accept
router.post('/:id/accept', protect, authorize('delivery'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, status: 'pending' })
      .populate('order_id', 'order_number');
    if (!delivery) return res.status(400).json({ success: false, message: 'Delivery no longer available' });
    delivery.status = 'assigned';
    delivery.driver_id = req.user._id;
    delivery.assigned_at = new Date();
    await delivery.save();
    const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
    await Notification.insertMany(managers.map(u => ({
      user_id: u._id, type: 'delivery', title: '🚴 Rider Accepted Delivery',
      message: `${req.user.name} accepted Order #${delivery.order_id?.order_number || ''} — please dispatch when ready.`,
    })));
    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

// POST /api/deliveries/:id/skip — rider skips + notifies owner/manager
router.post('/:id/skip', protect, authorize('delivery'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order_id', 'order_number delivery_address');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    await Delivery.findByIdAndUpdate(req.params.id, { $addToSet: { rejected_by: req.user._id } }, { new: true });
    // Notify owner/manager of skip
    const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
    if (managers.length > 0) {
      await Notification.insertMany(managers.map(u => ({
        user_id: u._id, type: 'delivery', title: '⚠️ Rider Skipped Order',
        message: `${req.user.name} skipped Order #${delivery.order_id?.order_number || '—'} — Address: ${(delivery.delivery_address || '—').slice(0, 60)}. Please assign another rider.`,
      })));
    }
    res.json({ success: true, data: delivery, message: 'Order skipped. Managers notified.' });
  } catch (err) { next(err); }
});

// PATCH /api/deliveries/:id/dispatch
router.patch('/:id/dispatch', protect, authorize('captain', 'manager', 'owner'), async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate('order_id', 'order_number');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (!['assigned', 'pending'].includes(delivery.status))
      return res.status(400).json({ success: false, message: 'Delivery cannot be dispatched in its current state.' });
    delivery.captain_dispatched = true;
    delivery.dispatched_at = new Date();
    delivery.dispatched_by = req.user._id;
    await delivery.save();
    if (delivery.driver_id) {
      await Notification.create({
        user_id: delivery.driver_id, type: 'delivery',
        title: '✅ Order Dispatched — Go Pickup!',
        message: `Order #${delivery.order_id?.order_number || ''} dispatched by ${req.user.name}. Head to restaurant now!`,
      });
    }
    res.json({ success: true, data: delivery, message: 'Order dispatched. Rider can now pickup.' });
  } catch (err) { next(err); }
});

// PATCH /api/deliveries/:id/status
router.patch('/:id/status', protect, authorize('delivery', 'manager', 'owner', 'captain'), async (req, res, next) => {
  try {
    const { status, current_location } = req.body;
    const VALID = ['picked_up', 'in_transit', 'delivered', 'failed'];
    if (!VALID.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role === 'delivery' && delivery.driver_id?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your delivery' });
    // ENFORCE DISPATCH GATE for pickup
    if (status === 'picked_up' && req.user.role === 'delivery' && !delivery.captain_dispatched) {
      return res.status(403).json({
        success: false,
        message: 'Cannot pick up yet — waiting for captain/manager to dispatch this order. You will receive a notification when ready.',
      });
    }
    delivery.status = status;
    if (current_location) delivery.current_location = current_location;
    if (status === 'picked_up')  delivery.picked_up_at  = new Date();
    if (status === 'in_transit') delivery.in_transit_at = new Date();
    if (status === 'delivered')  delivery.delivered_at  = new Date();
    await delivery.save();
    if (status === 'delivered') {
      // Auto-advance the linked Order to 'paid' so customer tracking shows complete
      try {
        const linkedOrder = await Order.findById(delivery.order_id);
        if (linkedOrder && ['served', 'completed_cooking'].includes(linkedOrder.status)) {
          linkedOrder.status = 'paid';
          linkedOrder.paid_at = new Date();
          await linkedOrder.save();
          // Notify customer
          if (linkedOrder.customer_id) {
            await Notification.create({
              user_id: linkedOrder.customer_id, type: 'delivery',
              title: '🏠 Order Delivered!',
              message: `Your order #${linkedOrder.order_number || ''} has been delivered successfully. Enjoy your meal!`,
            });
          }
        }
      } catch (e) { console.error('[auto-paid]', e.message); }
      const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
      await Notification.insertMany(managers.map(u => ({
        user_id: u._id, type: 'delivery', title: '✅ Delivery Completed',
        message: `Order delivered by ${req.user.name}. Fee: $${delivery.delivery_fee || 0}`,
      })));
    }
    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

// GET /api/deliveries
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.driver_id) filter.driver_id = req.query.driver_id;
    if (req.user.role === 'delivery' && !req.query.driver_id && req.query.status !== 'pending')
      filter.driver_id = req.user._id;
    if (req.query.status === 'pending' && req.user.role === 'delivery')
      filter.rejected_by = { $nin: [req.user._id] };
    const items = await Delivery.find(filter)
      .populate({ path: 'order_id', select: 'order_number total delivery_address order_type status' })
      .populate('driver_id', 'name phone vehicle_type')
      .sort({ order_placed_at: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// POST /api/deliveries
router.post('/', protect, async (req, res, next) => {
  try {
    const delivery = await Delivery.create({ ...req.body, order_placed_at: new Date(), status: 'pending' });
    res.status(201).json({ success: true, data: delivery });
  } catch (err) { next(err); }
});

module.exports = router;