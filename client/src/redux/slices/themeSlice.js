import { createSlice } from '@reduxjs/toolkit';

const savedTheme = localStorage.getItem('studyflow_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: savedTheme,
  },
  reducers: {
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('studyflow_theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleTheme: (state) => {
      const nextTheme = state.mode === 'dark' ? 'light' : 'dark';
      state.mode = nextTheme;
      localStorage.setItem('studyflow_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
  }
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
