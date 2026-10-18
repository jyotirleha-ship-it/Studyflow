import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('studyflow_token');
const userJson = localStorage.getItem('studyflow_user');

const initialState = {
  token: token || null,
  user: userJson ? JSON.parse(userJson) : null,
  isAuthenticated: !!token,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('studyflow_token', action.payload.token);
      localStorage.setItem('studyflow_user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('studyflow_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('studyflow_token');
      localStorage.removeItem('studyflow_user');
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
