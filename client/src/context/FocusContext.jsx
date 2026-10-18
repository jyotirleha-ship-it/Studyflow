import React, { createContext, useContext } from 'react';
import { useFocusTracker } from '../hooks/useFocusTracker.js';

const FocusContext = createContext(null);

export const FocusProvider = ({ children }) => {
  const focusTracker = useFocusTracker();

  return (
    <FocusContext.Provider value={focusTracker}>
      {children}
    </FocusContext.Provider>
  );
};

export const useGlobalFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useGlobalFocus must be used within a FocusProvider');
  }
  return context;
};

export default FocusContext;
