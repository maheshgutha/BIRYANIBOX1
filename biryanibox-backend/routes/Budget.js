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


// POST /api/budget/bulk — import multiple entries (from Excel upload)
// Accepts JSON array: [{ title, amount, entry_type, category, date, notes, period }]
router.post('/bulk', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const rows = req.body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided' });
    }

    const VALID_TYPES     = ['expense', 'income'];
    const VALID_CATS      = ['rent','salary','utilities','supplies','marketing','maintenance','equipment','other'];
    const VALID_PERIODS   = ['daily','weekly','monthly','yearly','one-time'];

    const toInsert = [];
    const errors   = [];

    rows.forEach((row, i) => {
      const rowNum = i + 2; // Excel rows start at 2 (row 1 is header)
      const title      = String(row.title || row.Title || row.TITLE || '').trim();
      const amount     = parseFloat(row.amount || row.Amount || row.AMOUNT || 0);
      const entry_type = String(row.entry_type || row['Entry Type'] || row.type || 'expense').toLowerCase().trim();
      const category   = String(row.category || row.Category || 'other').toLowerCase().trim();
      const period     = String(row.period || row.Period || 'one-time').toLowerCase().trim();
      const date       = row.date || row.Date || new Date().toISOString();
      const notes      = String(row.notes || row.Notes || '').trim();

      if (!title)                           { errors.push(`Row ${rowNum}: Title is required`); return; }
      if (!amount || amount <= 0)           { errors.push(`Row ${rowNum}: Amount must be > 0`); return; }
      if (!VALID_TYPES.includes(entry_type)){ errors.push(`Row ${rowNum}: entry_type must be 'expense' or 'income'`); return; }

      toInsert.push({
        title,
        amount,
        entry_type,
        category:   VALID_CATS.includes(category)    ? category   : 'other',
        period:     VALID_PERIODS.includes(period)    ? period     : 'one-time',
        date:       new Date(date),
        notes,
        created_by: req.user._id,
      });
    });

    if (errors.length > 0 && toInsert.length === 0) {
      return res.status(400).json({ success: false, message: 'All rows have errors', errors });
    }

    const inserted = await BudgetEntry.insertMany(toInsert, { ordered: false });
    res.status(201).json({
      success: true,
      imported: inserted.length,
      skipped:  rows.length - toInsert.length,
      errors:   errors.length > 0 ? errors : undefined,
      message:  `Successfully imported ${inserted.length} entries${errors.length > 0 ? ` (${errors.length} rows skipped)` : ''}`,
    });
  } catch (err) { next(err); }
});

module.exports = router;