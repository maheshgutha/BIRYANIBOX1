import { useContext } from 'react';
import { AuthContext, OrderContext, CartContext, DemoDataContext } from './contexts';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const useOrders = () => {
    const context = useContext(OrderContext);
    if (!context) throw new Error('useOrders must be used within an OrderProvider');
    return context;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

export const useDemoData = () => {
    const context = useContext(DemoDataContext);
    if (!context) throw new Error('useDemoData must be used within a DemoDataProvider');
    return context;
};
