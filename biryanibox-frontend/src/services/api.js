const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('bb_token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: headers(options.headers),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ── AUTH ──────────────────────────────────────────────────────────
export const authAPI = {
  login:    (body) => request('/auth/login',          { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register',       { method: 'POST', body: JSON.stringify(body) }),
  me:       ()     => request('/auth/me'),
  logout:   ()     => request('/auth/logout',         { method: 'POST' }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
};

// ── MENU ──────────────────────────────────────────────────────────
export const menuAPI = {
  getAll:             (params = '') => request(`/menu${params}`),
  getOne:             (id)         => request(`/menu/${id}`),
  create:             (body)       => request('/menu',              { method: 'POST',  body: JSON.stringify(body) }),
  update:             (id, body)   => request(`/menu/${id}`,        { method: 'PUT',   body: JSON.stringify(body) }),
  toggleAvailability: (id)         => request(`/menu/${id}/availability`, { method: 'PATCH' }),
  updateStock:        (id, stock)  => request(`/menu/${id}/stock`,  { method: 'PATCH', body: JSON.stringify({ stock }) }),
  delete:             (id)         => request(`/menu/${id}`,        { method: 'DELETE' }),
};

// ── INGREDIENTS ───────────────────────────────────────────────────
export const ingredientsAPI = {
  getAll:          ()           => request('/ingredients'),
  updateStock:     (id, stock)  => request(`/ingredients/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
  reorderForecast: ()           => request('/ingredients/reorder-forecast'),
  exportCSV:       ()           => `${BASE}/ingredients/export`,
};

// ── ORDERS ────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll:       (params = '') => request(`/orders${params}`),
  getOne:       (id)         => request(`/orders/${id}`),
  create:       (body)       => request('/orders',            { method: 'POST',  body: JSON.stringify(body) }),
  updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  rate:         (id, body)   => request(`/orders/${id}/rating`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete:       (id)         => request(`/orders/${id}`,      { method: 'DELETE' }),
  financials:   ()           => request('/orders/financials'),
  history:      (customerId) => request(`/orders/history/${customerId}`),
};

// ── CART ──────────────────────────────────────────────────────────
export const cartAPI = {
  get:    ()               => request('/cart'),
  add:    (menu_item_id, quantity = 1) => request('/cart/items', { method: 'POST', body: JSON.stringify({ menu_item_id, quantity }) }),
  update: (menuItemId, quantity) => request(`/cart/items/${menuItemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  remove: (menuItemId)     => request(`/cart/items/${menuItemId}`, { method: 'DELETE' }),
  clear:  ()               => request('/cart',                   { method: 'DELETE' }),
};

// ── CHECKOUT ──────────────────────────────────────────────────────
export const checkoutAPI = {
  validate: () => request('/checkout/validate', { method: 'POST' }),
  process:  (body) => request('/checkout',      { method: 'POST', body: JSON.stringify(body) }),
  invoice:  (orderId) => request(`/checkout/invoice/${orderId}`),
};

// ── RESERVATIONS ──────────────────────────────────────────────────
export const reservationsAPI = {
  getAll:  (params = '') => request(`/reservations${params}`),
  create:  (body)        => request('/reservations',          { method: 'POST',  body: JSON.stringify(body) }),
  update:  (id, body)    => request(`/reservations/${id}`,    { method: 'PUT',   body: JSON.stringify(body) }),
  setStatus: (id, status) => request(`/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignTable: (id, table) => request(`/reservations/${id}/table`, { method: 'PATCH', body: JSON.stringify({ table_assigned: table }) }),
  delete:  (id)          => request(`/reservations/${id}`,    { method: 'DELETE' }),
};

// ── CATERING ──────────────────────────────────────────────────────
export const cateringAPI = {
  getAll:  (params = '') => request(`/catering${params}`),
  create:  (body)        => request('/catering', { method: 'POST', body: JSON.stringify(body) }),
  update:  (id, body)    => request(`/catering/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setStatus: (id, status) => request(`/catering/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ── GIFT CARDS ────────────────────────────────────────────────────
export const giftCardsAPI = {
  validate: (code)  => request(`/gift-cards/validate/${code}`),
  purchase: (body)  => request('/gift-cards',  { method: 'POST', body: JSON.stringify(body) }),
  redeem:   (body)  => request('/gift-cards/redeem', { method: 'POST', body: JSON.stringify(body) }),
};

// ── DELIVERIES ────────────────────────────────────────────────────
export const deliveriesAPI = {
  getAll:       (params = '') => request(`/deliveries${params}`),
  updateStatus: (id, status, current_location) => request(`/deliveries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, current_location }) }),
  completed:    ()            => request('/deliveries/completed'),
};

// ── DASHBOARD ─────────────────────────────────────────────────────
export const dashboardAPI = {
  overview:         () => request('/dashboard/overview'),
  financials:       () => request('/dashboard/financials'),
  revenue:     (period) => request(`/dashboard/revenue?period=${period}`),
  topItems:         () => request('/dashboard/top-items'),
  staffPerformance: () => request('/dashboard/staff-performance'),
  inventoryAlerts:  () => request('/dashboard/inventory-alerts'),
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:   ()   => request('/notifications'),
  readAll:  ()   => request('/notifications/read-all', { method: 'PATCH' }),
  readOne:  (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  delete:   (id) => request(`/notifications/${id}`,      { method: 'DELETE' }),
};

// ── TABLES ────────────────────────────────────────────────────────
export const tablesAPI = {
  getAll: () => request('/tables'),
};

// ── REVIEWS ───────────────────────────────────────────────────────
export const reviewsAPI = {
  getFeatured: () => request('/reviews?featured=true'),
  create:  (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
};

// ── CONTACT ───────────────────────────────────────────────────────
export const contactAPI = {
  send: (body) => request('/contact', { method: 'POST', body: JSON.stringify(body) }),
};

// ── LOYALTY ───────────────────────────────────────────────────────
export const loyaltyAPI = {
  getTiers: () => request('/loyalty/tiers'),
  getUser:  (userId) => request(`/loyalty/${userId}`),
};

// ── USERS ─────────────────────────────────────────────────────────
export const usersAPI = {
  getAll:  (params = '') => request(`/users${params}`),
  update:  (id, body)    => request(`/users/${id}`,  { method: 'PUT',   body: JSON.stringify(body) }),
  delete:  (id)          => request(`/users/${id}`,  { method: 'DELETE' }),
};

// Per-item image URLs — each menu item gets its own unique food photo
const ITEM_IMAGE_URLS = {
  // ── Biryani ──────────────────────────────────────────────────────
  'Chicken Dum Biryani':   'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=80',
  'Mutton Dum Biryani':    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&q=80',
  'Shrimp Biryani':        'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80',
  'Vegetable Dum Biryani': 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80',
  'Egg Biryani':           'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
  // ── Appetizers ───────────────────────────────────────────────────
  'Chicken Tikka':         'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
  'Paneer 65':             'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
  'Lamb Seekh Kabab':      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&q=80',
  'Chicken Lollipop':      'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80',
  'Samosa (3pc)':          'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'Paneer Tikka Masala':   'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  'Dal Makhani':           'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
  // ── Breads ───────────────────────────────────────────────────────
  'Garlic Naan':           'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&q=80',
  'Butter Naan':           'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
  'Paratha':               'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
  'Roti':                  'https://images.unsplash.com/photo-1565538420870-da08ff96a207?w=600&q=80',
  'Kulcha (Cheese)':       'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
  // ── Desserts ─────────────────────────────────────────────────────
  'Gulab Jamun (3pc)':     'https://images.unsplash.com/photo-1666618090276-3d5ae2c93a04?w=600&q=80',
  'Gulab Jamun':           'https://images.unsplash.com/photo-1666618090276-3d5ae2c93a04?w=600&q=80',
  'Rasmalai':              'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
  'Kheer':                 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=600&q=80',
  'Ice Cream Kulfi':       'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=80',
  // ── Combos ───────────────────────────────────────────────────────
  'Family Combo (4)':      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  'Couple Combo (2)':      'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=600&q=80',
  'Couple Combo':          'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=600&q=80',
  'Party Pack (6)':        'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80',
  'Veg Combo':             'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&q=80',
  // ── Drinks ───────────────────────────────────────────────────────
  'Mango Lassi':           'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80',
  'Sweet Lassi':           'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',
  'Masala Chai':           'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=600&q=80',
  'Rose Sharbat':          'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
};

// Category fallback URLs (used when item name not in map)
const CATEGORY_IMAGE_URLS = {
  'Biryani':    'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=80',
  'Appetizers': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80',
  'Breads':     'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&q=80',
  'Curries':    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  'Desserts':   'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
  'Dessert':    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
  'Combos':     'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  'Drinks':     'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80',
};

const getItemImageUrl = (name, category) =>
  ITEM_IMAGE_URLS[name] || CATEGORY_IMAGE_URLS[category] ||
  'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=80';

// Helper: normalize backend menu item → frontend shape
export const normalizeMenuItem = (item) => ({
  id: item._id,
  _id: item._id,
  name: item.name,
  price: item.price,
  category: item.category,
  image: item.image_url || getItemImageUrl(item.name, item.category),
  image_url: item.image_url || getItemImageUrl(item.name, item.category),
  prep_time: item.prep_time,
  rating: item.rating,
  spiceLevel: item.spice_level,
  isVeg: item.is_veg,
  isHalal: item.is_halal,
  available: item.is_available,
  is_available: item.is_available,
  stock: item.stock,
  minStock: item.min_stock,
  min_stock: item.min_stock,
  desc: item.description,
  description: item.description,
});

// Helper: normalize a single order item so dish name is always present
const normalizeOrderItem = (item) => ({
  _id: item._id,
  menu_item_id: item.menu_item_id?._id || item.menu_item_id,
  // name: prefer stored name, fallback to populated menu_item_id.name
  name: item.name || item.menu_item_id?.name || 'Unknown Item',
  category: item.category || item.menu_item_id?.category || '',
  image_url: item.image_url || item.menu_item_id?.image_url || '',
  quantity: item.quantity,
  unit_price: item.unit_price,
  price: item.price || item.unit_price,
});

// Helper: normalize backend order → frontend shape
export const normalizeOrder = (order) => ({
  id: order._id,
  _id: order._id,
  order_number: order.order_number,
  // Normalize every item so dish names always appear
  items: (order.items || []).map(normalizeOrderItem),
  total: order.total,
  table: order.table_number,
  table_number: order.table_number,
  captain: order.captain_id?.name || order.captain_id || '',
  captain_id: order.captain_id,
  customerName: order.customer_id?.name || 'Walk-in Guest',
  status: order.status,
  timestamp: order.created_at,
  created_at: order.created_at,
  rating: order.rating || 0,
  feedback: order.feedback || '',
  isNew: false,
});

// Helper: normalize backend ingredient → frontend shape
export const normalizeIngredient = (ing) => ({
  id: ing._id,
  _id: ing._id,
  name: ing.name,
  unit: ing.unit,
  stock: ing.stock,
  minStock: ing.min_stock,
  min_stock: ing.min_stock,
  reorderLeadDays: ing.reorder_lead_days,
  reorder_lead_days: ing.reorder_lead_days,
  unitCost: ing.unit_cost,
  unit_cost: ing.unit_cost,
  needsReorder: ing.stock < ing.min_stock,
  daysRemaining: ing.stock > 0 ? (ing.stock / 5).toFixed(1) : 0,
});

// ── ADDRESSES ─────────────────────────────────────────────────────
export const addressesAPI = {
  getAll:     ()          => request('/addresses'),
  create:     (body)      => request('/addresses', { method: 'POST', body: JSON.stringify(body) }),
  setDefault: (id)        => request(`/addresses/${id}/default`, { method: 'PATCH' }),
  delete:     (id)        => request(`/addresses/${id}`, { method: 'DELETE' }),
};