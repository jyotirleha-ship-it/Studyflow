import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setLearningDNA } from '../redux/slices/learningDNASlice.js';
import { analyticsAPI } from '../services/api.js';

export const useLearningDNA = () => {
  const dispatch = useDispatch();
  const { data: learningDNA, loading } = useSelector((state) => state.learningDNA);

  const fetchLearningDNA = useCallback(async () => {
    try {
      const res = await analyticsAPI.getLearningDNA();
      dispatch(setLearningDNA(res.data.learningDNA));
      return res.data.learningDNA;
    } catch (err) {
      console.error('Failed to load learning DNA', err);
    }
  }, [dispatch]);

  return { learningDNA, loading, fetchLearningDNA };
};
