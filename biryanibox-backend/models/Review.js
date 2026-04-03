const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  menu_item_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  order_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating:        { type: Number, required: true, min: 1, max: 5 },
  review_text:   { type: String },
  reviewer_name: { type: String, maxlength: 100 },
  reviewer_role: { type: String, maxlength: 80 },
  is_featured:   { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Review', ReviewSchema);
