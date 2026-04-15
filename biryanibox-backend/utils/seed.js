require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
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
    // 4 Captains
    { name: 'Arjun Singh',    email: 'captain1@biryanibox.com', password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    { name: 'Priya Sharma',   email: 'captain2@biryanibox.com', password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    { name: 'Vikram Reddy',   email: 'captain3@biryanibox.com', password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    { name: 'Meena Patel',    email: 'captain4@biryanibox.com', password_hash: await bcrypt.hash('captain123',  salt), role: 'captain',  is_active: true },
    // 6 Chefs (one per station)
    { name: 'Rabbani Basha',  email: 'chef1@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    { name: 'Sanjay Kumar',   email: 'chef2@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    { name: 'Divya Menon',    email: 'chef3@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    { name: 'Imran Sheikh',   email: 'chef4@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    { name: 'Lakshmi Devi',   email: 'chef5@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    { name: 'Mohan Rao',      email: 'chef6@biryanibox.com',    password_hash: await bcrypt.hash('chef123',     salt), role: 'chef',     is_active: true },
    // 3 Riders
    { name: 'Ravi Kumar',     email: 'rider1@biryanibox.com',   password_hash: await bcrypt.hash('rider123',    salt), role: 'delivery', is_active: true, vehicle_type: 'Motorcycle', driver_rating: 4.8, delivery_count: 0 },
    { name: 'Suresh Babu',    email: 'rider2@biryanibox.com',   password_hash: await bcrypt.hash('rider123',    salt), role: 'delivery', is_active: true, vehicle_type: 'Bicycle',    driver_rating: 4.6, delivery_count: 0 },
    { name: 'Kiran Das',      email: 'rider3@biryanibox.com',   password_hash: await bcrypt.hash('rider123',    salt), role: 'delivery', is_active: true, vehicle_type: 'Scooter',    driver_rating: 4.7, delivery_count: 0 },
    // Customer
    { name: 'Anjali Verma',   email: 'customer@biryanibox.com', password_hash: await bcrypt.hash('customer123', salt), role: 'customer', is_active: true, loyalty_points: 850, order_count: 12 },
  ]);
  console.log('Users seeded (16 users)');

  // ── Kitchen Stations (6 stations) ─────────────────────────────────────────
  const stations = await KitchenStation.insertMany([
    { name: 'Biryani Station',   capacity: 5, is_active: true },
    { name: 'Grill Station',     capacity: 3, is_active: true },
    { name: 'Dessert Station',   capacity: 2, is_active: true },
    { name: 'Curry Station',     capacity: 4, is_active: true },
    { name: 'Tandoor Station',   capacity: 3, is_active: true },
    { name: 'Beverages Station', capacity: 2, is_active: true },
  ]);
  console.log('Kitchen stations seeded (6 stations)');

  // ── Chef Profiles (6 chefs, one per station) ───────────────────────────────
  const chef1 = users.find(u => u.email === 'chef1@biryanibox.com');
  const chef2 = users.find(u => u.email === 'chef2@biryanibox.com');
  const chef3 = users.find(u => u.email === 'chef3@biryanibox.com');
  const chef4 = users.find(u => u.email === 'chef4@biryanibox.com');
  const chef5 = users.find(u => u.email === 'chef5@biryanibox.com');
  const chef6 = users.find(u => u.email === 'chef6@biryanibox.com');

  await ChefProfile.insertMany([
    { user_id: chef1._id, specialization: 'Biryani',   experience_years: 8, station_id: stations[0]._id, status: 'active' },
    { user_id: chef2._id, specialization: 'Grill',     experience_years: 5, station_id: stations[1]._id, status: 'active' },
    { user_id: chef3._id, specialization: 'Desserts',  experience_years: 3, station_id: stations[2]._id, status: 'active' },
    { user_id: chef4._id, specialization: 'Curries',   experience_years: 6, station_id: stations[3]._id, status: 'active' },
    { user_id: chef5._id, specialization: 'Tandoor',   experience_years: 7, station_id: stations[4]._id, status: 'active' },
    { user_id: chef6._id, specialization: 'Beverages', experience_years: 2, station_id: stations[5]._id, status: 'active' },
  ]);
  console.log('Chef profiles seeded (6 chefs)');

  // ── Menu Items (35 items) ──────────────────────────────────────────────────
  await MenuItem.insertMany([

    // ── BIRYANI (7 items) ──
    {
      name: 'Chicken Biryani', price: 18.99, category: 'Biryani',
      prep_time: 25, rating: 4.8, spice_level: 3, is_veg: false, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
      description: 'Aromatic basmati rice layered with tender chicken and fried onions.',
    },
    {
      name: 'Mutton Biryani', price: 22.99, category: 'Biryani',
      prep_time: 35, rating: 4.9, spice_level: 3, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
      description: 'Slow-cooked tender mutton with fragrant whole spices.',
    },
    {
      name: 'Veg Biryani', price: 14.99, category: 'Biryani',
      prep_time: 20, rating: 4.5, spice_level: 2, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80',
      description: 'Fresh garden vegetables cooked with aromatic basmati rice.',
    },
    {
      name: 'Prawn Biryani', price: 24.99, category: 'Biryani',
      prep_time: 30, rating: 4.7, spice_level: 3, is_veg: false, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
      description: 'Juicy tiger prawns layered with spiced saffron rice.',
    },
    {
      name: 'Egg Biryani', price: 15.99, category: 'Biryani',
      prep_time: 20, rating: 4.4, spice_level: 2, is_veg: false, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
      description: 'Boiled eggs cooked in a tangy masala over fragrant rice.',
    },
    {
      name: 'Hyderabadi Dum Biryani', price: 26.99, category: 'Biryani',
      prep_time: 45, rating: 4.9, spice_level: 3, is_veg: false, is_halal: true,
      stock: 50, min_stock: 5, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
      description: 'Authentic slow-dum cooked Hyderabadi style with caramelised onions.',
    },
    {
      name: 'Paneer Biryani', price: 16.99, category: 'Biryani',
      prep_time: 25, rating: 4.6, spice_level: 2, is_veg: true, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80',
      description: 'Soft cottage cheese cubes layered with saffron-infused rice.',
    },

    // ── APPETIZERS (7 items) ──
    {
      name: 'Chicken Tikka', price: 14.99, category: 'Appetizers',
      prep_time: 15, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
      description: 'Grilled chicken marinated overnight in yogurt and aromatic spices.',
    },
    {
      name: 'Paneer 65', price: 12.99, category: 'Appetizers',
      prep_time: 12, rating: 4.6, spice_level: 3, is_veg: true, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
      description: 'Crispy fried paneer tossed in a fiery spiced sauce.',
    },
    {
      name: 'Seekh Kebab', price: 13.99, category: 'Appetizers',
      prep_time: 15, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
      description: 'Minced lamb skewers grilled on charcoal with mint chutney.',
    },
    {
      name: 'Hara Bhara Kebab', price: 10.99, category: 'Appetizers',
      prep_time: 12, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&q=80',
      description: 'Spinach and pea patties with a crisp golden crust.',
    },
    {
      name: 'Fish Tikka', price: 15.99, category: 'Appetizers',
      prep_time: 15, rating: 4.5, spice_level: 2, is_veg: false, is_halal: true,
      stock: 50, min_stock: 5, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
      description: 'Tender fish fillets marinated in ajwain and lemon, grilled to perfection.',
    },
    {
      name: 'Samosa (2 pcs)', price: 6.99, category: 'Appetizers',
      prep_time: 10, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 120, min_stock: 12, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
      description: 'Crispy pastry filled with spiced potatoes and green peas.',
    },
    {
      name: 'Chicken Lollipop', price: 13.99, category: 'Appetizers',
      prep_time: 15, rating: 4.6, spice_level: 3, is_veg: false, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
      description: 'Indo-Chinese style spicy fried chicken wings.',
    },

    // ── COMBOS (5 items) ──
    {
      name: 'Dal Makhani', price: 11.99, category: 'Combos',
      prep_time: 20, rating: 4.6, spice_level: 1, is_veg: true, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80',
      description: 'Slow cooked black lentils in a rich buttery tomato gravy.',
    },
    {
      name: 'Butter Chicken', price: 16.99, category: 'Combos',
      prep_time: 20, rating: 4.8, spice_level: 2, is_veg: false, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
      description: 'Tender chicken in a velvety tomato and cream sauce.',
    },
    {
      name: 'Family Feast (4 pax)', price: 54.99, category: 'Combos',
      prep_time: 40, rating: 4.8, spice_level: 2, is_veg: false, is_halal: true,
      stock: 30, min_stock: 3, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
      description: 'Chicken Biryani + Butter Chicken + Naan x4 + 2 Lassis.',
    },
    {
      name: 'Veg Thali', price: 17.99, category: 'Combos',
      prep_time: 25, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 50, min_stock: 5, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=600&q=80',
      description: 'Veg Biryani + Dal Makhani + Naan + Raita + Dessert.',
    },
    {
      name: 'Non-Veg Thali', price: 21.99, category: 'Combos',
      prep_time: 30, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true,
      stock: 50, min_stock: 5, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
      description: 'Chicken Biryani + Butter Chicken + Naan + Raita + Dessert.',
    },

    // ── BREADS (4 items) ──
    {
      name: 'Garlic Naan', price: 3.99, category: 'Breads',
      prep_time: 8, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 200, min_stock: 20, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
      description: 'Freshly baked naan brushed with garlic butter and coriander.',
    },
    {
      name: 'Butter Naan', price: 3.49, category: 'Breads',
      prep_time: 8, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 200, min_stock: 20, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
      description: 'Soft leavened bread cooked in tandoor and finished with butter.',
    },
    {
      name: 'Tandoori Roti', price: 2.49, category: 'Breads',
      prep_time: 6, rating: 4.3, spice_level: 1, is_veg: true, is_halal: true,
      stock: 200, min_stock: 20, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
      description: 'Whole wheat bread baked in a clay tandoor oven.',
    },
    {
      name: 'Cheese Naan', price: 4.99, category: 'Breads',
      prep_time: 10, rating: 4.6, spice_level: 1, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
      description: 'Naan stuffed with melted cheese and mild herbs.',
    },

    // ── DESSERTS (5 items) ──
    {
      name: 'Gulab Jamun', price: 6.99, category: 'Desserts',
      prep_time: 10, rating: 4.8, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601303516900-b5e0d6f64b14?w=600&q=80',
      description: 'Soft milk dumplings soaked in rose-cardamom sugar syrup.',
    },
    {
      name: 'Kheer', price: 5.99, category: 'Desserts',
      prep_time: 15, rating: 4.6, spice_level: 1, is_veg: true, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601303516900-b5e0d6f64b14?w=600&q=80',
      description: 'Creamy rice pudding slow-cooked with milk, sugar, and cardamom.',
    },
    {
      name: 'Rasmalai', price: 7.99, category: 'Desserts',
      prep_time: 10, rating: 4.7, spice_level: 1, is_veg: true, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601303516900-b5e0d6f64b14?w=600&q=80',
      description: 'Soft cottage cheese dumplings in chilled saffron-rose milk.',
    },
    {
      name: 'Halwa', price: 5.49, category: 'Desserts',
      prep_time: 12, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601303516900-b5e0d6f64b14?w=600&q=80',
      description: 'Semolina cooked in ghee with sugar, raisins, and cashews.',
    },
    {
      name: 'Ice Cream (2 scoops)', price: 4.99, category: 'Desserts',
      prep_time: 5, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1601303516900-b5e0d6f64b14?w=600&q=80',
      description: 'Choice of mango, vanilla, or rose ice cream.',
    },

    // ── DRINKS (7 items) ──
    {
      name: 'Mango Lassi', price: 5.99, category: 'Drinks',
      prep_time: 5, rating: 4.7, spice_level: 1, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
      description: 'Thick chilled mango yogurt shake with a hint of cardamom.',
    },
    {
      name: 'Sweet Lassi', price: 4.99, category: 'Drinks',
      prep_time: 5, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
      description: 'Classic chilled yogurt drink with sugar and rose water.',
    },
    {
      name: 'Salted Lassi', price: 4.49, category: 'Drinks',
      prep_time: 5, rating: 4.3, spice_level: 1, is_veg: true, is_halal: true,
      stock: 120, min_stock: 12, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
      description: 'Refreshing spiced yogurt drink with roasted cumin and rock salt.',
    },
    {
      name: 'Masala Chai', price: 3.49, category: 'Drinks',
      prep_time: 5, rating: 4.6, spice_level: 1, is_veg: true, is_halal: true,
      stock: 200, min_stock: 20, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
      description: 'Spiced milk tea brewed with ginger, cardamom, and cinnamon.',
    },
    {
      name: 'Rose Sharbat', price: 3.99, category: 'Drinks',
      prep_time: 3, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 120, min_stock: 12, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
      description: 'Chilled rose-flavoured syrup drink with basil seeds.',
    },
    {
      name: 'Fresh Lime Soda', price: 3.49, category: 'Drinks',
      prep_time: 3, rating: 4.3, spice_level: 1, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
      description: 'Freshly squeezed lime with sparkling water, sweet or salted.',
    },
    {
      name: 'Thandai', price: 5.49, category: 'Drinks',
      prep_time: 5, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80',
      description: 'Traditional chilled milk drink with almonds, fennel, and pepper.',
    },
  ]);
  console.log('Menu items seeded (35 items)');

  // ── Ingredients (25 items) ─────────────────────────────────────────────────
  await Ingredient.insertMany([
    // Grains & Rice
    { name: 'Basmati Rice',        unit: 'kg',     stock: 80,  min_stock: 15, unit_cost: 4.50 },
    { name: 'Whole Wheat Flour',   unit: 'kg',     stock: 30,  min_stock: 8,  unit_cost: 1.80 },
    { name: 'Semolina (Sooji)',    unit: 'kg',     stock: 15,  min_stock: 3,  unit_cost: 1.50 },

    // Proteins
    { name: 'Chicken',             unit: 'kg',     stock: 60,  min_stock: 12, unit_cost: 8.00 },
    { name: 'Mutton',              unit: 'kg',     stock: 35,  min_stock: 7,  unit_cost: 12.00 },
    { name: 'Prawn',               unit: 'kg',     stock: 20,  min_stock: 4,  unit_cost: 18.00 },
    { name: 'Fish Fillet',         unit: 'kg',     stock: 15,  min_stock: 3,  unit_cost: 10.00 },
    { name: 'Eggs',                unit: 'units',  stock: 200, min_stock: 30, unit_cost: 0.25 },  // ← fixed: was 'pcs'
    { name: 'Paneer',              unit: 'kg',     stock: 20,  min_stock: 4,  unit_cost: 9.00 },
    { name: 'Minced Lamb',         unit: 'kg',     stock: 15,  min_stock: 3,  unit_cost: 13.00 },

    // Vegetables
    { name: 'Onions',              unit: 'kg',     stock: 40,  min_stock: 8,  unit_cost: 1.50 },
    { name: 'Tomatoes',            unit: 'kg',     stock: 30,  min_stock: 6,  unit_cost: 2.00 },
    { name: 'Spinach',             unit: 'kg',     stock: 10,  min_stock: 2,  unit_cost: 2.50 },
    { name: 'Green Peas',          unit: 'kg',     stock: 10,  min_stock: 2,  unit_cost: 3.00 },
    { name: 'Potatoes',            unit: 'kg',     stock: 25,  min_stock: 5,  unit_cost: 1.20 },
    { name: 'Bell Peppers',        unit: 'kg',     stock: 8,   min_stock: 2,  unit_cost: 3.50 },
    { name: 'Garlic',              unit: 'kg',     stock: 8,   min_stock: 2,  unit_cost: 5.00 },
    { name: 'Ginger',              unit: 'kg',     stock: 6,   min_stock: 1,  unit_cost: 6.00 },

    // Dairy & Fats
    { name: 'Dairy/Cream',         unit: 'liters', stock: 20,  min_stock: 5,  unit_cost: 3.50 },
    { name: 'Butter (Unsalted)',   unit: 'kg',     stock: 10,  min_stock: 2,  unit_cost: 8.00 },
    { name: 'Curd / Yogurt',       unit: 'liters', stock: 20,  min_stock: 5,  unit_cost: 2.00 },
    { name: 'Milk',                unit: 'liters', stock: 30,  min_stock: 8,  unit_cost: 1.50 },

    // Spices & Condiments
    { name: 'Biryani Spice Mix',   unit: 'kg',     stock: 12,  min_stock: 2,  unit_cost: 15.00 },
    { name: 'Garam Masala',        unit: 'kg',     stock: 5,   min_stock: 1,  unit_cost: 18.00 },
    { name: 'Saffron', unit: 'g', stock: 100, min_stock: 20, unit_cost: 0.50 },
  ]);
  console.log('Ingredients seeded (25 items)');

  // ── Loyalty Tiers ──────────────────────────────────────────────────────────
  await LoyaltyTier.insertMany([
    { name: 'Bronze', min_points: 0,    max_points: 999,  discount_percent: 5,  perks: ['5% off orders', 'Birthday bonus'] },
    { name: 'Silver', min_points: 1000, max_points: 2999, discount_percent: 10, perks: ['10% off orders', 'Priority seating'] },
    { name: 'Gold',   min_points: 3000, max_points: null, discount_percent: 15, perks: ['15% off orders', 'Free delivery', 'VIP table'] },
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
  // Captain 4 → No tables (Delivery & Pickup only)
  const cap1 = users.find(u => u.email === 'captain1@biryanibox.com');
  const cap2 = users.find(u => u.email === 'captain2@biryanibox.com');
  const cap3 = users.find(u => u.email === 'captain3@biryanibox.com');

  await RestaurantTable.updateMany({ table_number: { $in: [1, 2, 3] } }, { captain_id: cap1._id });
  await RestaurantTable.updateMany({ table_number: { $in: [4, 5, 6] } }, { captain_id: cap2._id });
  await RestaurantTable.updateMany({ table_number: { $in: [7, 8, 9] } }, { captain_id: cap3._id });
  console.log('Captain zones assigned:');
  console.log(`  Captain1 (${cap1._id}) → Tables 1, 2, 3`);
  console.log(`  Captain2 (${cap2._id}) → Tables 4, 5, 6`);
  console.log(`  Captain3 (${cap3._id}) → Tables 7, 8, 9`);
  console.log(`  Captain4 → Delivery & Pickup (no tables)`);

  console.log('\n✅ Seed complete!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('  Users         : 16 (1 owner, 1 manager, 4 captains, 6 chefs, 3 riders, 1 customer)');
  console.log('  Kitchen Stns  : 6  (Biryani, Grill, Dessert, Curry, Tandoor, Beverages)');
  console.log('  Menu Items    : 35 (7 Biryani, 7 Appetizers, 5 Combos, 4 Breads, 5 Desserts, 7 Drinks)');
  console.log('  Ingredients   : 25 (Grains, Proteins, Vegetables, Dairy, Spices)');
  console.log('  Tables        : 9  (6 Regular, 3 VIP)');
  console.log('  Loyalty Tiers : 3  (Bronze, Silver, Gold)');
  console.log('═══════════════════════════════════════════════════');
  console.log('\nLogin credentials:');
  console.log('  Owner:    owner@biryanibox.com    / owner123');
  console.log('  Manager:  manager@biryanibox.com  / manager123');
  console.log('  Captain1: captain1@biryanibox.com / captain123  (Tables 1-3)');
  console.log('  Captain2: captain2@biryanibox.com / captain123  (Tables 4-6)');
  console.log('  Captain3: captain3@biryanibox.com / captain123  (Tables 7-9)');
  console.log('  Captain4: captain4@biryanibox.com / captain123  (Delivery/Pickup)');
  console.log('  Chef1:    chef1@biryanibox.com    / chef123      (Biryani Station)');
  console.log('  Chef2:    chef2@biryanibox.com    / chef123      (Grill Station)');
  console.log('  Chef3:    chef3@biryanibox.com    / chef123      (Dessert Station)');
  console.log('  Chef4:    chef4@biryanibox.com    / chef123      (Curry Station)');
  console.log('  Chef5:    chef5@biryanibox.com    / chef123      (Tandoor Station)');
  console.log('  Chef6:    chef6@biryanibox.com    / chef123      (Beverages Station)');
  console.log('  Rider1:   rider1@biryanibox.com   / rider123');
  console.log('  Rider2:   rider2@biryanibox.com   / rider123');
  console.log('  Rider3:   rider3@biryanibox.com   / rider123');
  console.log('  Customer: customer@biryanibox.com / customer123');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });