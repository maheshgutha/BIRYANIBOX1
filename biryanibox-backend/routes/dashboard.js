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

// GET /api/dashboard/overview
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
      { $match: { 'order.created_at': { $gte: todayStart } } },
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
