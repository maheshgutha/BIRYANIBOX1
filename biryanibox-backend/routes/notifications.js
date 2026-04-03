const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// GET /api/notifications
router.get('/', protect, async (req, res, next) => {
  try {
    const items = await Notification.find({ user_id: req.user._id })
      .sort({ created_at: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ user_id: req.user._id, is_read: false });
    res.json({ success: true, data: items, unreadCount });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all  (must be before /:id)
router.patch('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ user_id: req.user._id, is_read: false }, { is_read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { is_read: true }, { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// DELETE /api/notifications/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
