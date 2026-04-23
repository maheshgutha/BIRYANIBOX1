const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const { protect, authorize } = require('../middleware/auth');

// All non-customer, non-owner staff roles a manager/owner can create
const SUPPORT_ROLES = ['servant', 'helper', 'cleaner', 'security'];
const MANAGER_ROLES = ['captain', 'chef', ...SUPPORT_ROLES];
const OWNER_ROLES   = ['manager', ...MANAGER_ROLES, 'delivery'];

// Helper: check if requester can manage target role
const canManage = (requesterRole, targetRole) => {
  if (requesterRole === 'owner')   return OWNER_ROLES.includes(targetRole);
  if (requesterRole === 'manager') return MANAGER_ROLES.includes(targetRole);
  return false;
};

// GET /api/users
router.get('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    // Manager can only see roles they manage (not customers)
    if (req.user.role === 'manager') {
      filter.role = { $in: role ? [role].filter(r => MANAGER_ROLES.includes(r)) : MANAGER_ROLES };
    }
    // Owner can see everyone including customers
    const users = await User.find(filter).select('-password_hash -reset_token -reset_expire');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
});

// GET /api/users/me — get own profile
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash -reset_token -reset_expire');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/users/me — update own profile (name, phone, avatar_url)
router.patch('/me', protect, async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'avatar_url'];
    const updateData = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updateData[field] = req.body[field]; });
    const updated = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true })
      .select('-password_hash -reset_token -reset_expire');
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// PATCH /api/users/me/password — change own password
router.patch('/me/password', protect, async (req, res, next) => {
  try {
    const { current_password, new_password, currentPassword, newPassword } = req.body;
    const curPass = current_password || currentPassword;
    const newPass = new_password || newPassword;
    if (!curPass || !newPass) return res.status(400).json({ success: false, message: 'current_password and new_password are required' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const match = await user.matchPassword(curPass);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    user.password_hash = newPass;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
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

// POST /api/users — create staff with full details
router.post('/', protect, async (req, res, next) => {
  try {
    const { role, password, password_hash, ...rest } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

    // Authorization check
    if (!canManage(req.user.role, role)) {
      return res.status(403).json({
        success: false,
        message: `Your role '${req.user.role}' cannot create users with role '${role}'`
      });
    }

    const rawPassword = password || password_hash || 'BiryaniBox@123';
    const user = await User.create({ ...rest, role, password_hash: rawPassword });
    const { password_hash: _, ...safeUser } = user.toObject();
    res.status(201).json({ success: true, data: safeUser });
  } catch (err) { next(err); }
});

// PUT /api/users/:id — update staff, including role change
router.put('/:id', protect, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const { password_hash, password, role: newRole, ...updateData } = req.body;

    // Check current role management permission
    if (!canManage(req.user.role, target.role)) {
      return res.status(403).json({ success: false, message: `Not authorized to update ${target.role}` });
    }

    // If role is being changed, check permission for new role too
    if (newRole && newRole !== target.role) {
      if (!canManage(req.user.role, newRole)) {
        return res.status(403).json({ success: false, message: `Not authorized to assign role '${newRole}'` });
      }
      updateData.role = newRole;
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .select('-password_hash -reset_token -reset_expire');
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/status — temporarily enable/disable staff
router.patch('/:id/status', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    if (!canManage(req.user.role, target.role)) {
      return res.status(403).json({ success: false, message: `Not authorized to manage ${target.role}` });
    }

    const { is_active, disabled_reason } = req.body;
    const updateData = {
      is_active,
      disabled_reason: is_active ? '' : (disabled_reason || 'Temporarily disabled'),
      disabled_at: is_active ? null : new Date(),
    };

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select('-password_hash');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/password
router.patch('/:id/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, current_password, new_password } = req.body;
    const curPass = currentPassword || current_password;
    const newPass = newPassword || new_password;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user.role !== 'owner') {
      const match = await user.matchPassword(curPass);
      if (!match) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    user.password_hash = newPass;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
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
router.patch('/:id/loyalty', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { points, description } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { $inc: { loyalty_points: points } }, { new: true }).select('loyalty_points');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await LoyaltyTransaction.create({ user_id: req.params.id, type: 'adjust', points, description });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

module.exports = router;