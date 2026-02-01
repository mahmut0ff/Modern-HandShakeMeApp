// Localization service - Simple interface for basic translations

import { LocalizationService } from '../shared/services/localization.service';
import { SupportedLocale } from '../shared/types/localization';
import { isSupportedLocale, getDefaultLocale } from '../shared/utils/localization';

// Создаем единственный экземпляр сервиса
const localizationService = new LocalizationService();

// Кэш для простых переводов
const simpleTranslationsCache = new Map<string, Record<string, string>>();

/**
 * Простая функция перевода для обратной совместимости
 */
export async function translate(key: string, locale: string = 'ru'): Promise<string> {
  const normalizedLocale = isSupportedLocale(locale) ? locale : getDefaultLocale();
  
  try {
    const response = await localizationService.translate({
      key,
      locale: normalizedLocale
    });
    
    return response.value;
  } catch (error) {
    console.error('Translation error:', error);
    return key; // Fallback на ключ
  }
}

/**
 * Синхронная функция перевода из кэша
 */
export function translateSync(key: string, locale: string = 'ru'): string {
  const normalizedLocale = isSupportedLocale(locale) ? locale : getDefaultLocale();
  const cacheKey = `translations_${normalizedLocale}`;
  const translations = simpleTranslationsCache.get(cacheKey);
  
  if (translations && translations[key]) {
    return translations[key];
  }
  
  return key; // Fallback на ключ
}

/**
 * Предварительная загрузка переводов в кэш
 */
export async function preloadTranslations(locale: SupportedLocale): Promise<void> {
  try {
    const translations = await localizationService.exportTranslations(locale);
    const cacheKey = `translations_${locale}`;
    simpleTranslationsCache.set(cacheKey, translations);
  } catch (error) {
    console.error('Error preloading translations:', error);
  }
}

/**
 * Форматировать дату с учетом локали
 */
export function formatDate(date: Date, locale: string = 'ru'): string {
  const normalizedLocale = isSupportedLocale(locale) ? locale : getDefaultLocale();
  
  try {
    return new Intl.DateTimeFormat(normalizedLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Форматировать валюту с учетом локали
 */
export function formatCurrency(amount: number, locale: string = 'ru'): string {
  const normalizedLocale = isSupportedLocale(locale) ? locale : getDefaultLocale();
  
  try {
    // Для Кыргызстана используем сомы
    const currency = normalizedLocale === 'en' ? 'USD' : 'KGS';
    
    return new Intl.NumberFormat(normalizedLocale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${amount} ${normalizedLocale === 'en' ? 'USD' : 'сом'}`;
  }
}

/**
 * Форматировать число с учетом локали
 */
export function formatNumber(num: number, locale: string = 'ru'): string {
  const normalizedLocale = isSupportedLocale(locale) ? locale : getDefaultLocale();
  
  try {
    return new Intl.NumberFormat(normalizedLocale).format(num);
  } catch (error) {
    console.error('Number formatting error:', error);
    return num.toString();
  }
}

/**
 * Получить доступ к полному сервису локализации
 */
export function getLocalizationService(): LocalizationService {
  return localizationService;
}

// Экспортируем типы для удобства
export type { SupportedLocale } from '../shared/types/localization';
