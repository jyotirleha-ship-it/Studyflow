import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setAnalyticsData } from '../redux/slices/analyticsSlice.js';
import { analyticsAPI } from '../services/api.js';

export const useStudyAnalytics = () => {
  const dispatch = useDispatch();
  const {
    weeklyHours,
    totalWeeklyHours,
    subjectProgress,
    completionRate,
    studyConsistencyScore,
    loading
  } = useSelector((state) => state.analytics);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await analyticsAPI.getAnalytics();
      dispatch(setAnalyticsData(res.data));
    } catch (err) {
      console.error('Failed to load study analytics', err);
    }
  }, [dispatch]);

  return {
    weeklyHours,
    totalWeeklyHours,
    subjectProgress,
    completionRate,
    studyConsistencyScore,
    loading,
    fetchAnalytics
  };
};
