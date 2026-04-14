const express = require('express');
const router  = express.Router();
const RestaurantTable = require('../models/RestaurantTable');
const User            = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ── Seed 9 tables on startup ───────────────────────────────────────────────
// Zone map:
//   Captain 1 → Tables 1, 2, 3   (regular)
//   Captain 2 → Tables 4, 5, 6   (regular)
//   Captain 3 → Tables 7, 8, 9   (regular/vip)
//   Captain 4 → no tables (delivery/pickup orders only)
async function seedTables() {
  try {
    const count = await RestaurantTable.countDocuments({ is_active: true });
    if (count >= 9) {
      console.log('[Tables] Tables already exist — skipping seed (captain assignments preserved)');
      return;
    }
    // Only seed from scratch if tables don't exist
    // Run utils/seed.js to fully reset with captain zone assignments
    const tables = [
      { table_number: 1, label: 'Table 1', capacity: 4,  type: 'regular', status: 'available', is_active: true },
      { table_number: 2, label: 'Table 2', capacity: 4,  type: 'regular', status: 'available', is_active: true },
      { table_number: 3, label: 'Table 3', capacity: 6,  type: 'regular', status: 'available', is_active: true },
      { table_number: 4, label: 'Table 4', capacity: 6,  type: 'regular', status: 'available', is_active: true },
      { table_number: 5, label: 'Table 5', capacity: 8,  type: 'regular', status: 'available', is_active: true },
      { table_number: 6, label: 'Table 6', capacity: 8,  type: 'regular', status: 'available', is_active: true },
      { table_number: 7, label: 'Table 7', capacity: 10, type: 'vip',     status: 'available', is_active: true },
      { table_number: 8, label: 'Table 8', capacity: 12, type: 'vip',     status: 'available', is_active: true },
      { table_number: 9, label: 'Table 9', capacity: 8,  type: 'vip',     status: 'available', is_active: true },
    ];
    await RestaurantTable.insertMany(tables);
    console.log('[Tables] 9 tables seeded: Tables 1-9');
    console.log('[Tables] NOTE: Run utils/seed.js to assign captains to their zones');
  } catch (err) {
    console.error('[Tables] Seed error:', err.message);
  }
}
seedTables();

// ── GET /api/tables  — all tables with captain ─────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const tables = await RestaurantTable.find({ is_active: true })
      .populate('captain_id', 'name email phone')
      .sort({ table_number: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (err) { next(err); }
});

