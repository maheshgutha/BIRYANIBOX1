const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) { const d = new Date(date); filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) }; }
    const items = await Reservation.find(filter).sort({ date: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await Reservation.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const item = await Reservation.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.patch('/:id/status', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.patch('/:id/table', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndUpdate(req.params.id, { table_assigned: req.body.table_assigned, status: 'confirmed' }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, message: 'Reservation deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
