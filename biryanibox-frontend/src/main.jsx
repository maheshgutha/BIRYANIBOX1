import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { OrderProvider } from './context/OrderContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { DemoDataProvider } from './context/DemoDataContext.jsx';

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