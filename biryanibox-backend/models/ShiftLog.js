const mongoose = require('mongoose');

const ShiftLogSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:       { type: String },
  check_in:   { type: Date },
  check_out:  { type: Date },
  date:       { type: String }, // YYYY-MM-DD for easy querying
  duration_minutes: { type: Number },
  notes:      { type: String, maxlength: 300 },
  status:     { type: String, enum: ['active', 'completed'], default: 'active' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ShiftLog', ShiftLogSchema);