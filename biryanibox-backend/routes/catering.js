const express  = require('express');
const router   = express.Router();
const CateringOrder = require('../models/CateringOrder');
const User          = require('../models/User');
const Notification  = require('../models/Notification');
const nodemailer    = require('nodemailer');
const { protect, authorize } = require('../middleware/auth');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER) { console.log(`[Email] ${subject} → ${to}`); return; }
  try { await transporter.sendMail({ from: `"Biryani Box" <${process.env.SMTP_USER}>`, to, subject, html }); }
  catch (err) { console.error('[Email]', err.message); }
};

// ── GET all catering orders ────────────────────────────────────────────────
router.get('/', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const items = await CateringOrder.find(filter).sort({ event_date: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
});

// ── GET single ────────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await CateringOrder.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Catering order not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── POST — customer submits catering request ───────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const item = await CateringOrder.create({ ...req.body, status: 'pending' });

    // Notify owners and managers
    const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
    await Notification.insertMany(managers.map(u => ({
      user_id: u._id, type: 'catering', title: '🍽️ New Catering Request',
      message: `${item.contact_name || item.customer_name} requests catering for ${item.guests || item.guest_count} guests on ${item.event_date}. Review and send quotation.`,
    })));

    // Send acknowledgement email to customer
    const customerEmail = item.email || item.contact_email;
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: 'Catering Request Received — Biryani Box',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
            <h1 style="color:#f97316;margin-bottom:4px;">Biryani Box 🍛</h1>
            <p style="color:#888;font-size:13px;margin-bottom:28px;">Catering Request</p>
            <h2 style="font-size:20px;margin-bottom:8px;">Hi ${item.contact_name || item.customer_name}!</h2>
            <p style="color:#ccc;margin-bottom:20px;">We've received your catering request. Our team will prepare a detailed quotation and send it to you shortly.</p>
            <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">Request Summary</p>
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#888;padding:4px 0;">Event Date</td><td style="text-align:right;color:#fff;">${item.event_date}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Guests</td><td style="text-align:right;color:#fff;">${item.guests || item.guest_count || 'TBD'}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Type</td><td style="text-align:right;color:#fff;">${item.event_type || 'Catering'}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Status</td><td style="text-align:right;color:#f97316;font-weight:bold;">Pending Quotation</td></tr>
              </table>
            </div>
            <p style="color:#666;font-size:12px;">We'll be in touch within 24 hours with a custom quotation.</p>
          </div>
        `,
      });
    }

    res.status(201).json({ success: true, data: item, message: 'Catering request submitted. We will contact you shortly.' });
  } catch (err) { next(err); }
});

// ── PUT /api/catering/:id ─────────────────────────────────────────────────
router.put('/:id', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await CateringOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Catering order not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── PATCH /api/catering/:id/status ────────────────────────────────────────
router.patch('/:id/status', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const existing = await CateringOrder.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    // Enforce: cannot confirm without sending a quotation first
    if (status === 'confirmed' && !existing.total_price && !existing.quotation_message) {
      return res.status(400).json({ success: false, message: 'Please send a quotation before confirming the catering order.' });
    }

    const item = await CateringOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });

    // Send cancellation email with sorry note
    if (status === 'cancelled' && existing.status !== 'cancelled') {
      const customerEmail = item.email || item.contact_email;
      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: '❌ Catering Request Cancelled — Biryani Box',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
              <h1 style="color:#f97316;margin-bottom:4px;">Biryani Box 🍛</h1>
              <p style="color:#888;font-size:13px;margin-bottom:28px;">Catering Cancellation</p>
              <h2 style="font-size:20px;margin-bottom:8px;">Dear ${item.contact_name || item.customer_name},</h2>
              <p style="color:#ccc;margin-bottom:20px;">We are truly sorry to inform you that your catering request has been <strong style="color:#ef4444;">cancelled</strong>.</p>
              <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin-bottom:20px;">
                <table style="width:100%;font-size:14px;">
                  <tr><td style="color:#888;padding:4px 0;">Event Date</td><td style="text-align:right;color:#fff;">${item.event_date || '—'}</td></tr>
                  <tr><td style="color:#888;padding:4px 0;">Guests</td><td style="text-align:right;color:#fff;">${item.guests || item.guest_count || '—'}</td></tr>
                  <tr><td style="color:#888;padding:4px 0;">Status</td><td style="text-align:right;color:#ef4444;font-weight:bold;">❌ Cancelled</td></tr>
                </table>
              </div>
              <div style="background:#1a0000;border-left:3px solid #ef4444;border-radius:8px;padding:16px;margin-bottom:20px;">
                <p style="color:#ef4444;font-size:13px;font-weight:bold;margin:0 0 6px;">We sincerely apologise for any inconvenience caused.</p>
                <p style="color:#ccc;font-size:13px;line-height:1.6;margin:0;">We are sorry for the disappointment this may have caused. Our team was unable to accommodate your catering request at this time. We genuinely hope you will give us another opportunity to serve you — please reach out and we will do our best to make it right!</p>
              </div>
              <p style="color:#666;font-size:12px;">Please contact us if you would like to discuss alternative options or reschedule.</p>
              <p style="color:#444;font-size:12px;margin-top:20px;">With sincere apologies,<br/><strong style="color:#f97316;">The Biryani Box Team</strong></p>
            </div>
          `,
        });
      }
    }

    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── PATCH /api/catering/:id/send-quotation — owner sends custom quotation + email
