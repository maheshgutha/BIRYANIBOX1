const express = require('express');
const router  = express.Router();
const RestaurantTable = require('../models/RestaurantTable');
const User            = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ── Seed 9 tables on startup ───────────────────────────────────────────────
// Zone map:
//   Captain 1 → Tables 1, 2, 3   (regular)
//   Captain 2 → Tables 4, 5, 6   (regular)
//   Captain 3 → VIP 1, VIP 2, VIP 3  (vip)
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
      { table_number: 7, label: 'VIP 1',   capacity: 10, type: 'vip',     status: 'available', is_active: true },
      { table_number: 8, label: 'VIP 2',   capacity: 12, type: 'vip',     status: 'available', is_active: true },
      { table_number: 9, label: 'VIP 3',   capacity: 8,  type: 'vip',     status: 'available', is_active: true },
    ];
    await RestaurantTable.insertMany(tables);
    console.log('[Tables] 9 tables seeded: Tables 1-6 + VIP 1-3');
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
    // Identify zone type
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
//   { zone: 3, captain_id: "<id>" }  → assigns tables 7-9 (VIP)
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

module.exports = router;