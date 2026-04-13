const mongoose = require('mongoose');

const GiftCardSchema = new mongoose.Schema({
  code:             { type: String, required: true, unique: true },
  denomination:     { type: Number, required: true, min: 0 },
  balance:          { type: Number, required: true, min: 0 },
  sender_name:      { type: String },
  sender_email:     { type: String, lowercase: true },
  // Track which customer user sent this card (for sender dashboard)
  sent_by_user_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Track which customer has added/claimed this card to their account
  claimed_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  receiver_name:    { type: String },
  receiver_email:   { type: String, lowercase: true },
  // legacy fields kept for backward compat
  purchased_by:     { type: String },
  recipient_name:   { type: String },
  recipient_contact:{ type: String },
  delivery_method:  { type: String, enum: ['email', 'sms'], default: 'email' },
  status:           { type: String, enum: ['active', 'used', 'expired'], default: 'active' },
  expiry_date:      { type: Date },
  email_sent:       { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('GiftCard', GiftCardSchema);