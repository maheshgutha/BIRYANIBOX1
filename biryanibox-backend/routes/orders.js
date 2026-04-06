const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const MenuItem = require('../models/MenuItem');
const MenuRecipe = require('../models/MenuRecipe');
const Ingredient = require('../models/Ingredient');
const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Role-based status transition rules
const STATUS_PERMISSIONS = {
  start_cooking:     ['chef'],
  completed_cooking: ['chef'],
  served:            ['captain', 'manager', 'owner'],
  paid:              ['captain', 'manager', 'owner'],
  cancelled:         ['manager', 'owner'],
};

// Valid forward transitions
const VALID_TRANSITIONS = {
  pending:            ['start_cooking', 'cancelled'],
  start_cooking:      ['completed_cooking', 'cancelled'],
  completed_cooking:  ['served'],
  served:             ['paid'],
  paid:               [],
  cancelled:          [],
};

// GET /api/orders/financials
router.get('/financials', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const paidOrders = await Order.find({ status: 'paid' });
    let revenue = 0, costOfGoods = 0;
    for (const order of paidOrders) {
      revenue += order.total;
      const items = await OrderItem.find({ order_id: order._id });
      for (const item of items) {
        const recipes = await MenuRecipe.find({ menu_item_id: item.menu_item_id }).populate('ingredient_id');
        for (const r of recipes) {
          if (r.ingredient_id) costOfGoods += r.qty_per_serving * item.quantity * (r.ingredient_id.unit_cost || 0);
        }
      }
    }
    const profit = revenue - costOfGoods;
    res.json({ success: true, data: { revenue: +revenue.toFixed(2), costOfGoods: +costOfGoods.toFixed(2), profit: +profit.toFixed(2), profitMargin: revenue > 0 ? +((profit / revenue) * 100).toFixed(2) : 0 } });
  } catch (err) { next(err); }
});

