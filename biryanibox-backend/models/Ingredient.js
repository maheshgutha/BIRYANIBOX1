const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, maxlength: 100 },
  unit:      { type: String, enum: ['kg', 'g', 'liters', 'ml', 'units', 'pieces'], required: true },
  stock:     { type: Number, default: 0, min: 0 },
  min_stock: { type: Number, default: 0, min: 0 },
  unit_cost: { type: Number, default: 0, min: 0 },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Ingredient', IngredientSchema);