import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { CartProvider } from './context/CartContext';
import { DemoDataProvider } from './context/DemoDataContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <OrderProvider>
        <CartProvider>
          <DemoDataProvider>
            <App />
          </DemoDataProvider>
        </CartProvider>
      </OrderProvider>
    </AuthProvider>
  </StrictMode>
);
