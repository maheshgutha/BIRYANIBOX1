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

// GET /api/orders/financials  (must be before /:id)
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
          if (r.ingredient_id) costOfGoods += r.qty_per_serving * item.quantity * (r.ingredient_id.unit_cost || 0);
        }
      }
    }
    const profit = revenue - costOfGoods;
    res.json({ success: true, data: { revenue: +revenue.toFixed(2), costOfGoods: +costOfGoods.toFixed(2), profit: +profit.toFixed(2), profitMargin: revenue > 0 ? +((profit / revenue) * 100).toFixed(2) : 0 } });
  } catch (err) { next(err); }
});

// GET /api/orders/history/:customerId
router.get('/history/:customerId', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ customer_id: req.params.customerId }).sort({ created_at: -1 });
    const result = [];
    for (const o of orders) {
      const items = await OrderItem.find({ order_id: o._id });
      result.push({ ...o.toObject(), items });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/orders
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, table, captain_id, chef_id, order_type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (table) filter.table_number = table;
    if (captain_id) filter.captain_id = captain_id;
    if (chef_id) filter.chef_id = chef_id;
    if (order_type) filter.order_type = order_type;
    const orders = await Order.find(filter)
      .populate('customer_id', 'name email phone')
      .populate('captain_id', 'name')
      .populate('chef_id', 'name')
      .sort({ created_at: -1 });

    // Attach items (with dish names) to every order so all dashboards can display them
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
    const items = await OrderItem.find({ order_id: order._id }).populate('menu_item_id', 'name image_url');
    res.json({ success: true, data: { ...order.toObject(), items } });
  } catch (err) { next(err); }
});

// POST /api/orders  — checks stock + deducts ingredients
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, table_number, captain_id, order_type, payment_method, customer_id } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'No items in order' });

    // Stock check
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

    // Calculate total
    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menu_item_id);
      total += menuItem.price * item.quantity;
      orderItems.push({ menu_item_id: item.menu_item_id, name: menuItem.name, quantity: item.quantity, unit_price: menuItem.price });
    }

    // Create order
    const order = await Order.create({ customer_id, captain_id, table_number, total, order_type: order_type || 'dine-in', payment_method, status: 'pending' });

    // Create order items
    const createdItems = await OrderItem.insertMany(orderItems.map(i => ({ ...i, order_id: order._id })));

    // Deduct ingredients
    for (const item of items) {
      const recipes = await MenuRecipe.find({ menu_item_id: item.menu_item_id });
      for (const r of recipes) {
        await Ingredient.findByIdAndUpdate(r.ingredient_id, { $inc: { stock: -(r.qty_per_serving * item.quantity) } });
      }
    }

    // Update customer order count
    if (customer_id) await User.findByIdAndUpdate(customer_id, { $inc: { order_count: 1 } });

    // Notify managers
    const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
    for (const m of managers) {
      await Notification.create({ user_id: m._id, type: 'order', title: 'New Order', message: `Order #${order.order_number} placed for ${table_number || order_type}` });
    }

    res.status(201).json({ success: true, data: { ...order.toObject(), items: createdItems } });
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending','preparing','served','paid','cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Award loyalty points when paid
    if (status === 'paid' && order.customer_id) {
      const points = Math.floor(order.total);
      await User.findByIdAndUpdate(order.customer_id, { $inc: { loyalty_points: points } });
      await LoyaltyTransaction.create({ user_id: order.customer_id, order_id: order._id, type: 'earn', points, description: `Points earned for order #${order.order_number}` });
    }

    res.json({ success: true, data: order });
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