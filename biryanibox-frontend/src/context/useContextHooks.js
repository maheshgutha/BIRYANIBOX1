import { useContext } from 'react';
import { AuthContext, OrderContext, CartContext, DemoDataContext } from './contexts';
export const useAuth = () => useContext(AuthContext);
export const useOrders = () => useContext(OrderContext);
export const useCart = () => useContext(CartContext);
export const useDemoData = () => useContext(DemoDataContext);

