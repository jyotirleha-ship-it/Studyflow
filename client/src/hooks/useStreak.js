import { useSelector, useDispatch } from 'react-redux';
import { setStreakCelebration, clearStreakCelebration } from '../redux/slices/taskSlice.js';
import confetti from 'canvas-confetti';
import { useCallback } from 'react';

export const useStreak = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const celebration = useSelector((state) => state.tasks.streakCelebration);

  const triggerStreakCelebration = useCallback((streakData) => {
    dispatch(setStreakCelebration(streakData));

    // Particle burst celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.25 },
        colors: ['#ff5722', '#f59e0b', '#6366f1', '#10b981']
      });
    } catch (err) {
      // safe fallback
    }

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dispatch(clearStreakCelebration());
    }, 5000);
  }, [dispatch]);

  return {
    currentStreak: user?.streak || 12,
    longestStreak: user?.longestStreak || 15,
    celebration,
    triggerStreakCelebration,
    dismissCelebration: () => dispatch(clearStreakCelebration())
  };
};
