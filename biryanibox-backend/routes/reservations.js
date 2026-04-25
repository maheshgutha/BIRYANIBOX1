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
  if (!process.env.SMTP_USER) { console.log(`[Email] Would send to ${to}: ${subject}`); return; }
  try {
    await transporter.sendMail({ from: `"Biryani Box" <${process.env.SMTP_USER}>`, to, subject, html });
    console.log(`[Email] Sent to ${to}`);
  } catch (err) { console.error('[Email]', err.message); }
};

// ── Helper: parse "7:30 PM" → minutes since midnight ───────────────────────
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  const ampm = (m[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

// ── Helper: check if a table is blocked for a given date+time (±30 min) ───
const checkTableConflict = async (table_assigned, date, time, excludeId = null) => {
  if (!table_assigned || !date || !time) return [];
  const reqMins = timeToMinutes(time);
  if (reqMins === null) return [];

  // Get all confirmed (and pending) reservations for the same table on the same date
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const filter = {
    table_assigned: { $regex: new RegExp(`^${table_assigned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    status: { $in: ['pending', 'confirmed'] },
    date: { $gte: dayStart, $lte: dayEnd },
  };
  if (excludeId) filter._id = { $ne: excludeId };

  const existing = await Reservation.find(filter);

  // Find ones within ±30 minutes
  return existing.filter(r => {
    const rMins = timeToMinutes(r.time);
    if (rMins === null) return false;
    return Math.abs(rMins - reqMins) < 30; // strict less than 30 min gap
  });
};

// ── GET /api/reservations/check-conflict — frontend calls this before confirming
router.get('/check-conflict', protect, async (req, res, next) => {
  try {
    const { table_assigned, date, time, exclude_id } = req.query;
    if (!table_assigned || !date || !time)
      return res.json({ success: true, conflicts: [], hasConflict: false });

    const conflicts = await checkTableConflict(table_assigned, new Date(date), time, exclude_id);
    res.json({
      success: true,
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map(r => ({
        _id: r._id,
        customer_name: r.customer_name,
        time: r.time,
        guests: r.guests,
        status: r.status,
      })),
    });
  } catch (err) { next(err); }
});

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

    // Customers can ONLY see their own reservations — enforce by their email
    if (req.user.role === 'customer') {
      filter.email = { $regex: `^${req.user.email}$`, $options: 'i' };
    } else {
      // Staff can filter by email or status/date
      if (status) filter.status = status;
      if (email)  filter.email  = { $regex: email, $options: 'i' };
      if (date)   { const d = new Date(date); filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) }; }
    }

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
    const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
    await Notification.insertMany(managers.map(u => ({
      user_id: u._id, type: 'reservation', title: '📅 New Reservation Request',
      message: `${item.customer_name} wants to book for ${item.guests} guests on ${item.date} at ${item.time}. Review & confirm.`,
    })));
    if (item.email) {
      await sendEmail({
        to: item.email,
        subject: 'Reservation Request Received — Biryani Box',
        html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
          <h1 style="color:#f97316;">Biryani Box 🍛</h1>
          <h2>Hi ${item.customer_name}!</h2>
          <p style="color:#ccc;">We've received your reservation request. Our team will review and confirm it shortly.</p>
          <p style="color:#f97316;font-weight:bold;">Date: ${item.date} · Time: ${item.time} · Guests: ${item.guests}</p>
        </div>`,
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
    const prev = await Reservation.findById(req.params.id);
    const item = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });
    // Send completion greeting email
    if (req.body.status === 'completed' && prev?.status !== 'completed' && item.email) {
      await sendEmail({
        to: item.email,
        subject: '🎉 Thank You for Dining with Us — Biryani Box',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
            <h1 style="color:#f97316;margin-bottom:4px;">Biryani Box 🍛</h1>
            <p style="color:#888;font-size:13px;margin-bottom:28px;">Your Visit is Complete</p>
            <h2 style="font-size:22px;">Dear ${item.customer_name},</h2>
            <p style="color:#ccc;margin:12px 0 20px;">It was a pleasure having you with us today! We hope you enjoyed your dining experience and that every bite was memorable.</p>
            <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin:20px 0;">
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#888;padding:6px 0;">Date</td><td style="text-align:right;color:#fff;">${item.date ? new Date(item.date).toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—'}</td></tr>
                <tr><td style="color:#888;padding:6px 0;">Time</td><td style="text-align:right;color:#fff;">${item.time || '—'}</td></tr>
                <tr><td style="color:#888;padding:6px 0;">Guests</td><td style="text-align:right;color:#fff;">${item.guests || '—'}</td></tr>
                ${item.table_assigned ? `<tr><td style="color:#888;padding:6px 0;">Table</td><td style="text-align:right;color:#f97316;">${item.table_assigned}</td></tr>` : ''}
                <tr><td style="color:#888;padding:6px 0;">Status</td><td style="text-align:right;color:#10b981;font-weight:bold;">✅ Completed</td></tr>
              </table>
            </div>
            <div style="background:#0a1f0a;border-left:3px solid #10b981;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="color:#10b981;font-weight:bold;margin:0 0 8px;">We'd love to see you again!</p>
              <p style="color:#ccc;margin:0;font-size:14px;">Your satisfaction is our greatest reward. We look forward to welcoming you back soon for another unforgettable experience.</p>
            </div>
            <p style="color:#666;font-size:12px;margin-top:20px;">Thank you for choosing Biryani Box. See you next time! 🙏</p>
            <p style="color:#444;margin-top:16px;">Warm regards,<br/><strong style="color:#f97316;">The Biryani Box Team</strong></p>
          </div>
        `,
      });
    }

    if (req.body.status === 'cancelled' && prev?.status !== 'cancelled' && item.email) {
      const cancelReason = req.body.cancellation_reason || req.body.cancel_reason || '';
      await sendEmail({
        to: item.email,
        subject: '❌ Reservation Cancelled — Biryani Box',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
            <h1 style="color:#f97316;margin-bottom:4px;">Biryani Box 🍛</h1>
            <p style="color:#888;font-size:13px;margin-bottom:28px;">Reservation Update</p>
            <h2 style="font-size:20px;">Dear ${item.customer_name},</h2>
            <p style="color:#ccc;margin:12px 0;">We are truly sorry to inform you that your reservation has been <strong style="color:#ef4444;">cancelled</strong>.</p>
            <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin:20px 0;">
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#888;padding:4px 0;">Date</td><td style="text-align:right;color:#fff;">${item.date || '—'}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Guests</td><td style="text-align:right;color:#fff;">${item.guests || '—'}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Status</td><td style="text-align:right;color:#ef4444;font-weight:bold;">❌ Cancelled</td></tr>
              </table>
            </div>
            ${cancelReason ? `
            <div style="background:#1a0000;border-left:3px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="color:#ef4444;font-size:12px;font-weight:bold;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Reason for Cancellation</p>
              <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0;">${cancelReason}</p>
            </div>` : ''}
            <div style="background:#1a0000;border-left:3px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="color:#ef4444;font-weight:bold;margin:0 0 6px;">We sincerely apologise for any inconvenience caused.</p>
              <p style="color:#ccc;margin:0;">Please feel free to make a new reservation — we would love to make it up to you!</p>
            </div>
            <p style="color:#444;font-size:12px;margin-top:24px;">With sincere apologies,<br/><strong style="color:#f97316;">The Biryani Box Team</strong></p>
          </div>
        `,
      });
    }
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

// ── PATCH /api/reservations/:id/confirm — with 30-min conflict check ──────
router.patch('/:id/confirm', protect, authorize('owner','manager','captain'), async (req, res, next) => {
  try {
    const { quotation_message, table_assigned } = req.body;

    // ── CONFLICT CHECK — block if same table booked ±30 min on same date ──
    if (table_assigned) {
      const pending = await Reservation.findById(req.params.id);
      if (pending && pending.date && pending.time) {
        const conflicts = await checkTableConflict(
          table_assigned, pending.date, pending.time, pending._id
        );
        if (conflicts.length > 0) {
          const c = conflicts[0];
          return res.status(409).json({
            success: false,
            message: `Table "${table_assigned}" is already booked for ${c.customer_name} at ${c.time} (within 30 minutes of this reservation). Please choose a different table or time.`,
            conflicts,
          });
        }
      }
    }

    const item = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', table_assigned: table_assigned || undefined, quotation_message },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Reservation not found' });

    if (item.email) {
      await sendEmail({
        to: item.email,
        subject: '✅ Reservation Confirmed — Biryani Box',
        html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
          <h1 style="color:#f97316;">Biryani Box 🍛</h1>
          <h2>Great news, ${item.customer_name}! 🎉</h2>
          <p style="color:#ccc;">Your reservation is <strong style="color:#10b981;">confirmed</strong>.</p>
          <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin:16px 0;">
            <table style="width:100%;font-size:14px;">
              <tr><td style="color:#888;">Date</td><td style="text-align:right;color:#fff;">${item.date ? new Date(item.date).toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—'}</td></tr>
              <tr><td style="color:#888;">Time</td><td style="text-align:right;color:#fff;">${item.time || '—'}</td></tr>
              <tr><td style="color:#888;">Guests</td><td style="text-align:right;color:#fff;">${item.guests}</td></tr>
              ${table_assigned ? `<tr><td style="color:#888;">Table</td><td style="text-align:right;color:#f97316;font-weight:bold;">${table_assigned}</td></tr>` : ''}
            </table>
          </div>
          ${quotation_message ? `<div style="background:#1a1a1a;border-left:3px solid #f97316;padding:16px;border-radius:8px;margin:16px 0;"><p style="color:#ccc;">${quotation_message}</p></div>` : ''}
          <p style="color:#666;font-size:12px;">Please arrive 5 minutes early. Looking forward to seeing you!</p>
          <p style="color:#444;">— The Biryani Box Team</p>
        </div>`,
      });
    }

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