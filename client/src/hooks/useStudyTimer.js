import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { toggleTimer, tickTimer, resetTimer, startSession, endSession } from '../redux/slices/studySlice.js';

export const useStudyTimer = () => {
  const dispatch = useDispatch();
  const { timerSeconds, timerRunning, isFocusMode, activeSession, selectedTopic } = useSelector((state) => state.study);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        dispatch(tickTimer());
      }, 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      dispatch(toggleTimer());
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, dispatch]);

  const start = useCallback((sessionData) => {
    dispatch(startSession(sessionData));
  }, [dispatch]);

  const pauseResume = useCallback(() => {
    dispatch(toggleTimer());
  }, [dispatch]);

  const reset = useCallback((minutes) => {
    dispatch(resetTimer(minutes));
  }, [dispatch]);

  const finish = useCallback(() => {
    dispatch(endSession());
  }, [dispatch]);

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    timerSeconds,
    timerRunning,
    isFocusMode,
    activeSession,
    selectedTopic,
    formattedTime,
    start,
    pauseResume,
    reset,
    finish
  };
};
