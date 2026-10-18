import { createSlice } from '@reduxjs/toolkit';

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    weeklyHours: [],
    totalWeeklyHours: 0,
    subjectProgress: [],
    completionRate: 0,
    studyConsistencyScore: 0,
    loading: false
  },
  reducers: {
    setAnalyticsData: (state, action) => {
      state.weeklyHours = action.payload.weeklyHours || [];
      state.totalWeeklyHours = action.payload.totalWeeklyHours || 0;
      state.subjectProgress = action.payload.subjectProgress || [];
      state.completionRate = action.payload.completionRate || 0;
      state.studyConsistencyScore = action.payload.studyConsistencyScore || 0;
      state.loading = false;
    }
  }
});

export const { setAnalyticsData } = analyticsSlice.actions;
export default analyticsSlice.reducer;
