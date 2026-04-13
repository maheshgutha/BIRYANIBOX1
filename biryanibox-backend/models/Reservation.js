const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  customer_name:  { type: String, required: true, maxlength: 100 },
  email:          { type: String },
  phone:          { type: String },
  date:           { type: Date, required: true },
  time:           { type: String, required: true },
  guests:         { type: Number, required: true, min: 1 },
  notes:          { type: String },
  status:         { type: String, enum: ['pending','confirmed','cancelled'], default: 'pending' },
  table_assigned: { type: String },
  table_reserved: { type: Boolean, default: false }, // set true when 30-min auto-reserve fires
  quotation_message: { type: String },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Reservation', ReservationSchema);