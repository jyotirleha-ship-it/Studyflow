import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setTheme, toggleTheme } from '../redux/slices/themeSlice.js';

export const useTheme = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.mode);

  const switchTheme = useCallback((mode) => {
    dispatch(setTheme(mode));
  }, [dispatch]);

  const toggle = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  return { theme, switchTheme, toggleTheme: toggle };
};
