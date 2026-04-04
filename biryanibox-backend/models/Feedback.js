const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  customer_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer_name: { type: String, maxlength: 100, default: 'Anonymous' },
  mobile_number: { type: String, maxlength: 20 },
  order_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating:        { type: Number, min: 1, max: 5, required: true },
  message:       { type: String, maxlength: 2000 },
  suggestion:    { type: String, maxlength: 2000 },
  category:      { type: String, enum: ['food', 'service', 'ambience', 'general'], default: 'general' },
  is_read:       { type: Boolean, default: false },
  read_by:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read_at:       { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Feedback', FeedbackSchema);