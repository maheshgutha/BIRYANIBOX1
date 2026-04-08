const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Apply for leave (captain, chef, manager, owner can apply)
router.post('/', protect, async (req, res, next) => {
  try {
    const { from_date, to_date, leave_type, reason } = req.body;
    if (!from_date || !to_date || !reason)
      return res.status(400).json({ success: false, message: 'from_date, to_date and reason are required' });

    const from = new Date(from_date);
    const to = new Date(to_date);
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    if (days < 1)
      return res.status(400).json({ success: false, message: 'to_date must be >= from_date' });

    const leave = await Leave.create({
      user_id: req.user._id,
      role: req.user.role,
      from_date: from,
      to_date: to,
      days,
      leave_type: leave_type || 'casual',
      reason,
    });
    await leave.populate('user_id', 'name email role');
    res.status(201).json({ success: true, data: leave });
  } catch (err) { next(err); }
});

// Get leaves - own leaves for captain/chef, all for manager/owner
router.get('/', protect, async (req, res, next) => {
  try {
    const { role: filterRole, status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    if (req.user.role === 'captain' || req.user.role === 'chef') {
      // Staff see only their own leaves
      filter.user_id = req.user._id;
    } else if (req.user.role === 'manager') {
      // Manager sees captain and chef leaves (+ their own)
      if (filterRole) {
        filter.role = filterRole;
      } else {
        filter.role = { $in: ['captain', 'chef', 'manager'] };
      }
    } else if (req.user.role === 'owner') {
      // Owner sees everyone
      if (filterRole) filter.role = filterRole;
    }

    const leaves = await Leave.find(filter)
      .populate('user_id', 'name email role')
      .populate('approved_by', 'name role')
      .sort({ created_at: -1 });

    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (err) { next(err); }
});

// Approve or reject a leave
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });

    const leave = await Leave.findById(req.params.id).populate('user_id', 'name role');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    // Permission: manager can approve captain/chef; owner can approve anyone
    if (req.user.role === 'manager') {
      if (!['captain', 'chef', 'manager'].includes(leave.role)) {
        return res.status(403).json({ success: false, message: 'Managers can only approve captain/chef/manager leaves' });
      }
    } else if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Not authorized to approve/reject leaves' });
    }

    leave.status = status;
    leave.approved_by = req.user._id;
    leave.approved_at = new Date();
    if (remarks) leave.remarks = remarks;
    await leave.save();
    await leave.populate('approved_by', 'name role');

    res.json({ success: true, data: leave });
  } catch (err) { next(err); }
});

// Delete own leave (only if pending)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (String(leave.user_id) !== String(req.user._id) && req.user.role !== 'owner')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (leave.status !== 'pending' && req.user.role !== 'owner')
      return res.status(400).json({ success: false, message: 'Can only delete pending leaves' });
    await leave.deleteOne();
    res.json({ success: true, message: 'Leave deleted' });
  } catch (err) { next(err); }
});

module.exports = router;