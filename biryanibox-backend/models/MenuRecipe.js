const mongoose = require('mongoose');

const MenuRecipeSchema = new mongoose.Schema({
  menu_item_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  ingredient_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  qty_per_serving: { type: Number, required: true, min: 0 }
});

MenuRecipeSchema.index({ menu_item_id: 1, ingredient_id: 1 }, { unique: true });

module.exports = mongoose.model('MenuRecipe', MenuRecipeSchema);
