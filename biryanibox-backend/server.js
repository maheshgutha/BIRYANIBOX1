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

// Routes
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
app.use('/api/shifts',        require('./routes/shifts'));
app.use('/api/announcements', require('./routes/Announcements'));
app.use('/api/feedback',      require('./routes/Feedback'));
app.use('/api/leaves',        require('./routes/leaves'));
app.use('/api/budget',        require('./routes/Budget'));
app.use('/api/waste',         require('./routes/Waste'));

app.get('/', (req, res) => res.json({ message: 'Biryani Box API Running', status: 'ok' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start reservation auto-reserve background job
  startReservationJob();
});

// ── Background job: auto-reserve tables 30 min before reservation time ────────
function startReservationJob() {
  const Reservation    = require('./models/Reservation');
  const RestaurantTable = require('./models/RestaurantTable');
  const Notification   = require('./models/Notification');
  const User           = require('./models/User');

  const THIRTY_MIN = 30 * 60 * 1000;

  async function checkReservations() {
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + THIRTY_MIN); // 30 min from now

      // Find confirmed reservations NOT yet table-reserved, within the 30-min window
      const upcoming = await Reservation.find({
        status: 'confirmed',
        table_reserved: { $ne: true }, // custom flag to avoid re-processing
      });

      for (const res of upcoming) {
        if (!res.date || !res.time) continue;

        // Build reservation datetime from date + time string
        const resDate = new Date(res.date);
        const timeParts = res.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!timeParts) continue;

        let hours = parseInt(timeParts[1]);
        const mins = parseInt(timeParts[2]);
        const ampm = timeParts[3]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        resDate.setHours(hours, mins, 0, 0);

        // Check if reservation is within the next 30 minutes
        if (resDate >= now && resDate <= windowEnd) {
          // Mark table as reserved
          if (res.table_assigned) {
            const tNum = parseInt(res.table_assigned);
            if (!isNaN(tNum)) {
              await RestaurantTable.findOneAndUpdate(
                { table_number: tNum },
                { status: 'reserved' }
              );

              // Find the captain for this table and notify
              const tableRec = await RestaurantTable.findOne({ table_number: tNum }).populate('captain_id');
              if (tableRec?.captain_id) {
                await Notification.create({
                  user_id: tableRec.captain_id._id,
                  type: 'reservation',
                  title: '⏰ Table Reserved in 30 Minutes',
                  message: `Table ${res.table_assigned} is reserved for ${res.customer_name} at ${res.time} (${res.guests} guests). Please prepare the table.`,
                });
              }
              // Also notify managers/owner
              const managers = await User.find({ role: { $in: ['owner', 'manager'] }, is_active: true });
              await Notification.insertMany(managers.map(u => ({
                user_id: u._id,
                type: 'reservation',
                title: '📅 Upcoming Reservation',
                message: `Table ${res.table_assigned} reserved for ${res.customer_name} at ${res.time} — 30 min alert.`,
              })));
            }
          }

          // Mark as processed so we don't re-fire
          await Reservation.findByIdAndUpdate(res._id, { table_reserved: true });
        }
      }
    } catch (err) {
      console.error('[ReservationJob] Error:', err.message);
    }
  }

  // Run every 5 minutes
  setInterval(checkReservations, 5 * 60 * 1000);
  // Also run once at startup
  setTimeout(checkReservations, 5000);
  console.log('[ReservationJob] Auto-reserve scheduler started (runs every 5 min)');
}




