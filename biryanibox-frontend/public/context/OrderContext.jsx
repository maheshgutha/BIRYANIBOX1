import React, { useState, useEffect } from 'react';
import { MOCK_MENU, MOCK_INGREDIENTS, MOCK_ORDERS, MENU_RECIPES } from './menuData';
import { OrderContext } from './contexts';

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('bb_orders');
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  });

  const [ingredients, setIngredients] = useState(() => {
    const saved = localStorage.getItem('bb_ingredients');
    return saved ? JSON.parse(saved) : MOCK_INGREDIENTS;
  });

  const [menu, setMenu] = useState(() => {
    const saved = localStorage.getItem('bb_menu');
    return saved ? JSON.parse(saved) : MOCK_MENU;
  });

  useEffect(() => {
    localStorage.setItem('bb_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('bb_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('bb_menu', JSON.stringify(menu));
  }, [menu]);

  const createOrder = (cart, table, captain) => {
    // Check stock first
    for (const item of cart) {
      const recipe = MENU_RECIPES[item.id];
      if (recipe) {
        for (const req of recipe) {
          const ing = ingredients.find((i) => i.id === req.ingredientId);
          if (ing && ing.stock < req.qty * item.quantity) {
            return { error: `Insufficient stock for ${ing.name}` };
          }
        }
      }
    }

    const newOrder = {
      id: `ORD_${Date.now()}`,
      items: cart,
      total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
      table,
      captain,
      status: 'pending',
      timestamp: new Date().toISOString(),
      rating: 0,
    };

    // Update ingredients
    const updatedIngredients = ingredients.map((ing) => {
      let newStock = ing.stock;
      cart.forEach((item) => {
        const recipe = MENU_RECIPES[item.id];
        if (recipe) {
          const req = recipe.find((r) => r.ingredientId === ing.id);
          if (req) {
            newStock -= req.qty * item.quantity;
          }
        }
      });
      return { ...ing, stock: Math.max(0, parseFloat(newStock.toFixed(2))) };
    });

    setIngredients(updatedIngredients);
    setOrders([newOrder, ...orders]);
    return { success: true, orderId: newOrder.id };
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const deleteOrder = (orderId) => {
    setOrders(orders.filter((o) => o.id !== orderId));
  };

  const updateMenuStock = (itemId, stock) => {
    setMenu(menu.map((m) => (m.id === itemId ? { ...m, stock } : m)));
  };

  const toggleMenuAvailability = (itemId) => {
    setMenu(menu.map((m) => (m.id === itemId ? { ...m, available: !m.available } : m)));
  };

  const updateIngredientStock = (ingredientId, amount) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === ingredientId ? { ...ing, stock: amount } : ing))
    );
  };

  const importIngredientsCSV = (data) => {
    setIngredients(data);
  };

  const exportIngredientsCSV = () => ingredients;

  const getFinancialMetrics = () => {
    const revenue = orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.total, 0);
    const costOfGoods = orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => {
        let cost = 0;
        o.items.forEach((item) => {
          const recipe = MENU_RECIPES[item.id];
          if (recipe) {
            recipe.forEach((req) => {
              const ing = ingredients.find((i) => i.id === req.ingredientId);
              if (ing) cost += req.qty * item.quantity * ing.unitCost;
            });
          }
        });
        return sum + cost;
      }, 0);

    return {
      revenue,
      costOfGoods,
      profit: revenue - costOfGoods,
      profitMargin: revenue > 0 ? ((revenue - costOfGoods) / revenue) * 100 : 0,
    };
  };

  const getReorderForecast = () =>
    ingredients.map((ing) => ({
      ...ing,
      needsReorder: ing.stock < ing.minStock,
      daysRemaining: ing.stock / 5, // Mock daily usage
    }));

  return (
    <OrderContext.Provider
      value={{
        orders,
        ingredients,
        menu,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        updateMenuStock,
        toggleMenuAvailability,
        updateIngredientStock,
        importIngredientsCSV,
        exportIngredientsCSV,
        getFinancialMetrics,
        getReorderForecast,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
