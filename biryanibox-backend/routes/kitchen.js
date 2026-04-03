const express = require('express');
const router = express.Router();
const KitchenStation = require('../models/KitchenStation');
const ChefOrderAssignment = require('../models/ChefOrderAssignment');
const ChefShift = require('../models/ChefShift');
const ChefProfile = require('../models/ChefProfile');
const { protect, authorize } = require('../middleware/auth');

// ── STATIONS ──────────────────────────────────────────────────────

// GET /api/kitchen/stations
router.get('/stations', protect, async (req, res, next) => {
  try {
    const stations = await KitchenStation.find().sort({ name: 1 });
    res.json({ success: true, data: stations });
  } catch (err) { next(err); }
});

// GET /api/kitchen/stations/:id
router.get('/stations/:id', protect, async (req, res, next) => {
  try {
    const station = await KitchenStation.findById(req.params.id);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    const chef = await ChefProfile.findOne({ station_id: req.params.id }).populate('user_id', 'name');
    res.json({ success: true, data: { ...station.toObject(), assigned_chef: chef } });
  } catch (err) { next(err); }
});

// POST /api/kitchen/stations
router.post('/stations', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const station = await KitchenStation.create(req.body);
    res.status(201).json({ success: true, data: station });
  } catch (err) { next(err); }
});

// PUT /api/kitchen/stations/:id
router.put('/stations/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const station = await KitchenStation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    res.json({ success: true, data: station });
  } catch (err) { next(err); }
});

// PATCH /api/kitchen/stations/:id/assign
router.patch('/stations/:id/assign', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const profile = await ChefProfile.findOneAndUpdate(
      { user_id: req.body.chef_id },
      { station_id: req.params.id },
      { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Chef not found' });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// DELETE /api/kitchen/stations/:id
router.delete('/stations/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await KitchenStation.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ success: true, message: 'Station deactivated' });
  } catch (err) { next(err); }
});

// ── QUEUE ─────────────────────────────────────────────────────────

// GET /api/kitchen/queue
router.get('/queue', protect, async (req, res, next) => {
  try {
    const queue = await ChefOrderAssignment.find({ status: { $in: ['queued','cooking'] } })
      .populate('order_id', 'order_number table_number total status created_at')
      .populate('chef_id', 'name')
      .populate('station_id', 'name')
      .sort({ assigned_at: 1 });
    res.json({ success: true, count: queue.length, data: queue });
  } catch (err) { next(err); }
});

// POST /api/kitchen/assignments
router.post('/assignments', protect, authorize('owner','manager','captain'), async (req, res, next) => {
  try {
    const assignment = await ChefOrderAssignment.create(req.body);
    res.status(201).json({ success: true, data: assignment });
  } catch (err) { next(err); }
});

// PATCH /api/kitchen/assignments/:id/status
router.patch('/assignments/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'cooking') update.started_at = new Date();
    if (status === 'done') {
      update.completed_at = new Date();
      const assignment = await ChefOrderAssignment.findById(req.params.id);
      if (assignment) {
        const mins = (Date.now() - assignment.started_at) / 60000;
        const profile = await ChefProfile.findOne({ user_id: assignment.chef_id });
        if (profile) {
          const newAvg = profile.orders_completed > 0
            ? (profile.avg_prep_time_mins * profile.orders_completed + mins) / (profile.orders_completed + 1)
            : mins;
          await ChefProfile.findOneAndUpdate({ user_id: assignment.chef_id }, { $inc: { orders_completed: 1 }, avg_prep_time_mins: +newAvg.toFixed(2) });
        }
      }
    }
    const item = await ChefOrderAssignment.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PATCH /api/kitchen/assignments/:id/reassign
router.patch('/assignments/:id/reassign', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await ChefOrderAssignment.findByIdAndUpdate(
      req.params.id,
      { chef_id: req.body.chef_id, station_id: req.body.station_id, status: 'queued', started_at: null },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── SHIFTS ────────────────────────────────────────────────────────

// GET /api/kitchen/shifts
router.get('/shifts', protect, async (req, res, next) => {
  try {
    const { date } = req.query;
    const filter = {};
    if (date) { const d = new Date(date); filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) }; }
    const shifts = await ChefShift.find(filter)
      .populate('chef_id', 'name')
      .populate('station_id', 'name')
      .sort({ date: 1, start_time: 1 });
    res.json({ success: true, data: shifts });
  } catch (err) { next(err); }
});

// POST /api/kitchen/shifts
router.post('/shifts', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const shift = await ChefShift.create(req.body);
    res.status(201).json({ success: true, data: shift });
  } catch (err) { next(err); }
});

// PUT /api/kitchen/shifts/:id
router.put('/shifts/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const shift = await ChefShift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });
    res.json({ success: true, data: shift });
  } catch (err) { next(err); }
});

// DELETE /api/kitchen/shifts/:id
router.delete('/shifts/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    await ChefShift.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Shift removed' });
  } catch (err) { next(err); }
});

// ── PERFORMANCE ───────────────────────────────────────────────────

// GET /api/kitchen/leaderboard
router.get('/leaderboard', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const profiles = await ChefProfile.find()
      .populate('user_id', 'name avatar_url')
      .populate('station_id', 'name')
      .sort({ orders_completed: -1, avg_prep_time_mins: 1 })
      .limit(10);
    res.json({ success: true, data: profiles });
  } catch (err) { next(err); }
});

// GET /api/kitchen/load
router.get('/load', protect, async (req, res, next) => {
  try {
    const stations = await KitchenStation.find({ is_active: true });
    const result = [];
    for (const s of stations) {
      const active = await ChefOrderAssignment.countDocuments({ station_id: s._id, status: { $in: ['queued','cooking'] } });
      result.push({ station: s.name, capacity: s.capacity, active_orders: active, load_percent: +((active / s.capacity) * 100).toFixed(0) });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
