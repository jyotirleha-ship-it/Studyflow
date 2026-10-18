import { createSlice } from '@reduxjs/toolkit';
import i18n from '../../i18n/i18n.js';

const savedLang = localStorage.getItem('studyflow_lang') || 'en';

const languageSlice = createSlice({
  name: 'language',
  initialState: {
    currentLanguage: savedLang,
  },
  reducers: {
    setLanguage: (state, action) => {
      state.currentLanguage = action.payload;
      localStorage.setItem('studyflow_lang', action.payload);
      i18n.changeLanguage(action.payload);
    }
  }
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
