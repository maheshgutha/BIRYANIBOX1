const mongoose = require('mongoose');

const CateringOrderSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  email:         { type: String },
  phone:         { type: String },
  event_type:    { type: String },
  event_date:    { type: Date, required: true },
  delivery_time: { type: String },
  guest_count:   { type: Number, required: true, min: 1 },
  venue:         { type: String },
  menu_items:    [{ type: String }],
  menu_selection: { type: String },
  package_id:    { type: String },
  quote_value:   { type: Number, min: 0 },
  budget:        { type: Number, min: 0 },
  total_price:   { type: Number, min: 0 },
  status:        { type: String, enum: ['pending','confirmed','cancelled','completed'], default: 'pending' },
  notes:         { type: String },
  reminder_24h_sent: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('CateringOrder', CateringOrderSchema);