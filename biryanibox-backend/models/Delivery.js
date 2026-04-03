const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  order_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  driver_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer_name:    { type: String },
  phone:            { type: String },
  address:          { type: String },
  status:           { type: String, enum: ['assigned','picked-up','in-transit','delivered','failed'], default: 'assigned' },
  distance_km:      { type: Number, min: 0 },
  estimated_mins:   { type: Number, min: 0 },
  current_location: { type: String },
  order_placed_at:  { type: Date, default: Date.now },
  delivered_at:     { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', DeliverySchema);
