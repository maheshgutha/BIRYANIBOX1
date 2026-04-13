const express   = require('express');
const router    = express.Router();
const Reservation = require('../models/Reservation');
const User        = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer   = require('nodemailer');
const { protect, authorize } = require('../middleware/auth');
const RestaurantTable = require('../models/RestaurantTable');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: `"Biryani Box" <${process.env.SMTP_USER}>`, to, subject, html });
    console.log(`[Email] Sent to ${to}`);
  } catch (err) { console.error('[Email]', err.message); }
};

// ── PUBLIC search ──────────────────────────────────────────────────────────
router.get('/public/search', async (req, res, next) => {
  try {
    const { name, phone, email } = req.query;
    if (!name && !phone && !email) return res.json({ success: true, count: 0, data: [] });
    const conditions = [];
    if (name)  conditions.push({ customer_name: { $regex: name,  $options: 'i' } });
    if (phone) conditions.push({ phone:          { $regex: phone, $options: 'i' } });
    if (email) conditions.push({ email:          { $regex: email, $options: 'i' } });
    const items = await Reservation.find({ $or: conditions }).sort({ date: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// ── GET /api/reservations ──────────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, date, email } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (date) { const d = new Date(date); filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) }; }
    const items = await Reservation.find(filter).sort({ date: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// ── GET /api/reservations/:id ──────────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await Reservation.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── POST /api/reservations — customer submits reservation ─────────────────
router.post('/', async (req, res, next) => {
  try {
    const item = await Reservation.create({ ...req.body, status: 'pending' });

    // Notify owner and manager — new reservation pending approval
    const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
    await Notification.insertMany(managers.map(u => ({
      user_id: u._id, type: 'reservation', title: '📅 New Reservation Request',
      message: `${item.customer_name} wants to book for ${item.guests} guests on ${item.date} at ${item.time}. Review & confirm.`,
    })));

    // Confirm email to customer (pending state)
    if (item.email) {
      await sendEmail({
        to: item.email,
        subject: 'Reservation Request Received — Biryani Box',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
            <h1 style="color:#f97316;margin-bottom:4px;">Biryani Box 🍛</h1>
            <p style="color:#888;font-size:13px;margin-bottom:28px;">Reservation Request</p>
            <h2 style="font-size:20px;margin-bottom:8px;">Hi ${item.customer_name}!</h2>
            <p style="color:#ccc;margin-bottom:20px;">We've received your reservation request. Our team will review and confirm it shortly.</p>
            <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">Your Booking Details</p>
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#888;padding:4px 0;">Date</td><td style="text-align:right;color:#fff;">${item.date}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Time</td><td style="text-align:right;color:#fff;">${item.time}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Guests</td><td style="text-align:right;color:#fff;">${item.guests}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Status</td><td style="text-align:right;color:#f97316;font-weight:bold;">Pending Confirmation</td></tr>
              </table>
            </div>
            <p style="color:#666;font-size:12px;">You will receive a confirmation email once our team approves your booking.</p>
          </div>
        `,
      });
    }

    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── PUT /api/reservations/:id ─────────────────────────────────────────────
router.put('/:id', protect, async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── PATCH /api/reservations/:id ───────────────────────────────────────────
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── PATCH /api/reservations/:id/status ────────────────────────────────────
router.patch('/:id/status', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── PATCH /api/reservations/:id/confirm — owner confirms + sends quotation email
router.patch('/:id/confirm', protect, authorize('owner','manager','captain'), async (req, res, next) => {
  try {
    const { quotation_message, table_assigned } = req.body;
    const item = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', table_assigned: table_assigned || undefined, quotation_message },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });

    // Send confirmation email to customer
    if (item.email) {
      await sendEmail({
        to: item.email,
        subject: '✅ Reservation Confirmed — Biryani Box',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
            <h1 style="color:#f97316;margin-bottom:4px;">Biryani Box 🍛</h1>
            <p style="color:#888;font-size:13px;margin-bottom:28px;">Reservation Confirmed</p>
            <h2 style="font-size:20px;margin-bottom:8px;">Great news, ${item.customer_name}! 🎉</h2>
            <p style="color:#ccc;margin-bottom:20px;">Your reservation has been <strong style="color:#10b981;">confirmed</strong>. We look forward to welcoming you!</p>
            <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">Booking Details</p>
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#888;padding:4px 0;">Date</td><td style="text-align:right;color:#fff;">${item.date}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Time</td><td style="text-align:right;color:#fff;">${item.time}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Guests</td><td style="text-align:right;color:#fff;">${item.guests}</td></tr>
                ${table_assigned ? `<tr><td style="color:#888;padding:4px 0;">Table</td><td style="text-align:right;color:#f97316;font-weight:bold;">${table_assigned}</td></tr>` : ''}
                <tr><td style="color:#888;padding:4px 0;">Status</td><td style="text-align:right;color:#10b981;font-weight:bold;">✅ Confirmed</td></tr>
              </table>
            </div>
            ${quotation_message ? `<div style="background:#1a1a1a;border-left:3px solid #f97316;border-radius:8px;padding:16px;margin-bottom:20px;"><p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Message from our team</p><p style="color:#ccc;font-size:14px;line-height:1.6;margin:0;">${quotation_message}</p></div>` : ''}
            <p style="color:#666;font-size:12px;">Please arrive 5 minutes before your booking time. Looking forward to serving you!</p>
            <p style="color:#444;font-size:12px;margin-top:20px;">— The Biryani Box Team</p>
          </div>
        `,
      });
    }

    // Table status will be auto-set to 'reserved' 30 min before reservation time by server background job.
    res.json({ success: true, data: item, message: 'Reservation confirmed and email sent to customer.' });
  } catch (err) { next(err); }
});

// ── PATCH /api/reservations/:id/table ─────────────────────────────────────
router.patch('/:id/table', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndUpdate(
      req.params.id, { table_assigned: req.body.table_assigned, status: 'confirmed' }, { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── DELETE /api/reservations/:id ──────────────────────────────────────────
router.delete('/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    res.json({ success: true, message: 'Reservation deleted' });
  } catch (err) { next(err); }
});

module.exports = router;