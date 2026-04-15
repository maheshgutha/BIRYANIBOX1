const express = require('express');
const router  = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    res.json({ success: true, data: announcements });
  } catch (err) { next(err); }
});

// GET /api/announcements/all — owner/manager see everything
router.get('/all', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('created_by', 'name role')
      .sort({ created_at: -1 });
    res.json({ success: true, data: announcements });
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