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
  login:          (body)  => request('/auth/login',          { method: 'POST', body: JSON.stringify(body) }),
  register:       (body)  => request('/auth/register',       { method: 'POST', body: JSON.stringify(body) }),
  me:             ()      => request('/auth/me'),
  logout:         ()      => request('/auth/logout',         { method: 'POST' }),
  forgotPassword: (email) => request('/auth/forgot-password',{ method: 'POST', body: JSON.stringify({ email }) }),
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
  getAll:          ()          => request('/ingredients'),
  create:          (body)      => request('/ingredients',           { method: 'POST', body: JSON.stringify(body) }),
  update:          (id, body)  => request(`/ingredients/${id}`,     { method: 'PUT',  body: JSON.stringify(body) }),
  updateStock:     (id, stock) => request(`/ingredients/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
  delete:          (id)        => request(`/ingredients/${id}`,     { method: 'DELETE' }),
  reorderForecast: ()          => request('/ingredients/reorder-forecast'),
  exportCSV:       ()          => `${BASE}/ingredients/export`,
};

// ── ORDERS ────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll:            (params = '') => request(`/orders${params}`),
  getOne:            (id)          => request(`/orders/${id}`),
  create:            (body)        => request('/orders',              { method: 'POST',  body: JSON.stringify(body) }),
  updateStatus:      (id, status)  => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  rate:              (id, body)    => request(`/orders/${id}/rating`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete:            (id)          => request(`/orders/${id}`,        { method: 'DELETE' }),
  financials:        ()            => request('/orders/financials'),
  history:           (customerId)  => request(`/orders/history/${customerId}`),
  captainOrders:     (captainId, period) => request(`/orders/my-captain-orders/${captainId}?period=${period}`),
  chefOrders:        (chefId, period)    => request(`/orders/my-chef-orders/${chefId}?period=${period}`),
};

// ── USERS / STAFF ─────────────────────────────────────────────────
export const usersAPI = {
  getAll:        (params = '') => request(`/users${params}`),
  getOne:        (id)          => request(`/users/${id}`),
  create:        (body)        => request('/users',             { method: 'POST',  body: JSON.stringify(body) }),
  update:        (id, body)    => request(`/users/${id}`,       { method: 'PUT',   body: JSON.stringify(body) }),
  toggleStatus:  (id, is_active, disabled_reason) =>
    request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active, disabled_reason }) }),
  delete:        (id)          => request(`/users/${id}`,       { method: 'DELETE' }),
  changePassword:(id, body)    => request(`/users/${id}/password`, { method: 'PATCH', body: JSON.stringify(body) }),
  getLoyalty:    (id)          => request(`/users/${id}/loyalty`),
  updateLoyalty: (id, body)    => request(`/users/${id}/loyalty`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── CART ──────────────────────────────────────────────────────────
export const cartAPI = {
  get:    ()                         => request('/cart'),
  add:    (menu_item_id, quantity=1) => request('/cart/items',        { method: 'POST',  body: JSON.stringify({ menu_item_id, quantity }) }),
  update: (menuItemId, quantity)     => request(`/cart/items/${menuItemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  remove: (menuItemId)               => request(`/cart/items/${menuItemId}`, { method: 'DELETE' }),
  clear:  ()                         => request('/cart',              { method: 'DELETE' }),
};

// ── CHECKOUT ──────────────────────────────────────────────────────
export const checkoutAPI = {
  validate: ()      => request('/checkout/validate', { method: 'POST' }),
  process:  (body)  => request('/checkout',          { method: 'POST', body: JSON.stringify(body) }),
  invoice:  (orderId) => request(`/checkout/invoice/${orderId}`),
};

// ── RESERVATIONS ──────────────────────────────────────────────────
export const reservationsAPI = {
  getAll:   (params = '') => request(`/reservations${params}`),
  getOne:   (id)          => request(`/reservations/${id}`),
  create:   (body)        => request('/reservations',          { method: 'POST',  body: JSON.stringify(body) }),
  update:   (id, body)    => request(`/reservations/${id}`,    { method: 'PUT',   body: JSON.stringify(body) }),
  patch:    (id, body)    => request(`/reservations/${id}`,    { method: 'PATCH', body: JSON.stringify(body) }),
  delete:   (id)          => request(`/reservations/${id}`,    { method: 'DELETE' }),
};

// ── TABLES ────────────────────────────────────────────────────────
export const tablesAPI = {
  getAll:     ()         => request('/tables'),
  getOne:     (id)       => request(`/tables/${id}`),
  create:     (body)     => request('/tables',        { method: 'POST',  body: JSON.stringify(body) }),
  update:     (id, body) => request(`/tables/${id}`,  { method: 'PUT',   body: JSON.stringify(body) }),
  setStatus:  (id, status) => request(`/tables/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete:     (id)       => request(`/tables/${id}`,  { method: 'DELETE' }),
};

// ── SHIFTS ────────────────────────────────────────────────────────
export const shiftsAPI = {
  getAll:    (params = '') => request(`/shifts${params}`),
  getActive: ()            => request('/shifts/active'),
  getMyActive: ()          => request('/shifts/my-active'),
  checkIn:   (notes = '')  => request('/shifts/checkin', { method: 'POST', body: JSON.stringify({ notes }) }),
  checkOut:  (id, notes='') => request(`/shifts/${id}/checkout`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
  create:    (body)        => request('/shifts',         { method: 'POST', body: JSON.stringify(body) }),
  delete:    (id)          => request(`/shifts/${id}`,   { method: 'DELETE' }),
};

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────
export const announcementsAPI = {
  getAll:   ()          => request('/announcements'),
  getPublic: ()         => fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/announcements', {
    headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('bb_token') ? { 'Authorization': 'Bearer ' + localStorage.getItem('bb_token') } : {}) }
  }).then(r => r.json()),
  getAllAdmin: ()        => request('/announcements/all'),
  create:   (body)      => request('/announcements',        { method: 'POST',  body: JSON.stringify(body) }),
  update:   (id, body)  => request(`/announcements/${id}`,  { method: 'PUT',   body: JSON.stringify(body) }),
  delete:   (id)        => request(`/announcements/${id}`,  { method: 'DELETE' }),
};

// ── FEEDBACK ──────────────────────────────────────────────────────
export const feedbackAPI = {
  getAll:      (params='') => request(`/feedback${params}`),
  create:      (body)      => request('/feedback',          { method: 'POST',  body: JSON.stringify(body) }),
  markRead:    (id)        => request(`/feedback/${id}/read`, { method: 'PATCH' }),
  markAllRead: ()          => request('/feedback/mark-all-read', { method: 'PATCH' }),
  delete:      (id)        => request(`/feedback/${id}`,    { method: 'DELETE' }),
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:     ()     => request('/notifications'),
  markRead:   (id)   => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead:()     => request('/notifications/read-all',   { method: 'PATCH' }),
  delete:     (id)   => request(`/notifications/${id}`,      { method: 'DELETE' }),
};

// ── CATERING ──────────────────────────────────────────────────────
export const cateringAPI = {
  getAll:  ()       => request('/catering'),
  getOne:  (id)     => request(`/catering/${id}`),
  create:  (body)   => request('/catering',       { method: 'POST',  body: JSON.stringify(body) }),
  update:  (id,body)=> request(`/catering/${id}`, { method: 'PUT',   body: JSON.stringify(body) }),
  delete:  (id)     => request(`/catering/${id}`, { method: 'DELETE' }),
};

// ── GIFT CARDS ────────────────────────────────────────────────────
export const giftCardsAPI = {
  validate:  (code)    => request(`/gift-cards/validate/${code}`),
  purchase:  (body)    => request('/gift-cards',  { method: 'POST', body: JSON.stringify(body) }),
  getAll:    ()        => request('/gift-cards'),
};

// ── ADDRESSES ─────────────────────────────────────────────────────
export const addressesAPI = {
  getAll:     ()     => request('/addresses'),
  create:     (body) => request('/addresses',     { method: 'POST',  body: JSON.stringify(body) }),
  setDefault: (id)   => request(`/addresses/${id}/default`, { method: 'PATCH' }),
  update:     (id, body) => request(`/addresses/${id}`, { method: 'PUT',   body: JSON.stringify(body) }),
  delete:     (id)   => request(`/addresses/${id}`, { method: 'DELETE' }),
};

// ── LOYALTY ───────────────────────────────────────────────────────
export const loyaltyAPI = {
  getTransactions: (userId) => request(`/loyalty/${userId}`),
  redeem:          (body)   => request('/loyalty/redeem', { method: 'POST', body: JSON.stringify(body) }),
};

// ── NORMALIZE HELPERS ─────────────────────────────────────────────
const normalizeOrderItem = (item) => ({
  _id: item._id,
  menu_item_id: item.menu_item_id?._id || item.menu_item_id,
  name: item.name || item.menu_item_id?.name || 'Unknown Item',
  category: item.category || item.menu_item_id?.category || '',
  image_url: item.image_url || item.menu_item_id?.image_url || '',
  quantity: item.quantity,
  unit_price: item.unit_price,
  price: item.price || item.unit_price,
});

export const normalizeOrder = (order) => ({
  id: order._id,
  _id: order._id,
  order_number: order.order_number,
  items: (order.items || []).map(normalizeOrderItem),
  total: order.total,
  table: order.table_number,
  table_number: order.table_number,
  captain: order.captain_id?.name || order.captain_id || '',
  captain_id: order.captain_id,
  chef: order.chef_id?.name || order.chef_id || '',
  chef_id: order.chef_id,
  customerName: order.customer_id?.name || 'Walk-in Guest',
  status: order.status,
  spiceness: order.spiceness || 'medium',
  timestamp: order.created_at,
  created_at: order.created_at,
  cooking_started_at: order.cooking_started_at,
  cooking_completed_at: order.cooking_completed_at,
  served_at: order.served_at,
  paid_at: order.paid_at,
  rating: order.rating || 0,
  feedback: order.feedback || '',
  isNew: false,
});

export const normalizeIngredient = (ing) => ({
  id: ing._id,
  _id: ing._id,
  name: ing.name,
  unit: ing.unit,
  stock: ing.stock,
  minStock: ing.min_stock,
  min_stock: ing.min_stock,
  unitCost: ing.unit_cost,
  unit_cost: ing.unit_cost,
  needsReorder: ing.stock < ing.min_stock,
});