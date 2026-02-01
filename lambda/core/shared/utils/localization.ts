/**
 * Localization Utilities
 * Утилиты для системы локализации
 */

import { 
  SupportedLocale, 
  LocaleInfo, 
  PluralForms, 
  CurrencyFormat,
  DateTimeFormat,
  NumberFormat
} from '../types/localization';

// Информация о поддерживаемых локалях
export const LOCALE_INFO: Record<SupportedLocale, LocaleInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ','
    },
    pluralRules: [
      { condition: 'n === 1', form: 'one' },
      { condition: 'true', form: 'other' }
    ]
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    currency: 'KGS', // Кыргызстан использует сомы
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: ' '
    },
    pluralRules: [
      { condition: 'n % 10 === 1 && n % 100 !== 11', form: 'one' },
      { condition: 'n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)', form: 'few' },
      { condition: 'true', form: 'many' }
    ]
  },
  ky: {
    code: 'ky',
    name: 'Kyrgyz',
    nativeName: 'Кыргызча',
    direction: 'ltr',
    currency: 'KGS',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: ' '
    },
    pluralRules: [
      { condition: 'n === 1', form: 'one' },
      { condition: 'true', form: 'other' }
    ]
  }
};

// Форматы валют
export const CURRENCY_FORMATS: Record<SupportedLocale, CurrencyFormat> = {
  en: {
    locale: 'en',
    currency: 'USD',
    symbol: '$',
    position: 'before',
    space: false
  },
  ru: {
    locale: 'ru',
    currency: 'KGS',
    symbol: 'сом',
    position: 'after',
    space: true
  },
  ky: {
    locale: 'ky',
    currency: 'KGS',
    symbol: 'сом',
    position: 'after',
    space: true
  }
};

// Форматы даты и времени
export const DATETIME_FORMATS: Record<SupportedLocale, DateTimeFormat> = {
  en: {
    locale: 'en',
    dateFormat: 'MMMM d, yyyy',
    timeFormat: 'h:mm a',
    dateTimeFormat: 'MMMM d, yyyy h:mm a',
    timezone: 'UTC'
  },
  ru: {
    locale: 'ru',
    dateFormat: 'd MMMM yyyy г.',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'd MMMM yyyy г., HH:mm',
    timezone: 'Asia/Bishkek'
  },
  ky: {
    locale: 'ky',
    dateFormat: 'yyyy-жылдын d-MMMM',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'yyyy-жылдын d-MMMM, HH:mm',
    timezone: 'Asia/Bishkek'
  }
};

/**
 * Проверить поддерживается ли локаль
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return ['en', 'ru', 'ky'].includes(locale);
}

/**
 * Получить локаль по умолчанию
 */
export function getDefaultLocale(): SupportedLocale {
  return 'ru'; // Русский как основной для Кыргызстана
}

/**
 * Получить fallback локаль
 */
export function getFallbackLocale(locale: SupportedLocale): SupportedLocale {
  if (locale === 'ky') return 'ru'; // Кыргызский -> Русский
  if (locale === 'ru') return 'en'; // Русский -> Английский
  return 'en'; // Английский -> Английский
}

/**
 * Интерполяция переменных в строке
 */
export function interpolateVariables(
  text: string, 
  variables: Record<string, string | number> = {}
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Извлечь переменные из строки перевода
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  
  return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
}

/**
 * Получить правильную форму множественного числа
 */
export function getPluralForm(
  count: number, 
  pluralForms: PluralForms, 
  locale: SupportedLocale
): string {
  const n = Math.abs(count);
  
  // Безопасная реализация правил плюрализации без eval
  switch (locale) {
    case 'en':
      if (n === 1) {
        return pluralForms.one || pluralForms.other;
      }
      return pluralForms.other;
      
    case 'ru':
      if (n % 10 === 1 && n % 100 !== 11) {
        return pluralForms.one || pluralForms.other;
      }
      if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
        return pluralForms.few || pluralForms.other;
      }
      return pluralForms.many || pluralForms.other;
      
    case 'ky':
      if (n === 1) {
        return pluralForms.one || pluralForms.other;
      }
      return pluralForms.other;
      
    default:
      return pluralForms.other;
  }
}

