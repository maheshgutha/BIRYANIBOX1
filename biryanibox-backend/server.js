const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'https://biryani-box.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Existing routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/menu',          require('./routes/menu'));
app.use('/api/ingredients',   require('./routes/ingredients'));
app.use('/api/recipes',       require('./routes/recipes'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/checkout',      require('./routes/checkout'));
app.use('/api/reservations',  require('./routes/reservations'));
app.use('/api/catering',      require('./routes/catering'));
app.use('/api/gift-cards',    require('./routes/giftCards'));
app.use('/api/deliveries',    require('./routes/deliveries'));
app.use('/api/addresses',     require('./routes/addresses'));
app.use('/api/tables',        require('./routes/tables'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chefs',         require('./routes/chefs'));
app.use('/api/kitchen',       require('./routes/kitchen'));
app.use('/api/loyalty',       require('./routes/loyalty'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/contact',       require('./routes/contact'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// NEW routes
app.use('/api/shifts',        require('./routes/shifts'));
app.use('/api/announcements', require('./routes/Announcements'));
app.use('/api/feedback',      require('./routes/Feedback'));
app.use('/api/leaves',        require('./routes/leaves'));

app.get('/', (req, res) => res.json({ message: 'Biryani Box API Running', status: 'ok' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));