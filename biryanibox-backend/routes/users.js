const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users
router.get('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select('-password_hash -reset_token -reset_expire');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash -reset_token -reset_expire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// POST /api/users — owner can create any role; manager can only create captains
router.post('/', protect, async (req, res, next) => {
  try {
    const { role, password, password_hash, ...rest } = req.body;
    // Authorization check
    if (req.user.role === 'manager') {
      if (role !== 'captain') {
        return res.status(403).json({ success: false, message: 'Managers can only create captains' });
      }
    } else if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Not authorized to create users' });
    }
    const rawPassword = password || password_hash || 'BiryaniBox@123';
    const user = await User.create({ ...rest, role, password_hash: rawPassword });
    res.status(201).json({ success: true, data: { ...user.toObject(), password_hash: undefined } });
  } catch (err) { next(err); }
});

// PUT /api/users/:id — owner can update anyone; manager can update captains only
router.put('/:id', protect, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user.role === 'manager' && target.role !== 'captain') {
      return res.status(403).json({ success: false, message: 'Managers can only update captains' });
    }
    if (!['owner','manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { password_hash, password, ...updateData } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password_hash');
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { is_active: req.body.is_active }, { new: true }).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/password
router.patch('/:id/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user.role !== 'owner') {
      const match = await user.matchPassword(currentPassword);
      if (!match) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    user.password_hash = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id — owner only; cannot delete customers via manager
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target.role === 'owner') return res.status(400).json({ success: false, message: 'Cannot delete owner account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
});

// GET /api/users/:id/loyalty
router.get('/:id/loyalty', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('loyalty_points name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const transactions = await LoyaltyTransaction.find({ user_id: req.params.id }).sort({ created_at: -1 }).limit(20);
    res.json({ success: true, data: { points: user.loyalty_points, transactions } });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/loyalty
router.patch('/:id/loyalty', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { points, description } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { $inc: { loyalty_points: points } }, { new: true }).select('loyalty_points');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await LoyaltyTransaction.create({ user_id: req.params.id, type: 'adjust', points, description });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

module.exports = router;