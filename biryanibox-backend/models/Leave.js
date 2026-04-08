const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:       { type: String, enum: ['captain', 'chef', 'manager', 'owner'], required: true },
  leave_type: { type: String, enum: ['sick', 'casual', 'emergency', 'annual', 'unpaid'], default: 'casual' },
  from_date:  { type: Date, required: true },
  to_date:    { type: Date, required: true },
  days:       { type: Number, required: true },
  reason:     { type: String, required: true, maxlength: 500 },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approved_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:{ type: Date },
  remarks:    { type: String, maxlength: 300 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Leave', LeaveSchema);