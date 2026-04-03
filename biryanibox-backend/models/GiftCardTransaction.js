const mongoose = require('mongoose');

const GiftCardTransactionSchema = new mongoose.Schema({
  gift_card_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GiftCard', required: true },
  order_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount_used:  { type: Number, required: true, min: 0 },
  used_at:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('GiftCardTransaction', GiftCardTransactionSchema);
