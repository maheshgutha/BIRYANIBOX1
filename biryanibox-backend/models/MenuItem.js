const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name:         { type: String, required: true, maxlength: 100 },
  description:  { type: String },
  price:        { type: Number, required: true, min: 0 },
  category:     { type: String,enum: ['Dosa','Tiffins','Biryani','Pulao','Curries','Appetizers','Street Style','Beverages','Desserts'], required: true },
  image_url:    { type: String },
  prep_time:    { type: Number, min: 0 },
  rating:       { type: Number, min: 0, max: 5, default: 0 },
  spice_level:  { type: Number, min: 0, max: 3, default: 1 },
  is_veg:       { type: Boolean, default: false },
  is_halal:     { type: Boolean, default: true },
  stock:        { type: Number, default: 100, min: 0 },
  min_stock:    { type: Number, default: 10, min: 0 },
  is_available: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at' } });

MenuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', MenuItemSchema);