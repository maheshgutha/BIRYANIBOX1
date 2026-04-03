const mongoose = require('mongoose');

const ChefShiftSchema = new mongoose.Schema({
  chef_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:       { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time:   { type: String, required: true },
  station_id: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenStation' },
  notes:      { type: String }
});

module.exports = mongoose.model('ChefShift', ChefShiftSchema);
