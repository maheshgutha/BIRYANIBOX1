const mongoose = require('mongoose');

const PeakWindowSchema = new mongoose.Schema(
  { start: { type: Number, min: 0, max: 23 }, end: { type: Number, min: 0, max: 23 } },
  { _id: false }
);

const DeliveryPricingSchema = new mongoose.Schema({
  name:     { type: String, default: 'default', unique: true },
  is_active:{ type: Boolean, default: true },

  // ── Base pricing ───────────────────────────────────────────────────────────
  base_price:  { type: Number, default: 30,  min: 0 }, // ₹30 for first base_km
  base_km:     { type: Number, default: 3,   min: 0 }, // first N km covered by base_price
  per_km_rate: { type: Number, default: 10,  min: 0 }, // ₹/km beyond base_km
  max_delivery_km: { type: Number, default: 15, min: 1 }, // hard distance cap

  // ── Time-based surcharges ──────────────────────────────────────────────────
  peak_hour_charge: { type: Number, default: 20, min: 0 },
  peak_hours: { type: [PeakWindowSchema], default: [
    { start: 12, end: 14 }, // lunch  12:00–14:00
    { start: 19, end: 21 }, // dinner 19:00–21:00
  ]},
  late_night_charge: { type: Number, default: 15, min: 0 },
  late_night_start:  { type: Number, default: 22, min: 0, max: 23 }, // 22:00
  late_night_end:    { type: Number, default:  6, min: 0, max: 23 }, // 06:00

  // ── Order-value conditions ────────────────────────────────────────────────
  small_order_fee:       { type: Number, default: 20,  min: 0 },
  small_order_threshold: { type: Number, default: 199, min: 0 }, // order < threshold → add fee
  free_delivery_threshold:{ type: Number, default: 599, min: 0 }, // order ≥ threshold → free

  // ── Surge pricing (future-ready) ──────────────────────────────────────────
  surge_multiplier: { type: Number, default: 1.0, min: 1 },
  surge_active:     { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('DeliveryPricing', DeliveryPricingSchema);