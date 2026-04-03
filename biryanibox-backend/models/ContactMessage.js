const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name:           { type: String, required: true, maxlength: 100 },
  email:          { type: String, required: true },
  date_requested: { type: Date },
  guest_count:    { type: Number, min: 1 },
  message:        { type: String },
  status:         { type: String, enum: ['new','read','replied'], default: 'new' }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
