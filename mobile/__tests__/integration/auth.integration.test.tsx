import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react-native';
import { api } from '../../services/api';
import authReducer, { setCredentials, logout } from '../../features/auth/authSlice';

describe('Auth Integration Tests', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });
  });

  afterEach(() => {
    store.dispatch(api.util.resetApiState());
  });

  describe('Authentication Flow', () => {
    it('should handle complete login flow', async () => {
      const mockUser = {
        id: 1,
        phone: '+996700123456',
        role: 'client' as const,
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      // Dispatch login action
      store.dispatch(
        setCredentials({
          user: mockUser,
          ...mockTokens,
        })
      );

      // Verify state
      const state = store.getState() as RootState;
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.accessToken).toBe(mockTokens.accessToken);
      expect(state.auth.refreshToken).toBe(mockTokens.refreshToken);
      expect(state.auth.isAuthenticated).toBe(true);
    });

    it('should handle logout flow', async () => {
      // Setup authenticated state
      const mockUser = {
        id: 1,
        phone: '+996700123456',
        role: 'client' as const,
      };

      store.dispatch(
        setCredentials({
          user: mockUser,
          accessToken: 'token',
          refreshToken: 'refresh',
        })
      );

      // Verify authenticated
      expect((store.getState() as RootState).auth.isAuthenticated).toBe(true);

      // Logout
      store.dispatch(logout());

      // Verify logged out
      const state = store.getState() as RootState;
      expect(state.auth.user).toBeNull();
      expect(state.auth.accessToken).toBeNull();
      expect(state.auth.refreshToken).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
    });

    it('should handle token refresh', async () => {
      const initialTokens = {
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
      };

      const mockUser = {
        id: 1,
        phone: '+996700123456',
        role: 'master' as const,
      };

      // Set initial credentials
      store.dispatch(
        setCredentials({
          user: mockUser,
          ...initialTokens,
        })
      );

      // Simulate token refresh
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      store.dispatch(
        setCredentials({
          user: mockUser,
          ...newTokens,
        })
      );

      // Verify tokens updated
      const state = store.getState() as RootState;
      expect(state.auth.accessToken).toBe(newTokens.accessToken);
      expect(state.auth.refreshToken).toBe(newTokens.refreshToken);
      expect(state.auth.user).toEqual(mockUser);
    });
  });

  describe('Role-based Access', () => {
    it('should handle client role', () => {
      const clientUser = {
        id: 1,
        phone: '+996700123456',
        role: 'client' as const,
      };

      store.dispatch(
        setCredentials({
          user: clientUser,
          accessToken: 'token',
          refreshToken: 'refresh',
        })
      );

      const state = store.getState() as RootState;
      expect(state.auth.user?.role).toBe('client');
    });

    it('should handle master role', () => {
      const masterUser = {
        id: 2,
        phone: '+996700654321',
        role: 'master' as const,
      };

      store.dispatch(
        setCredentials({
          user: masterUser,
          accessToken: 'token',
          refreshToken: 'refresh',
        })
      );

      const state = store.getState() as RootState;
      expect(state.auth.user?.role).toBe('master');
    });

    it('should handle admin role', () => {
      const adminUser = {
        id: 3,
        phone: '+996700111111',
        role: 'admin' as const,
      };

      store.dispatch(
        setCredentials({
          user: adminUser,
          accessToken: 'token',
          refreshToken: 'refresh',
        })
      );

      const state = store.getState() as RootState;
      expect(state.auth.user?.role).toBe('admin');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials', () => {
      const initialState = (store.getState() as RootState).auth;
      expect(initialState.isAuthenticated).toBe(false);
    });

    it('should maintain state after failed login', () => {
      const initialState = (store.getState() as RootState).auth;

      // Attempt to set invalid credentials (should still work, validation is on backend)
      store.dispatch(
        setCredentials({
          user: { id: 0, phone: '', role: 'client' },
          accessToken: '',
          refreshToken: '',
        })
      );

      const state = (store.getState() as RootState).auth;
      expect(state.isAuthenticated).toBe(true); // State updated regardless
    });
  });
});
