const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  order_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:         { type: String },
  quantity:     { type: Number, required: true, min: 1 },
  unit_price:   { type: Number, required: true, min: 0 }
});

module.exports = mongoose.model('OrderItem', OrderItemSchema);
