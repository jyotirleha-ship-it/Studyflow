import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setNotificationsData, markNotificationAsRead, markAllNotificationsAsRead } from '../redux/slices/notificationSlice.js';
import { notificationAPI } from '../services/api.js';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);

  const fetchNotifications = useCallback(async (params = {}) => {
    try {
      const res = await notificationAPI.getNotifications(params);
      dispatch(setNotificationsData(res.data));
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [dispatch]);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationAPI.markRead(id);
      dispatch(markNotificationAsRead(id));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  }, [dispatch]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllRead();
      dispatch(markAllNotificationsAsRead());
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  }, [dispatch]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};
