import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { loginStart, loginSuccess, loginFailure, logout, updateUser } from '../redux/slices/authSlice.js';
import { authAPI } from '../services/api.js';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const login = useCallback(async (email, password) => {
    dispatch(loginStart());
    try {
      const res = await authAPI.login({ email, password });
      dispatch(loginSuccess(res.data));
      return { success: true, user: res.data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      dispatch(loginFailure(msg));
      return { success: false, message: msg };
    }
  }, [dispatch]);

  const register = useCallback(async (data) => {
    dispatch(loginStart());
    try {
      const res = await authAPI.register(data);
      dispatch(loginSuccess(res.data));
      return { success: true, user: res.data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      dispatch(loginFailure(msg));
      return { success: false, message: msg };
    }
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authAPI.getProfile();
      dispatch(updateUser(res.data.user));
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout: handleLogout,
    refreshProfile
  };
};
