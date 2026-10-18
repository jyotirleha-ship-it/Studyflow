import { createSlice } from '@reduxjs/toolkit';

const studySlice = createSlice({
  name: 'study',
  initialState: {
    activeSession: null,
    isFocusMode: false,
    timerSeconds: 25 * 60,
    timerRunning: false,
    selectedTopic: null,
    sessions: [],
    summaries: [],
    loading: false
  },
  reducers: {
    startSession: (state, action) => {
      state.activeSession = action.payload;
      state.isFocusMode = true;
      state.timerSeconds = (action.payload.durationMinutes || 25) * 60;
      state.timerRunning = true;
      state.selectedTopic = action.payload.topic || null;
    },
    toggleTimer: (state) => {
      state.timerRunning = !state.timerRunning;
    },
    tickTimer: (state) => {
      if (state.timerSeconds > 0 && state.timerRunning) {
        state.timerSeconds -= 1;
      }
    },
    resetTimer: (state, action) => {
      state.timerSeconds = (action.payload || 25) * 60;
      state.timerRunning = false;
    },
    endSession: (state) => {
      state.isFocusMode = false;
      state.timerRunning = false;
      state.activeSession = null;
    },
    setSessions: (state, action) => {
      state.sessions = action.payload;
    },
    setSummaries: (state, action) => {
      state.summaries = action.payload;
    }
  }
});

export const {
  startSession,
  toggleTimer,
  tickTimer,
  resetTimer,
  endSession,
  setSessions,
  setSummaries
} = studySlice.actions;
export default studySlice.reducer;
