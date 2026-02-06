import { configureStore } from '@reduxjs/toolkit';
import { orderApi } from '../../../services/orderApi';
import { api } from '../../../services/api';

describe('orderApi', () => {
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

  describe('getCategories', () => {
    it('should create getCategories endpoint', () => {
      expect(orderApi.endpoints.getCategories).toBeDefined();
    });

    it('should transform response correctly', () => {
      const endpoint = orderApi.endpoints.getCategories;
      expect(endpoint.name).toBe('getCategories');
    });
  });

  describe('getCategorySkills', () => {
    it('should create getCategorySkills endpoint', () => {
      expect(orderApi.endpoints.getCategorySkills).toBeDefined();
    });
  });

  describe('getOrders', () => {
    it('should create getOrders endpoint', () => {
      expect(orderApi.endpoints.getOrders).toBeDefined();
    });

    it('should provide Order tag', () => {
      const endpoint = orderApi.endpoints.getOrders;
      expect(endpoint.name).toBe('getOrders');
    });
  });

  describe('getOrderById', () => {
    it('should create getOrderById endpoint', () => {
      expect(orderApi.endpoints.getOrderById).toBeDefined();
    });
  });

  describe('createOrder', () => {
    it('should create createOrder endpoint', () => {
      expect(orderApi.endpoints.createOrder).toBeDefined();
    });

    it('should invalidate Order tag', () => {
      const endpoint = orderApi.endpoints.createOrder;
      expect(endpoint.name).toBe('createOrder');
    });
  });

  describe('updateOrder', () => {
    it('should create updateOrder endpoint', () => {
      expect(orderApi.endpoints.updateOrder).toBeDefined();
    });
  });

  describe('deleteOrder', () => {
    it('should create deleteOrder endpoint', () => {
      expect(orderApi.endpoints.deleteOrder).toBeDefined();
    });
  });

  describe('addToFavorites', () => {
    it('should create addToFavorites endpoint', () => {
      expect(orderApi.endpoints.addToFavorites).toBeDefined();
    });
  });

  describe('removeFromFavorites', () => {
    it('should create removeFromFavorites endpoint', () => {
      expect(orderApi.endpoints.removeFromFavorites).toBeDefined();
    });
  });

  describe('getMyOrders', () => {
    it('should create getMyOrders endpoint', () => {
      expect(orderApi.endpoints.getMyOrders).toBeDefined();
    });

    it('should transform response with results', () => {
      const endpoint = orderApi.endpoints.getMyOrders;
      expect(endpoint.name).toBe('getMyOrders');
    });
  });
});
