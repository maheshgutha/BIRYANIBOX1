const express = require('express');
const router  = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const MenuItem = require('../models/MenuItem');

/* ── Email transporter (shared with catering) ───────────────────────────── */
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

// Middleware: optionally decode token without blocking unauthenticated requests
const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password_hash');
    }
  } catch (_) { /* token invalid or missing — that's OK */ }
  next();
};

// Helper: resolve offer_items (array of menu item _id strings) to name objects
const resolveOfferItems = async (announcements) => {
  // Collect all unique item IDs across all announcements
  const allIds = [...new Set(
    announcements.flatMap(a =>
      a.has_offer && a.offer_scope === 'selected' ? (a.offer_items || []) : []
    )
  )];
  if (allIds.length === 0) return announcements;

  // Fetch all relevant menu items in one query
  const items = await MenuItem.find({ _id: { $in: allIds } }).select('_id name');
  const idToName = {};
  items.forEach(it => { idToName[String(it._id)] = it.name; });

  // Return announcements with offer_items replaced by { id, name } objects
  return announcements.map(a => {
    const obj = a.toObject ? a.toObject() : a;
    if (obj.has_offer && obj.offer_scope === 'selected' && Array.isArray(obj.offer_items)) {
      obj.offer_items = obj.offer_items.map(id => ({
        id,
        name: idToName[String(id)] || id,
      }));
    }
    return obj;
  });
};

// GET /api/announcements — public + authenticated customers see customer-targeted ones
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    let filter = { is_active: true };

    // Customers (logged in or not) always see 'customer' targeted announcements
    const role = req.user?.role || 'customer';
    // Show announcements targeting the user's role OR customer role (so owners/managers see customer ones too)
    filter.target_roles = { $in: role === 'customer' ? ['customer'] : [role, 'customer'] };

    // Only show scheduled announcements that have passed their date
    filter.$or = [
      { is_scheduled: false },
      { is_scheduled: true, scheduled_date: { $lte: new Date() } },
    ];

    const announcements = await Announcement.find(filter)
      .populate('created_by', 'name role')
      .sort({ created_at: -1 });

    // Resolve offer_items (MenuItem ObjectIds) → { _id, name } objects
    const resolved = await resolveOfferItems(announcements);
    res.json({ success: true, data: resolved });
  } catch (err) { next(err); }
});

// GET /api/announcements/all — owner/manager see everything
router.get('/all', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('created_by', 'name role')
      .sort({ created_at: -1 });
    const resolved = await resolveOfferItems(announcements);
    res.json({ success: true, data: resolved });
  } catch (err) { next(err); }
});

