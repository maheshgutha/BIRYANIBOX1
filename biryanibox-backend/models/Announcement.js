const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title:          { type: String, required: true, maxlength: 200 },
  message:        { type: String, required: true, maxlength: 2000 },
  priority:       { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  target_roles:   [{ type: String, enum: ['owner', 'manager', 'captain', 'chef', 'customer'] }],
  is_active:      { type: Boolean, default: true },
  created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Scheduling
  scheduled_date: { type: Date, default: null },
  is_scheduled:   { type: Boolean, default: false },
  // Festival
  is_festival:    { type: Boolean, default: false },
  festival_name:  { type: String, default: '' },
  // Offer / discount
  has_offer:      { type: Boolean, default: false },
  offer_discount: { type: Number, default: 0 },      // percentage e.g. 20
  offer_scope:    { type: String, enum: ['all', 'selected'], default: 'all' },
  offer_items:    [{ type: String }],                // array of menu item _ids, or ['ALL']
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Announcement', AnnouncementSchema);