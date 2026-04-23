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

  // ── Menu Items (from Biryani Box Menu) ───────────────────────────────────────
  await MenuItem.insertMany([

    // ── DOSA CORNER (11 items) ──
    {
      name: 'Plain Dosa', price: 8.15, category: 'Dosa',
      prep_time: 10, rating: 4.3, spice_level: 1, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
      description: 'Crispy thin rice and lentil crepe served with sambar and coconut chutney.',
    },
    {
      name: 'Paper Dosa', price: 8.15, category: 'Dosa',
      prep_time: 10, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1643268972535-a2b100ff3632?fm=jpg&q=…',
      description: 'Extra thin, extra crispy dosa stretched paper-thin, served with chutneys.',
    },
    {
      name: 'Masala Dosa', price: 9.50, category: 'Dosa',
      prep_time: 12, rating: 4.8, spice_level: 2, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=8…',
      description: 'Golden crispy dosa stuffed with spiced potato and onion masala.',
    },
    {
      name: 'Karam Dosa', price: 9.15, category: 'Dosa',
      prep_time: 12, rating: 4.5, spice_level: 3, is_veg: true, is_halal: true,
      stock: 120, min_stock: 12, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=8…',
      description: 'Spicy Andhra-style dosa spread with fiery karam (chilli) paste.',
    },
    {
      name: 'Cheese Dosa', price: 9.15, category: 'Dosa',
      prep_time: 12, rating: 4.6, spice_level: 1, is_veg: true, is_halal: true,
      stock: 120, min_stock: 12, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=8…',
      description: 'Crispy dosa loaded with melted cheese, served with tomato chutney.',
    },
    {
      name: 'Ghee Dosa', price: 9.50, category: 'Dosa',
      prep_time: 10, rating: 4.7, spice_level: 1, is_veg: true, is_halal: true,
      stock: 130, min_stock: 13, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=8…',
      description: 'Crispy dosa cooked generously with pure ghee for a rich flavour.',
    },
    {
      name: 'Ghee Karam Dosa', price: 9.89, category: 'Dosa',
      prep_time: 12, rating: 4.6, spice_level: 3, is_veg: true, is_halal: true,
      stock: 110, min_stock: 11, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=8…',
      description: 'Ghee-roasted dosa with spicy karam paste — Andhra-style favourite.',
    },
    {
      name: 'Onion Dosa', price: 11.00, category: 'Dosa',
      prep_time: 12, rating: 4.5, spice_level: 2, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=8…',
      description: 'Crispy dosa topped with caramelised onions and green chillies.',
    },
    {
      name: 'Uthapam', price: 10.50, category: 'Dosa',
      prep_time: 15, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/homemade-fish-biryani-served-yogurt-600w-1136948657.jpg',
      description: 'Thick soft rice pancake topped with onions, tomato, and coriander.',
    },
    {
      name: 'Pesarattu', price: 10.25, category: 'Dosa',
      prep_time: 12, rating: 4.4, spice_level: 2, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=8…',
      description: 'Andhra-style green moong dal crepe, crispy and protein-rich.',
    },
    {
      name: 'Upma Pesarattu', price: 10.50, category: 'Dosa',
      prep_time: 15, rating: 4.5, spice_level: 2, is_veg: true, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=8…',
      description: 'Moong dal crepe stuffed with soft semolina upma — a classic combo.',
    },

    // ── TIFFINS (6 items) ──
    {
      name: 'Pongal', price: 8.99, category: 'Tiffins',
      prep_time: 15, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/sakkarai-pongal-indian-festival-food-600w-2096870482.jpg',
      description: 'Comforting rice and lentil porridge tempered with pepper, cumin, and ghee.',
    },
    {
      name: 'Upma', price: 8.99, category: 'Tiffins',
      prep_time: 12, rating: 4.3, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/upma-made-samolina-rava-most-600w-1904780020.jpg',
      description: 'Fluffy roasted semolina cooked with vegetables and curry leaves.',
    },
    {
      name: 'Idly (2 pcs)', price: 8.99, category: 'Tiffins',
      prep_time: 10, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/dly-sambar-idli-sambhar-green-600w-2482760933.jpg',
      description: 'Soft steamed rice cakes served with sambar and fresh coconut chutney.',
    },
    {
      name: 'Vada (2 pcs)', price: 8.99, category: 'Tiffins',
      prep_time: 12, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 120, min_stock: 12, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/medu-vada-popular-south-indian-600w-1675667164.jpg',
      description: 'Crispy golden lentil doughnuts served with sambar and chutney.',
    },
    {
      name: 'Poori (3 pcs)', price: 11.99, category: 'Tiffins',
      prep_time: 15, rating: 4.6, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chole-bhature-spicy-chick-peas-600w-1867969534.jpg',
      description: 'Fluffy deep-fried whole wheat puffed bread served with potato masala.',
    },
    {
      name: 'Chapathi (3 pcs)', price: 11.99, category: 'Tiffins',
      prep_time: 12, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 120, min_stock: 12, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chole-chana-masala-paratha-chickpea-600w-1962699067.jpg',
      description: 'Soft whole wheat flatbreads served with dal or vegetable curry.',
    },

    // ── BIRYANI CORNER (7 items) ──
    {
      name: 'Chicken Dum Biryani', price: 16.90, category: 'Biryani',
      prep_time: 35, rating: 4.8, spice_level: 3, is_veg: false, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
      description: 'Slow dum-cooked aromatic basmati layered with tender bone-in chicken.',
    },
    {
      name: 'Boneless Chicken Biryani', price: 17.90, category: 'Biryani',
      prep_time: 30, rating: 4.7, spice_level: 3, is_veg: false, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
      description: 'Fragrant basmati rice with juicy boneless chicken pieces and fried onions.',
    },
    {
      name: 'Goat Dum Biryani', price: 19.60, category: 'Biryani',
      prep_time: 45, rating: 4.9, spice_level: 3, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
      description: 'Slow-cooked tender goat meat with whole spices on saffron rice.',
    },
    {
      name: 'Boneless Mutton Biryani', price: 20.60, category: 'Biryani',
      prep_time: 45, rating: 4.9, spice_level: 3, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80',
      description: 'Rich and aromatic biryani with melt-in-the-mouth boneless mutton.',
    },
    {
      name: 'Fish Biryani', price: 18.99, category: 'Biryani',
      prep_time: 30, rating: 4.6, spice_level: 2, is_veg: false, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/homemade-fish-biryani-served-yogurt-600w-1136948657.jpg',
      description: 'Delicate fish fillets layered with spiced saffron basmati rice.',
    },
    {
      name: 'Shrimp Biryani', price: 18.99, category: 'Biryani',
      prep_time: 30, rating: 4.7, spice_level: 3, is_veg: false, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
      description: 'Juicy tiger shrimp cooked with fragrant basmati and coastal spices.',
    },
    {
      name: 'Veg Biryani', price: 14.99, category: 'Biryani',
      prep_time: 20, rating: 4.5, spice_level: 2, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80',
      description: 'Seasonal garden vegetables dum-cooked with aromatic basmati rice.',
    },

    // ── PULAO (5 items) ──
    {
      name: 'Fry Piece Chicken Pulao', price: 17.99, category: 'Pulao',
      prep_time: 25, rating: 4.6, spice_level: 2, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/closeup-traditional-chicken-biryani-served-600w-2666592193.jpg',
      description: 'Basmati rice cooked with crispy fried chicken pieces and whole spices.',
    },
    {
      name: 'Shrimp Pulao', price: 17.99, category: 'Pulao',
      prep_time: 25, rating: 4.6, spice_level: 2, is_veg: false, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/prawn-shrimp-biryani-wooden-background-600w-1949336659.jpg',
      description: 'Aromatic basmati rice with succulent shrimp, tempered with spices.',
    },
    {
      name: 'Ghee Roast Chicken Pulao', price: 18.60, category: 'Pulao',
      prep_time: 30, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chicken-pulao-polao-fried-onion-600w-2374430941.jpg',
      description: 'Richly spiced ghee-roasted chicken tossed with fragrant basmati.',
    },
    {
      name: 'Veg Pulao', price: 15.99, category: 'Pulao',
      prep_time: 20, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/indian-veg-biryani-pulav-vegetable-600w-1940878666.jpg',
      description: 'Basmati rice stir-cooked with mixed vegetables and mild whole spices.',
    },
    {
      name: 'Plain Pulao', price: 14.99, category: 'Pulao',
      prep_time: 15, rating: 4.2, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/vegetable-pulao-popular-indian-rice-600w-2280409581.jpg',
      description: 'Lightly seasoned basmati rice with bay leaf and cloves — a clean side.',
    },

    // ── CURRIES (10 items) ──
    {
      name: 'Andhra Chicken Curry', price: 15.60, category: 'Curries',
      prep_time: 25, rating: 4.7, spice_level: 3, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/homemade-chicken-korma-curry-dish-600w-699200920.jpg',
      description: 'Bold fiery Andhra-style chicken curry with red chillies and tamarind.',
    },
    {
      name: 'Chicken Tikka Masala', price: 15.99, category: 'Curries',
      prep_time: 20, rating: 4.8, spice_level: 2, is_veg: false, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chicken-tikka-masala-spices-on-600w-2700643187.jpg',
      description: 'Grilled chicken tikka simmered in a creamy spiced tomato masala sauce.',
    },
    {
      name: 'Chicken Butter Masala', price: 15.99, category: 'Curries',
      prep_time: 20, rating: 4.8, spice_level: 2, is_veg: false, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chicken-tikka-masala-delicious-butter-600w-2480142011.jpg',
      description: 'Tender chicken in a velvety butter and tomato cream sauce.',
    },
    {
      name: 'Goat Curry', price: 17.99, category: 'Curries',
      prep_time: 35, rating: 4.7, spice_level: 3, is_veg: false, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/mutton-curry-lamb-spicy-indian-600w-2130681140.jpg',
      description: 'Slow-cooked bone-in goat in a rich masala gravy with whole spices.',
    },
    {
      name: 'Lamb Curry', price: 17.99, category: 'Curries',
      prep_time: 35, rating: 4.7, spice_level: 3, is_veg: false, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/indian-style-mutton-gosht-masala-600w-2238294631.jpg',
      description: 'Tender lamb slow-cooked in an aromatic onion-tomato gravy.',
    },
    {
      name: 'Paneer Tikka Masala', price: 14.60, category: 'Curries',
      prep_time: 20, rating: 4.6, spice_level: 2, is_veg: true, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/paneer-butter-masala-cheese-cottage-600w-620766416.jpg',
      description: 'Grilled paneer cubes in a spiced tomato-cream masala.',
    },
    {
      name: 'Paneer Butter Masala', price: 14.60, category: 'Curries',
      prep_time: 18, rating: 4.6, spice_level: 1, is_veg: true, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
      description: 'Soft paneer cubes in a buttery tomato-cashew gravy.',
    },
    {
      name: 'Veg Kurma', price: 14.60, category: 'Curries',
      prep_time: 20, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/south-indian-food-vegetable-korma-600w-2636381243.jpg',
      description: 'Mixed vegetables simmered in a mild coconut and cashew cream sauce.',
    },
    {
      name: 'Malai Kofta', price: 14.60, category: 'Curries',
      prep_time: 25, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/malai-kofta-indian-cuisine-dish-600w-1923525206.jpg',
      description: 'Fried paneer and potato dumplings in a creamy saffron gravy.',
    },
    {
      name: 'Cashew Curry', price: 14.60, category: 'Curries',
      prep_time: 20, rating: 4.5, spice_level: 1, is_veg: true, is_halal: true,
      stock: 60, min_stock: 6, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/cashew-curry-indian-kaju-masala-600w-1252377736.jpg',
      description: 'Whole cashews cooked in a rich, mildly spiced tomato-coconut gravy.',
    },

    // ── APPETIZERS (4 items) ──
    {
      name: 'Apollo Fish', price: 15.60, category: 'Appetizers',
      prep_time: 15, rating: 4.7, spice_level: 3, is_veg: false, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=600&q=80',
      description: 'Hyderabadi-style crispy fried fish tossed in tangy spiced sauce.',
    },
    {
      name: 'Chicken 65', price: 16.50, category: 'Appetizers',
      prep_time: 15, rating: 4.8, spice_level: 3, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/indian-starters-chicken-65-on-600w-1863301966.jpg',
      description: 'Iconic spicy deep-fried chicken bites with curry leaves and green chillies.',
    },
    {
      name: 'Chicken 555', price: 16.50, category: 'Appetizers',
      prep_time: 15, rating: 4.6, spice_level: 3, is_veg: false, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chicken-555-popular-south-indian-600w-2583741931.jpg',
      description: 'Crispy fried chicken in a punchy five-spice coating — a crowd favourite.',
    },
    {
      name: 'Chicken Pakodi', price: 15.99, category: 'Appetizers',
      prep_time: 12, rating: 4.5, spice_level: 2, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chicken-pakora-pakoda-spicy-fried-600w-1882723891.jpg',
      description: 'Tender chicken pieces coated in a spiced chickpea batter and fried crispy.',
    },

    // ── STREET STYLE (8 items) ──
    {
      name: 'Veg Hakka Noodles', price: 14.99, category: 'Street Style',
      prep_time: 15, rating: 4.4, spice_level: 2, is_veg: true, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/top-view-vegetable-schezwan-noodles-600w-2426060185.jpg',
      description: 'Stir-fried noodles with crunchy vegetables in Indo-Chinese sauces.',
    },
    {
      name: 'Veg Manchurian Noodles', price: 15.99, category: 'Street Style',
      prep_time: 18, rating: 4.5, spice_level: 2, is_veg: true, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/schezwan-veg-noodles-spicy-tasty-600w-1302216073.jpg',
      description: 'Hakka noodles topped with crispy veg manchurian balls in tangy sauce.',
    },
    {
      name: 'Veg Fried Rice', price: 14.99, category: 'Street Style',
      prep_time: 15, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chinese-fried-rice-chilly-chicken-600w-2089847410.jpg',
      description: 'Wok-tossed rice with fresh vegetables in soy-ginger seasoning.',
    },
    {
      name: 'Veg Manchurian Fried Rice', price: 15.99, category: 'Street Style',
      prep_time: 18, rating: 4.5, spice_level: 2, is_veg: true, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/veg-manchurian-fried-rice-made-600w-1866778348.jpghttps://www.shutterstock.com/image-photo/veg-manchurian-fried-rice-made-600w-1866778348.jpg',
      description: 'Fried rice served with crispy manchurian balls in tangy sauce.',
    },
    {
      name: 'Egg Fried Rice', price: 16.99, category: 'Street Style',
      prep_time: 15, rating: 4.6, spice_level: 1, is_veg: false, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
      description: 'Wok-fried basmati rice scrambled with eggs in light soy seasoning.',
    },
    {
      name: 'Chicken Fried Rice', price: 16.99, category: 'Street Style',
      prep_time: 15, rating: 4.7, spice_level: 1, is_veg: false, is_halal: true,
      stock: 90, min_stock: 9, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chinese-fried-rice-chilly-chicken-600w-2089847410.jpg',
      description: 'Stir-fried rice with tender chicken strips, soy sauce, and vegetables.',
    },
    {
      name: 'Egg Hakka Noodles', price: 15.99, category: 'Street Style',
      prep_time: 15, rating: 4.5, spice_level: 2, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
      description: 'Wok-tossed noodles with fluffy scrambled egg and Indo-Chinese spices.',
    },
    {
      name: 'Chicken Hakka Noodles', price: 16.99, category: 'Street Style',
      prep_time: 15, rating: 4.7, spice_level: 2, is_veg: false, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/chicken-hakka-noodles-bowl-on-600w-2310202585.jpg',
      description: 'Stir-fried noodles with juicy chicken strips, soy, and chilli sauce.',
    },

    // ── BEVERAGES (5 items) ──
    {
      name: 'Coffee', price: 3.99, category: 'Beverages',
      prep_time: 5, rating: 4.4, spice_level: 1, is_veg: true, is_halal: true,
      stock: 200, min_stock: 20, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
      description: 'South Indian filter coffee made with fresh brew and frothy milk.',
    },
    {
      name: 'Tea', price: 2.70, category: 'Beverages',
      prep_time: 5, rating: 4.3, spice_level: 1, is_veg: true, is_halal: true,
      stock: 200, min_stock: 20, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/white-tea-cup-refreshing-hot-600w-2461982285.jpg',
      description: 'Hot freshly brewed tea with milk and sugar.',
    },
    {
      name: 'Mango Lassi', price: 5.00, category: 'Beverages',
      prep_time: 5, rating: 4.7, spice_level: 1, is_veg: true, is_halal: true,
      stock: 150, min_stock: 15, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/fresh-mango-lassi-glasses-on-600w-2325021663.jpg',
      description: 'Thick chilled mango yogurt drink with a touch of cardamom.',
    },
    {
      name: 'Thums Up / Limca', price: 2.75, category: 'Beverages',
      prep_time: 1, rating: 4.2, spice_level: 1, is_veg: true, is_halal: true,
      stock: 200, min_stock: 20, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/glass-cold-peruvian-chilcano-cocktail-600w-2185670865.jpg',
      description: 'Chilled carbonated soft drink — Thums Up (bold) or Limca (lemon).',
    },
    {
      name: 'Coke / Pepsi / Sprite', price: 1.50, category: 'Beverages',
      prep_time: 1, rating: 4.1, spice_level: 1, is_veg: true, is_halal: true,
      stock: 200, min_stock: 20, is_available: true,
      image_url: 'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Your choice of chilled Coke, Pepsi, or Sprite.',
    },

    // ── DESSERTS (3 items) ──
    {
      name: 'Gulab Jamun', price: 5.00, category: 'Desserts',
      prep_time: 10, rating: 4.8, spice_level: 1, is_veg: true, is_halal: true,
      stock: 100, min_stock: 10, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/indian-gulab-jamun-sweet-balls-600w-2694094677.jpg',
      description: 'Soft milk-solid dumplings soaked in rose and cardamom sugar syrup.',
    },
    {
      name: 'Rasmalai', price: 6.00, category: 'Desserts',
      prep_time: 10, rating: 4.7, spice_level: 1, is_veg: true, is_halal: true,
      stock: 80, min_stock: 8, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/bread-rasmalai-tweaked-version-traditional-600w-2212485393.jpg',
      description: 'Delicate cottage cheese dumplings in chilled saffron-rose flavoured milk.',
    },
    {
      name: 'Shrikhand', price: 7.00, category: 'Desserts',
      prep_time: 5, rating: 4.6, spice_level: 1, is_veg: true, is_halal: true,
      stock: 70, min_stock: 7, is_available: true,
      image_url: 'https://www.shutterstock.com/image-photo/top-shot-kesar-shrikhand-green-600w-2140238755.jpg',
      description: 'Thick sweetened hung curd with saffron, cardamom, and dry fruits.',
    },
  ]);
  console.log('Menu items seeded (59 items — full Biryani Box Menu)');

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