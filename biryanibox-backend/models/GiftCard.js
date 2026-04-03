const mongoose = require('mongoose');

const GiftCardSchema = new mongoose.Schema({
  code:              { type: String, required: true, unique: true },
  denomination:      { type: Number, required: true, min: 0 },
  balance:           { type: Number, required: true, min: 0 },
  purchased_by:      { type: String },
  recipient_name:    { type: String },
  recipient_contact: { type: String },
  delivery_method:   { type: String, enum: ['email','sms'] },
  status:            { type: String, enum: ['active','used','expired'], default: 'active' },
  expiry_date:       { type: Date }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('GiftCard', GiftCardSchema);
