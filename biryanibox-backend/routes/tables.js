const express = require('express');
const router = express.Router();
const RestaurantTable = require('../models/RestaurantTable');
const { protect, authorize } = require('../middleware/auth');

// GET /api/tables
router.get('/', async (req, res, next) => {
  try {
    const tables = await RestaurantTable.find({ is_active: true }).sort({ label: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (err) { next(err); }
});

// POST /api/tables
router.post('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const table = await RestaurantTable.create(req.body);
    res.status(201).json({ success: true, data: table });
  } catch (err) { next(err); }
});

// PATCH /api/tables/:id/status
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const table = await RestaurantTable.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (err) { next(err); }
});

// DELETE /api/tables/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    const table = await RestaurantTable.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, message: 'Table removed' });
  } catch (err) { next(err); }
});

module.exports = router;
