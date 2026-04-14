const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const User             = require('../models/User');
const MenuItem         = require('../models/MenuItem');
const Ingredient       = require('../models/Ingredient');
const KitchenStation   = require('../models/KitchenStation');
const ChefProfile      = require('../models/ChefProfile');
const LoyaltyTier      = require('../models/LoyaltyTier');
const RestaurantTable  = require('../models/RestaurantTable');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), MenuItem.deleteMany({}), Ingredient.deleteMany({}),
    KitchenStation.deleteMany({}), ChefProfile.deleteMany({}),
    LoyaltyTier.deleteMany({}), RestaurantTable.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const salt = await bcrypt.genSalt(10);

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = await User.insertMany([
    { name: 'Rajesh Kumar',   email: 'owner@biryanibox.com',    password_hash: await bcrypt.hash('owner123',    salt), role: 'owner',    is_active: true },
    { name: 'Priya Nair',     email: 'manager@biryanibox.com',  password_hash: await bcrypt.hash('manager123',  salt), role: 'manager',  is_active: true },
    // 4 Captains — each has a unique zone
    { name: 'Arjun Singh',    email: 'captain1@biryanibox.com', password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    { name: 'Priya Sharma',   email: 'captain2@biryanibox.com', password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    { name: 'Vikram Reddy',   email: 'captain3@biryanibox.com', password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    { name: 'Meena Patel',    email: 'captain4@biryanibox.com', password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    // 3 Chefs
    { name: 'Rabbani Basha',  email: 'chef1@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    { name: 'Sanjay Kumar',   email: 'chef2@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    { name: 'Divya Menon',    email: 'chef3@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    // 3 Riders
    { name: 'Ravi Kumar',     email: 'rider1@biryanibox.com',   password_hash: await bcrypt.hash('rider123',    salt), role: 'delivery', is_active: true, vehicle_type: 'Motorcycle', driver_rating: 4.8, delivery_count: 0 },
    { name: 'Suresh Babu',    email: 'rider2@biryanibox.com',   password_hash: await bcrypt.hash('rider123',    salt), role: 'delivery', is_active: true, vehicle_type: 'Bicycle',    driver_rating: 4.6, delivery_count: 0 },
    { name: 'Kiran Das',      email: 'rider3@biryanibox.com',   password_hash: await bcrypt.hash('rider123',    salt), role: 'delivery', is_active: true, vehicle_type: 'Scooter',    driver_rating: 4.7, delivery_count: 0 },
    // Customer
    { name: 'Anjali Verma',   email: 'customer@biryanibox.com', password_hash: await bcrypt.hash('customer123', salt), role: 'customer', is_active: true, loyalty_points: 850, order_count: 12 },
  ]);
  console.log('Users seeded (13 users)');

  // ── Kitchen Stations ───────────────────────────────────────────────────────
  const stations = await KitchenStation.insertMany([
    { name: 'Biryani Station', capacity: 5, is_active: true },
    { name: 'Grill Station',   capacity: 3, is_active: true },
    { name: 'Dessert Station', capacity: 2, is_active: true },
  ]);
  console.log('Kitchen stations seeded');

  // ── Chef Profiles (all 3 chefs) ────────────────────────────────────────────
  const chef1 = users.find(u => u.email === 'chef1@biryanibox.com');
  const chef2 = users.find(u => u.email === 'chef2@biryanibox.com');
  const chef3 = users.find(u => u.email === 'chef3@biryanibox.com');
  await ChefProfile.insertMany([
    { user_id: chef1._id, specialization: 'Biryani', experience_years: 8,  station_id: stations[0]._id, status: 'active' },
    { user_id: chef2._id, specialization: 'Grill',   experience_years: 5,  station_id: stations[1]._id, status: 'active' },
    { user_id: chef3._id, specialization: 'Desserts',experience_years: 3,  station_id: stations[2]._id, status: 'active' },
  ]);
  console.log('Chef profiles seeded');

  // ── Menu Items ─────────────────────────────────────────────────────────────
  await MenuItem.insertMany([
    { name: 'Chicken Biryani',        price: 18.99, category: 'Biryani',    prep_time: 25, rating: 4.8, spice_level: 3, is_veg: false, is_halal: true, stock: 100, min_stock: 10, is_available: true, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', description: 'Aromatic basmati rice layered with tender chicken.' },
    { name: 'Mutton Biryani',         price: 22.99, category: 'Biryani',    prep_time: 35, rating: 4.9, spice_level: 3, is_veg: false, is_halal: true, stock: 80,  min_stock: 8,  is_available: true, image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80', description: 'Slow-cooked mutton with fragrant spices.' },
    { name: 'Veg Biryani',            price: 14.99, category: 'Biryani',    prep_time: 20, rating: 4.5, spice_level: 2, is_veg: true,  is_halal: true, stock: 100, min_stock: 10, is_available: true, image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80', description: 'Garden vegetables cooked with aromatic rice.' },
    { name: 'Chicken Tikka',          price: 14.99, category: 'Appetizers', prep_time: 15, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true, stock: 80,  min_stock: 8,  is_available: true, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', description: 'Grilled chicken marinated in yogurt and spices.' },
    { name: 'Paneer 65',              price: 12.99, category: 'Appetizers', prep_time: 12, rating: 4.6, spice_level: 3, is_veg: true,  is_halal: true, stock: 70,  min_stock: 7,  is_available: true, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', description: 'Crispy fried paneer in spicy sauce.' },
    { name: 'Dal Makhani',            price: 11.99, category: 'Combos',    prep_time: 20, rating: 4.6, spice_level: 1, is_veg: true,  is_halal: true, stock: 90,  min_stock: 9,  is_available: true, image_url: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80', description: 'Slow cooked black lentils in rich tomato gravy.' },
    { name: 'Butter Chicken',         price: 16.99, category: 'Combos',    prep_time: 20, rating: 4.8, spice_level: 2, is_veg: false, is_halal: true, stock: 90,  min_stock: 9,  is_available: true, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', description: 'Tender chicken in creamy tomato sauce.' },
    { name: 'Garlic Naan',            price: 3.99,  category: 'Breads',     prep_time: 8,  rating: 4.5, spice_level: 1, is_veg: true,  is_halal: true, stock: 200, min_stock: 20, is_available: true, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', description: 'Freshly baked naan with garlic butter.' },
    { name: 'Mango Lassi',            price: 5.99,  category: 'Drinks',  prep_time: 5,  rating: 4.7, spice_level: 1, is_veg: true,  is_halal: true, stock: 150, min_stock: 15, is_available: true, image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80', description: 'Chilled mango yogurt drink.' },
    { name: 'Gulab Jamun',            price: 6.99,  category: 'Desserts',   prep_time: 10, rating: 4.8, spice_level: 1, is_veg: true,  is_halal: true, stock: 100, min_stock: 10, is_available: true, image_url: 'https://images.unsplash.com/photo-1601303516900-b5e0d6f64b14?w=600&q=80', description: 'Soft milk dumplings in rose sugar syrup.' },
  ]);
  console.log('Menu items seeded');

  // ── Ingredients ────────────────────────────────────────────────────────────
  await Ingredient.insertMany([
    { name: 'Basmati Rice',  unit: 'kg',    stock: 50,  min_stock: 10, unit_cost: 4.50 },
    { name: 'Chicken',       unit: 'kg',    stock: 40,  min_stock: 8,  unit_cost: 8.00 },
    { name: 'Mutton',        unit: 'kg',    stock: 25,  min_stock: 5,  unit_cost: 12.00 },
    { name: 'Onions',        unit: 'kg',    stock: 30,  min_stock: 6,  unit_cost: 1.50 },
    { name: 'Tomatoes',      unit: 'kg',    stock: 20,  min_stock: 4,  unit_cost: 2.00 },
    { name: 'Spice Mix',     unit: 'kg',    stock: 10,  min_stock: 2,  unit_cost: 15.00 },
    { name: 'Dairy/Cream',   unit: 'liters', stock: 15,  min_stock: 3,  unit_cost: 3.50 },
    { name: 'Paneer',        unit: 'kg',    stock: 10,  min_stock: 2,  unit_cost: 9.00 },
  ]);
  console.log('Ingredients seeded');

  // ── Loyalty Tiers ──────────────────────────────────────────────────────────
  await LoyaltyTier.insertMany([
    { name: 'Bronze',   min_points: 0,    max_points: 999,  discount_percent: 5,  perks: ['5% off orders', 'Birthday bonus'] },
    { name: 'Silver',   min_points: 1000, max_points: 2999, discount_percent: 10, perks: ['10% off orders', 'Priority seating'] },
    { name: 'Gold',     min_points: 3000, max_points: null, discount_percent: 15, perks: ['15% off orders', 'Free delivery', 'VIP table'] },
  ]);
  console.log('Loyalty tiers seeded');

  // ── Restaurant Tables (9 tables) ───────────────────────────────────────────
  await RestaurantTable.insertMany([
    { table_number: 1, label: 'Table 1', capacity: 4,  type: 'regular', status: 'available', is_active: true },
    { table_number: 2, label: 'Table 2', capacity: 4,  type: 'regular', status: 'available', is_active: true },
    { table_number: 3, label: 'Table 3', capacity: 6,  type: 'regular', status: 'available', is_active: true },
    { table_number: 4, label: 'Table 4', capacity: 6,  type: 'regular', status: 'available', is_active: true },
    { table_number: 5, label: 'Table 5', capacity: 8,  type: 'regular', status: 'available', is_active: true },
    { table_number: 6, label: 'Table 6', capacity: 8,  type: 'regular', status: 'available', is_active: true },
    { table_number: 7, label: 'Table 7', capacity: 10, type: 'vip',     status: 'available', is_active: true },
    { table_number: 8, label: 'Table 8', capacity: 12, type: 'vip',     status: 'available', is_active: true },
    { table_number: 9, label: 'Table 9', capacity: 8,  type: 'vip',     status: 'available', is_active: true },
  ]);
  console.log('Restaurant tables seeded');

  // ── AUTO-ASSIGN Captains to their Table Zones ──────────────────────────────
  // Captain 1 → Tables 1, 2, 3
  // Captain 2 → Tables 4, 5, 6
  // Captain 3 → Tables 7, 8, 9
  // Captain 4 → No tables       (Delivery & Pickup only)
  const cap1 = users.find(u => u.email === 'captain1@biryanibox.com');
  const cap2 = users.find(u => u.email === 'captain2@biryanibox.com');
  const cap3 = users.find(u => u.email === 'captain3@biryanibox.com');
  // captain4 intentionally gets no tables — they handle delivery/pickup

  await RestaurantTable.updateMany({ table_number: { $in: [1, 2, 3] } }, { captain_id: cap1._id });
  await RestaurantTable.updateMany({ table_number: { $in: [4, 5, 6] } }, { captain_id: cap2._id });
  await RestaurantTable.updateMany({ table_number: { $in: [7, 8, 9] } }, { captain_id: cap3._id });
  console.log('Captain zones assigned:');
  console.log(`  Captain1 (${cap1._id}) → Tables 1, 2, 3`);
  console.log(`  Captain2 (${cap2._id}) → Tables 4, 5, 6`);
  console.log(`  Captain3 (${cap3._id}) → Tables 7, 8, 9`);
  console.log(`  Captain4 → Delivery & Pickup (no tables)`);

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Owner:    owner@biryanibox.com    / owner123');
  console.log('  Manager:  manager@biryanibox.com  / manager123');
  console.log('  Captain1: captain1@biryanibox.com / captain123  (Tables 1-3)');
  console.log('  Captain2: captain2@biryanibox.com / captain123  (Tables 4-6)');
  console.log('  Captain3: captain3@biryanibox.com / captain123  (Tables 7-9)');
  console.log('  Captain4: captain4@biryanibox.com / captain123  (Delivery/Pickup)');
  console.log('  Chef1:    chef1@biryanibox.com    / chef123');
  console.log('  Chef2:    chef2@biryanibox.com    / chef123');
  console.log('  Chef3:    chef3@biryanibox.com    / chef123');
  console.log('  Rider1:   rider1@biryanibox.com   / rider123');
  console.log('  Rider2:   rider2@biryanibox.com   / rider123');
  console.log('  Rider3:   rider3@biryanibox.com   / rider123');
  console.log('  Customer: customer@biryanibox.com / customer123');
  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });