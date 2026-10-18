import { createSlice } from '@reduxjs/toolkit';

const calendarSlice = createSlice({
  name: 'calendar',
  initialState: {
    events: [],
    currentView: 'month',
    selectedDate: new Date().toISOString(),
    loading: false
  },
  reducers: {
    setEvents: (state, action) => {
      state.events = action.payload;
      state.loading = false;
    },
    setView: (state, action) => {
      state.currentView = action.payload;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    addEvent: (state, action) => {
      state.events.push(action.payload);
    },
    updateEventItem: (state, action) => {
      const idx = state.events.findIndex(e => e._id === action.payload._id);
      if (idx !== -1) state.events[idx] = action.payload;
    },
    removeEventItem: (state, action) => {
      state.events = state.events.filter(e => e._id !== action.payload);
    }
  }
});

export const { setEvents, setView, setSelectedDate, addEvent, updateEventItem, removeEventItem } = calendarSlice.actions;
export default calendarSlice.reducer;
