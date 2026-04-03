const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  quantity:     { type: Number, required: true, min: 1, default: 1 },
  added_at:     { type: Date, default: Date.now }
});

CartItemSchema.index({ user_id: 1, menu_item_id: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', CartItemSchema);
