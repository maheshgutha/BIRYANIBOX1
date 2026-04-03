const mongoose = require('mongoose');

const LoyaltyTierSchema = new mongoose.Schema({
  name:             { type: String, enum: ['Bronze','Silver','Gold','Platinum'], required: true, unique: true },
  min_points:       { type: Number, required: true, min: 0 },
  max_points:       { type: Number },
  discount_percent: { type: Number, default: 0, min: 0, max: 100 },
  perks:            [{ type: String }]
});

module.exports = mongoose.model('LoyaltyTier', LoyaltyTierSchema);
