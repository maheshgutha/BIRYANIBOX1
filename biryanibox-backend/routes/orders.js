const express = require('express');
const router  = express.Router();
const Order              = require('../models/Order');
const OrderItem          = require('../models/OrderItem');
const MenuItem           = require('../models/MenuItem');
const MenuRecipe         = require('../models/MenuRecipe');
const Ingredient         = require('../models/Ingredient');
const User               = require('../models/User');
const RestaurantTable    = require('../models/RestaurantTable');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const Notification       = require('../models/Notification');
const Delivery           = require('../models/Delivery');
const ChefOrderAssignment = require('../models/ChefOrderAssignment');
const nodemailer         = require('nodemailer');
const { protect, authorize } = require('../middleware/auth');

// ── Email transporter ──────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER) return;
  try {
    await transporter.sendMail({ from: `"Biryani Box" <${process.env.SMTP_USER}>`, to, subject, html });
  } catch (err) { console.error('[Email]', err.message); }
};

// ── Helper: notify users by role ───────────────────────────────────────────
const notifyRoles = async (roles, { type, title, message }) => {
  const users = await User.find({ role: { $in: roles }, is_active: true });
  await Notification.insertMany(users.map(u => ({ user_id: u._id, type, title, message })));
};

// ── Helper: get captain for a table number ────────────────────────────────
// Tables 1-3 → captain 1, 4-6 → captain 2, 7-9 → captain 3 (dynamic, based on DB assignments)
// Takeaway/Delivery → captain with role 'captain' who handles delivery (4th captain)
const getCaptainForTable = async (tableNumber) => {
  if (!tableNumber || tableNumber === 'Takeaway') {
    // Captain 4: delivery/pickup captain — no tables assigned
    const allCaptains = await User.find({ role: 'captain', is_active: true });
    for (const cap of allCaptains) {
      const hasTables = await RestaurantTable.findOne({ captain_id: cap._id, is_active: true });
      if (!hasTables) return cap; // captain with no tables = delivery captain
    }
    return null;
  }
  // Try label match first (e.g. "Table 7", "Table 2")
  const byLabel = await RestaurantTable.findOne({ label: tableNumber }).populate('captain_id');
  if (byLabel) return byLabel.captain_id || null;
  // Fallback: numeric match
  const tNum = parseInt(tableNumber);
  if (!isNaN(tNum)) {
    const byNum = await RestaurantTable.findOne({ table_number: tNum }).populate('captain_id');
    return byNum?.captain_id || null;
  }
  return null;
};

// ── Status permission rules ────────────────────────────────────────────────
const STATUS_PERMISSIONS = {
  start_cooking:     ['chef'],
  completed_cooking: ['chef'],
  dispatched:        ['captain', 'manager', 'owner'],
  served:            ['captain', 'manager', 'owner'],
  paid:              ['captain', 'manager', 'owner'],
  cancelled:         ['manager', 'owner'],
};
const VALID_TRANSITIONS = {
  pending:           ['start_cooking', 'cancelled'],
  start_cooking:     ['completed_cooking', 'cancelled'],
  completed_cooking: ['dispatched', 'served'],
  dispatched:        ['served', 'paid'],
  served:            ['paid'],
  paid:              [],
  cancelled:         [],
};

// ── GET /api/orders/financials ────────────────────────────────────────────
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

    // Breakeven analysis
    const fixedCosts = parseFloat(process.env.MONTHLY_FIXED_COSTS || '5000');
    const avgOrderValue = paidOrders.length > 0 ? revenue / paidOrders.length : 0;
    const avgCostPerOrder = paidOrders.length > 0 ? costOfGoods / paidOrders.length : 0;
    const contributionMargin = avgOrderValue - avgCostPerOrder;
    const breakevenOrders = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
    const breakevenRevenue = breakevenOrders * avgOrderValue;

    res.json({
      success: true,
      data: {
        revenue: +revenue.toFixed(2),
        costOfGoods: +costOfGoods.toFixed(2),
        profit: +profit.toFixed(2),
        profitMargin: revenue > 0 ? +((profit / revenue) * 100).toFixed(2) : 0,
        totalOrders: paidOrders.length,
        avgOrderValue: +avgOrderValue.toFixed(2),
        breakeven: {
          fixedCosts: +fixedCosts.toFixed(2),
          contributionMarginPerOrder: +contributionMargin.toFixed(2),
          ordersNeeded: breakevenOrders,
          revenueNeeded: +breakevenRevenue.toFixed(2),
          achieved: revenue >= breakevenRevenue,
        }
      }
    });
  } catch (err) { next(err); }
});

