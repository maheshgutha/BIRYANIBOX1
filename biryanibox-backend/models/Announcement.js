// biryanibox-backend/models/Announcement.js
// REPLACE ENTIRE FILE — the original contained route code instead of a schema

const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title:          { type: String, required: true, maxlength: 200 },
  message:        { type: String, required: true, maxlength: 2000 },
  priority:       { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  target_roles:   [{ type: String, enum: ['owner', 'manager', 'captain', 'chef', 'customer'] }],
  is_active:      { type: Boolean, default: true },
  created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Calendar / scheduling support
  scheduled_date: { type: Date, default: null },
  is_scheduled:   { type: Boolean, default: false },
  // Festival offer
  is_festival:    { type: Boolean, default: false },
  festival_name:  { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Announcement', AnnouncementSchema);