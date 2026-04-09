const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const nodemailer = require('nodemailer');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── Nodemailer transporter (configure via .env) ─────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT  || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTPEmail = async (email, otp, name) => {
  try {
    await transporter.sendMail({
      from:    `"Biryani Box" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Your Biryani Box OTP Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#111;color:#fff;border-radius:16px;">
          <h2 style="color:#f97316;">Biryani Box 🍛</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your one-time verification code is:</p>
          <div style="font-size:40px;font-weight:900;letter-spacing:8px;color:#f97316;padding:20px 0;">${otp}</div>
          <p style="color:#888;font-size:12px;">This code expires in 10 minutes. Do not share it.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('OTP email error:', err.message);
    // Don't throw — fallback: log OTP in dev
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }
  }
};

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
// Send OTP to email before registration completes
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const existing = await User.findOne({ email, is_verified: true, role: 'customer' });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Upsert a temp user or update existing unverified
    let tempUser = await User.findOne({ email, is_verified: false });
    if (!tempUser) {
      tempUser = new User({ name: name || 'Guest', email, password_hash: 'TEMP', role: 'customer', is_verified: false });
    }
    const otp = tempUser.generateOTP();
    await tempUser.save({ validateBeforeSave: false });

    await sendOTPEmail(email, otp, name || 'Customer');
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
// Verify OTP and complete registration
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp, name, phone, password } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Please request an OTP first' });
    if (!user.otp_code || user.otp_code !== String(otp))
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otp_expires < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });

    // Complete registration
    user.name         = name || user.name;
    user.phone        = phone || user.phone;
    user.password_hash = password;
    user.is_verified  = true;
    user.otp_code     = undefined;
    user.otp_expires  = undefined;
    await user.save();

    const token = user.getSignedToken();
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, first_name, last_name, email, phone, password } = req.body;
    if (!name || !password) return res.status(400).json({ success: false, message: 'Name and password required' });
    const existing = email ? await User.findOne({ email, is_verified: true }) : null;
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const fullName = name || `${first_name || ''} ${last_name || ''}`.trim();
    const user = await User.create({
      name: fullName, first_name, last_name, email, phone,
      password_hash: password, role: 'customer', is_verified: true
    });
    const token = user.getSignedToken();
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated' });
    const token = user.getSignedToken();
    res.json({
      success: true, token,
      user: {
        id: user._id, name: user.name, first_name: user.first_name, last_name: user.last_name,
        email: user.email, role: user.role,
        loyalty_points: user.loyalty_points, total_spent: user.total_spent,
        reward_coupons: user.reward_coupons, avatar_url: user.avatar_url
      }
    });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash -reset_token -reset_expire -otp_code');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', protect, (req, res) => {
  const token = req.user.getSignedToken();
  res.json({ success: true, token });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user with that email' });
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.reset_token  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.reset_expire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Reset token generated', resetToken });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
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
    const jwt_token = user.getSignedToken();
    res.json({ success: true, token: jwt_token });
  } catch (err) { next(err); }
});

module.exports = router;