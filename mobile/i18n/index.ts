/**
 * i18n Configuration
 * Internationalization setup for the mobile app
 */

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import ru from './locales/ru.json';
import en from './locales/en.json';
import ky from './locales/ky.json';

// Storage key for language preference
const LANGUAGE_KEY = 'app_language';

// Create i18n instance
const i18n = new I18n({
  ru,
  en,
  ky,
});

// Set default locale
i18n.defaultLocale = 'ru';
i18n.enableFallback = true;

// Initialize with device locale or saved preference
export const initializeI18n = async (): Promise<string> => {
  try {
    // Try to get saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    
    if (savedLanguage) {
      i18n.locale = savedLanguage;
      return savedLanguage;
    }

    // Use device locale
    const deviceLocale = Localization.locale || Localization.locales?.[0] || 'ru-RU';
    const languageCode = typeof deviceLocale === 'string' 
      ? deviceLocale.split('-')[0] 
      : 'ru'; // Get language code (e.g., 'ru' from 'ru-RU')
    
    const supportedLocales = ['ru', 'en', 'ky'];
    
    if (supportedLocales.includes(languageCode)) {
      i18n.locale = languageCode;
    } else {
      i18n.locale = 'ru'; // Default to Russian
    }

    return i18n.locale;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    i18n.locale = 'ru';
    return 'ru';
  }
};

// Change language
export const changeLanguage = async (language: string): Promise<void> => {
  try {
    i18n.locale = language;
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.locale;
};

// Get available languages
export const getAvailableLanguages = () => [
  { code: 'ru', name: 'Русский', nativeName: 'Русский' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча' },
];

// Translation function
export const t = (key: string, options?: Record<string, any>): string => {
  return i18n.t(key, options);
};

// Check if translation exists
export const hasTranslation = (key: string): boolean => {
  return i18n.translations[i18n.locale]?.[key] !== undefined;
};

export default i18n;
