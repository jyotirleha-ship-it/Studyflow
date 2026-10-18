import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  loading: false,
  error: null,
  streakCelebration: null
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasksData: (state, action) => {
      state.tasks = action.payload.data || [];
      state.page = action.payload.page || 1;
      state.limit = action.payload.limit || 10;
      state.total = action.payload.total || 0;
      state.totalPages = action.payload.totalPages || 1;
      state.loading = false;
    },
    setTaskLoading: (state, action) => {
      state.loading = action.payload;
    },
    addTask: (state, action) => {
      state.tasks.unshift(action.payload);
      state.total += 1;
    },
    updateTaskItem: (state, action) => {
      const idx = state.tasks.findIndex(t => t._id === action.payload._id);
      if (idx !== -1) {
        state.tasks[idx] = action.payload;
      }
    },
    removeTaskItem: (state, action) => {
      state.tasks = state.tasks.filter(t => t._id !== action.payload);
      state.total -= 1;
    },
    setStreakCelebration: (state, action) => {
      state.streakCelebration = action.payload;
    },
    clearStreakCelebration: (state) => {
      state.streakCelebration = null;
    }
  }
});

export const {
  setTasksData,
  setTaskLoading,
  addTask,
  updateTaskItem,
  removeTaskItem,
  setStreakCelebration,
  clearStreakCelebration
} = taskSlice.actions;
export default taskSlice.reducer;
