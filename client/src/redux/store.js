import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import themeReducer from './slices/themeSlice.js';
import languageReducer from './slices/languageSlice.js';
import taskReducer from './slices/taskSlice.js';
import calendarReducer from './slices/calendarSlice.js';
import studyReducer from './slices/studySlice.js';
import chatReducer from './slices/chatSlice.js';
import notificationReducer from './slices/notificationSlice.js';
import analyticsReducer from './slices/analyticsSlice.js';
import learningDNAReducer from './slices/learningDNASlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    language: languageReducer,
    tasks: taskReducer,
    calendar: calendarReducer,
    study: studyReducer,
    chat: chatReducer,
    notifications: notificationReducer,
    analytics: analyticsReducer,
    learningDNA: learningDNAReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
