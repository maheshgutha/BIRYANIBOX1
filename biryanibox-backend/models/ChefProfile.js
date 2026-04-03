const mongoose = require('mongoose');

const ChefProfileSchema = new mongoose.Schema({
  user_id:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization:     { type: String },
  station_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenStation' },
  experience_years:   { type: Number, default: 0, min: 0 },
  status:             { type: String, enum: ['active','off-duty','on-break'], default: 'active' },
  orders_completed:   { type: Number, default: 0, min: 0 },
  avg_prep_time_mins: { type: Number, default: 0, min: 0 },
  rating:             { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('ChefProfile', ChefProfileSchema);
