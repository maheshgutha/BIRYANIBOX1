const mongoose = require('mongoose');

const ChefOrderAssignmentSchema = new mongoose.Schema({
  order_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  chef_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  station_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenStation' },
  status:       { type: String, enum: ['queued','cooking','done'], default: 'queued' },
  assigned_at:  { type: Date, default: Date.now },
  started_at:   { type: Date },
  completed_at: { type: Date }
});

module.exports = mongoose.model('ChefOrderAssignment', ChefOrderAssignmentSchema);
