const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const GiftCard = require('../models/GiftCard');
const GiftCardTransaction = require('../models/GiftCardTransaction');
const { protect, authorize } = require('../middleware/auth');

// GET /api/gift-cards/validate/:code  (before /:id)
router.get('/validate/:code', async (req, res, next) => {
  try {
    const card = await GiftCard.findOne({ code: req.params.code });
    if (!card) return res.status(404).json({ success: false, message: 'Gift card not found' });
    if (card.status !== 'active') return res.status(400).json({ success: false, message: `Gift card is ${card.status}` });
    if (card.expiry_date && card.expiry_date < new Date()) {
      card.status = 'expired'; await card.save();
      return res.status(400).json({ success: false, message: 'Gift card expired' });
    }
    res.json({ success: true, data: { code: card.code, balance: card.balance, denomination: card.denomination, status: card.status } });
  } catch (err) { next(err); }
});

// GET /api/gift-cards
router.get('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const cards = await GiftCard.find().sort({ created_at: -1 });
    res.json({ success: true, count: cards.length, data: cards });
  } catch (err) { next(err); }
});

// GET /api/gift-cards/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const card = await GiftCard.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: 'Gift card not found' });
    res.json({ success: true, data: card });
  } catch (err) { next(err); }
});

// POST /api/gift-cards
router.post('/', async (req, res, next) => {
  try {
    const { denomination, purchased_by, recipient_name, recipient_contact, delivery_method } = req.body;
    const code = 'BIRYANI' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiry_date = new Date(); expiry_date.setFullYear(expiry_date.getFullYear() + 1);
    const card = await GiftCard.create({ code, denomination, balance: denomination, purchased_by, recipient_name, recipient_contact, delivery_method, expiry_date });
    res.status(201).json({ success: true, data: card });
  } catch (err) { next(err); }
});

// POST /api/gift-cards/redeem
router.post('/redeem', protect, async (req, res, next) => {
  try {
    const { code, amount, order_id } = req.body;
    const card = await GiftCard.findOne({ code, status: 'active' });
    if (!card) return res.status(404).json({ success: false, message: 'Invalid or expired gift card' });
    const use = Math.min(card.balance, amount);
    card.balance -= use;
    if (card.balance <= 0) card.status = 'used';
    await card.save();
    await GiftCardTransaction.create({ gift_card_id: card._id, order_id, amount_used: use });
    res.json({ success: true, data: { amount_used: use, remaining_balance: card.balance } });
  } catch (err) { next(err); }
});

// GET /api/gift-cards/:id/transactions
router.get('/:id/transactions', protect, async (req, res, next) => {
  try {
    const txns = await GiftCardTransaction.find({ gift_card_id: req.params.id }).populate('order_id', 'order_number total');
    res.json({ success: true, data: txns });
  } catch (err) { next(err); }
});

module.exports = router;
