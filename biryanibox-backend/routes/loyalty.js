const express = require('express');
const router = express.Router();
const LoyaltyTier = require('../models/LoyaltyTier');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/loyalty/tiers
router.get('/tiers', async (req, res, next) => {
  try {
    const tiers = await LoyaltyTier.find().sort({ min_points: 1 });
    res.json({ success: true, data: tiers });
  } catch (err) { next(err); }
});

// GET /api/loyalty/:userId
router.get('/:userId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('name loyalty_points');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const tiers = await LoyaltyTier.find().sort({ min_points: 1 });
    const currentTier = [...tiers].reverse().find(t => user.loyalty_points >= t.min_points) || tiers[0];
    const nextTier = tiers.find(t => t.min_points > user.loyalty_points);
    res.json({
      success: true,
      data: {
        user_id: user._id,
        name: user.name,
        points: user.loyalty_points,
        current_tier: currentTier,
        next_tier: nextTier || null,
        points_to_next: nextTier ? nextTier.min_points - user.loyalty_points : 0
      }
    });
  } catch (err) { next(err); }
});

// GET /api/loyalty/:userId/transactions
router.get('/:userId/transactions', protect, async (req, res, next) => {
  try {
    const txns = await LoyaltyTransaction.find({ user_id: req.params.userId })
      .populate('order_id', 'order_number total')
      .sort({ created_at: -1 });
    res.json({ success: true, data: txns });
  } catch (err) { next(err); }
});

// POST /api/loyalty/earn
router.post('/earn', protect, async (req, res, next) => {
  try {
    const { user_id, order_id, points, description } = req.body;
    await User.findByIdAndUpdate(user_id, { $inc: { loyalty_points: points } });
    const txn = await LoyaltyTransaction.create({ user_id, order_id, type: 'earn', points, description });
    res.status(201).json({ success: true, data: txn });
  } catch (err) { next(err); }
});

// POST /api/loyalty/redeem
router.post('/redeem', protect, async (req, res, next) => {
  try {
    const { user_id, points, order_id, description } = req.body;
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.loyalty_points < points) return res.status(400).json({ success: false, message: 'Insufficient points' });
    await User.findByIdAndUpdate(user_id, { $inc: { loyalty_points: -points } });
    const txn = await LoyaltyTransaction.create({ user_id, order_id, type: 'redeem', points: -points, description });
    res.json({ success: true, data: txn, remaining_points: user.loyalty_points - points });
  } catch (err) { next(err); }
});

// PATCH /api/loyalty/:userId/adjust
router.patch('/:userId/adjust', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { points, description } = req.body;
    const user = await User.findByIdAndUpdate(req.params.userId, { $inc: { loyalty_points: points } }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const txn = await LoyaltyTransaction.create({ user_id: req.params.userId, type: 'adjust', points, description });
    res.json({ success: true, data: { new_balance: user.loyalty_points, transaction: txn } });
  } catch (err) { next(err); }
});

module.exports = router;
