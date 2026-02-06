import authReducer, { setCredentials, setTokens, logout } from '../../../../features/auth/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };

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

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setCredentials', () => {
    it('should set user and tokens', () => {
      const actual = authReducer(
        initialState,
        setCredentials({
          user: mockUser,
          ...mockTokens,
        })
      );

      expect(actual.user).toEqual(mockUser);
      expect(actual.accessToken).toBe(mockTokens.accessToken);
      expect(actual.refreshToken).toBe(mockTokens.refreshToken);
      expect(actual.isAuthenticated).toBe(true);
    });

    it('should update existing credentials', () => {
      const existingState = {
        user: mockUser,
        ...mockTokens,
        isAuthenticated: true,
      };

      const newUser = { ...mockUser, firstName: 'Jane' };
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      const actual = authReducer(
        existingState,
        setCredentials({
          user: newUser,
          ...newTokens,
        })
      );

      expect(actual.user).toEqual(newUser);
      expect(actual.accessToken).toBe(newTokens.accessToken);
      expect(actual.refreshToken).toBe(newTokens.refreshToken);
    });
  });

  describe('setTokens', () => {
    it('should update tokens without changing user', () => {
      const stateWithUser = {
        user: mockUser,
        accessToken: 'old-access-token',
        refreshToken: 'old-refresh-token',
        isAuthenticated: true,
      };

      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      const actual = authReducer(stateWithUser, setTokens(newTokens));

      expect(actual.user).toEqual(mockUser);
      expect(actual.accessToken).toBe(newTokens.accessToken);
      expect(actual.refreshToken).toBe(newTokens.refreshToken);
      expect(actual.isAuthenticated).toBe(true);
    });

    it('should work with null user', () => {
      const actual = authReducer(initialState, setTokens(mockTokens));

      expect(actual.user).toBeNull();
      expect(actual.accessToken).toBe(mockTokens.accessToken);
      expect(actual.refreshToken).toBe(mockTokens.refreshToken);
    });
  });

  describe('logout', () => {
    it('should clear all auth data', () => {
      const authenticatedState = {
        user: mockUser,
        ...mockTokens,
        isAuthenticated: true,
      };

      const actual = authReducer(authenticatedState, logout());

      expect(actual).toEqual(initialState);
    });

    it('should work when already logged out', () => {
      const actual = authReducer(initialState, logout());

      expect(actual).toEqual(initialState);
    });
  });

  describe('edge cases', () => {
    it('should handle partial user data', () => {
      const partialUser = {
        id: 1,
        phone: '+996700123456',
        role: 'master' as const,
      };

      const actual = authReducer(
        initialState,
        setCredentials({
          user: partialUser,
          ...mockTokens,
        })
      );

      expect(actual.user).toEqual(partialUser);
      expect(actual.isAuthenticated).toBe(true);
    });

    it('should handle empty tokens', () => {
      const actual = authReducer(
        initialState,
        setTokens({
          accessToken: '',
          refreshToken: '',
        })
      );

      expect(actual.accessToken).toBe('');
      expect(actual.refreshToken).toBe('');
    });
  });
});
