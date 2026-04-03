import React, { useState } from 'react';
import { AuthContext } from './contexts';

// export const useAuth = () => useContext(AuthContext);

// Mock user profiles for demo
const MOCK_USERS = {
  owner: {
    id: 'owner_1',
    name: 'Rajesh Kumar',
    role: 'owner',
    email: 'owner@biryanibox.com',
    phone: '+1-555-0101',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
    joinDate: '2023-01-15',
    restaurantName: 'Biryani Box Premium',
  },
  manager: {
    id: 'manager_1',
    name: 'Priya Sharma',
    role: 'manager',
    email: 'manager@biryanibox.com',
    phone: '+1-555-0102',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    joinDate: '2023-03-20',
    managerSince: '2023-03-20',
  },
  captain: {
    id: 'captain_1',
    name: 'Arjun Singh',
    role: 'captain',
    email: 'captain@biryanibox.com',
    phone: '+1-555-0103',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    joinDate: '2023-05-10',
    tables: ['T1', 'T2', 'T3', 'T4'],
  },
  delivery: {
    id: 'delivery_1',
    name: 'Vikram Patel',
    role: 'delivery',
    email: 'delivery@biryanibox.com',
    phone: '+1-555-0104',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    joinDate: '2023-06-01',
    vehicleType: 'Motorcycle',
    rating: 4.8,
    deliveries: 245,
  },
  customer: {
    id: 'customer_1',
    name: 'Anjali Verma',
    role: 'customer',
    email: 'customer@biryanibox.com',
    phone: '+1-555-0105',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
    joinDate: '2024-01-10',
    address: '123 Main Street, NYC',
    loyaltyPoints: 850,
    orderCount: 12,
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bb_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (role) => {
    const newUser = MOCK_USERS[role] || MOCK_USERS.customer;
    setUser(newUser);
    localStorage.setItem('bb_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bb_user');
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