router.patch('/:id/send-quotation', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { total_price, quotation_message, status: newStatus } = req.body;
    const item = await CateringOrder.findByIdAndUpdate(
      req.params.id,
      { total_price, quotation_message, status: newStatus || 'confirmed' },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });

    const customerEmail = item.email || item.contact_email;
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: '📋 Your Catering Quotation — Biryani Box',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
            <h1 style="color:#f97316;margin-bottom:4px;">Biryani Box 🍛</h1>
            <p style="color:#888;font-size:13px;margin-bottom:28px;">Catering Quotation</p>
            <h2 style="font-size:20px;margin-bottom:8px;">Dear ${item.contact_name || item.customer_name},</h2>
            <p style="color:#ccc;margin-bottom:20px;">Thank you for choosing Biryani Box for your event! Here is our quotation for your catering request.</p>
            <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">Event Details</p>
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#888;padding:4px 0;">Event Date</td><td style="text-align:right;color:#fff;">${item.event_date}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Guests</td><td style="text-align:right;color:#fff;">${item.guests || item.guest_count || 'TBD'}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Event Type</td><td style="text-align:right;color:#fff;">${item.event_type || 'Catering'}</td></tr>
                ${total_price ? `<tr><td style="color:#888;padding:4px 0;">Total Quote</td><td style="text-align:right;color:#f97316;font-weight:bold;font-size:18px;">$${total_price}</td></tr>` : ''}
              </table>
            </div>
            ${quotation_message ? `
            <div style="background:#1a1a1a;border-left:3px solid #f97316;border-radius:8px;padding:16px;margin-bottom:20px;">
              <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Message from our team</p>
              <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0;">${quotation_message}</p>
            </div>` : ''}
            <p style="color:#666;font-size:12px;">Please reply to this email or contact us to confirm your booking. We look forward to making your event special!</p>
            <p style="color:#444;font-size:12px;margin-top:20px;">Warm regards,<br/><strong style="color:#f97316;">The Biryani Box Team</strong></p>
          </div>
        `,
      });
    }

    res.json({ success: true, data: item, message: 'Quotation sent to customer email.' });
  } catch (err) { next(err); }
});

// ── PATCH /api/catering/:id/price ─────────────────────────────────────────
router.patch('/:id/price', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const item = await CateringOrder.findByIdAndUpdate(req.params.id, { total_price: req.body.total_price }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

// ── DELETE /api/catering/:id ──────────────────────────────────────────────
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    const item = await CateringOrder.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Catering request deleted' });
  } catch (err) { next(err); }
});

// ── GET /api/catering/send-reminders ─────────────────────────────────────
// Call this periodically (e.g. once a day). Sends notifications to owner,
// manager AND customer for catering events happening tomorrow.
router.get('/send-reminders', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    // Find catering orders whose event_date starts with tomorrow's date string
    const events = await CateringOrder.find({
      event_date: { $regex: `^${tomorrowStr}` },
      status: { $in: ['pending', 'confirmed'] },
    });

    let sentCount = 0;
    for (const event of events) {
      // Notify owner + manager
      const staff = await User.find({ role: { $in: ['owner', 'manager'] }, is_active: true });
      await Notification.insertMany(staff.map(u => ({
        user_id: u._id, type: 'catering_reminder',
        title: '📅 Catering Event Tomorrow!',
        message: `Reminder: "${event.event_type || 'Catering event'}" for ${event.guest_count || event.guests} guests is scheduled for tomorrow (${tomorrowStr}). Contact: ${event.customer_name || event.contact_name} — ${event.email || event.contact_email}.`,
      })));

      // Notify customer via email
      const customerEmail = event.email || event.contact_email;
      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: '⏰ Your Catering Event is Tomorrow — Biryani Box',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
              <h1 style="color:#f97316;">Biryani Box 🍛</h1>
              <p style="color:#888;font-size:13px;margin-bottom:28px;">Catering Reminder</p>
              <h2 style="font-size:20px;">Your event is tomorrow, ${event.customer_name || event.contact_name}!</h2>
              <p style="color:#ccc;margin:16px 0;">This is a friendly reminder that your catering order is scheduled for <strong style="color:#f97316;">${tomorrowStr}</strong>.</p>
              <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin:20px 0;">
                <table style="width:100%;font-size:14px;">
                  <tr><td style="color:#888;padding:4px 0;">Event Type</td><td style="text-align:right;color:#fff;">${event.event_type || 'Catering'}</td></tr>
                  <tr><td style="color:#888;padding:4px 0;">Guests</td><td style="text-align:right;color:#fff;">${event.guest_count || event.guests || 'TBD'}</td></tr>
                  <tr><td style="color:#888;padding:4px 0;">Status</td><td style="text-align:right;color:#f97316;font-weight:bold;">${event.status}</td></tr>
                </table>
              </div>
              <p style="color:#666;font-size:12px;">If you have any last-minute changes, please contact us immediately. We look forward to serving you!</p>
              <p style="color:#444;font-size:12px;margin-top:20px;">Warm regards,<br/><strong style="color:#f97316;">The Biryani Box Team</strong></p>
            </div>
          `,
        });
      }
      sentCount++;
    }

    res.json({ success: true, message: `Reminders sent for ${sentCount} event(s) happening tomorrow.` });
  } catch (err) { next(err); }
});

module.exports = router;