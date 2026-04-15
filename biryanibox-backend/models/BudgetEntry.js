const mongoose = require('mongoose');

const BudgetEntrySchema = new mongoose.Schema({
  title:      { type: String, required: true, maxlength: 200 },
  amount:     { type: Number, required: true, min: 0 },
  category:   { type: String, enum: ['rent', 'salary', 'utilities', 'supplies', 'marketing', 'maintenance', 'equipment', 'other'], default: 'other' },
  entry_type: { type: String, enum: ['expense', 'income'], required: true },
  period:     { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', 'one-time'], default: 'one-time' },
  date:       { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:      { type: String, maxlength: 500 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('BudgetEntry', BudgetEntrySchema);