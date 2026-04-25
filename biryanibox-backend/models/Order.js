const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  order_number:   { type: String, unique: true, sparse: true },
  customer_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  captain_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chef_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  station_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenStation' },
  table_number:   { type: String, maxlength: 10 },

  // ── Price breakdown ────────────────────────────────────────────────────
  subtotal:           { type: Number, default: 0, min: 0 }, // sum of item prices before discounts
  coupon_discount:    { type: Number, default: 0, min: 0 }, // reward coupon deduction
  gift_card_discount: { type: Number, default: 0, min: 0 }, // gift card deduction
  tier_discount:      { type: Number, default: 0, min: 0 }, // loyalty tier % discount
  delivery_fee:       { type: Number, min: 0, default: 0 },
  total:              { type: Number, required: true, min: 0 }, // FINAL amount after all discounts

  // coupon / gift-card meta
  coupon_code:        { type: String, default: null },
  gift_card_code:     { type: String, default: null },

  // pending_confirmation (dine-in awaiting owner/manager approval within 10 min)
  // → pending → start_cooking → completed_cooking → served → paid | cancelled
  status: {
    type: String,
    enum: ['pending_confirmation', 'pending', 'start_cooking', 'completed_cooking', 'served', 'paid', 'cancelled'],
    default: 'pending',
  },

  // For dine-in 10-min confirmation window
  confirmation_expires_at: { type: Date },

  order_type:     { type: String, enum: ['dine-in', 'delivery', 'takeaway', 'pickup'], default: 'dine-in' },
  payment_method: { type: String, enum: ['upi', 'card', 'cash', 'gift_card', 'mixed'] },
  spiceness:      { type: String, enum: ['mild', 'medium', 'hot', 'extra_hot'], default: 'medium' },
  rating:         { type: Number, min: 1, max: 5 },
  feedback:       { type: String },

  // Delivery fields
  delivery_address:  { type: String },
  delivery_notes:    { type: String },

  knock_bell:        { type: Boolean, default: true },

  // Pickup extra items requested by customer (e.g. spoons, sambar, curries)
  pickup_extra_items: { type: String },
  distance_km:       { type: Number, min: 0 },

  // Delivery customer contact info (captured from POS delivery form)
  delivery_customer_name:  { type: String },
  delivery_customer_email: { type: String },
  delivery_customer_phone: { type: String },

  // Timestamps
  cooking_started_at:   { type: Date },
  cooking_completed_at: { type: Date },
  served_at:            { type: Date },
  paid_at:              { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

OrderSchema.pre('save', function (next) {
  if (!this.order_number) {
    this.order_number = 'BOX-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);