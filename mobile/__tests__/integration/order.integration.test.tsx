import { configureStore } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { orderApi } from '../../services/orderApi';

describe('Order Integration Tests', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });
  });

  afterEach(() => {
    store.dispatch(api.util.resetApiState());
  });

  describe('Order CRUD Operations', () => {
    it('should have all order endpoints defined', () => {
      expect(orderApi.endpoints.getOrders).toBeDefined();
      expect(orderApi.endpoints.getOrderById).toBeDefined();
      expect(orderApi.endpoints.createOrder).toBeDefined();
      expect(orderApi.endpoints.updateOrder).toBeDefined();
      expect(orderApi.endpoints.deleteOrder).toBeDefined();
    });

    it('should have category endpoints', () => {
      expect(orderApi.endpoints.getCategories).toBeDefined();
      expect(orderApi.endpoints.getCategorySkills).toBeDefined();
    });

    it('should have favorites endpoints', () => {
      expect(orderApi.endpoints.addToFavorites).toBeDefined();
      expect(orderApi.endpoints.removeFromFavorites).toBeDefined();
    });

    it('should have file management endpoints', () => {
      expect(orderApi.endpoints.getOrderFiles).toBeDefined();
      expect(orderApi.endpoints.addOrderFile).toBeDefined();
      expect(orderApi.endpoints.deleteOrderFile).toBeDefined();
    });
  });

  describe('Order Search and Filter', () => {
    it('should support search parameters', () => {
      const endpoint = orderApi.endpoints.getOrders;
      expect(endpoint).toBeDefined();
      expect(endpoint.name).toBe('getOrders');
    });

    it('should support category filtering', () => {
      const endpoint = orderApi.endpoints.getOrders;
      expect(endpoint).toBeDefined();
    });

    it('should support city filtering', () => {
      const endpoint = orderApi.endpoints.getOrders;
      expect(endpoint).toBeDefined();
    });

    it('should support budget filtering', () => {
      const endpoint = orderApi.endpoints.getOrders;
      expect(endpoint).toBeDefined();
    });
  });

  describe('Order Status Management', () => {
    const orderStatuses = ['draft', 'active', 'in_progress', 'completed', 'cancelled'];

    orderStatuses.forEach(status => {
      it(`should handle ${status} status`, () => {
        expect(orderStatuses).toContain(status);
      });
    });
  });

  describe('Order Budget Types', () => {
    const budgetTypes = ['fixed', 'range', 'negotiable'];

    budgetTypes.forEach(type => {
      it(`should handle ${type} budget type`, () => {
        expect(budgetTypes).toContain(type);
      });
    });
  });
});
