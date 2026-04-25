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

const normaliseCategory = (cat) => {
  if (!cat) return 'general';
  const lower = cat.toLowerCase().trim();
  if (lower === 'food quality' || lower === 'food') return 'food';
  if (lower === 'service') return 'service';
  if (lower === 'ambience' || lower === 'ambiance') return 'ambience';
  if (lower === 'delivery') return 'delivery';
  if (lower === 'general') return 'general';
  return 'general';
};

// ── Role-aware view: attach _role_* virtual fields based on caller's role ─────
const toRoleView = (doc, role) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (role === 'manager') {
    obj._role_is_read    = obj.manager_is_read    || false;
    obj._role_read_at    = obj.manager_read_at     || null;
    obj._role_reply      = obj.manager_reply       || null;
    obj._role_replied_at = obj.manager_replied_at  || null;
    obj._role_reply_sent = obj.manager_reply_sent_email || false;
    obj._role_label      = 'Manager Reply';
  } else {
    obj._role_is_read    = obj.is_read    || false;
    obj._role_read_at    = obj.read_at    || null;
    obj._role_reply      = obj.owner_reply || null;
    obj._role_replied_at = obj.owner_replied_at || null;
    obj._role_reply_sent = obj.reply_sent_email || false;
    obj._role_label      = 'Owner Reply';
  }
  return obj;
};

// GET /api/feedback — role-aware listing
router.get('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const role = req.user.role;
    const { is_read, category } = req.query;
    const filter = {};
    if (category) filter.category = normaliseCategory(category);
    if (is_read !== undefined) {
      filter[role === 'manager' ? 'manager_is_read' : 'is_read'] = is_read === 'true';
    }
    const feedback = await Feedback.find(filter)
      .populate('customer_id', 'name email')
      .populate('order_id', 'order_number')
      .populate('owner_replied_by', 'name')
      .populate('manager_replied_by', 'name')
      .sort({ created_at: -1 });
    const data = feedback.map(f => toRoleView(f, role));
    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
});

// POST /api/feedback — public: customer submits
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

// PATCH /api/feedback/:id/read — marks read for caller's role only
router.patch('/:id/read', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const role = req.user.role;
    const updateFields = role === 'manager'
      ? { manager_is_read: true, manager_read_by: req.user._id, manager_read_at: new Date() }
      : { is_read: true, read_by: req.user._id, read_at: new Date() };
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('owner_replied_by', 'name').populate('manager_replied_by', 'name');
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, data: toRoleView(feedback, role) });
  } catch (err) { next(err); }
});

// PATCH /api/feedback/mark-all-read — marks all unread for caller's role
router.patch('/mark-all-read', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const role = req.user.role;
    const unreadFilter = role === 'manager' ? { manager_is_read: false } : { is_read: false };
    const updateFields = role === 'manager'
      ? { manager_is_read: true, manager_read_by: req.user._id, manager_read_at: new Date() }
      : { is_read: true, read_by: req.user._id, read_at: new Date() };
    await Feedback.updateMany(unreadFilter, updateFields);
    res.json({ success: true, message: 'All feedback marked as read' });
  } catch (err) { next(err); }
});

// POST /api/feedback/:id/reply — saves reply under caller's role field only
router.post('/:id/reply', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { reply_message } = req.body;
    if (!reply_message) return res.status(400).json({ success: false, message: 'Reply message is required' });
    const role = req.user.role;
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    if (!feedback.customer_email) return res.status(400).json({ success: false, message: 'No customer email on this feedback' });

    let emailSent = false;
    if (process.env.SMTP_USER) {
      try {
        const replierLabel = role === 'manager' ? 'Manager' : 'Owner';
        await transporter.sendMail({
          from:    `"Biryani Box" <${process.env.SMTP_USER}>`,
          to:      feedback.customer_email,
          subject: 'Response to your Biryani Box Feedback',
          html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#111;color:#fff;border-radius:16px;">
            <h2 style="color:#f97316;">Biryani Box 🍛</h2>
            <p>Dear <strong>${feedback.customer_name || 'Valued Customer'}</strong>,</p>
            <p>Thank you for your feedback. Here is our response from the <strong>${replierLabel}</strong>:</p>
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

    if (role === 'manager') {
      feedback.manager_reply            = reply_message;
      feedback.manager_replied_by       = req.user._id;
      feedback.manager_replied_at       = new Date();
      feedback.manager_reply_sent_email = emailSent;
      feedback.manager_is_read          = true;
      feedback.manager_read_by          = req.user._id;
      feedback.manager_read_at          = feedback.manager_read_at || new Date();
    } else {
      feedback.owner_reply      = reply_message;
      feedback.owner_replied_by = req.user._id;
      feedback.owner_replied_at = new Date();
      feedback.reply_sent_email = emailSent;
      feedback.is_read          = true;
      feedback.read_by          = req.user._id;
      feedback.read_at          = feedback.read_at || new Date();
    }
    await feedback.save();
    await feedback.populate('owner_replied_by', 'name');
    await feedback.populate('manager_replied_by', 'name');
    res.json({ success: true, data: toRoleView(feedback, role), email_sent: emailSent });
  } catch (err) { next(err); }
});

// DELETE /api/feedback/:id — owner only
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Feedback deleted' });
  } catch (err) { next(err); }
});

module.exports = router;