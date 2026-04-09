const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  // Name fields — full name + split first/last
  name:              { type: String, required: true, maxlength: 100 },
  first_name:        { type: String, maxlength: 50 },
  last_name:         { type: String, maxlength: 50 },

  email:             { type: String, unique: true, sparse: true, lowercase: true },
  phone:             { type: String, maxlength: 20 },
  password_hash:     { type: String },
  role:              {
    type: String,
    enum: ['owner', 'manager', 'captain', 'chef', 'delivery', 'customer', 'servant', 'helper', 'cleaner', 'security'],
    default: 'customer'
  },
  avatar_url:        { type: String },

  // OTP fields for email verification
  otp_code:          { type: String },
  otp_expires:       { type: Date },
  is_verified:       { type: Boolean, default: false },

  // Full personal details (for staff)
  dob:               { type: Date },
  gender:            { type: String, enum: ['male', 'female', 'other', ''] },
  address:           { type: String, maxlength: 300 },
  city:              { type: String, maxlength: 100 },
  state:             { type: String, maxlength: 100 },
  pincode:           { type: String, maxlength: 10 },
  emergency_contact_name:  { type: String, maxlength: 100 },
  emergency_contact_phone: { type: String, maxlength: 20 },
  joining_date:      { type: Date },
  id_proof_type:     { type: String, enum: ['aadhar', 'pan', 'passport', 'driving_license', 'ssn', 'drivers_license', ''] },
  id_proof_number:   { type: String, maxlength: 50 },
  bank_account:      { type: String, maxlength: 50 },
  ifsc_code:         { type: String, maxlength: 20 },
  salary:            { type: Number, default: 0 },

  // Status
  is_active:         { type: Boolean, default: true },
  disabled_reason:   { type: String, maxlength: 200 },
  disabled_at:       { type: Date },

  // Customer fields
  loyalty_points:    { type: Number, default: 0 },
  order_count:       { type: Number, default: 0 },
  total_spent:       { type: Number, default: 0 },   // cumulative spend in USD
  reward_coupons:    [
    {
      code:        String,
      amount:      Number,
      is_used:     { type: Boolean, default: false },
      created_at:  { type: Date, default: Date.now },
      expires_at:  Date,
    }
  ],

  // Delivery fields
  vehicle_type:      { type: String },
  driver_rating:     { type: Number, min: 0, max: 5 },
  delivery_count:    { type: Number, default: 0 },

  reset_token:       { type: String },
  reset_expire:      { type: Date },
}, { timestamps: { createdAt: 'created_at' } });

UserSchema.pre('save', async function (next) {
  // Auto-split name into first/last if not set
  if (this.isModified('name') && this.name) {
    const parts = this.name.trim().split(' ');
    if (!this.first_name) this.first_name = parts[0] || '';
    if (!this.last_name)  this.last_name  = parts.slice(1).join(' ') || '';
  }
  if (!this.isModified('password_hash') || !this.password_hash) return next();
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password_hash);
};

UserSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Generate a 6-digit OTP
UserSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp_code    = otp;
  this.otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  return otp;
};

module.exports = mongoose.model('User', UserSchema);