const mongoose = require('mongoose');

const RestaurantTableSchema = new mongoose.Schema({
  label:     { type: String, required: true, unique: true, maxlength: 20 },
  capacity:  { type: Number, min: 1, default: 4 },
  type:      { type: String, enum: ['regular','vip','outdoor','takeaway'], default: 'regular' },
  status:    { type: String, enum: ['available','occupied','reserved'], default: 'available' },
  is_active: { type: Boolean, default: true }
});

module.exports = mongoose.model('RestaurantTable', RestaurantTableSchema);