// GET /api/orders/history/:customerId  — FIXED: populates item names properly
router.get('/history/:customerId', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ customer_id: req.params.customerId })
      .sort({ created_at: -1 });
    const result = [];
    for (const o of orders) {
      const items = await OrderItem.find({ order_id: o._id })
        .populate('menu_item_id', 'name image_url category price');
      result.push({
        ...o.toObject(),
        items: items.map(item => ({
          _id: item._id,
          menu_item_id: item.menu_item_id?._id || item.menu_item_id,
          name: item.name || item.menu_item_id?.name || 'Item',
          category: item.menu_item_id?.category || '',
          image_url: item.menu_item_id?.image_url || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          price: item.unit_price,
        })),
      });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/orders/my-captain-orders/:captainId
router.get('/my-captain-orders/:captainId', protect, async (req, res, next) => {
  try {
    const { period } = req.query;
    let dateFilter = {};
    const now = new Date();
    if (period === 'today') {
      dateFilter = { created_at: { $gte: new Date(now.setHours(0, 0, 0, 0)) } };
    } else if (period === 'weekly') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { created_at: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { created_at: { $gte: monthAgo } };
    }
    const orders = await Order.find({
      captain_id: req.params.captainId,
      status: { $in: ['served', 'paid'] },
      ...dateFilter,
    })
      .populate('customer_id', 'name phone')
      .sort({ created_at: -1 });
    const result = [];
    for (const o of orders) {
      const items = await OrderItem.find({ order_id: o._id }).populate('menu_item_id', 'name');
      result.push({
        ...o.toObject(),
        items: items.map(item => ({
          _id: item._id,
          name: item.name || item.menu_item_id?.name || 'Unknown',
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/orders/my-chef-orders/:chefId
router.get('/my-chef-orders/:chefId', protect, async (req, res, next) => {
  try {
    const { period } = req.query;
    let dateFilter = {};
    if (period === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      dateFilter = { created_at: { $gte: today } };
    } else if (period === 'weekly') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { created_at: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { created_at: { $gte: monthAgo } };
    }
    const orders = await Order.find({
      chef_id: req.params.chefId,
      status: { $in: ['completed_cooking', 'served', 'paid'] },
      ...dateFilter,
    })
      .populate('customer_id', 'name phone')
      .sort({ created_at: -1 });
    const result = [];
    for (const o of orders) {
      const items = await OrderItem.find({ order_id: o._id }).populate('menu_item_id', 'name category');
      result.push({
        ...o.toObject(),
        items: items.map(item => ({
          _id: item._id,
          name: item.name || item.menu_item_id?.name || 'Unknown',
          category: item.menu_item_id?.category || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/orders
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, table, captain_id, chef_id, order_type, period, customer_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (table) filter.table_number = table;
    if (captain_id) filter.captain_id = captain_id;
    if (chef_id) filter.chef_id = chef_id;
    if (order_type) filter.order_type = order_type;
    if (customer_id) filter.customer_id = customer_id;

    if (period) {
      if (period === 'today') {
        filter.created_at = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
      } else if (period === 'weekly') {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        filter.created_at = { $gte: weekAgo };
      } else if (period === 'monthly') {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
        filter.created_at = { $gte: monthAgo };
      }
    }

    const orders = await Order.find(filter)
      .populate('customer_id', 'name email phone')
      .populate('captain_id', 'name')
      .populate('chef_id', 'name')
      .sort({ created_at: -1 });

    const orderIds = orders.map(o => o._id);
    const allItems = await OrderItem.find({ order_id: { $in: orderIds } })
      .populate('menu_item_id', 'name category image_url');

    const itemsByOrder = {};
    allItems.forEach(item => {
      const key = item.order_id.toString();
      if (!itemsByOrder[key]) itemsByOrder[key] = [];
      itemsByOrder[key].push({
        _id: item._id,
        menu_item_id: item.menu_item_id?._id || item.menu_item_id,
        name: item.name || item.menu_item_id?.name || 'Unknown Item',
        category: item.menu_item_id?.category || '',
        image_url: item.menu_item_id?.image_url || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        price: item.unit_price,
      });
    });

    const data = orders.map(o => ({
      ...o.toObject(),
      items: itemsByOrder[o._id.toString()] || [],
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer_id', 'name email phone')
      .populate('captain_id', 'name')
      .populate('chef_id', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await OrderItem.find({ order_id: order._id })
      .populate('menu_item_id', 'name image_url category');
    res.json({ success: true, data: { ...order.toObject(), items } });
  } catch (err) { next(err); }
});

// POST /api/orders
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, table_number, captain_id, order_type, payment_method, customer_id, spiceness } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'No items in order' });

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menu_item_id);
      if (!menuItem) return res.status(404).json({ success: false, message: `Menu item ${item.menu_item_id} not found` });
      if (!menuItem.is_available) return res.status(400).json({ success: false, message: `${menuItem.name} is unavailable` });
      const recipes = await MenuRecipe.find({ menu_item_id: item.menu_item_id }).populate('ingredient_id');
      for (const r of recipes) {
        if (r.ingredient_id && r.ingredient_id.stock < r.qty_per_serving * item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock: ${r.ingredient_id.name}` });
        }
      }
    }

    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menu_item_id);
      total += menuItem.price * item.quantity;
      orderItems.push({ menu_item_id: item.menu_item_id, name: menuItem.name, quantity: item.quantity, unit_price: menuItem.price });
    }

    const order = await Order.create({
      customer_id, captain_id, table_number, total,
      order_type: order_type || 'dine-in',
      payment_method, status: 'pending',
      spiceness: spiceness || 'medium',
    });

    const createdItems = await OrderItem.insertMany(orderItems.map(i => ({ ...i, order_id: order._id })));

    for (const item of items) {
      const recipes = await MenuRecipe.find({ menu_item_id: item.menu_item_id });
      for (const r of recipes) {
        await Ingredient.findByIdAndUpdate(r.ingredient_id, { $inc: { stock: -(r.qty_per_serving * item.quantity) } });
      }
    }

    if (customer_id) await User.findByIdAndUpdate(customer_id, { $inc: { order_count: 1 } });

    const notifyRoles = ['owner', 'manager', 'chef'];
    const toNotify = await User.find({ role: { $in: notifyRoles }, is_active: true });
    for (const u of toNotify) {
      await Notification.create({
        user_id: u._id, type: 'order', title: 'New Order',
        message: `Order #${order.order_number} placed for ${table_number || order_type}`
      });
    }

    res.status(201).json({ success: true, data: { ...order.toObject(), items: createdItems } });
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const userRole = req.user.role;

    const allowedRoles = STATUS_PERMISSIONS[status];
    if (!allowedRoles) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${userRole}' cannot set status to '${status}'. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const validNext = VALID_TRANSITIONS[order.status] || [];
    if (!validNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'`
      });
    }

    const timeUpdate = {};
    if (status === 'start_cooking')    timeUpdate.cooking_started_at   = new Date();
    if (status === 'completed_cooking') timeUpdate.cooking_completed_at = new Date();
    if (status === 'served')            timeUpdate.served_at             = new Date();
    if (status === 'paid')              timeUpdate.paid_at               = new Date();

    const updateData = { status, ...timeUpdate };

    if ((status === 'start_cooking' || status === 'completed_cooking') && userRole === 'chef') {
      updateData.chef_id = req.user._id;
    }
    if (status === 'served' && (userRole === 'captain' || userRole === 'manager' || userRole === 'owner')) {
      updateData.captain_id = req.user._id;
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (status === 'paid' && updated.customer_id) {
      const points = Math.floor(updated.total);
      await User.findByIdAndUpdate(updated.customer_id, { $inc: { loyalty_points: points } });
      await LoyaltyTransaction.create({
        user_id: updated.customer_id, order_id: updated._id,
        type: 'earn', points, description: `Points earned for order #${updated.order_number}`
      });
    }

    if (status === 'completed_cooking') {
      const captains = await User.find({ role: { $in: ['captain', 'manager', 'owner'] }, is_active: true });
      for (const c of captains) {
        await Notification.create({
          user_id: c._id, type: 'order', title: 'Order Ready',
          message: `Order #${updated.order_number} is ready to serve!`
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/rating
router.patch('/:id/rating', protect, async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { rating, feedback }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// DELETE /api/orders/:id
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await OrderItem.deleteMany({ order_id: req.params.id });
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) { next(err); }
});

module.exports = router;