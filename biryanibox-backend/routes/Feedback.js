const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');

// GET /api/feedback
router.get('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { is_read, category } = req.query;
    const filter = {};
    if (is_read !== undefined) filter.is_read = is_read === 'true';
    if (category) filter.category = category;
    const feedback = await Feedback.find(filter)
      .populate('customer_id', 'name email')
      .populate('order_id', 'order_number')
      .sort({ created_at: -1 });
    res.json({ success: true, count: feedback.length, data: feedback });
  } catch (err) { next(err); }
});

// POST /api/feedback — any authenticated user or customer
router.post('/', async (req, res, next) => {
  try {
    const feedback = await Feedback.create(req.body);
    res.status(201).json({ success: true, data: feedback });
  } catch (err) { next(err); }
});

// PATCH /api/feedback/:id/read
router.patch('/:id/read', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, {
      is_read: true,
      read_by: req.user._id,
      read_at: new Date(),
    }, { new: true });
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, data: feedback });
  } catch (err) { next(err); }
});

// PATCH /api/feedback/mark-all-read
router.patch('/mark-all-read', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    await Feedback.updateMany({ is_read: false }, { is_read: true, read_by: req.user._id, read_at: new Date() });
    res.json({ success: true, message: 'All feedback marked as read' });
  } catch (err) { next(err); }
});

// DELETE /api/feedback/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Feedback deleted' });
  } catch (err) { next(err); }
});

module.exports = router;