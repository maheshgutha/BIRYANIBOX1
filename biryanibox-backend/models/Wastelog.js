const mongoose = require('mongoose');

const WasteLogSchema = new mongoose.Schema({
  ingredient_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
  menu_item_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  item_type:         { type: String, enum: ['ingredient', 'menu_item'], default: 'ingredient' },
  item_name:         { type: String, required: true },
  quantity_wasted:   { type: Number, required: true, min: 0 },
  unit:              { type: String, maxlength: 20 },
  unit_cost_at_time: { type: Number, default: 0 },
  total_loss:        { type: Number, default: 0 },
  reason:            { type: String, enum: ['spoilage', 'overcooking', 'expiry', 'spillage', 'quality_reject', 'other'], default: 'spoilage' },
  notes:             { type: String, maxlength: 500 },
  logged_by:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('WasteLog', WasteLogSchema);