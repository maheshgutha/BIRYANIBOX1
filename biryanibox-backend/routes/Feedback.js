const express = require('express');
const router  = express.Router();
const nodemailer = require('nodemailer');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Normalise 'ambiance' → 'ambience' (customer page sends 'ambiance', DB enum is 'ambience')
const normaliseCategory = (cat) => {
  if (!cat) return 'general';
  if (cat === 'ambiance') return 'ambience';
  const allowed = ['food', 'service', 'ambience', 'delivery', 'general'];
  return allowed.includes(cat) ? cat : 'general';
};

// GET /api/feedback
router.get('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { is_read, category } = req.query;
    const filter = {};
    if (is_read !== undefined) filter.is_read = is_read === 'true';
    if (category) filter.category = normaliseCategory(category);
    const feedback = await Feedback.find(filter)
      .populate('customer_id', 'name email')
      .populate('order_id', 'order_number')
      .populate('owner_replied_by', 'name')
      .sort({ created_at: -1 });
    res.json({ success: true, count: feedback.length, data: feedback });
  } catch (err) { next(err); }
});

// POST /api/feedback — customer submits feedback
router.post('/', async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (!rating) return res.status(400).json({ success: false, message: 'Rating is required' });
    const feedback = await Feedback.create({
      ...req.body,
      category: normaliseCategory(req.body.category),
    });
    res.status(201).json({ success: true, data: feedback });
  } catch (err) { next(err); }
});

// PATCH /api/feedback/:id/read
router.patch('/:id/read', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, {
      is_read: true, read_by: req.user._id, read_at: new Date(),
    }, { new: true });
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, data: feedback });
  } catch (err) { next(err); }
});

// PATCH /api/feedback/mark-all-read
router.patch('/mark-all-read', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    await Feedback.updateMany({ is_read: false }, { is_read: true, read_by: req.user._id, read_at: new Date() });
    res.json({ success: true, message: 'All feedback marked as read' });
  } catch (err) { next(err); }
});

// POST /api/feedback/:id/reply
router.post('/:id/reply', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { reply_message } = req.body;
    if (!reply_message) return res.status(400).json({ success: false, message: 'Reply message is required' });
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    if (!feedback.customer_email) return res.status(400).json({ success: false, message: 'No customer email on this feedback' });

    let emailSent = false;
    if (process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from:    `"Biryani Box" <${process.env.SMTP_USER}>`,
          to:      feedback.customer_email,
          subject: 'Response to your Biryani Box Feedback',
          html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#111;color:#fff;border-radius:16px;">
            <h2 style="color:#f97316;">Biryani Box 🍛</h2>
            <p>Dear <strong>${feedback.customer_name || 'Valued Customer'}</strong>,</p>
            <p>Thank you for your feedback. Here is our response:</p>
            <div style="background:#1a1a1a;border-left:4px solid #f97316;padding:16px;border-radius:8px;margin:16px 0;">
              <p style="margin:0;color:#fff;">${reply_message}</p>
            </div>
            <p>Your original feedback (Rating: ${'★'.repeat(feedback.rating)}):</p>
            <blockquote style="color:#888;border-left:3px solid #444;padding-left:12px;">${feedback.message || ''}</blockquote>
            <p style="color:#888;font-size:12px;margin-top:24px;">Biryani Box Management Team</p>
          </div>`,
        });
        emailSent = true;
      } catch (emailErr) { console.error('Reply email error:', emailErr.message); }
    }

    feedback.owner_reply      = reply_message;
    feedback.owner_replied_by = req.user._id;
    feedback.owner_replied_at = new Date();
    feedback.reply_sent_email = emailSent;
    feedback.is_read          = true;
    await feedback.save();

    res.json({ success: true, data: feedback, email_sent: emailSent });
  } catch (err) { next(err); }
});

// DELETE /api/feedback/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Feedback deleted' });
  } catch (err) { next(err); }
});

module.exports = router;