// POST /api/announcements
router.post('/', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const {
      title, message, priority, target_roles,
      is_scheduled, scheduled_date,
      is_festival, festival_name,
      has_offer, offer_discount, offer_scope, offer_items,
    } = req.body;

    const roles = target_roles || ['customer'];
    const announcement = await Announcement.create({
      title, message,
      priority: priority || 'normal',
      target_roles: roles,
      is_active: true,
      created_by: req.user._id,
      is_scheduled: !!is_scheduled,
      scheduled_date: is_scheduled && scheduled_date ? new Date(scheduled_date) : null,
      is_festival: !!is_festival,
      festival_name: festival_name || '',
      has_offer: !!has_offer,
      offer_discount: has_offer ? Number(offer_discount) || 0 : 0,
      offer_scope: offer_scope || 'all',
      offer_items: has_offer ? (offer_items || []) : [],
    });

    // ── Send notifications to target staff roles immediately (non-scheduled) ─
    if (!is_scheduled) {
      const staffRoles = roles.filter(r => r !== 'customer');
      const emoji = is_festival ? '🎉' : has_offer ? '🎁' : priority === 'urgent' ? '🚨' : '📢';
      const notifTitle = `${emoji} ${title}`;
      const notifMsg   = has_offer ? `${message} — ${offer_discount}% OFF offer!` : message;

      // Notify targeted staff roles
      if (staffRoles.length > 0) {
        const staffTargets = await User.find({ role: { $in: staffRoles }, is_active: true });
        if (staffTargets.length > 0) {
          await Notification.insertMany(staffTargets.map(u => ({
            user_id: u._id, type: 'announcement', title: notifTitle, message: notifMsg,
          })));
        }
      }
      // Owner/manager always gets a ping when a customer announcement is posted
      if (roles.includes('customer')) {
        const admins = await User.find({ role: { $in: ['owner', 'manager'] }, is_active: true });
        if (admins.length > 0) {
          await Notification.insertMany(admins.map(u => ({
            user_id: u._id, type: 'announcement',
            title: `📢 Customer Announcement: ${title}`,
            message: `Posted to customers: "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}"`,
          })));
        }
      }

      // ── Bulk email to all registered customers ───────────────────────────
      if (roles.includes('customer')) {
        const customers = await User.find({
          role: 'customer',
          is_active: true,
          email: { $exists: true, $nin: ['', null] },
        }).select('name email');

        if (customers.length > 0) {
          const emoji      = is_festival ? '🎉' : has_offer ? '🎁' : priority === 'urgent' ? '🚨' : '📢';
          const badgeColor = priority === 'urgent' ? '#ef4444' : has_offer ? '#22c55e' : '#f97316';
          const badgeText  = priority === 'urgent' ? 'URGENT' : is_festival ? 'FESTIVAL' : has_offer ? `${offer_discount}% OFF` : 'ANNOUNCEMENT';

          // Send all emails concurrently (Promise.allSettled so one failure doesn't block others)
          await Promise.allSettled(customers.map(customer => sendEmail({
            to: customer.email,
            subject: `${emoji} ${title} — Biryani Box`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
                  <h1 style="color:#f97316;margin:0;font-size:22px;">Biryani Box 🍛</h1>
                  <span style="background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}44;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.1em;">${badgeText}</span>
                </div>

                <h2 style="font-size:20px;margin:0 0 12px;color:#fff;">${emoji} ${title}</h2>
                <p style="color:#ccc;font-size:14px;line-height:1.7;margin-bottom:20px;">${message}</p>

                ${has_offer ? `
                <div style="background:#0a1a0a;border:1px solid #22c55e44;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
                  <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Special Offer</p>
                  <p style="color:#22c55e;font-size:36px;font-weight:900;margin:0;">${offer_discount}% OFF</p>
                  ${offer_scope === 'all' ? '<p style="color:#aaa;font-size:13px;margin:8px 0 0;">Applicable on all menu items</p>' : ''}
                </div>` : ''}

                ${is_festival && festival_name ? `
                <div style="background:#1a1200;border:1px solid #f9731644;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
                  <p style="color:#f97316;font-size:16px;font-weight:800;margin:0;">🎊 ${festival_name}</p>
                </div>` : ''}

                <div style="background:#1a1a1a;border-radius:12px;padding:16px;margin-bottom:20px;border-left:3px solid #f97316;">
                  <p style="color:#888;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">From Biryani Box</p>
                  <p style="color:#aaa;font-size:12px;margin:0;">Hi ${customer.name || 'Valued Customer'}, thank you for being a part of our community. We hope to see you soon!</p>
                </div>

                <p style="color:#444;font-size:11px;margin-top:20px;text-align:center;">
                  You are receiving this because you have an account with Biryani Box.<br/>
                  <strong style="color:#f97316;">The Biryani Box Team</strong>
                </p>
              </div>
            `,
          })));
        }
      }
    }

    res.status(201).json({ success: true, data: announcement });
  } catch (err) { next(err); }
});

// PUT /api/announcements/:id
router.put('/:id', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, data: announcement });
  } catch (err) { next(err); }
});

// DELETE /api/announcements/:id
router.delete('/:id', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) { next(err); }
});

module.exports = router;