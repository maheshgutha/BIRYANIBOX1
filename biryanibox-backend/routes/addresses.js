const express = require('express');
const router = express.Router();
const Address = require('../models/Address');
const { protect } = require('../middleware/auth');

// Build address_line helper
const buildLine = (body) => {
  const parts = [body.street, body.city, body.state, body.pincode].filter(Boolean);
  return parts.length ? parts.join(', ') : (body.address_line || 'N/A');
};

// GET /api/addresses
router.get('/', protect, async (req, res, next) => {
  try {
    const items = await Address.find({ user_id: req.user._id }).sort({ is_default: -1 });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

// POST /api/addresses
router.post('/', protect, async (req, res, next) => {
  try {
    const { is_default } = req.body;
    if (is_default) {
      await Address.updateMany({ user_id: req.user._id }, { is_default: false });
    }
    const payload = {
      ...req.body,
      user_id: req.user._id,
      address_line: buildLine(req.body),
    };
    const item = await Address.create(payload);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PUT /api/addresses/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const payload = { ...req.body, address_line: buildLine(req.body) };
    const item = await Address.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      payload, { new: true, runValidators: false }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// PATCH /api/addresses/:id/default
router.patch('/:id/default', protect, async (req, res, next) => {
  try {
    await Address.updateMany({ user_id: req.user._id }, { is_default: false });
    const item = await Address.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { is_default: true }, { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// DELETE /api/addresses/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const item = await Address.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, message: 'Address removed' });
  } catch (err) { next(err); }
});

module.exports = router;