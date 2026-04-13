const express = require('express');
const router  = express.Router();
const LoyaltyTier        = require('../models/LoyaltyTier');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const User               = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ── Points config (matches screenshot criteria) ───────────────────────────
const POINTS_RULES = {
  order_placed:  10,   // every order placed
  order_above_500: 25, // order total above $500
  feedback:       5,   // submit feedback
  referral:      50,   // refer a friend
};

// ── GET /api/loyalty/rules ────────────────────────────────────────────────
router.get('/rules', (req, res) => {
  res.json({ success: true, data: POINTS_RULES });
});

// ── GET /api/loyalty/tiers ────────────────────────────────────────────────
router.get('/tiers', async (req, res, next) => {
  try {
    const tiers = await LoyaltyTier.find().sort({ min_points: 1 });
    res.json({ success: true, data: tiers });
  } catch (err) { next(err); }
});

// ── GET /api/loyalty/:userId ──────────────────────────────────────────────
router.get('/:userId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('name loyalty_points email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const tiers = await LoyaltyTier.find().sort({ min_points: 1 });
    const currentTier = [...tiers].reverse().find(t => user.loyalty_points >= t.min_points) || tiers[0];
    const nextTier    = tiers.find(t => t.min_points > user.loyalty_points);
    res.json({
      success: true,
      data: {
        user_id: user._id,
        name: user.name,
        points: user.loyalty_points,
        current_tier: currentTier,
        next_tier: nextTier || null,
        points_to_next: nextTier ? nextTier.min_points - user.loyalty_points : 0,
        rules: POINTS_RULES,
      }
    });
  } catch (err) { next(err); }
});

// ── GET /api/loyalty/:userId/transactions ─────────────────────────────────
router.get('/:userId/transactions', protect, async (req, res, next) => {
  try {
    const txns = await LoyaltyTransaction.find({ user_id: req.params.userId })
      .populate('order_id', 'order_number total')
      .sort({ created_at: -1 });
    res.json({ success: true, data: txns });
  } catch (err) { next(err); }
});

// ── POST /api/loyalty/earn  — award points based on rule ─────────────────
router.post('/earn', protect, async (req, res, next) => {
  try {
    const { user_id, order_id, rule, order_total, description } = req.body;
    // rule: 'order_placed' | 'order_above_500' | 'feedback' | 'referral' | 'custom'
    let pts = 0;
    if (rule === 'order_placed')    pts = POINTS_RULES.order_placed;
    else if (rule === 'order_above_500') pts = POINTS_RULES.order_above_500;
    else if (rule === 'feedback')   pts = POINTS_RULES.feedback;
    else if (rule === 'referral')   pts = POINTS_RULES.referral;
    else pts = req.body.points || 0;

    // Auto-award extra 25 pts if order > 500
    let extraPts = 0;
    if (rule === 'order_placed' && order_total && order_total > 500) {
      extraPts = POINTS_RULES.order_above_500;
    }

    const totalPts = pts + extraPts;
    await User.findByIdAndUpdate(user_id, { $inc: { loyalty_points: totalPts } });

    const txns = [];
    const txn = await LoyaltyTransaction.create({
      user_id, order_id, type: 'earn', points: pts,
      description: description || `Points for ${rule}`,
    });
    txns.push(txn);

    if (extraPts > 0) {
      const bonusTxn = await LoyaltyTransaction.create({
        user_id, order_id, type: 'earn', points: extraPts,
        description: 'Bonus: order above $500',
      });
      txns.push(bonusTxn);
    }

    res.status(201).json({ success: true, data: txns, total_points_earned: totalPts });
  } catch (err) { next(err); }
});

// ── POST /api/loyalty/redeem ──────────────────────────────────────────────
router.post('/redeem', protect, async (req, res, next) => {
  try {
    const { user_id, order_id, points, description } = req.body;
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.loyalty_points < points)
      return res.status(400).json({ success: false, message: 'Insufficient loyalty points' });
    await User.findByIdAndUpdate(user_id, { $inc: { loyalty_points: -points } });
    const txn = await LoyaltyTransaction.create({
      user_id, order_id, type: 'redeem', points: -points,
      description: description || 'Points redeemed',
    });
    res.status(201).json({ success: true, data: txn });
  } catch (err) { next(err); }
});

// ── POST /api/loyalty/referral ────────────────────────────────────────────
router.post('/referral', protect, async (req, res, next) => {
  try {
    const { referrer_id, referred_email } = req.body;
    const referred = await User.findOne({ email: referred_email, role: 'customer' });
    if (!referred) return res.status(404).json({ success: false, message: 'Referred user not found' });
    const pts = POINTS_RULES.referral;
    await User.findByIdAndUpdate(referrer_id, { $inc: { loyalty_points: pts } });
    const txn = await LoyaltyTransaction.create({
      user_id: referrer_id, type: 'earn', points: pts,
      description: `Referral bonus — referred ${referred_email}`,
    });
    res.status(201).json({ success: true, data: txn, points_earned: pts });
  } catch (err) { next(err); }
});

module.exports = router;