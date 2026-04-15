const express = require('express');
const router  = express.Router();
const BudgetEntry = require('../models/BudgetEntry');
const { protect, authorize } = require('../middleware/auth');

// GET /api/budget — list all entries (owner/manager)
router.get('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { period, entry_type, from, to } = req.query;
    const filter = {};
    if (period)     filter.period     = period;
    if (entry_type) filter.entry_type = entry_type;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    const entries = await BudgetEntry.find(filter)
      .populate('created_by', 'name role')
      .sort({ date: -1 });
    res.json({ success: true, count: entries.length, data: entries });
  } catch (err) { next(err); }
});

// GET /api/budget/summary — totals for finance center
router.get('/summary', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    const entries = await BudgetEntry.find(filter);
    const totalExpenses = entries.filter(e => e.entry_type === 'expense').reduce((s, e) => s + e.amount, 0);
    const totalIncome   = entries.filter(e => e.entry_type === 'income').reduce((s, e) => s + e.amount, 0);
    res.json({ success: true, data: { totalExpenses, totalIncome, entries } });
  } catch (err) { next(err); }
});

// POST /api/budget — create a new entry
router.post('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const entry = await BudgetEntry.create({
      ...req.body,
      created_by: req.user._id,
      date: req.body.date ? new Date(req.body.date) : new Date(),
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
});

// PUT /api/budget/:id
router.put('/:id', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const entry = await BudgetEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
});

// DELETE /api/budget/:id
router.delete('/:id', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    await BudgetEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Budget entry deleted' });
  } catch (err) { next(err); }
});

module.exports = router;