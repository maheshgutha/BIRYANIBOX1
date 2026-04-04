const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');

// GET /api/announcements — filter by role
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = { is_active: true };
    // Show announcements targeting the user's role
    filter.target_roles = { $in: [req.user.role] };
    const announcements = await Announcement.find(filter)
      .populate('created_by', 'name role')
      .sort({ created_at: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) { next(err); }
});

// GET /api/announcements/all — owner/manager see all
router.get('/all', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('created_by', 'name role')
      .sort({ created_at: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) { next(err); }
});

// POST /api/announcements
router.post('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const announcement = await Announcement.create({ ...req.body, created_by: req.user._id });
    res.status(201).json({ success: true, data: announcement });
  } catch (err) { next(err); }
});

// PUT /api/announcements/:id
router.put('/:id', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, data: announcement });
  } catch (err) { next(err); }
});

// DELETE /api/announcements/:id
router.delete('/:id', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) { next(err); }
});

module.exports = router;