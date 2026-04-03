const mongoose = require('mongoose');

const KitchenStationSchema = new mongoose.Schema({
  name:               { type: String, required: true, unique: true, maxlength: 80 },
  handles_categories: [{ type: String }],
  capacity:           { type: Number, default: 5, min: 1 },
  is_active:          { type: Boolean, default: true }
});

module.exports = mongoose.model('KitchenStation', KitchenStationSchema);
