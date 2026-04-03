# Biryani Box — Backend API

Complete Express.js + MongoDB backend for Biryani Box restaurant management system.

## Tech Stack
- Node.js + Express.js
- MongoDB Atlas (Mongoose)
- JWT Authentication
- bcryptjs for password hashing

## Setup

### 1. Install dependencies
```bash
cd biryanibox-backend
npm install
```

### 2. Environment is already configured in `.env`
```
MONGO_URI=mongodb+srv://...
PORT=5000
JWT_SECRET=biryanibox_super_secret_jwt_2026
CLIENT_URL=http://localhost:5173
```

### 3. Seed the database
```bash
node utils/seed.js
```

### 4. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on http://localhost:5000

---

## Login Credentials (after seed)

| Role     | Email                        | Password     |
|----------|------------------------------|--------------|
| Owner    | owner@biryanibox.com         | owner123     |
| Manager  | manager@biryanibox.com       | manager123   |
| Captain  | captain@biryanibox.com       | captain123   |
| Delivery | delivery@biryanibox.com      | delivery123  |
| Customer | customer@biryanibox.com      | customer123  |

---

## Frontend Integration

Add this to your frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Authentication Header
Every protected request needs:
```
Authorization: Bearer <token>
```

### Example API calls from frontend:

```javascript
// Login
const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await res.json();
localStorage.setItem('bb_token', token);
localStorage.setItem('bb_user', JSON.stringify(user));

// Authenticated request
const token = localStorage.getItem('bb_token');
const menu = await fetch('http://localhost:5000/api/menu', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## API Summary — 151 Endpoints across 23 modules

| Module          | Base Path              | Endpoints |
|-----------------|------------------------|-----------|
| Auth            | /api/auth              | 7         |
| Users           | /api/users             | 10        |
| Menu            | /api/menu              | 9         |
| Ingredients     | /api/ingredients       | 9         |
| Recipes         | /api/recipes           | 5         |
| Orders          | /api/orders            | 11        |
| Cart            | /api/cart              | 5         |
| Checkout        | /api/checkout          | 3         |
| Reservations    | /api/reservations      | 9         |
| Catering        | /api/catering          | 8         |
| Gift Cards      | /api/gift-cards        | 6         |
| Deliveries      | /api/deliveries        | 8         |
| Addresses       | /api/addresses         | 5         |
| Tables          | /api/tables            | 4         |
| Notifications   | /api/notifications     | 4         |
| Chefs           | /api/chefs             | 10        |
| Kitchen         | /api/kitchen           | 16        |
| Loyalty         | /api/loyalty           | 6         |
| Reviews         | /api/reviews           | 4         |
| Contact         | /api/contact           | 4         |
| Dashboard       | /api/dashboard         | 6         |

---

## Project Structure

```
biryanibox-backend/
├── server.js              # Entry point
├── .env                   # Environment variables
├── package.json
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   ├── auth.js            # JWT protect + authorize
│   └── errorHandler.js    # Global error handler
├── models/                # 23 Mongoose models
│   ├── User.js
│   ├── MenuItem.js
│   ├── Ingredient.js
│   ├── MenuRecipe.js
│   ├── Order.js
│   ├── OrderItem.js
│   ├── CartItem.js
│   ├── Reservation.js
│   ├── CateringOrder.js
│   ├── GiftCard.js
│   ├── GiftCardTransaction.js
│   ├── Delivery.js
│   ├── Address.js
│   ├── RestaurantTable.js
│   ├── Notification.js
│   ├── ChefProfile.js
│   ├── KitchenStation.js
│   ├── ChefOrderAssignment.js
│   ├── ChefShift.js
│   ├── LoyaltyTier.js
│   ├── LoyaltyTransaction.js
│   ├── Review.js
│   └── ContactMessage.js
├── routes/                # 21 route files
│   ├── auth.js
│   ├── users.js
│   ├── menu.js
│   ├── ingredients.js
│   ├── recipes.js
│   ├── orders.js
│   ├── cart.js
│   ├── checkout.js
│   ├── reservations.js
│   ├── catering.js
│   ├── giftCards.js
│   ├── deliveries.js
│   ├── addresses.js
│   ├── tables.js
│   ├── notifications.js
│   ├── chefs.js
│   ├── kitchen.js
│   ├── loyalty.js
│   ├── reviews.js
│   ├── contact.js
│   └── dashboard.js
└── utils/
    └── seed.js            # Database seeder
```
