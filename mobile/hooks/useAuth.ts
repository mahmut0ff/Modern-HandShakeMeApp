import { useAppSelector, useAppDispatch } from './redux';
import { logout } from '../features/auth/authSlice';
import { useLogoutMutation } from '../services/authApi';

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
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isClient: user?.role === 'client',
    isMaster: user?.role === 'master',
    isAdmin: user?.role === 'admin',
    logout: handleLogout,
  };
};