const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Ingredient = require('../models/Ingredient');
const MenuRecipe = require('../models/MenuRecipe');
const Reservation = require('../models/Reservation');
const Delivery = require('../models/Delivery');
const { protect, authorize } = require('../middleware/auth');

// ── Helpers ─────────────────────────────────────────────────────────────────
const getDateRange = (period, from, to) => {
  const now = new Date();
  if (from && to) {
    const start = new Date(from); start.setHours(0, 0, 0, 0);
    const end   = new Date(to);   end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  switch (period) {
    case 'day': {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case 'week': {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now };
    }
    default: {
      // All time
      return { start: new Date(0), end: now };
    }
  }
};

// ── GET /api/dashboard/command-hub ──────────────────────────────────────────
// Main endpoint for the enhanced Command Hub
// Query params:
//   period = day | week | month | year | custom (default: all)
//   from   = YYYY-MM-DD (for custom range)
//   to     = YYYY-MM-DD (for custom range)
//   calendar_date = YYYY-MM-DD (for calendar order lookup)
router.get('/command-hub', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { period = 'all', from, to, calendar_date } = req.query;
    const { start, end } = getDateRange(period, from, to);

    const dateFilter = { created_at: { $gte: start, $lte: end } };

    // ── 1. Revenue: total from paid orders in period ─────────────────────────
    const [revenueAgg] = await Order.aggregate([
      { $match: { status: 'paid', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    const revenue       = revenueAgg?.total || 0;
    const paidCount     = revenueAgg?.count || 0;
    const avgOrderValue = paidCount > 0 ? revenue / paidCount : 0;

    // ── 2. Revenue chart — daily breakdown for the period ──────────────────
    let chartGroupBy;
    if (period === 'day') {
      chartGroupBy = { hour: { $hour: '$created_at' } };
    } else if (period === 'week' || period === 'custom') {
      chartGroupBy = { year: { $year: '$created_at' }, month: { $month: '$created_at' }, day: { $dayOfMonth: '$created_at' } };
    } else if (period === 'month') {
      chartGroupBy = { year: { $year: '$created_at' }, month: { $month: '$created_at' }, day: { $dayOfMonth: '$created_at' } };
    } else {
      chartGroupBy = { year: { $year: '$created_at' }, month: { $month: '$created_at' } };
    }

    const revenueChart = await Order.aggregate([
      { $match: { status: 'paid', ...dateFilter } },
      { $group: { _id: chartGroupBy, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ]);

    // ── 3. Order Pipeline stats ──────────────────────────────────────────────
    const [pipeline] = await Promise.all([
      Order.aggregate([
        { $match: { ...dateFilter } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
    ]);

    // Total PAID orders in period (revenue-consistent count)
    const totalOrders    = await Order.countDocuments({ status: 'paid', ...dateFilter });
    const totalAllOrders = await Order.countDocuments(dateFilter);

    // Cancelled orders with details
    const cancelledOrders = await Order.find({ status: 'cancelled', ...dateFilter })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('customer_id', 'name email');
    const cancelledCount = await Order.countDocuments({ status: 'cancelled', ...dateFilter });

    // Pipeline map
    const pipelineMap = {};
    pipeline.forEach(p => { pipelineMap[p._id] = p.count; });

    // ── 4. Calendar date orders (if requested) ──────────────────────────────
    // Returns ALL orders so owner can see full picture per day.
    // calendar_paid_total sums only paid orders for accurate revenue.
    let calendarOrders = [];
    if (calendar_date) {
      const calStart = new Date(calendar_date); calStart.setHours(0, 0, 0, 0);
      const calEnd   = new Date(calendar_date); calEnd.setHours(23, 59, 59, 999);
      calendarOrders = await Order.find({ created_at: { $gte: calStart, $lte: calEnd } })
        .sort({ created_at: -1 })
        .populate('customer_id', 'name email');
    }
    const calendarPaidTotal = calendarOrders
      .filter(o => o.status === 'paid')
      .reduce((s, o) => s + (o.total || 0), 0);

    // ── 5. Top dishes — from orders in period ───────────────────────────────
    const topDishesAll = await OrderItem.aggregate([
      { $lookup: { from: 'orders', localField: 'order_id', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: { 'order.created_at': { $gte: start, $lte: end }, 'order.status': 'paid' } },
      { $group: {
        _id:           '$menu_item_id',
        name:          { $first: '$name' },
        total_qty:     { $sum: '$quantity' },
        total_revenue: { $sum: { $multiply: ['$quantity', '$unit_price'] } },
        order_count:   { $sum: 1 },
      }},
      { $sort: { total_qty: -1 } },
    ]);

    // Top 10 for pie/bar chart
    const topDishes10   = topDishesAll.slice(0, 10);
    // Top 5 for initial display (show more expands to all)
    const topDishes5    = topDishesAll.slice(0, 5);

    res.json({
      success: true,
      data: {
        period,
        date_range: { start, end },
        // Revenue
        revenue:         +revenue.toFixed(2),
        paid_count:      paidCount,
        avg_order_value: +avgOrderValue.toFixed(2),
        // Chart data
        revenue_chart:   revenueChart,
        // Pipeline — total_orders counts paid orders only (revenue-consistent)
        total_orders:     totalOrders,
        total_all_orders: totalAllOrders,
        pipeline: {
          pending:           pipelineMap['pending']           || 0,
          pending_confirmation: pipelineMap['pending_confirmation'] || 0,
          start_cooking:     pipelineMap['start_cooking']     || 0,
          completed_cooking: pipelineMap['completed_cooking'] || 0,
          served:            pipelineMap['served']            || 0,
          paid:              pipelineMap['paid']              || 0,
          cancelled:         pipelineMap['cancelled']         || 0,
          dispatched:        pipelineMap['dispatched']        || 0,
          delivered:         pipelineMap['delivered']         || 0,
        },
        cancelled_count:  cancelledCount,
        cancelled_orders: cancelledOrders.map(o => ({
          _id:          o._id,
          order_number: o.order_number,
          total:        o.total,
          order_type:   o.order_type,
          table_number: o.table_number,
          created_at:   o.created_at,
          customer:     o.customer_id ? { name: o.customer_id.name, email: o.customer_id.email } : null,
        })),
        // Calendar
        calendar_date,
        calendar_paid_total: +calendarPaidTotal.toFixed(2),
        calendar_orders: calendarOrders.map(o => ({
          _id:          o._id,
          order_number: o.order_number,
          status:       o.status,
          total:        o.total,
          order_type:   o.order_type,
          created_at:   o.created_at,
          customer:     o.customer_id ? { name: o.customer_id.name } : null,
        })),
        // Dishes
        top_dishes:     topDishes5,
        top_dishes_10:  topDishes10,
        top_dishes_all: topDishesAll,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/overview (kept for backward compat)
router.get('/overview', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const [totalOrders, todayOrders, totalUsers, pendingOrders, totalRevenue, todayRevenue] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ created_at: { $gte: todayStart } }),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({ status: { $in: ['pending','preparing'] } }),
      Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { status: 'paid', created_at: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$total' } } }])
    ]);
    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        today_orders: todayOrders,
        total_customers: totalUsers,
        pending_orders: pendingOrders,
        total_revenue: +(totalRevenue[0]?.total || 0).toFixed(2),
        today_revenue: +(todayRevenue[0]?.total || 0).toFixed(2)
      }
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/financials
router.get('/financials', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const paidOrders = await Order.find({ status: 'paid' });
    let revenue = 0, costOfGoods = 0;
    for (const order of paidOrders) {
      revenue += order.total;
      const items = await OrderItem.find({ order_id: order._id });
      for (const item of items) {
        const recipes = await MenuRecipe.find({ menu_item_id: item.menu_item_id }).populate('ingredient_id');
        for (const r of recipes) {
          if (r.ingredient_id) costOfGoods += (r.qty_per_serving * item.quantity * r.ingredient_id.unit_cost) || 0;
        }
      }
    }
    const profit = revenue - costOfGoods;
    res.json({
      success: true,
      data: {
        revenue: +revenue.toFixed(2),
        cost_of_goods: +costOfGoods.toFixed(2),
        gross_profit: +profit.toFixed(2),
        profit_margin: revenue > 0 ? +((profit / revenue) * 100).toFixed(2) : 0,
        total_paid_orders: paidOrders.length
      }
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/revenue?period=daily
router.get('/revenue', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query;
    let groupBy, daysBack;
    if (period === 'daily') { daysBack = 7; groupBy = { year: { $year: '$created_at' }, month: { $month: '$created_at' }, day: { $dayOfMonth: '$created_at' } }; }
    else if (period === 'weekly') { daysBack = 28; groupBy = { year: { $year: '$created_at' }, week: { $week: '$created_at' } }; }
    else { daysBack = 180; groupBy = { year: { $year: '$created_at' }, month: { $month: '$created_at' } }; }
    const since = new Date(); since.setDate(since.getDate() - daysBack);
    const data = await Order.aggregate([
      { $match: { status: 'paid', created_at: { $gte: since } } },
      { $group: { _id: groupBy, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    res.json({ success: true, period, data });
  } catch (err) { next(err); }
});

// GET /api/dashboard/top-items
router.get('/top-items', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const data = await OrderItem.aggregate([
      { $lookup: { from: 'orders', localField: 'order_id', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: { 'order.created_at': { $gte: todayStart }, 'order.status': 'paid' } },
      { $group: { _id: '$menu_item_id', name: { $first: '$name' }, total_qty: { $sum: '$quantity' }, total_revenue: { $sum: { $multiply: ['$quantity','$unit_price'] } } } },
      { $sort: { total_qty: -1 } },
      { $limit: 10 }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/dashboard/staff-performance
router.get('/staff-performance', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const captains = await Order.aggregate([
      { $match: { captain_id: { $exists: true, $ne: null } } },
      { $group: { _id: '$captain_id', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', role: '$user.role', orders: 1, revenue: 1 } },
      { $sort: { orders: -1 } }
    ]);
    const drivers = await Delivery.aggregate([
      { $match: { driver_id: { $exists: true, $ne: null }, status: 'delivered' } },
      { $group: { _id: '$driver_id', deliveries: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', deliveries: 1, rating: '$user.driver_rating' } },
      { $sort: { deliveries: -1 } }
    ]);
    res.json({ success: true, data: { captains, drivers } });
  } catch (err) { next(err); }
});

// GET /api/dashboard/inventory-alerts
router.get('/inventory-alerts', protect, authorize('owner','manager'), async (req, res, next) => {
  try {
    const [lowMenuItems, lowIngredients] = await Promise.all([
      MenuItem.find({ $expr: { $lte: ['$stock','$min_stock'] }, is_available: true }).select('name category stock min_stock'),
      Ingredient.find({ $expr: { $lte: ['$stock','$min_stock'] } }).select('name unit stock min_stock reorder_lead_days')
    ]);
    res.json({
      success: true,
      data: {
        low_menu_items: lowMenuItems,
        low_ingredients: lowIngredients,
        total_alerts: lowMenuItems.length + lowIngredients.length
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;