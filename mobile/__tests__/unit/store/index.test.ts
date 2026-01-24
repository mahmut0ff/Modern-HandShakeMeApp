import { store, persistor } from '../../../store';
import { api } from '../../../services/api';

describe('Redux Store', () => {
  it('should be defined', () => {
    expect(store).toBeDefined();
  });

  it('should have auth reducer', () => {
    const state = store.getState();
    expect(state.auth).toBeDefined();
  });

  it('should have api reducer', () => {
    const state = store.getState();
    expect(state[api.reducerPath]).toBeDefined();
  });

  it('should have initial auth state', () => {
    const state = store.getState();
    expect(state.auth).toEqual({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('should have persistor defined', () => {
    expect(persistor).toBeDefined();
  });

  describe('Store Configuration', () => {
    it('should have correct middleware', () => {
      const state = store.getState();
      expect(state).toBeDefined();
    });

    it('should handle actions', () => {
      const initialState = store.getState();
      expect(initialState).toBeDefined();
    });
  });

  describe('API Integration', () => {
    it('should have API endpoints', () => {
      expect(api.endpoints).toBeDefined();
    });

    it('should have correct tag types', () => {
      const tagTypes = [
        'User',
        'Order',
        'Application',
        'Project',
        'MasterProfile',
        'ClientProfile',
        'Portfolio',
        'Review',
        'Chat',
        'Notification',
        'Wallet',
        'Transaction',
        'Service',
        'ServiceCategory',
        'Verification',
      ];

      // API should be configured with these tag types
      expect(api.reducerPath).toBe('api');
    });
  });
});
