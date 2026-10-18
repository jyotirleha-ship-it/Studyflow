import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false
  },
  reducers: {
    setNotificationsData: (state, action) => {
      state.notifications = action.payload.data || [];
      state.unreadCount = action.payload.unreadCount || 0;
      state.loading = false;
    },
    markNotificationAsRead: (state, action) => {
      const item = state.notifications.find(n => n._id === action.payload);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    }
  }
});

export const { setNotificationsData, markNotificationAsRead, markAllNotificationsAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
