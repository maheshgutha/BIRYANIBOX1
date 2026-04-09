const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name:      { type: String, required: true, maxlength: 100 },
  unit:      {
    type: String,
    enum: ['kg', 'g', 'liters', 'ml', 'units', 'pieces', 'pounds', 'gallons', 'oz', 'cups'],
    required: true
  },
  stock:     { type: Number, default: 0, min: 0 },
  min_stock: { type: Number, default: 0, min: 0 },
  unit_cost: { type: Number, default: 0, min: 0 },

  // Grouping/categorisation
  category:  {
    type: String,
    enum: ['proteins', 'vegetables', 'spices_herbs', 'dairy', 'grains_rice', 'oils_fats', 'sauces_condiments', 'beverages', 'dry_goods', 'other'],
    default: 'other'
  },

  // Date when ingredient was added/purchased (mandatory)
  date_added:      { type: Date, required: true, default: Date.now },
  expiry_date:     { type: Date },

  supplier:        { type: String, maxlength: 100 },
  notes:           { type: String, maxlength: 500 },
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Ingredient', IngredientSchema);