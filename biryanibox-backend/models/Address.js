const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label:        { type: String, maxlength: 50 },
  // Structured address fields
  street:       { type: String },
  city:         { type: String },
  state:        { type: String },
  pincode:      { type: String },
  // Legacy field — auto-built from structured fields
  address_line: { type: String },
  type:         { type: String, enum: ['home','office','other'], default: 'home' },
  is_default:   { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at' } });

// Auto-build address_line before save so the required constraint is satisfied
AddressSchema.pre('save', function(next) {
  const parts = [this.street, this.city, this.state, this.pincode].filter(Boolean);
  if (parts.length) this.address_line = parts.join(', ');
  if (!this.address_line) this.address_line = 'N/A';
  next();
});

module.exports = mongoose.model('Address', AddressSchema);