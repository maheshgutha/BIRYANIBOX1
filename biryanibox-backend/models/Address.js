const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label:        { type: String, maxlength: 50 },
  address_line: { type: String, required: true },
  type:         { type: String, enum: ['home','office','other'], default: 'home' },
  is_default:   { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Address', AddressSchema);
