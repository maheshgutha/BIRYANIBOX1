const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { protect, authorize } = require('../middleware/auth');

// POST /api/contact
router.post('/', async (req, res, next) => {
  try {
    const msg = await ContactMessage.create(req.body);
    res.status(201).json({ success: true, data: msg, message: 'Message received! We will contact you shortly.' });
  } catch (err) { next(err); }
});

// GET /api/contact
router.get('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const msgs = await ContactMessage.find(filter).sort({ created_at: -1 });
    res.json({ success: true, count: msgs.length, data: msgs });
  } catch (err) { next(err); }
});

// PATCH /api/contact/:id/status
router.patch('/:id/status', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: msg });
  } catch (err) { next(err); }
});

// DELETE /api/contact/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
