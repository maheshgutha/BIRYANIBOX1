const express = require('express');
const router = express.Router();
const CateringOrder = require('../models/CateringOrder');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const items = await CateringOrder.find(filter).sort({ event_date: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await CateringOrder.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Catering order not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const item = await CateringOrder.create(req.body);
    res.status(201).json({ success: true, data: item, message: 'Catering request submitted. We will contact you shortly.' });
  } catch (err) { next(err); }
});

router.put('/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await CateringOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Catering order not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.patch('/:id/status', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await CateringOrder.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.patch('/:id/price', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await CateringOrder.findByIdAndUpdate(req.params.id, { total_price: req.body.total_price }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    const item = await CateringOrder.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Catering request deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
