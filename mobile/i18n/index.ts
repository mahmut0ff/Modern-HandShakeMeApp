import { I18n } from 'i18n-js'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Import translations
import ru from './locales/ru.json'
import en from './locales/en.json'
import ky from './locales/ky.json'

// Create i18n instance
const i18n = new I18n({
  ru,
  en,
  ky,
})

// Set default locale
i18n.defaultLocale = 'ru'
i18n.locale = 'ru'
i18n.enableFallback = true

// Storage key for saved locale
const LOCALE_STORAGE_KEY = 'user_locale'

/**
 * Initialize i18n with saved or device locale
 */
export const initializeI18n = async (): Promise<void> => {
  try {
    // Try to get saved locale from storage
    const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY)
    
    if (savedLocale && i18n.translations[savedLocale]) {
      i18n.locale = savedLocale
    } else {
      // Use device locale as fallback
      const deviceLocale = Localization.locale
      
      if (deviceLocale && typeof deviceLocale === 'string') {
        const languageCode = deviceLocale.split('-')[0] // Get language code only
        
        if (i18n.translations[languageCode]) {
          i18n.locale = languageCode
        } else {
          i18n.locale = 'ru' // Default to Russian
        }
      } else {
        i18n.locale = 'ru' // Default to Russian if no device locale
      }
    }
    
    console.log('i18n initialized with locale:', i18n.locale)
  } catch (error) {
    console.error('Failed to initialize i18n:', error)
    i18n.locale = 'ru' // Fallback to Russian
  }
}

/**
 * Change app locale and save to storage
 */
export const changeLocale = async (locale: string): Promise<void> => {
  try {
    if (i18n.translations[locale]) {
      i18n.locale = locale
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale)
      console.log('Locale changed to:', locale)
    } else {
      console.warn('Locale not supported:', locale)
    }
  } catch (error) {
    console.error('Failed to change locale:', error)
  }
}

/**
 * Get current locale
 */
export const getCurrentLocale = (): string => {
  return i18n.locale
}

/**
 * Get available locales
 */
export const getAvailableLocales = (): string[] => {
  return Object.keys(i18n.translations)
}

/**
 * Translate function
 */
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options)
}

export default i18n