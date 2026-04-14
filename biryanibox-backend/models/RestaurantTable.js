const mongoose = require('mongoose');

const RestaurantTableSchema = new mongoose.Schema({
  table_number: { type: Number, required: true, unique: true, min: 1 },
  label:        { type: String, required: true, unique: true, maxlength: 30 },
  capacity:     { type: Number, min: 1, default: 4 },
  type:         { type: String, enum: ['regular', 'vip', 'outdoor'], default: 'regular' },
  status:       { type: String, enum: ['available', 'occupied', 'reserved', 'not_available'], default: 'available' },
  captain_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  is_active:    { type: Boolean, default: true },
});

module.exports = mongoose.model('RestaurantTable', RestaurantTableSchema);