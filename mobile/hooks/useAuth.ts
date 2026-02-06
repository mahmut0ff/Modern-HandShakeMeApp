import { useAppSelector, useAppDispatch } from './redux';
import { logout } from '../features/auth/authSlice';
import { useLogoutMutation } from '../services/authApi';
import { router } from 'expo-router';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken, refreshToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutMutation({ refresh: refreshToken }).unwrap();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      // Redirect to login after logout
      router.replace('/(auth)/login');
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isClient: user?.role === 'CLIENT',
    isMaster: user?.role === 'MASTER',
    isAdmin: user?.role === 'ADMIN',
    logout: handleLogout,
  };
};