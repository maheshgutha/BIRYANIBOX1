const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !password) return res.status(400).json({ success: false, message: 'Name and password required' });
    const existing = email ? await User.findOne({ email }) : null;
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, phone, password_hash: password, role: 'customer' });
    const token = user.getSignedToken();
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated' });
    const token = user.getSignedToken();
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, loyalty_points: user.loyalty_points, avatar_url: user.avatar_url } });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash -reset_token -reset_expire');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', protect, (req, res) => {
  const token = req.user.getSignedToken();
  res.json({ success: true, token });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user with that email' });
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.reset_expire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Reset token generated', resetToken });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ reset_token: hashed, reset_expire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.password_hash = password;
    user.reset_token = undefined;
    user.reset_expire = undefined;
    await user.save();
    const jwt = user.getSignedToken();
    res.json({ success: true, token: jwt });
  } catch (err) { next(err); }
});

module.exports = router;
