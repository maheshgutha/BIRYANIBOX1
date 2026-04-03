const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:       { type: String, maxlength: 50, default: 'info' },
  title:      { type: String, required: true, maxlength: 150 },
  message:    { type: String, required: true },
  is_read:    { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Notification', NotificationSchema);
