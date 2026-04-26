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
app.use('/api/delivery-pricing', require('./routes/deliveryPricing'));

app.get('/', (req, res) => res.json({ message: 'Biryani Box API Running', status: 'ok' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start reservation auto-reserve background job
  startReservationJob();
  // Start catering 24-hour reminder job
  startCateringReminderJob();
});

// ── Background job: 24-hour catering event reminder ───────────────────────────
function startCateringReminderJob() {
  const CateringOrder = require('./models/CateringOrder');
  const User          = require('./models/User');
  const Notification  = require('./models/Notification');
  const nodemailer    = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const sendEmail = async ({ to, subject, html }) => {
    if (!process.env.SMTP_USER) { console.log(`[CateringReminder] ${subject} → ${to}`); return; }
    try { await transporter.sendMail({ from: `"Biryani Box" <${process.env.SMTP_USER}>`, to, subject, html }); }
    catch (err) { console.error('[CateringReminder Email]', err.message); }
  };

  async function checkCateringReminders() {
    try {
      // Build tomorrow's date range (midnight to midnight)
      const now       = new Date();
      const tomorrow  = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
      const tomorrowEnd   = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

      const events = await CateringOrder.find({
        event_date: { $gte: tomorrowStart, $lte: tomorrowEnd },
        status: { $in: ['pending', 'confirmed'] },
        reminder_24h_sent: { $ne: true }, // guard: don't send twice
      });

      if (events.length === 0) return;

      const dateLabel = tomorrowStart.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      for (const event of events) {
        const guestCount  = event.guest_count || '—';
        const eventType   = event.event_type  || 'Catering';
        const clientName  = event.customer_name || '—';
        const clientEmail = event.email || '—';
        const clientPhone = event.phone || '—';
        const venue       = event.venue || '—';
        const menuItems   = (event.menu_items || []).join(', ') || '—';

        const staffHtml = `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#111;padding:36px;border-radius:20px;color:#fff;">
            <h1 style="color:#f97316;margin:0 0 4px;">Biryani Box 🍛</h1>
            <p style="color:#888;font-size:13px;margin-bottom:24px;">24-Hour Catering Alert</p>
            <div style="background:#1a1200;border:2px solid #f97316;border-radius:14px;padding:16px;margin-bottom:20px;text-align:center;">
              <p style="color:#f97316;font-size:18px;font-weight:900;margin:0;">⚠️ Catering Event Tomorrow!</p>
              <p style="color:#aaa;font-size:13px;margin:6px 0 0;">${dateLabel}</p>
            </div>
            <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin-bottom:16px;">
              <p style="color:#888;font-size:11px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">Event Details</p>
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#888;padding:4px 0;">Event Type</td><td style="text-align:right;color:#fff;">${eventType}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Date</td><td style="text-align:right;color:#f97316;font-weight:bold;">${dateLabel}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Guests</td><td style="text-align:right;color:#fff;font-weight:bold;">${guestCount}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Venue</td><td style="text-align:right;color:#fff;">${venue}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Status</td><td style="text-align:right;color:#22c55e;font-weight:bold;">${event.status.toUpperCase()}</td></tr>
              </table>
            </div>
            <div style="background:#1a1a1a;border-radius:14px;padding:20px;margin-bottom:16px;">
              <p style="color:#888;font-size:11px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.1em;">Client Contact</p>
              <table style="width:100%;font-size:14px;">
                <tr><td style="color:#888;padding:4px 0;">Name</td><td style="text-align:right;color:#fff;">${clientName}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Email</td><td style="text-align:right;color:#fff;">${clientEmail}</td></tr>
                <tr><td style="color:#888;padding:4px 0;">Phone</td><td style="text-align:right;color:#fff;">${clientPhone}</td></tr>
              </table>
            </div>
            ${menuItems !== '—' ? `
            <div style="background:#1a1a1a;border-radius:14px;padding:16px;margin-bottom:16px;">
              <p style="color:#888;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">Menu Items</p>
              <p style="color:#ccc;font-size:13px;line-height:1.6;margin:0;">${menuItems}</p>
            </div>` : ''}
            <p style="color:#444;font-size:12px;margin-top:20px;">Please ensure all preparations are complete.<br/><strong style="color:#f97316;">Biryani Box System</strong></p>
          </div>
        `;

        // Notify owners, managers and chefs via in-app notification
        const staff = await User.find({ role: { $in: ['owner', 'manager', 'chef'] }, is_active: true });
        if (staff.length > 0) {
          await Notification.insertMany(staff.map(u => ({
            user_id: u._id,
            type: 'catering_reminder',
            title: `⚠️ Catering Tomorrow — ${eventType} (${guestCount} guests)`,
            message: `Catering event for ${clientName} is scheduled for tomorrow (${dateLabel}). ${guestCount} guests. Venue: ${venue}. Please ensure all preparations are in order.`,
          })));
        }

        // Email owners + managers
        const managers = await User.find({ role: { $in: ['owner', 'manager'] }, is_active: true, email: { $exists: true, $nin: ['', null] } });
        for (const mgr of managers) {
          await sendEmail({ to: mgr.email, subject: `⚠️ Catering Tomorrow: ${eventType} for ${guestCount} Guests — Biryani Box`, html: staffHtml });
        }

        // Email chefs
        const chefs = await User.find({ role: 'chef', is_active: true, email: { $exists: true, $nin: ['', null] } });
        for (const chef of chefs) {
          await sendEmail({ to: chef.email, subject: `👨‍🍳 Prep Alert: Catering Tomorrow — ${eventType} (${guestCount} guests)`, html: staffHtml });
        }

        // Mark reminder sent so it doesn't re-fire
        await CateringOrder.findByIdAndUpdate(event._id, { reminder_24h_sent: true });
        console.log(`[CateringReminder] Sent 24h alert for event ${event._id} (${eventType}, ${dateLabel})`);
      }
    } catch (err) {
      console.error('[CateringReminderJob] Error:', err.message);
    }
  }

  // Run every hour — the guard flag (reminder_24h_sent) prevents duplicate sends
  setInterval(checkCateringReminders, 60 * 60 * 1000);
  // Also run once at startup (after 10s to let DB connect)
  setTimeout(checkCateringReminders, 10000);
  console.log('[CateringReminderJob] 24-hour catering reminder scheduler started (runs every hour)');
}
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