const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name:           { type: String, required: true, maxlength: 100 },
  email:          { type: String, unique: true, sparse: true, lowercase: true },
  phone:          { type: String, maxlength: 20 },
  password_hash:  { type: String },
  role:           { type: String, enum: ['owner','manager','captain','delivery','customer','chef'], default: 'customer' },
  avatar_url:     { type: String },
  loyalty_points: { type: Number, default: 0 },
  order_count:    { type: Number, default: 0 },
  vehicle_type:   { type: String },
  driver_rating:  { type: Number, min: 0, max: 5 },
  delivery_count: { type: Number, default: 0 },
  is_active:      { type: Boolean, default: true },
  reset_token:    { type: String },
  reset_expire:   { type: Date }
}, { timestamps: { createdAt: 'created_at' } });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash') || !this.password_hash) return next();
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

UserSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password_hash);
};

UserSchema.methods.getSignedToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

module.exports = mongoose.model('User', UserSchema);
