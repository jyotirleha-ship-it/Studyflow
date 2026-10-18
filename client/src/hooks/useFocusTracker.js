import { useReducer, useEffect, useRef, useCallback, useMemo } from 'react';

// Focus tracker actions
const FOCUS_ACTIONS = {
  START: 'START',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  STOP: 'STOP',
  TICK: 'TICK',
  RECORD_DISTRACTION: 'RECORD_DISTRACTION',
  DISMISS_WARNING: 'DISMISS_WARNING',
  RESET: 'RESET'
};

const initialFocusState = {
  isActive: false,
  isPaused: false,
  focusTime: 0,           // in seconds
  distractionCount: 0,    // count of tab switches / minimizes
  studySessionTime: 0,    // total elapsed in seconds
  warningActive: false,   // warning popup flag
  lastDistractionReason: ''
};

function focusReducer(state, action) {
  switch (action.type) {
    case FOCUS_ACTIONS.START:
      return {
        ...state,
        isActive: true,
        isPaused: false,
        warningActive: false
      };
    case FOCUS_ACTIONS.PAUSE:
      return {
        ...state,
        isPaused: true
      };
    case FOCUS_ACTIONS.RESUME:
      return {
        ...state,
        isPaused: false,
        warningActive: false
      };
    case FOCUS_ACTIONS.STOP:
      return {
        ...state,
        isActive: false,
        isPaused: false,
        warningActive: false
      };
    case FOCUS_ACTIONS.TICK:
      if (!state.isActive || state.isPaused) return state;
      return {
        ...state,
        studySessionTime: state.studySessionTime + 1,
        // Only increment focusTime when user is actively focused (no tab hidden)
        focusTime: action.payload?.isFocused ? state.focusTime + 1 : state.focusTime
      };
    case FOCUS_ACTIONS.RECORD_DISTRACTION:
      if (!state.isActive) return state;
      return {
        ...state,
        distractionCount: state.distractionCount + 1,
        warningActive: true,
        lastDistractionReason: action.payload?.reason || 'Tab switched or minimized'
      };
    case FOCUS_ACTIONS.DISMISS_WARNING:
      return {
        ...state,
        warningActive: false
      };
    case FOCUS_ACTIONS.RESET:
      return initialFocusState;
    default:
      return state;
  }
}

/**
 * Custom hook for study focus monitoring, tab switch detection,
 * browser minimize warnings, and focus score calculation.
 * Employs useReducer, useEffect, useRef, useCallback, and useMemo.
 */
export const useFocusTracker = (options = { autoStart: false }) => {
  const [state, dispatch] = useReducer(focusReducer, initialFocusState);
  const isDocumentVisibleRef = useRef(true);
  const timerRef = useRef(null);

  // Sync ref with document visibility
  useEffect(() => {
    isDocumentVisibleRef.current = !document.hidden;
  }, []);

  // Main 1-second interval loop
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      timerRef.current = setInterval(() => {
        dispatch({
          type: FOCUS_ACTIONS.TICK,
          payload: { isFocused: isDocumentVisibleRef.current }
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isActive, state.isPaused]);

  // Handle visibilitychange and window blur (Distraction Detection)
  useEffect(() => {
    if (!state.isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isDocumentVisibleRef.current = false;
        dispatch({
          type: FOCUS_ACTIONS.RECORD_DISTRACTION,
          payload: { reason: 'Switched tabs or minimized browser' }
        });
      } else {
        isDocumentVisibleRef.current = true;
      }
    };

    const handleWindowBlur = () => {
      // Triggered when focus moves to another window or desktop application
      if (state.isActive && !state.isPaused) {
        dispatch({
          type: FOCUS_ACTIONS.RECORD_DISTRACTION,
          payload: { reason: 'Left browser window' }
        });
      }
    };

    const handleBeforeUnload = (e) => {
      if (state.isActive && !state.isPaused) {
        const warningMsg = '⚠️ Hey! You are currently studying. Do you really want to leave? Stay Focused 📚';
        e.preventDefault();
        e.returnValue = warningMsg;
        return warningMsg;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isActive, state.isPaused]);

  const startSession = useCallback(() => {
    dispatch({ type: FOCUS_ACTIONS.START });
  }, []);

  const pauseSession = useCallback(() => {
    dispatch({ type: FOCUS_ACTIONS.PAUSE });
  }, []);

  const resumeSession = useCallback(() => {
    dispatch({ type: FOCUS_ACTIONS.RESUME });
  }, []);

  const stopSession = useCallback(() => {
    dispatch({ type: FOCUS_ACTIONS.STOP });
  }, []);

  const dismissWarning = useCallback(() => {
    dispatch({ type: FOCUS_ACTIONS.DISMISS_WARNING });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: FOCUS_ACTIONS.RESET });
  }, []);

  // Compute Focus Score (0 - 100%)
  const focusScore = useMemo(() => {
    if (state.studySessionTime === 0) return 100;
    const ratio = state.focusTime / state.studySessionTime;
    const penalty = state.distractionCount * 4;
    const calculated = Math.round(ratio * 100 - penalty);
    return Math.max(0, Math.min(100, calculated));
  }, [state.focusTime, state.studySessionTime, state.distractionCount]);

  // Format MM:SS helper
  const formatTime = useCallback((totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return {
    isActive: state.isActive,
    isPaused: state.isPaused,
    focusTime: state.focusTime,
    distractionCount: state.distractionCount,
    studySessionTime: state.studySessionTime,
    warningActive: state.warningActive,
    lastDistractionReason: state.lastDistractionReason,
    focusScore,
    formattedFocusTime: formatTime(state.focusTime),
    formattedTotalTime: formatTime(state.studySessionTime),
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    dismissWarning,
    resetSession
  };
};

export default useFocusTracker;
