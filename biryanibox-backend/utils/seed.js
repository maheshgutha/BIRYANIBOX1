const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const LoyaltyTier = require('../models/LoyaltyTier');
const KitchenStation = require('../models/KitchenStation');
const RestaurantTable = require('../models/RestaurantTable');
const ChefProfile = require('../models/ChefProfile');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}), MenuItem.deleteMany({}), Ingredient.deleteMany({}),
    LoyaltyTier.deleteMany({}), KitchenStation.deleteMany({}),
    RestaurantTable.deleteMany({}), ChefProfile.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const salt = await bcrypt.genSalt(10);

  // ── Users (including chef) ─────────────────────────────────────────────────
  const users = await User.insertMany([
    { name: 'Rajesh Kumar',   email: 'owner@biryanibox.com',    password_hash: await bcrypt.hash('owner123',    salt), role: 'owner',    is_active: true },
    { name: 'Priya Sharma',   email: 'manager@biryanibox.com',  password_hash: await bcrypt.hash('manager123',  salt), role: 'manager',  is_active: true },
    { name: 'Arjun Singh',    email: 'captain@biryanibox.com',  password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    { name: 'Rabbani Basha',  email: 'chef@biryanibox.com',     password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    { name: 'Vikram Patel',   email: 'delivery@biryanibox.com', password_hash: await bcrypt.hash('delivery123', salt), role: 'delivery', is_active: true, vehicle_type: 'Motorcycle', driver_rating: 4.8, delivery_count: 245 },
    { name: 'Anjali Verma',   email: 'customer@biryanibox.com', password_hash: await bcrypt.hash('customer123', salt), role: 'customer', is_active: true, loyalty_points: 850, order_count: 12 },
  ]);
  console.log('Users seeded (6 users including chef)');

  // ── Kitchen Stations ───────────────────────────────────────────────────────
  const stations = await KitchenStation.insertMany([
    { name: 'Biryani Station',  handles_categories: ['Biryani'],     capacity: 10, is_active: true },
    { name: 'Tandoor Station',  handles_categories: ['Appetizers'],  capacity: 8,  is_active: true },
    { name: 'Bread Station',    handles_categories: ['Breads'],       capacity: 6,  is_active: true },
    { name: 'Dessert Station',  handles_categories: ['Desserts'],     capacity: 5,  is_active: true },
    { name: 'Beverage Station', handles_categories: ['Drinks'],       capacity: 8,  is_active: true },
  ]);
  console.log('Kitchen stations seeded');

  // ── Chef Profile (link chef user to Biryani Station) ───────────────────────
  const chefUser = users.find(u => u.email === 'chef@biryanibox.com');
  const biryaniStation = stations.find(s => s.name === 'Biryani Station');
  await ChefProfile.create({
    user_id:          chefUser._id,
    specialization:   'Hyderabadi Dum Biryani',
    station_id:       biryaniStation._id,
    experience_years: 8,
    status:           'active',
    orders_completed: 0,
    avg_prep_time_mins: 22,
    rating: 4.9,
  });
  console.log('Chef profile seeded');

  // ── Menu Items ─────────────────────────────────────────────────────────────
  await MenuItem.insertMany([
    { name: 'Chicken Dum Biryani',   price: 18.99, category: 'Biryani',    prep_time: 25, rating: 4.8, spice_level: 3, is_veg: false, is_halal: true, stock: 100, min_stock: 10, is_available: true, image_url: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=80', description: 'Traditional Hyderabadi dum biryani with succulent chicken and aromatic basmati rice.' },
    { name: 'Mutton Dum Biryani',    price: 22.99, category: 'Biryani',    prep_time: 30, rating: 4.9, spice_level: 3, is_veg: false, is_halal: true, stock: 80,  min_stock: 8,  is_available: true, image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80', description: 'Slow-cooked mutton layered with saffron-infused rice and premium heritage spices.' },
    { name: 'Shrimp Biryani',        price: 24.99, category: 'Biryani',    prep_time: 20, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true, stock: 60,  min_stock: 6,  is_available: true, image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&q=80', description: 'Succulent gulf shrimp marinated in a zesty masala and layered with fragrant rice.' },
    { name: 'Vegetable Dum Biryani', price: 16.99, category: 'Biryani',    prep_time: 22, rating: 4.6, spice_level: 2, is_veg: true,  is_halal: true, stock: 100, min_stock: 10, is_available: true, image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80', description: 'Garden-fresh seasonal vegetables cooked with aromatic long-grain basmati.' },
    { name: 'Egg Biryani',           price: 17.99, category: 'Biryani',    prep_time: 20, rating: 4.5, spice_level: 2, is_veg: false, is_halal: true, stock: 90,  min_stock: 9,  is_available: true, image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80', description: 'Hard-boiled eggs tossed in spicy masala and layered with saffron-flavored rice.' },
    { name: 'Chicken Tikka',         price: 14.99, category: 'Appetizers', prep_time: 15, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true, stock: 80,  min_stock: 8,  is_available: true, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', description: 'Boneless chicken marinated in yogurt and spices, grilled to smoky perfection.' },
    { name: 'Paneer 65',             price: 12.99, category: 'Appetizers', prep_time: 12, rating: 4.6, spice_level: 3, is_veg: true,  is_halal: true, stock: 70,  min_stock: 7,  is_available: true, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', description: 'Crispy fried paneer tossed in a spicy, tangy South Indian tempered sauce.' },
    { name: 'Lamb Seekh Kabab',      price: 15.99, category: 'Appetizers', prep_time: 15, rating: 4.8, spice_level: 2, is_veg: false, is_halal: true, stock: 60,  min_stock: 6,  is_available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', description: 'Minced lamb with herbs and specialty spices, skewered and tandoor-roasted.' },
    { name: 'Chicken Lollipop',      price: 13.99, category: 'Appetizers', prep_time: 12, rating: 4.5, spice_level: 2, is_veg: false, is_halal: true, stock: 60,  min_stock: 6,  is_available: true, image_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80' },
    { name: 'Samosa (3pc)',          price:  8.99, category: 'Appetizers', prep_time:  8, rating: 4.4, spice_level: 1, is_veg: true,  is_halal: true, stock: 120, min_stock: 12, is_available: true, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80' },
    { name: 'Garlic Naan',           price:  4.99, category: 'Breads',     prep_time:  5, rating: 4.7, spice_level: 1, is_veg: true,  is_halal: true, stock: 200, min_stock: 20, is_available: true, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80' },
    { name: 'Butter Naan',           price:  3.99, category: 'Breads',     prep_time:  5, rating: 4.6, spice_level: 1, is_veg: true,  is_halal: true, stock: 200, min_stock: 20, is_available: true, image_url: 'https://images.unsplash.com/photo-1584717781292-ab7e0dc74f3c?w=600&q=80' },
    { name: 'Paratha',               price:  4.49, category: 'Breads',     prep_time:  6, rating: 4.5, spice_level: 1, is_veg: true,  is_halal: true, stock: 150, min_stock: 15, is_available: true, image_url: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4d?w=600&q=80' },
    { name: 'Gulab Jamun (3pc)',     price:  6.99, category: 'Desserts',   prep_time:  5, rating: 4.8, spice_level: 1, is_veg: true,  is_halal: true, stock: 100, min_stock: 10, is_available: true, image_url: 'https://images.unsplash.com/photo-1652969893464-6d5e26e71370?w=600&q=80' },
    { name: 'Rasmalai',              price:  7.99, category: 'Desserts',   prep_time:  5, rating: 4.9, spice_level: 1, is_veg: true,  is_halal: true, stock: 80,  min_stock: 8,  is_available: true, image_url: 'https://images.unsplash.com/photo-1571101421849-ee5b29c00c02?w=600&q=80' },
    { name: 'Kheer',                 price:  5.99, category: 'Desserts',   prep_time:  5, rating: 4.6, spice_level: 1, is_veg: true,  is_halal: true, stock: 80,  min_stock: 8,  is_available: true, image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80' },
    { name: 'Family Combo (4)',      price: 49.99, category: 'Combos',     prep_time: 35, rating: 4.8, spice_level: 2, is_veg: false, is_halal: true, stock: 50,  min_stock: 5,  is_available: true, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80', description: 'Chicken Dum Biryani x2, Mutton x1, Garlic Naan x4, Raita, Gulab Jamun.' },
    { name: 'Couple Combo',          price: 34.99, category: 'Combos',     prep_time: 30, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true, stock: 60,  min_stock: 6,  is_available: true, image_url: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=80' },
    { name: 'Veg Combo',             price: 27.99, category: 'Combos',     prep_time: 25, rating: 4.5, spice_level: 2, is_veg: true,  is_halal: true, stock: 60,  min_stock: 6,  is_available: true, image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80' },
    { name: 'Mango Lassi',           price:  4.99, category: 'Drinks',     prep_time:  3, rating: 4.8, spice_level: 1, is_veg: true,  is_halal: true, stock: 150, min_stock: 15, is_available: true, image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80' },
    { name: 'Sweet Lassi',           price:  3.99, category: 'Drinks',     prep_time:  3, rating: 4.7, spice_level: 1, is_veg: true,  is_halal: true, stock: 150, min_stock: 15, is_available: true, image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80' },
    { name: 'Masala Chai',           price:  2.99, category: 'Drinks',     prep_time:  5, rating: 4.6, spice_level: 1, is_veg: true,  is_halal: true, stock: 200, min_stock: 20, is_available: true, image_url: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=600&q=80' },
    { name: 'Rose Sharbat',          price:  3.49, category: 'Drinks',     prep_time:  2, rating: 4.5, spice_level: 1, is_veg: true,  is_halal: true, stock: 150, min_stock: 15, is_available: true, image_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80' },
    { name: 'Paneer Tikka Masala',   price: 15.99, category: 'Appetizers', prep_time: 15, rating: 4.7, spice_level: 2, is_veg: true,  is_halal: true, stock: 70,  min_stock: 7,  is_available: true, image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80' },
    { name: 'Dal Makhani',           price: 13.99, category: 'Appetizers', prep_time: 15, rating: 4.6, spice_level: 1, is_veg: true,  is_halal: true, stock: 80,  min_stock: 8,  is_available: true, image_url: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80' },
  ]);
  console.log('Menu items seeded (25 items)');

  // ── Ingredients ────────────────────────────────────────────────────────────
  await Ingredient.insertMany([
    { name: 'Basmati Rice',  unit: 'kg',     stock: 100, min_stock: 10, reorder_lead_days: 3, unit_cost: 2.50 },
    { name: 'Chicken',       unit: 'kg',     stock: 60,  min_stock: 8,  reorder_lead_days: 2, unit_cost: 5.20 },
    { name: 'Mutton',        unit: 'kg',     stock: 40,  min_stock: 6,  reorder_lead_days: 3, unit_cost: 8.50 },
    { name: 'Shrimp',        unit: 'kg',     stock: 25,  min_stock: 5,  reorder_lead_days: 4, unit_cost: 9.00 },
    { name: 'Paneer',        unit: 'kg',     stock: 30,  min_stock: 5,  reorder_lead_days: 3, unit_cost: 4.50 },
    { name: 'Vegetables',    unit: 'kg',     stock: 80,  min_stock: 12, reorder_lead_days: 2, unit_cost: 3.20 },
    { name: 'Eggs',          unit: 'units',  stock: 120, min_stock: 20, reorder_lead_days: 2, unit_cost: 0.20 },
    { name: 'Flour',         unit: 'kg',     stock: 60,  min_stock: 8,  reorder_lead_days: 2, unit_cost: 1.10 },
    { name: 'Dairy',         unit: 'kg',     stock: 70,  min_stock: 10, reorder_lead_days: 2, unit_cost: 3.80 },
    { name: 'Spices',        unit: 'kg',     stock: 40,  min_stock: 5,  reorder_lead_days: 2, unit_cost: 10.00 },
    { name: 'Lamb Mince',    unit: 'kg',     stock: 25,  min_stock: 4,  reorder_lead_days: 2, unit_cost: 9.50 },
    { name: 'Potatoes',      unit: 'kg',     stock: 50,  min_stock: 8,  reorder_lead_days: 2, unit_cost: 1.50 },
    { name: 'Saffron',       unit: 'g',      stock: 500, min_stock: 50, reorder_lead_days: 7, unit_cost: 0.10 },
    { name: 'Ghee',          unit: 'kg',     stock: 20,  min_stock: 3,  reorder_lead_days: 5, unit_cost: 12.00 },
    { name: 'Rose Water',    unit: 'liters', stock: 10,  min_stock: 2,  reorder_lead_days: 7, unit_cost: 5.00 },
  ]);
  console.log('Ingredients seeded');

  // ── Loyalty Tiers ──────────────────────────────────────────────────────────
  await LoyaltyTier.insertMany([
    { name: 'Bronze',   min_points: 0,    max_points: 499,  discount_percent: 0,  perks: ['Birthday bonus points'] },
    { name: 'Silver',   min_points: 500,  max_points: 1499, discount_percent: 5,  perks: ['5% off orders', 'Free delivery on orders over $30'] },
    { name: 'Gold',     min_points: 1500, max_points: 2999, discount_percent: 10, perks: ['10% off orders', 'Free delivery always', 'Priority queue'] },
    { name: 'Platinum', min_points: 3000, max_points: null, discount_percent: 15, perks: ['15% off orders', 'Free delivery always', 'VIP table reservations', 'Exclusive menu items'] },
  ]);
  console.log('Loyalty tiers seeded');

  // ── Restaurant Tables ──────────────────────────────────────────────────────
  await RestaurantTable.insertMany([
    { label: 'Table 1', capacity: 4,  type: 'regular',  status: 'available', is_active: true },
    { label: 'Table 2', capacity: 4,  type: 'regular',  status: 'available', is_active: true },
    { label: 'Table 3', capacity: 6,  type: 'regular',  status: 'available', is_active: true },
    { label: 'Table 4', capacity: 6,  type: 'regular',  status: 'available', is_active: true },
    { label: 'Table 5', capacity: 8,  type: 'outdoor',  status: 'available', is_active: true },
    { label: 'Table 6', capacity: 8,  type: 'outdoor',  status: 'available', is_active: true },
    { label: 'VIP 1',   capacity: 10, type: 'vip',      status: 'available', is_active: true },
    { label: 'VIP 2',   capacity: 12, type: 'vip',      status: 'available', is_active: true },
    { label: 'Takeaway',capacity: 1,  type: 'takeaway', status: 'available', is_active: true },
  ]);
  console.log('Restaurant tables seeded');

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Owner:    owner@biryanibox.com    / owner123');
  console.log('  Manager:  manager@biryanibox.com  / manager123');
  console.log('  Captain:  captain@biryanibox.com  / captain123');
  console.log('  Chef:     chef@biryanibox.com     / chef123   ← NEW');
  console.log('  Delivery: delivery@biryanibox.com / delivery123');
  console.log('  Customer: customer@biryanibox.com / customer123');
  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });