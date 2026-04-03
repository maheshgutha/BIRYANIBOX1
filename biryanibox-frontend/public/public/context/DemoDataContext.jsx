import React from 'react';
import {
  MOCK_RESERVATIONS,
  MOCK_CATERING_ORDERS,
  MOCK_GIFT_CARDS,
  MOCK_DELIVERIES,
  MOCK_ORDER_HISTORY,
} from './menuData';
import { DemoDataContext } from './contexts';

// export const useDemoData = () => useContext(DemoDataContext);


export const DemoDataProvider = ({ children }) => {
  const data = {
    reservations: MOCK_RESERVATIONS,
    cateringOrders: MOCK_CATERING_ORDERS,
    giftCards: MOCK_GIFT_CARDS,
    deliveries: MOCK_DELIVERIES,
    orderHistory: MOCK_ORDER_HISTORY,
  };

  return <DemoDataContext.Provider value={data}>{children}</DemoDataContext.Provider>;
};
