/**
 * useTranslation Hook
 * React hook for accessing translations in components
 */

import { useState, useEffect } from 'react';
import { t, getCurrentLanguage, changeLanguage, getAvailableLanguages } from '../i18n';

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    // Update when language changes
    const interval = setInterval(() => {
      const lang = getCurrentLanguage();
      if (lang !== currentLanguage) {
        setCurrentLanguage(lang);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentLanguage]);

  const switchLanguage = async (language: string) => {
    await changeLanguage(language);
    setCurrentLanguage(language);
  };

  return {
    t,
    currentLanguage,
    switchLanguage,
    availableLanguages: getAvailableLanguages(),
  };
};

export default useTranslation;
