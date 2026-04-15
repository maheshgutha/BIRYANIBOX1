const express = require('express');
const router  = express.Router();
const WasteLog = require('../models/Wastelog');
const { protect, authorize } = require('../middleware/auth');

// GET /api/waste
router.get('/', protect, authorize('owner', 'manager', 'chef'), async (req, res, next) => {
  try {
    const { from, to, reason, item_type } = req.query;
    const filter = {};
    if (reason)    filter.reason    = reason;
    if (item_type) filter.item_type = item_type;
    if (from || to) {
      filter.created_at = {};
      if (from) filter.created_at.$gte = new Date(from);
      if (to)   filter.created_at.$lte = new Date(to);
    }
    const logs = await WasteLog.find(filter)
      .populate('ingredient_id', 'name unit')
      .populate('menu_item_id', 'name price')
      .populate('logged_by', 'name role')
      .sort({ created_at: -1 });
    const totalLoss = logs.reduce((s, l) => s + (l.total_loss || 0), 0);
    res.json({ success: true, count: logs.length, totalLoss, data: logs });
  } catch (err) { next(err); }
});

// POST /api/waste — log a new waste entry
router.post('/', protect, async (req, res, next) => {
  try {
    const { ingredient_id, menu_item_id, item_type, item_name, quantity_wasted,
            unit, unit_cost_at_time, reason, notes } = req.body;

    const total_loss = parseFloat(unit_cost_at_time || 0) * parseFloat(quantity_wasted || 0);

    const log = await WasteLog.create({
      ingredient_id: ingredient_id || undefined,
      menu_item_id:  menu_item_id  || undefined,
      item_type:     item_type     || 'ingredient',
      item_name,
      quantity_wasted: parseFloat(quantity_wasted),
      unit,
      unit_cost_at_time: parseFloat(unit_cost_at_time || 0),
      total_loss: parseFloat(total_loss.toFixed(2)),
      reason: reason || 'spoilage',
      notes,
      logged_by: req.user._id,
    });
    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
});

// DELETE /api/waste/:id
router.delete('/:id', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    await WasteLog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Waste log deleted' });
  } catch (err) { next(err); }
});

module.exports = router;