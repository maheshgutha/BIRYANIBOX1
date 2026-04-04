const express = require('express');
const router = express.Router();
const ShiftLog = require('../models/ShiftLog');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/shifts — list shifts (owner/manager see all, others see own)
router.get('/', protect, async (req, res, next) => {
  try {
    const { date, user_id, role, period } = req.query;
    const filter = {};

    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      filter.user_id = req.user._id;
    } else if (user_id) {
      filter.user_id = user_id;
    }

    if (date) filter.date = date;
    if (role) filter.role = role;

    if (period) {
      if (period === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        filter.check_in = { $gte: todayStart, $lte: todayEnd };
      } else if (period === 'weekly') {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        filter.check_in = { $gte: weekAgo };
      } else if (period === 'monthly') {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
        filter.check_in = { $gte: monthAgo };
      }
    }

    const shifts = await ShiftLog.find(filter)
      .populate('user_id', 'name role email phone')
      .sort({ created_at: -1 });
    res.json({ success: true, count: shifts.length, data: shifts });
  } catch (err) { next(err); }
});

// GET /api/shifts/active — currently checked-in staff
router.get('/active', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const shifts = await ShiftLog.find({ status: 'active' })
      .populate('user_id', 'name role email phone avatar_url');
    res.json({ success: true, data: shifts });
  } catch (err) { next(err); }
});

// POST /api/shifts/checkin
router.post('/checkin', protect, async (req, res, next) => {
  try {
    // Check if already checked in
    const existing = await ShiftLog.findOne({ user_id: req.user._id, status: 'active' });
    if (existing) return res.status(400).json({ success: false, message: 'Already checked in' });

    const shift = await ShiftLog.create({
      user_id: req.user._id,
      role: req.user.role,
      check_in: new Date(),
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      notes: req.body.notes || '',
    });
    res.status(201).json({ success: true, data: shift });
  } catch (err) { next(err); }
});

// PATCH /api/shifts/:id/checkout
router.patch('/:id/checkout', protect, async (req, res, next) => {
  try {
    const shift = await ShiftLog.findById(req.params.id);
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

    if (shift.user_id.toString() !== req.user._id.toString() &&
        !['owner', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const checkOut = new Date();
    const duration = Math.round((checkOut - shift.check_in) / 60000); // minutes

    const updated = await ShiftLog.findByIdAndUpdate(req.params.id, {
      check_out: checkOut,
      duration_minutes: duration,
      status: 'completed',
      notes: req.body.notes || shift.notes,
    }, { new: true }).populate('user_id', 'name role');

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// GET /api/shifts/my-active — get current user's active shift
router.get('/my-active', protect, async (req, res, next) => {
  try {
    const shift = await ShiftLog.findOne({ user_id: req.user._id, status: 'active' });
    res.json({ success: true, data: shift });
  } catch (err) { next(err); }
});

// POST /api/shifts — manual shift creation (owner/manager)
router.post('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const shift = await ShiftLog.create(req.body);
    res.status(201).json({ success: true, data: shift });
  } catch (err) { next(err); }
});

// DELETE /api/shifts/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await ShiftLog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Shift deleted' });
  } catch (err) { next(err); }
});

module.exports = router;