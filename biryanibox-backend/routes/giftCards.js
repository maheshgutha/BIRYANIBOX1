const express    = require('express');
const router     = express.Router();
const crypto     = require('crypto');
const nodemailer = require('nodemailer');
const GiftCard   = require('../models/GiftCard');
const GiftCardTransaction = require('../models/GiftCardTransaction');
const { protect, authorize } = require('../middleware/auth');

// ── Email transporter ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendGiftCardEmail = async ({ receiver_email, receiver_name, sender_name, code, denomination }) => {
  if (!process.env.SMTP_USER) {
    console.log(`[GiftCard] Code ${code} for ${receiver_email} (SMTP not configured)`);
    return;
  }
  try {
    await transporter.sendMail({
      from:    `"Biryani Box" <${process.env.SMTP_USER}>`,
      to:      receiver_email,
      subject: `${sender_name || 'Someone'} sent you a Biryani Box Gift Card!`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:40px;border-radius:20px;color:#fff;">
          <h1 style="color:#f97316;font-size:28px;margin-bottom:4px;">BIRYANI BOX</h1>
          <p style="color:#888;font-size:13px;margin-bottom:30px;">Gift Card</p>
          <h2 style="font-size:20px;margin-bottom:8px;">Hi ${receiver_name || 'Friend'} 🎁</h2>
          <p style="color:#ccc;margin-bottom:20px;">${sender_name || 'Someone special'} sent you a gift card worth <strong style="color:#f97316;">₹${denomination}</strong>!</p>
          <div style="background:#1a1a1a;border:2px solid #f97316;border-radius:16px;padding:24px;text-align:center;margin:24px 0;">
            <p style="font-size:12px;color:#888;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">Your Gift Card Code</p>
            <p style="font-size:32px;font-weight:900;letter-spacing:8px;color:#f97316;font-family:monospace;">${code}</p>
          </div>
          <p style="color:#f97316;font-size:13px;font-weight:bold;margin-top:8px;">⚠️ One-time use only — this code becomes invalid after first use.</p>
          <p style="color:#888;font-size:12px;margin-top:8px;">Use this code at checkout on Biryani Box. Valid for 1 year.</p>
          <p style="color:#444;font-size:11px;margin-top:24px;">Do not share this code with anyone you don't trust.</p>
        </div>
      `,
    });
    console.log(`[GiftCard] Email sent to ${receiver_email}`);
  } catch (err) {
    console.error('[GiftCard] Email error:', err.message);
  }
};

// ── Generate unique code ──────────────────────────────────────────────────
const generateCode = () => {
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BB-${seg()}-${seg()}-${seg()}`;
};

// ── GET /api/gift-cards/validate/:code ────────────────────────────────────
// Returns card info for checkout validation — does NOT consume the card
router.get('/validate/:code', async (req, res, next) => {
  try {
    const card = await GiftCard.findOne({ code: req.params.code.toUpperCase().trim() });
    if (!card)
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    if (card.status !== 'active')
      return res.status(400).json({ success: false, message: `Gift card is ${card.status}` });
    if (card.expiry_date && card.expiry_date < new Date()) {
      card.status = 'expired';
      await card.save();
      return res.status(400).json({ success: false, message: 'Gift card has expired' });
    }
    res.json({
      success: true,
      data: {
        code:         card.code,
        balance:      card.balance,
        denomination: card.denomination,
        status:       card.status,
        receiver_name: card.receiver_name,
        sender_name:   card.sender_name,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/gift-cards  (admin only) ────────────────────────────────────
router.get('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const cards = await GiftCard.find().sort({ created_at: -1 });
    res.json({ success: true, count: cards.length, data: cards });
  } catch (err) { next(err); }
});

// ── GET /api/gift-cards/my — active cards with receiver_email = logged-in user ──
router.get('/my', protect, async (req, res, next) => {
  try {
    const cards = await GiftCard.find({
      receiver_email: req.user.email,
      status: 'active',
    }).sort({ created_at: -1 });
    res.json({ success: true, data: cards });
  } catch (err) { next(err); }
});

// ── GET /api/gift-cards/sent — cards purchased by logged-in user ──────────
router.get('/sent', protect, async (req, res, next) => {
  try {
    const cards = await GiftCard.find({
      sent_by_user_id: req.user._id,
    }).sort({ created_at: -1 });
    res.json({ success: true, data: cards });
  } catch (err) { next(err); }
});

// ── GET /api/gift-cards/:id ───────────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const card = await GiftCard.findById(req.params.id);
    if (!card)
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    res.json({ success: true, data: card });
  } catch (err) { next(err); }
});

// ── POST /api/gift-cards — purchase and email unique code to receiver ─────
router.post('/', async (req, res, next) => {
  try {
    const {
      denomination, sender_name, sender_email,
      receiver_name, receiver_email,
      purchased_by, recipient_name, recipient_contact, delivery_method,
    } = req.body;

    if (!denomination || denomination <= 0)
      return res.status(400).json({ success: false, message: 'Denomination required' });

    const finalReceiverEmail = receiver_email || recipient_contact;
    if (!finalReceiverEmail)
      return res.status(400).json({ success: false, message: 'Receiver email is required' });

    const code = generateCode();
    const expiry_date = new Date();
    expiry_date.setFullYear(expiry_date.getFullYear() + 1);

    // Detect logged-in sender
    let sent_by_user_id = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt  = require('jsonwebtoken');
        const User = require('../models/User');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const u = await User.findById(decoded.id).select('_id role');
        if (u) sent_by_user_id = u._id;
      } catch (_) { /* optional */ }
    }

    const card = await GiftCard.create({
      code,
      denomination,
      balance:       denomination,
      sender_name:   sender_name   || purchased_by,
      sender_email:  sender_email,
      receiver_name: receiver_name || recipient_name,
      receiver_email: finalReceiverEmail,
      purchased_by:  purchased_by  || sender_name,
      recipient_name: recipient_name || receiver_name,
      recipient_contact: finalReceiverEmail,
      delivery_method: delivery_method || 'email',
      expiry_date,
      sent_by_user_id,
    });

    // Send email asynchronously
    sendGiftCardEmail({
      receiver_email: finalReceiverEmail,
      receiver_name:  receiver_name || recipient_name || 'Friend',
      sender_name:    sender_name   || purchased_by   || 'Someone',
      code,
      denomination,
    }).then(() => {
      GiftCard.findByIdAndUpdate(card._id, { email_sent: true }).exec();
    });

    res.status(201).json({ success: true, data: card });
  } catch (err) { next(err); }
});

// ── POST /api/gift-cards/redeem — ONE-TIME USE only ───────────────────────
// The full denomination is applied at once. Card is immediately marked 'used'.
// A second redeem attempt on the same code will be rejected.
router.post('/redeem', protect, async (req, res, next) => {
  try {
    const { code, amount, order_id } = req.body;

    if (!code)
      return res.status(400).json({ success: false, message: 'Gift card code is required' });

    // Atomic findOneAndUpdate to prevent race-condition double-spend
    const card = await GiftCard.findOneAndUpdate(
      { code: code.toUpperCase().trim(), status: 'active' },
      {
        $set: {
          status:               'used',
          balance:              0,
          redeemed_by_order_id: order_id || null,
          redeemed_at:          new Date(),
        },
      },
      { new: false } // return the OLD doc so we know the denomination applied
    );

    if (!card)
      return res.status(404).json({
        success: false,
        message: 'Gift card not found, already used, or expired',
      });

    // Check expiry on the original doc
    if (card.expiry_date && card.expiry_date < new Date()) {
      // Restore status back to expired (edge case)
      await GiftCard.findByIdAndUpdate(card._id, { status: 'expired', balance: card.balance });
      return res.status(400).json({ success: false, message: 'Gift card has expired' });
    }

    const amount_used = card.balance; // full balance consumed in one shot

    await GiftCardTransaction.create({
      gift_card_id: card._id,
      order_id:     order_id || null,
      amount_used,
    });

    res.json({
      success: true,
      data: {
        amount_used,
        remaining_balance: 0,
        message: 'Gift card redeemed successfully. This card is now used.',
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/gift-cards/:id/transactions ─────────────────────────────────
router.get('/:id/transactions', protect, async (req, res, next) => {
  try {
    const txns = await GiftCardTransaction.find({ gift_card_id: req.params.id })
      .populate('order_id', 'order_number total');
    res.json({ success: true, data: txns });
  } catch (err) { next(err); }
});

module.exports = router;