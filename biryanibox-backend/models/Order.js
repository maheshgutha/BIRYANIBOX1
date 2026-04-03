const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  order_number:   { type: String, unique: true, sparse: true },
  customer_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  captain_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chef_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  station_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenStation' },
  table_number:   { type: String, maxlength: 10 },
  total:          { type: Number, required: true, min: 0 },
  status:         { type: String, enum: ['pending','preparing','served','paid','cancelled'], default: 'pending' },
  order_type:     { type: String, enum: ['dine-in','delivery','takeaway'], default: 'dine-in' },
  payment_method: { type: String, enum: ['upi','card','cash','gift_card'] },
  rating:         { type: Number, min: 1, max: 5 },
  feedback:       { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

OrderSchema.pre('save', function(next) {
  if (!this.order_number) {
    this.order_number = 'BOX-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