// ── GET /api/orders/history/:customerId ───────────────────────────────────
router.get('/history/:customerId', protect, async (req, res, next) => {
  try {
    // Customers can only retrieve their own order history
    if (req.user.role === 'customer' && req.user._id.toString() !== req.params.customerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const orders = await Order.find({ customer_id: req.params.customerId }).sort({ created_at: -1 });

    // Batch-fetch delivery records for all delivery orders in one query
    const deliveryOrderIds = orders.filter(o => o.order_type === 'delivery').map(o => o._id);
    const deliveries = deliveryOrderIds.length
      ? await Delivery.find({ order_id: { $in: deliveryOrderIds } })
          .select('order_id status captain_dispatched picked_up_at in_transit_at delivered_at')
          .lean()
      : [];
    const deliveryByOrderId = {};
    deliveries.forEach(d => { deliveryByOrderId[d.order_id.toString()] = d; });

    const result = [];
    for (const o of orders) {
      const items = await OrderItem.find({ order_id: o._id }).populate('menu_item_id', 'name image_url category price');
      result.push({
        ...o.toObject(),
        delivery: deliveryByOrderId[o._id.toString()] || null,
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

// ── GET /api/orders/live/:customerId — ALL active orders for THIS customer ─
router.get('/live/:customerId', protect, async (req, res, next) => {
  try {
    // Customers can only see their own live orders
    if (req.user.role === 'customer' && req.user._id.toString() !== req.params.customerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const orders = await Order.find({
      customer_id: req.params.customerId,
      status: { $nin: ['paid', 'cancelled', 'delivered'] },
    })
      .populate('captain_id', 'name')
      .populate('chef_id', 'name')
      .sort({ created_at: -1 });
    if (!orders.length) return res.json({ success: true, data: null, all: [] });
    // Return first as 'data' for backward compat, plus full array as 'all'
    const all = [];
    for (const order of orders) {
      const items = await OrderItem.find({ order_id: order._id }).populate('menu_item_id', 'name');
      all.push({ ...order.toObject(), items });
    }
    res.json({ success: true, data: all[0], all });
  } catch (err) { next(err); }
});

// ── GET /api/orders/my-captain-orders/:captainId ──────────────────────────
router.get('/my-captain-orders/:captainId', protect, async (req, res, next) => {
  try {
    const { period } = req.query;
    let dateFilter = {};
    const now = new Date();
    if (period === 'today') dateFilter = { created_at: { $gte: new Date(now.setHours(0,0,0,0)) } };
    else if (period === 'weekly') { const w = new Date(); w.setDate(w.getDate()-7); dateFilter = { created_at: { $gte: w } }; }
    else if (period === 'monthly') { const m = new Date(); m.setMonth(m.getMonth()-1); dateFilter = { created_at: { $gte: m } }; }
    const orders = await Order.find({ captain_id: req.params.captainId, status: { $in: ['served','paid'] }, ...dateFilter })
      .populate('customer_id', 'name phone').sort({ created_at: -1 });
    const result = [];
    for (const o of orders) {
      const items = await OrderItem.find({ order_id: o._id }).populate('menu_item_id', 'name');
      result.push({ ...o.toObject(), items: items.map(i => ({ _id: i._id, name: i.name || i.menu_item_id?.name || 'Unknown', quantity: i.quantity, unit_price: i.unit_price })) });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── GET /api/orders/my-chef-orders/:chefId ───────────────────────────────
router.get('/my-chef-orders/:chefId', protect, async (req, res, next) => {
  try {
    const { period } = req.query;
    let dateFilter = {};
    if (period === 'today') { const t = new Date(); t.setHours(0,0,0,0); dateFilter = { created_at: { $gte: t } }; }
    else if (period === 'weekly') { const w = new Date(); w.setDate(w.getDate()-7); dateFilter = { created_at: { $gte: w } }; }
    else if (period === 'monthly') { const m = new Date(); m.setMonth(m.getMonth()-1); dateFilter = { created_at: { $gte: m } }; }
    const orders = await Order.find({ chef_id: req.params.chefId, status: { $in: ['completed_cooking','served','paid'] }, ...dateFilter })
      .populate('customer_id', 'name phone').sort({ created_at: -1 });
    const result = [];
    for (const o of orders) {
      const items = await OrderItem.find({ order_id: o._id }).populate('menu_item_id', 'name category');
      result.push({ ...o.toObject(), items: items.map(i => ({ _id: i._id, name: i.name || i.menu_item_id?.name || 'Unknown', category: i.menu_item_id?.category || '', quantity: i.quantity, unit_price: i.unit_price })) });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── GET /api/orders ───────────────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, table, captain_id, chef_id, order_type, period, customer_id } = req.query;
    const filter = {};

    // ── CUSTOMER: only see their own orders ───────────────────────────────────
    if (req.user.role === 'customer') {
      filter.customer_id = req.user._id;
      if (status) filter.status = status;
      const orders = await Order.find(filter).sort({ created_at: -1 }).limit(50);
      const orderIds = orders.map(o => o._id);
      const allItems = await OrderItem.find({ order_id: { $in: orderIds } })
        .populate('menu_item_id', 'name category image_url');
      const itemsByOrder = {};
      allItems.forEach(item => {
        const key = item.order_id.toString();
        if (!itemsByOrder[key]) itemsByOrder[key] = [];
        itemsByOrder[key].push({ _id: item._id, name: item.name || item.menu_item_id?.name || 'Item', category: item.menu_item_id?.category || '', quantity: item.quantity, unit_price: item.unit_price, price: item.unit_price });
      });
      const data = orders.map(o => ({ ...o.toObject(), items: itemsByOrder[o._id.toString()] || [] }));
      return res.json({ success: true, count: data.length, data });
    }

    // ── STAFF: full query support ─────────────────────────────────────────────
    if (status) filter.status = status;
    if (table) filter.table_number = table;
    if (captain_id) filter.captain_id = captain_id;
    if (chef_id) filter.chef_id = chef_id;
    if (order_type) filter.order_type = order_type;
    if (customer_id) filter.customer_id = customer_id;
    if (period) {
      if (period === 'today') filter.created_at = { $gte: new Date(new Date().setHours(0,0,0,0)) };
      else if (period === 'weekly') { const w = new Date(); w.setDate(w.getDate()-7); filter.created_at = { $gte: w }; }
      else if (period === 'monthly') { const m = new Date(); m.setMonth(m.getMonth()-1); filter.created_at = { $gte: m }; }
    }
    if (req.user.role === 'chef') {
      filter.$or = [{ status: 'pending' }, { chef_id: req.user._id }];
      delete filter.chef_id;
    }

    // ── CAPTAIN: only see orders in their zone ────────────────────────────────
    if (req.user.role === 'captain') {
      const captainTables = await RestaurantTable.find({ captain_id: req.user._id, is_active: true });
      const captainTableNums = captainTables.map(t => t.table_number);
      const isDeliveryCaptain = captainTableNums.length === 0;
      if (isDeliveryCaptain) {
        // Delivery captain sees only delivery/pickup/takeaway orders
        filter.order_type = { $in: ['delivery', 'pickup', 'takeaway'] };
      } else {
        // Dine-in captain sees only orders for their tables
        // table_number stored as "1", "2", "Table 1", "Table 2" — match both formats
        const tablePatterns = captainTableNums.flatMap(n => [String(n), `Table ${n}`]);
        filter.table_number = { $in: tablePatterns };
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
      itemsByOrder[key].push({ _id: item._id, menu_item_id: item.menu_item_id?._id || item.menu_item_id, name: item.name || item.menu_item_id?.name || 'Unknown Item', category: item.menu_item_id?.category || '', image_url: item.menu_item_id?.image_url || '', quantity: item.quantity, unit_price: item.unit_price, price: item.unit_price });
    });
    const data = orders.map(o => ({ ...o.toObject(), items: itemsByOrder[o._id.toString()] || [] }));
    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer_id', 'name email phone')
      .populate('captain_id', 'name')
      .populate('chef_id', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const items = await OrderItem.find({ order_id: order._id }).populate('menu_item_id', 'name image_url category');
    // For delivery orders, bundle delivery status so the customer tracker can show
    // Dispatched / Delivering / Delivered steps accurately.
    let delivery = null;
    if (order.order_type === 'delivery') {
      delivery = await Delivery.findOne({ order_id: order._id })
        .select('status captain_dispatched driver_id assigned_at dispatched_at picked_up_at in_transit_at delivered_at')
        .lean();
    }
    res.json({ success: true, data: { ...order.toObject(), items, delivery } });
  } catch (err) { next(err); }
});

// ── POST /api/orders ───────────────────────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, table_number, order_type, payment_method, spiceness,
            delivery_address, delivery_notes, distance_km } = req.body;

    // For customers: always use their own ID as customer_id; ignore any captain_id from body
    // For staff (POS): use the customer_id from body if provided
    const customer_id = req.user.role === 'customer'
      ? req.user._id
      : (req.body.customer_id || null);

    // captain_id: only trust it from staff, never from customers
    const captain_id = req.user.role === 'customer' ? null : (req.body.captain_id || null);

    if (!items || !items.length) return res.status(400).json({ success: false, message: 'No items in order' });

    const isTakeaway  = order_type === 'takeaway' || order_type === 'pickup' || table_number === 'Takeaway';
    const isDelivery  = order_type === 'delivery';
    const needsAddress = isDelivery;
    if (needsAddress && (!delivery_address || !delivery_address.trim()))
      return res.status(400).json({ success: false, message: 'Delivery address is required for home delivery orders.' });

    // Validate items
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menu_item_id);
      if (!menuItem) return res.status(404).json({ success: false, message: `Menu item not found` });
      if (!menuItem.is_available) return res.status(400).json({ success: false, message: `${menuItem.name} is unavailable` });
    }

    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menu_item_id);
      total += menuItem.price * item.quantity;
      orderItems.push({ menu_item_id: item.menu_item_id, name: menuItem.name, quantity: item.quantity, unit_price: menuItem.price });
    }

    const dist = parseFloat(distance_km) || 0;
    const deliveryFee = isDelivery ? (dist > 0 ? Math.round(dist * 2) : 5) : 0;

    // Resolve numeric table number — handles both '1' and 'Table 1' formats
    let resolvedTableNum = null;
    if (table_number && table_number !== 'Takeaway') {
      const parsed = parseInt(table_number);
      if (!isNaN(parsed)) {
        resolvedTableNum = parsed;
      } else {
        // Try to extract number from label like "Table 1" or "Table 7"
        const match = String(table_number).match(/\d+/);
        if (match) resolvedTableNum = parseInt(match[0]);
      }
    }

    // Auto-assign captain based on table
    let assignedCaptainId = captain_id;
    if (!assignedCaptainId && resolvedTableNum) {
      const tableRec = await RestaurantTable.findOne({ table_number: resolvedTableNum });
      if (tableRec?.captain_id) assignedCaptainId = tableRec.captain_id;
    }

    const finalOrderType = isDelivery ? 'delivery' : isTakeaway ? 'pickup' : (order_type || 'dine-in');

    // Dine-in orders require owner/manager confirmation within 10 minutes
    const isDineIn = finalOrderType === 'dine-in';
    const initialStatus = isDineIn ? 'pending_confirmation' : 'pending';
    const confirmationExpiresAt = isDineIn ? new Date(Date.now() + 10 * 60 * 1000) : undefined;

    const order = await Order.create({
      customer_id, captain_id: assignedCaptainId, table_number,
      total: +(total + deliveryFee).toFixed(2),
      order_type: finalOrderType,
      payment_method, status: initialStatus,
      confirmation_expires_at: confirmationExpiresAt,
      spiceness: spiceness || 'medium',
      delivery_address: needsAddress ? delivery_address.trim() : undefined,
      delivery_notes:   needsAddress ? (delivery_notes || '') : undefined,
      distance_km:      needsAddress ? dist : undefined,
      delivery_fee:     deliveryFee,
    });

    const createdItems = await OrderItem.insertMany(orderItems.map(i => ({ ...i, order_id: order._id })));

    // Deduct ingredients
    for (const item of items) {
      const recipes = await MenuRecipe.find({ menu_item_id: item.menu_item_id });
      for (const r of recipes) {
        await Ingredient.findByIdAndUpdate(r.ingredient_id, { $inc: { stock: -(r.qty_per_serving * item.quantity) } });
      }
    }

    if (customer_id) await User.findByIdAndUpdate(customer_id, { $inc: { order_count: 1 } });

    if (isDineIn) {
      // ── Dine-in: notify owner + manager to ACCEPT or REJECT within 10 min ──
      const managersAndOwners = await User.find({ role: { $in: ['owner', 'manager'] }, is_active: true });
      await Notification.insertMany(managersAndOwners.map(u => ({
        user_id: u._id, type: 'order_confirm_required',
        title: '⏰ Dine-In Order — Action Required',
        message: `Order #${order.order_number} at Table ${table_number} needs your approval within 10 minutes. Total: $${order.total}. Accept or reject now.`,
        order_id: order._id,
      })));
    } else {
      // ── Non dine-in: notify owner + manager (info only) ─────────────────────
      const managersAndOwners = await User.find({ role: { $in: ['owner', 'manager'] }, is_active: true });
      await Notification.insertMany(managersAndOwners.map(u => ({
        user_id: u._id, type: 'new_order', title: '🛒 New Order Placed',
        message: `Order #${order.order_number} — ${finalOrderType}. Total: $${order.total}`,
      })));

      // Notify chefs for non-dine-in orders immediately
      const chefs = await User.find({ role: 'chef', is_active: true });
      await Notification.insertMany(chefs.map(u => ({
        user_id: u._id, type: 'new_order', title: '👨‍🍳 New Order in Kitchen',
        message: `Order #${order.order_number} is waiting. ${orderItems.map(i => `${i.name} ×${i.quantity}`).join(', ')}`,
      })));
    }

    // ── Notify ONLY the captain assigned to this specific table ──────────────
    if (isDineIn && assignedCaptainId) {
      await Notification.create({
        user_id: assignedCaptainId, type: 'new_order', title: '🪑 New Order – Your Table',
        message: `Order #${order.order_number} placed on Table ${table_number}. Awaiting manager confirmation. Total: $${order.total}`,
      });
    }

    // ── For delivery/pickup: notify ONLY captain4 (no-table captain) ─────────
    if (finalOrderType === 'delivery' || isTakeaway) {
      const allCaptains = await User.find({ role: 'captain', is_active: true });
      for (const cap of allCaptains) {
        const hasTables = await RestaurantTable.findOne({ captain_id: cap._id, is_active: true });
        if (!hasTables) {
          await Notification.create({
            user_id: cap._id, type: 'new_order',
            title: finalOrderType === 'delivery' ? '🚗 New Delivery Order' : '📦 New Pickup Order',
            message: `Order #${order.order_number} — ${finalOrderType}. Total: $${order.total}`,
          });
        }
      }
      // Also notify all riders for delivery orders
      if (finalOrderType === 'delivery') {
        const riders = await User.find({ role: 'delivery', is_active: true });
        await Notification.insertMany(riders.map(u => ({
          user_id: u._id, type: 'delivery', title: '🚴 New Delivery Order',
          message: `Order #${order.order_number} — ${order.delivery_address || 'Address not set'}. Fee: $${order.delivery_fee || 0}`,
        })));
      }
    }

    // ── Auto-expire: schedule rejection if dine-in not confirmed in 10 min ──
    if (isDineIn) {
      setTimeout(async () => {
        try {
          const fresh = await Order.findById(order._id);
          if (fresh && fresh.status === 'pending_confirmation') {
            fresh.status = 'cancelled';
            fresh.confirmation_expires_at = undefined;
            await fresh.save();
            // Notify customer
            if (customer_id) {
              await Notification.create({
                user_id: customer_id, type: 'order_rejected',
                title: '❌ Order Auto-Cancelled',
                message: `Order #${order.order_number} was not confirmed within 10 minutes and has been automatically cancelled. Please try again.`,
              });
            }
            // Notify manager/owner
            const mgrs = await User.find({ role: { $in: ['owner', 'manager'] }, is_active: true });
            await Notification.insertMany(mgrs.map(u => ({
              user_id: u._id, type: 'order_expired',
              title: '⏱ Order Expired',
              message: `Order #${order.order_number} was auto-cancelled after 10 min confirmation timeout.`,
            })));
          }
        } catch (e) { console.error('[AutoExpire]', e.message); }
      }, 10 * 60 * 1000);
    }

    res.status(201).json({ success: true, data: { ...order.toObject(), items: createdItems } });
  } catch (err) { next(err); }
});

// ── PATCH /api/orders/:id/confirm — Accept or Reject a dine-in order ──────
router.patch('/:id/confirm', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action))
      return res.status(400).json({ success: false, message: 'action must be accept or reject' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending_confirmation')
      return res.status(400).json({ success: false, message: 'Order is not awaiting confirmation' });

    // Check if expired
    if (order.confirmation_expires_at && order.confirmation_expires_at < new Date()) {
      order.status = 'cancelled';
      await order.save();
      return res.status(400).json({ success: false, message: 'Confirmation window expired — order auto-cancelled' });
    }

    if (action === 'reject') {
      order.status = 'cancelled';
      order.confirmation_expires_at = undefined;
      await order.save();

      // Notify customer
      if (order.customer_id) {
        await Notification.create({
          user_id: order.customer_id, type: 'order_rejected',
          title: '❌ Order Rejected',
          message: `Sorry, Order #${order.order_number} has been rejected. Please contact the restaurant or try a different table.`,
        });
      }
      return res.json({ success: true, message: 'Order rejected', data: order });
    }

    // Accept: move to pending, mark table occupied, notify chefs
    order.status = 'pending';
    order.confirmation_expires_at = undefined;
    await order.save();

    // Mark table occupied
    if (order.table_number) {
      const match = String(order.table_number).match(/\d+/);
      const tNum = match ? parseInt(match[0]) : null;
      if (tNum) await RestaurantTable.findOneAndUpdate({ table_number: tNum }, { status: 'occupied' });
    }

    // Notify chefs
    const chefs = await User.find({ role: 'chef', is_active: true });
    const orderItems = await OrderItem.find({ order_id: order._id });
    await Notification.insertMany(chefs.map(u => ({
      user_id: u._id, type: 'new_order', title: '👨‍🍳 New Order in Kitchen',
      message: `Order #${order.order_number} confirmed. ${orderItems.map(i => `${i.name} ×${i.quantity}`).join(', ')}`,
    })));

    // Notify customer: order confirmed
    if (order.customer_id) {
      await Notification.create({
        user_id: order.customer_id, type: 'order_accepted',
        title: '✅ Order Confirmed!',
        message: `Your Order #${order.order_number} has been accepted and is being prepared. Sit tight!`,
      });
    }

    res.json({ success: true, message: 'Order accepted', data: order });
  } catch (err) { next(err); }
});

// ── PATCH /api/orders/:id/status ──────────────────────────────────────────
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const userRole = req.user.role;

    const allowedRoles = STATUS_PERMISSIONS[status];
    if (!allowedRoles) return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    if (!allowedRoles.includes(userRole))
      return res.status(403).json({ success: false, message: `Role '${userRole}' cannot set status to '${status}'` });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const validNext = VALID_TRANSITIONS[order.status] || [];
    if (!validNext.includes(status))
      return res.status(400).json({ success: false, message: `Cannot transition from '${order.status}' to '${status}'` });

    // ── Chef constraint: if another chef already accepted this order, block ──
    if (status === 'start_cooking') {
      if (order.chef_id && order.chef_id.toString() !== req.user._id.toString()) {
        return res.status(409).json({ success: false, message: 'This order has already been accepted by another chef.' });
      }
    }

    // ── Captain zone constraint: captain can only serve/pay their own tables ──
    if (userRole === 'captain' && ['served', 'paid'].includes(status)) {
      const captainTables = await RestaurantTable.find({ captain_id: req.user._id, is_active: true });
      const captainTableNums = captainTables.map(t => t.table_number);
      const isDeliveryCaptain = captainTableNums.length === 0;
      if (isDeliveryCaptain) {
        // Delivery captain can only advance delivery/pickup orders
        if (!['delivery', 'pickup', 'takeaway'].includes(order.order_type)) {
          return res.status(403).json({ success: false, message: 'You handle delivery & pickup orders only. This is a dine-in order.' });
        }
      } else {
        // Dine-in captain: verify table is in their zone
        const rawTable = String(order.table_number || '');
        const match = rawTable.match(/\d+/);
        const orderTableNum = match ? parseInt(match[0]) : NaN;
        if (isNaN(orderTableNum) || !captainTableNums.includes(orderTableNum)) {
          return res.status(403).json({
            success: false,
            message: `Table ${order.table_number} is not in your zone. You manage: ${captainTableNums.map(n => `Table ${n}`).join(', ')}.`
          });
        }
      }
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

    // ── Create/update ChefOrderAssignment when chef starts or completes cooking ──
    if (status === 'start_cooking' && userRole === 'chef') {
      const existing = await ChefOrderAssignment.findOne({ order_id: order._id, chef_id: req.user._id });
      if (!existing) {
        await ChefOrderAssignment.create({
          order_id:   order._id,
          chef_id:    req.user._id,
          status:     'cooking',
          started_at: new Date(),
        });
      } else {
        existing.status = 'cooking'; existing.started_at = new Date(); await existing.save();
      }
    }
    if (status === 'completed_cooking' && userRole === 'chef') {
      await ChefOrderAssignment.findOneAndUpdate(
        { order_id: order._id },
        { status: 'done', completed_at: new Date() }
      );
    }
    if (status === 'served' && ['captain','manager','owner'].includes(userRole)) {
      updateData.captain_id = req.user._id;
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // ── Loyalty points on paid ─────────────────────────────────────────────
    if (status === 'paid' && updated.customer_id) {
      const pts = 10; // base points per order
      const bonusPts = updated.total > 500 ? 25 : 0;
      const totalPts = pts + bonusPts;
      await User.findByIdAndUpdate(updated.customer_id, { $inc: { loyalty_points: totalPts } });
      await LoyaltyTransaction.create({ user_id: updated.customer_id, order_id: updated._id, type: 'earn', points: totalPts, description: `Points for order #${updated.order_number}` });
    }

    // ── Create Delivery record when chef starts COOKING (new flow) ──────────
    // Delivery appears in rider dashboard as soon as cooking starts.
    // Riders can ACCEPT it, but cannot PICKUP until captain dispatches.
    if (status === 'start_cooking' && updated.order_type === 'delivery') {
      const alreadyExists = await Delivery.findOne({ order_id: updated._id });
      if (!alreadyExists) {
        const customer = updated.customer_id ? await User.findById(updated.customer_id).select('name phone email') : null;
        // Prefer delivery_customer_* fields (set from POS form) over linked user profile
        const deliveryName  = updated.delivery_customer_name  || customer?.name  || 'Walk-in';
        const deliveryEmail = updated.delivery_customer_email || customer?.email || '';
        const deliveryPhone = updated.delivery_customer_phone || customer?.phone || '';
        await Delivery.create({
          order_id:         updated._id,
          customer_id:      updated.customer_id || null,
          customer_name:    deliveryName,
          customer_email:   deliveryEmail,
          phone:            deliveryPhone,
          delivery_address: updated.delivery_address || 'Address not set',
          delivery_notes:   updated.delivery_notes  || '',
          distance_km:      updated.distance_km     || 0,
          delivery_fee:     updated.delivery_fee    || 0,
          status:           'pending',
          order_placed_at:  new Date(),
          captain_dispatched: false,
        });
        // Notify ALL riders immediately
        const riders = await User.find({ role: 'delivery', is_active: true });
        await Notification.insertMany(riders.map(u => ({
          user_id: u._id, type: 'delivery', title: '🍳 New Order Being Prepared',
          message: `Order #${updated.order_number} is now cooking — accept it now to claim delivery. You can pick up once captain dispatches.`,
        })));
      }
    }

    // ── Notify when cooking starts ─────────────────────────────────────────
    if (status === 'start_cooking') {
      // Notify owner/manager
      const managers = await User.find({ role: { $in: ['owner','manager'] }, is_active: true });
      await Notification.insertMany(managers.map(u => ({
        user_id: u._id, type: 'cooking', title: '🔥 Cooking Started',
        message: `Order #${updated.order_number} — chef started cooking`,
      })));
      // For delivery/pickup: also notify captain4 that cooking has started
      if (['delivery','pickup','takeaway'].includes(updated.order_type)) {
        const allCaptains = await User.find({ role: 'captain', is_active: true });
        for (const cap of allCaptains) {
          const hasTables = await RestaurantTable.findOne({ captain_id: cap._id, is_active: true });
          if (!hasTables) {
            await Notification.create({
              user_id: cap._id, type: 'cooking',
              title: '🍳 Cooking Started — Pickup/Delivery',
              message: `Order #${updated.order_number} is now cooking. Type: ${updated.order_type}. Prepare for dispatch.`,
            });
          }
        }
      }
    }

    // ── Notify when cooking done — ONLY relevant captain ────────────────────
    if (status === 'completed_cooking') {
      // Always notify owner + manager
      const managers = await User.find({ role: { $in: ['owner', 'manager'] }, is_active: true });
      await Notification.insertMany(managers.map(c => ({
        user_id: c._id, type: 'order_ready', title: '✅ Order Ready to Serve',
        message: `Order #${updated.order_number} cooking done — ${updated.table_number ? `Table ${updated.table_number}` : updated.order_type}`,
      })));

      if (updated.order_type === 'dine-in' && updated.captain_id) {
        // Notify only the captain assigned to this table
        await Notification.create({
          user_id: updated.captain_id, type: 'order_ready',
          title: '✅ Order Ready — Your Table',
          message: `Order #${updated.order_number} is ready. Table ${updated.table_number} — serve now!`,
        });
      } else if (['delivery','pickup','takeaway'].includes(updated.order_type)) {
        // Notify captain4 (no-table captain) for pickup/delivery
        const allCaptains4 = await User.find({ role: 'captain', is_active: true });
        for (const cap of allCaptains4) {
          const hasTables = await RestaurantTable.findOne({ captain_id: cap._id, is_active: true });
          if (!hasTables) {
            await Notification.create({
              user_id: cap._id, type: 'order_ready',
              title: '✅ Order Ready — Dispatch Now',
              message: `Order #${updated.order_number} cooking complete. Type: ${updated.order_type}. Ready for dispatch to rider.`,
            });
          }
        }
        // Also notify all riders — delivery is now ready for pickup
        const riders = await User.find({ role: 'delivery', is_active: true });
        await Notification.insertMany(riders.map(u => ({
          user_id: u._id, type: 'order_ready', title: '🟢 Order Ready for Pickup',
          message: `Order #${updated.order_number} is cooked and ready. You can now accept this delivery.`,
        })));
      }
    }

    // ── Mark table available only when order is PAID (not served) ─────────
    if (status === 'paid' && updated.order_type === 'dine-in' && updated.table_number) {
      let tNum = parseInt(updated.table_number);
      if (isNaN(tNum)) {
        const m = String(updated.table_number).match(/\d+/);
        if (m) tNum = parseInt(m[0]);
      }
      if (!isNaN(tNum)) {
        const activeOnTable = await Order.findOne({
          table_number: updated.table_number,
          status: { $nin: ['paid', 'cancelled', 'served'] },
          _id: { $ne: updated._id }
        });
        if (!activeOnTable) {
          await RestaurantTable.findOneAndUpdate({ table_number: tNum }, { status: 'available' });
        }
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── PATCH /api/orders/:id/rating ─────────────────────────────────────────
router.patch('/:id/rating', protect, async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { rating, feedback }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Award loyalty points for feedback
    if (order.customer_id) {
      await User.findByIdAndUpdate(order.customer_id, { $inc: { loyalty_points: 5 } });
      await LoyaltyTransaction.create({ user_id: order.customer_id, order_id: order._id, type: 'earn', points: 5, description: 'Rating submitted' });
    }
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ── DELETE /api/orders/:id ────────────────────────────────────────────────
router.delete('/:id', protect, authorize('owner'), async (req, res, next) => {
  try {
    await OrderItem.deleteMany({ order_id: req.params.id });
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) { next(err); }
});

module.exports = router;