const express          = require('express');
const router           = express.Router();
const { protect }      = require('../middleware/auth');
const DeliveryPricing  = require('../models/DeliveryPricing');
const { calculateDeliveryPrice, getPricingConfig } = require('../services/deliveryPricingService');

// ── POST /api/delivery-pricing/calculate ──────────────────────────────────────
// Calculate delivery fee for a destination + current cart value.
// Body: { destination: string|{lat,lng}, orderValue?: number, time?: ISO-string }
router.post('/calculate', protect, async (req, res, next) => {
  try {
    const { destination, orderValue = 0, time } = req.body;
    if (!destination) {
      return res.status(400).json({ success: false, message: 'destination is required' });
    }

    const result = await calculateDeliveryPrice(
      destination,
      parseFloat(orderValue) || 0,
      time || null
    );

    if (result.error) {
      return res.status(422).json({ success: false, message: result.error, distanceKm: result.distanceKm });
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── GET /api/delivery-pricing/config ─────────────────────────────────────────
// Returns the active pricing configuration (any authenticated user).
router.get('/config', protect, async (req, res, next) => {
  try {
    const config = await getPricingConfig();
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

// ── PUT /api/delivery-pricing/config ─────────────────────────────────────────
// Update pricing rules. Owner / Manager only.
router.put('/config', protect, async (req, res, next) => {
  try {
    if (!['owner', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Owner or Manager access required.' });
    }

    let config = await DeliveryPricing.findOne({ is_active: true });
    if (!config) config = new DeliveryPricing({ name: 'default' });

    const allowed = [
      'base_price', 'base_km', 'per_km_rate', 'max_delivery_km',
      'peak_hour_charge', 'peak_hours',
      'late_night_charge', 'late_night_start', 'late_night_end',
      'small_order_fee', 'small_order_threshold', 'free_delivery_threshold',
      'surge_multiplier', 'surge_active',
    ];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) config[field] = req.body[field];
    });
    await config.save();

    res.json({ success: true, data: config, message: 'Pricing config updated.' });
  } catch (err) { next(err); }
});

module.exports = router;