// ── GET /api/tables/available ──────────────────────────────────────────────
router.get('/available', async (req, res, next) => {
  try {
    const tables = await RestaurantTable.find({ is_active: true, status: 'available' })
      .populate('captain_id', 'name')
      .sort({ table_number: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (err) { next(err); }
});

// ── GET /api/tables/my-tables  — captain's own tables ─────────────────────
router.get('/my-tables', protect, authorize('captain'), async (req, res, next) => {
  try {
    const tables = await RestaurantTable.find({ captain_id: req.user._id, is_active: true })
      .sort({ table_number: 1 });
    res.json({ success: true, data: tables });
  } catch (err) { next(err); }
});

// ── GET /api/tables/captain-zone/:captainId  — zone info for a captain ────
router.get('/captain-zone/:captainId', protect, async (req, res, next) => {
  try {
    const tables = await RestaurantTable.find({ captain_id: req.params.captainId, is_active: true })
      .sort({ table_number: 1 });
    const isDeliveryCaptain = tables.length === 0;
    res.json({
      success: true,
      data: {
        tables,
        tableNumbers: tables.map(t => t.table_number),
        isDeliveryCaptain,
        zoneLabel: isDeliveryCaptain
          ? 'Delivery & Pickup'
          : tables.map(t => t.label).join(', '),
      }
    });
  } catch (err) { next(err); }
});

// ── POST /api/tables  — create a new table (owner/manager only) ───────────
router.post('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { label, capacity, type, captain_id } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ success: false, message: 'Table label is required' });
    }

    // Check for duplicate label
    const existingLabel = await RestaurantTable.findOne({ label: label.trim() });
    if (existingLabel) {
      return res.status(400).json({ success: false, message: `A table with label "${label.trim()}" already exists` });
    }

    // Auto-assign next table_number
    const last = await RestaurantTable.findOne().sort({ table_number: -1 });
    const nextNumber = last ? last.table_number + 1 : 1;

    // Validate captain if provided
    if (captain_id) {
      const cap = await User.findOne({ _id: captain_id, role: 'captain' });
      if (!cap) return res.status(400).json({ success: false, message: 'User is not a captain' });
    }

    const table = await RestaurantTable.create({
      table_number: nextNumber,
      label: label.trim(),
      capacity: capacity || 4,
      type: type || 'regular',
      status: 'available',
      captain_id: captain_id || null,
      is_active: true,
    });

    const populated = await RestaurantTable.findById(table._id).populate('captain_id', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
});

// ── PATCH /api/tables/:id/status ──────────────────────────────────────────
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    // Captains can only update their own tables
    if (req.user.role === 'captain') {
      if (!table.captain_id || table.captain_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only update your assigned tables' });
      }
    }

    const updated = await RestaurantTable.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── PATCH /api/tables/:id/assign-captain ──────────────────────────────────
router.patch('/:id/assign-captain', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { captain_id } = req.body;
    if (captain_id) {
      const cap = await User.findOne({ _id: captain_id, role: 'captain' });
      if (!cap) return res.status(400).json({ success: false, message: 'User is not a captain' });
    }
    const table = await RestaurantTable.findByIdAndUpdate(
      req.params.id,
      { captain_id: captain_id || null },
      { new: true }
    ).populate('captain_id', 'name email');
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (err) { next(err); }
});

// ── POST /api/tables/assign-captains-bulk ─────────────────────────────────
// Supports zone-bulk assignment:
//   { zone: 1, captain_id: "<id>" }  → assigns tables 1-3
//   { zone: 2, captain_id: "<id>" }  → assigns tables 4-6
//   { zone: 3, captain_id: "<id>" }  → assigns tables 7-9
// OR traditional { assignments: [{ table_number, captain_id }] }
router.post('/assign-captains-bulk', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { assignments, zone, captain_id } = req.body;

    // Zone shortcut
    if (zone !== undefined && captain_id !== undefined) {
      const zoneMap = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
      };
      const tableNums = zoneMap[zone];
      if (!tableNums) return res.status(400).json({ success: false, message: 'Zone must be 1, 2, or 3' });
      if (captain_id) {
        const cap = await User.findOne({ _id: captain_id, role: 'captain' });
        if (!cap) return res.status(400).json({ success: false, message: 'User is not a captain' });
      }
      const results = [];
      for (const num of tableNums) {
        const t = await RestaurantTable.findOneAndUpdate(
          { table_number: num },
          { captain_id: captain_id || null },
          { new: true }
        ).populate('captain_id', 'name email');
        if (t) results.push(t);
      }
      return res.json({ success: true, data: results });
    }

    // Traditional assignments array
    if (!Array.isArray(assignments))
      return res.status(400).json({ success: false, message: 'assignments array required' });
    const results = [];
    for (const a of assignments) {
      const t = await RestaurantTable.findOneAndUpdate(
        { table_number: a.table_number },
        { captain_id: a.captain_id || null },
        { new: true }
      ).populate('captain_id', 'name email');
      if (t) results.push(t);
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// ── PATCH /api/tables/:id/assign-captain-tables ───────────────────────────
// Assign/unassign multiple tables to/from a captain at once
// Body: { table_ids: [id1, id2, ...], captain_id: "<id>" | null }
router.patch('/assign-captain-tables', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { table_ids, captain_id } = req.body;
    if (!Array.isArray(table_ids)) {
      return res.status(400).json({ success: false, message: 'table_ids array required' });
    }
    if (captain_id) {
      const cap = await User.findOne({ _id: captain_id, role: 'captain' });
      if (!cap) return res.status(400).json({ success: false, message: 'User is not a captain' });
    }
    const results = [];
    for (const id of table_ids) {
      const t = await RestaurantTable.findByIdAndUpdate(
        id,
        { captain_id: captain_id || null },
        { new: true }
      ).populate('captain_id', 'name email');
      if (t) results.push(t);
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// ── DELETE /api/tables/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    const table = await RestaurantTable.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, message: 'Table deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;