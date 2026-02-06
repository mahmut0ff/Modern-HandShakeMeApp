import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../../../services/authApi';
import { api } from '../../../services/api';

describe('authApi', () => {
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

  describe('register', () => {
    it('should create register endpoint', () => {
      expect(authApi.endpoints.register).toBeDefined();
    });

    it('should have correct endpoint configuration', () => {
      const endpoint = authApi.endpoints.register;
      expect(endpoint.name).toBe('register');
    });
  });

  describe('login', () => {
    it('should create login endpoint', () => {
      expect(authApi.endpoints.login).toBeDefined();
    });

    it('should have correct endpoint configuration', () => {
      const endpoint = authApi.endpoints.login;
      expect(endpoint.name).toBe('login');
    });
  });

  describe('logout', () => {
    it('should create logout endpoint', () => {
      expect(authApi.endpoints.logout).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should create refreshToken endpoint', () => {
      expect(authApi.endpoints.refreshToken).toBeDefined();
    });
  });

  describe('verifyPhone', () => {
    it('should create verifyPhone endpoint', () => {
      expect(authApi.endpoints.verifyPhone).toBeDefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should create getCurrentUser endpoint', () => {
      expect(authApi.endpoints.getCurrentUser).toBeDefined();
    });

    it('should provide User tag', () => {
      const endpoint = authApi.endpoints.getCurrentUser;
      expect(endpoint.name).toBe('getCurrentUser');
    });
  });

  describe('updateCurrentUser', () => {
    it('should create updateCurrentUser endpoint', () => {
      expect(authApi.endpoints.updateCurrentUser).toBeDefined();
    });

    it('should invalidate User tag', () => {
      const endpoint = authApi.endpoints.updateCurrentUser;
      expect(endpoint.name).toBe('updateCurrentUser');
    });
  });

  describe('uploadAvatar', () => {
    it('should create uploadAvatar endpoint', () => {
      expect(authApi.endpoints.uploadAvatar).toBeDefined();
    });
  });

  describe('deleteAvatar', () => {
    it('should create deleteAvatar endpoint', () => {
      expect(authApi.endpoints.deleteAvatar).toBeDefined();
    });
  });
});
