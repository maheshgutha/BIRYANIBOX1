const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ChefProfile = require('../models/ChefProfile');
const ChefOrderAssignment = require('../models/ChefOrderAssignment');
const ChefShift = require('../models/ChefShift');
const { protect, authorize } = require('../middleware/auth');

// GET /api/chefs
router.get('/', protect, async (req, res, next) => {
  try {
    const { status } = req.query;
    const profileFilter = {};
    if (status) profileFilter.status = status;
    const profiles = await ChefProfile.find(profileFilter)
      .populate('user_id', 'name email phone avatar_url is_active')
      .populate('station_id', 'name');
    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (err) { next(err); }
});

// GET /api/chefs/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const profile = await ChefProfile.findOne({ user_id: req.params.id })
      .populate('user_id', 'name email phone avatar_url')
      .populate('station_id', 'name capacity');
    if (!profile) return res.status(404).json({ success: false, message: 'Chef not found' });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// POST /api/chefs
router.post('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { name, email, phone, password, specialization, experience_years, station_id } = req.body;
    const user = await User.create({ name, email, phone, password_hash: password || 'Chef@123', role: 'chef' });
    const profile = await ChefProfile.create({ user_id: user._id, specialization, experience_years, station_id });
    res.status(201).json({ success: true, data: { user, profile } });
  } catch (err) { next(err); }
});

// PUT /api/chefs/:id
router.put('/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { name, email, phone, specialization, experience_years, station_id } = req.body;
    if (name || email || phone) await User.findByIdAndUpdate(req.params.id, { name, email, phone });
    const profile = await ChefProfile.findOneAndUpdate(
      { user_id: req.params.id },
      { specialization, experience_years, station_id },
      { new: true }
    ).populate('user_id', 'name email').populate('station_id', 'name');
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// PATCH /api/chefs/:id/status
router.patch('/:id/status', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const profile = await ChefProfile.findOneAndUpdate(
      { user_id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Chef not found' });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// DELETE /api/chefs/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await ChefProfile.findOneAndDelete({ user_id: req.params.id });
    await User.findByIdAndUpdate(req.params.id, { is_active: false, role: 'customer' });
    res.json({ success: true, message: 'Chef removed' });
  } catch (err) { next(err); }
});

// GET /api/chefs/:id/queue
router.get('/:id/queue', protect, async (req, res, next) => {
  try {
    const assignments = await ChefOrderAssignment.find({ chef_id: req.params.id, status: { $in: ['queued','cooking'] } })
      .populate('order_id', 'order_number table_number total status items')
      .populate('station_id', 'name')
      .sort({ assigned_at: 1 });
    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
});

// GET /api/chefs/:id/shifts
router.get('/:id/shifts', protect, async (req, res, next) => {
  try {
    const shifts = await ChefShift.find({ chef_id: req.params.id })
      .populate('station_id', 'name')
      .sort({ date: 1 });
    res.json({ success: true, data: shifts });
  } catch (err) { next(err); }
});

// GET /api/chefs/:id/performance
router.get('/:id/performance', protect, async (req, res, next) => {
  try {
    const profile = await ChefProfile.findOne({ user_id: req.params.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Chef not found' });
    const completedToday = await ChefOrderAssignment.countDocuments({
      chef_id: req.params.id, status: 'done',
      completed_at: { $gte: new Date(new Date().setHours(0,0,0,0)) }
    });
    res.json({ success: true, data: { orders_completed: profile.orders_completed, avg_prep_time_mins: profile.avg_prep_time_mins, rating: profile.rating, completed_today: completedToday } });
  } catch (err) { next(err); }
});

module.exports = router;
