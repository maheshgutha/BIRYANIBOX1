const mongoose = require('mongoose');

const LoyaltyTransactionSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type:        { type: String, enum: ['earn','redeem','expire','adjust'], required: true },
  points:      { type: Number, required: true },
  description: { type: String, maxlength: 200 }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);
