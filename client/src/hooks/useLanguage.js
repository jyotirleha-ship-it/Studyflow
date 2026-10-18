import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setLanguage } from '../redux/slices/languageSlice.js';
import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const currentLanguage = useSelector((state) => state.language.currentLanguage);

  const changeLang = useCallback((langCode) => {
    dispatch(setLanguage(langCode));
    i18n.changeLanguage(langCode);
  }, [dispatch, i18n]);

  return { currentLanguage, changeLang };
};
