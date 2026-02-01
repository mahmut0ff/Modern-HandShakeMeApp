/**
 * useTranslation Hook
 * React hook for accessing translations in components
 */

import { useState, useEffect } from 'react';
import { t, getCurrentLocale, changeLocale, getAvailableLocales } from '../i18n';

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLocale());

  useEffect(() => {
    // Update when language changes
    const interval = setInterval(() => {
      const lang = getCurrentLocale();
      if (lang !== currentLanguage) {
        setCurrentLanguage(lang);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentLanguage]);

  const switchLanguage = async (language: string) => {
    await changeLocale(language);
    setCurrentLanguage(language);
  };

  return {
    t,
    currentLanguage,
    switchLanguage,
    availableLanguages: getAvailableLocales(),
  };
};

export default useTranslation;