/**
 * Форматировать число
 */
export function formatNumber(
  num: number, 
  locale: SupportedLocale,
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    const localeCode = locale === 'ky' ? 'ru-RU' : `${locale}-${locale.toUpperCase()}`;
    return new Intl.NumberFormat(localeCode, options).format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    return num.toString();
  }
}

/**
 * Форматировать валюту
 */
export function formatCurrency(
  amount: number, 
  locale: SupportedLocale
): string {
  const format = CURRENCY_FORMATS[locale];
  const formattedAmount = formatNumber(amount, locale, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  });
  
  if (format.position === 'before') {
    return `${format.symbol}${format.space ? ' ' : ''}${formattedAmount}`;
  } else {
    return `${formattedAmount}${format.space ? ' ' : ''}${format.symbol}`;
  }
}

/**
 * Форматировать дату
 */
export function formatDate(
  date: Date, 
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const localeCode = locale === 'ky' ? 'ru-RU' : `${locale}-${locale.toUpperCase()}`;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: DATETIME_FORMATS[locale].timezone
    };
    
    return new Intl.DateTimeFormat(localeCode, { ...defaultOptions, ...options }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Форматировать время
 */
export function formatTime(
  date: Date, 
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const localeCode = locale === 'ky' ? 'ru-RU' : `${locale}-${locale.toUpperCase()}`;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DATETIME_FORMATS[locale].timezone
    };
    
    return new Intl.DateTimeFormat(localeCode, { ...defaultOptions, ...options }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return date.toTimeString().slice(0, 5);
  }
}

/**
 * Форматировать дату и время
 */
export function formatDateTime(
  date: Date, 
  locale: SupportedLocale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const localeCode = locale === 'ky' ? 'ru-RU' : `${locale}-${locale.toUpperCase()}`;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DATETIME_FORMATS[locale].timezone
    };
    
    return new Intl.DateTimeFormat(localeCode, { ...defaultOptions, ...options }).format(date);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return date.toISOString().replace('T', ' ').slice(0, 16);
  }
}

/**
 * Валидировать перевод
 */
export function validateTranslation(
  key: string,
  value: string,
  variables?: Record<string, string | number>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Проверка пустого значения
  if (!value || value.trim().length === 0) {
    errors.push('Translation value cannot be empty');
  }
  
  // Проверка переменных
  const extractedVars = extractVariables(value);
  const providedVars = variables ? Object.keys(variables) : [];
  
  // Проверка неиспользуемых переменных
  for (const providedVar of providedVars) {
    if (!extractedVars.includes(providedVar)) {
      errors.push(`Unused variable: ${providedVar}`);
    }
  }
  
  // Проверка отсутствующих переменных
  for (const extractedVar of extractedVars) {
    if (!providedVars.includes(extractedVar)) {
      errors.push(`Missing variable: ${extractedVar}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Генерировать ключ кэша
 */
export function generateCacheKey(locale: SupportedLocale, category?: string): string {
  return category ? `translations:${locale}:${category}` : `translations:${locale}`;
}

/**
 * Нормализовать ключ перевода
 */
export function normalizeTranslationKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
}

/**
 * Получить относительное время
 */
export function getRelativeTime(
  date: Date, 
  locale: SupportedLocale,
  baseDate: Date = new Date()
): string {
  try {
    const localeCode = locale === 'ky' ? 'ru-RU' : `${locale}-${locale.toUpperCase()}`;
    const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' });
    
    const diffInSeconds = Math.floor((date.getTime() - baseDate.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (Math.abs(diffInDays) >= 1) {
      return rtf.format(diffInDays, 'day');
    } else if (Math.abs(diffInHours) >= 1) {
      return rtf.format(diffInHours, 'hour');
    } else if (Math.abs(diffInMinutes) >= 1) {
      return rtf.format(diffInMinutes, 'minute');
    } else {
      return rtf.format(diffInSeconds, 'second');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return formatDateTime(date, locale);
  }
}