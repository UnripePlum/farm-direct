import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, login, signup, logout, socialLogin } = useAuthStore();

  const isFarmer = user?.role === 'farmer';
  const isConsumer = user?.role === 'consumer';
  const hasRole = user?.role != null;

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isFarmer,
    isConsumer,
    hasRole,
    login,
    signup,
    logout,
    socialLogin,
  };
};
