/**
 * Localization Middleware
 * Middleware для автоматического определения локали
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { SupportedLocale } from '../types/localization';
import { isSupportedLocale, getDefaultLocale } from '../utils/localization';

export interface LocalizedEvent extends APIGatewayProxyEvent {
  locale: SupportedLocale;
  localizationContext: {
    detectedLocale: SupportedLocale;
    source: 'header' | 'query' | 'cookie' | 'default';
    fallbackLocale: SupportedLocale;
  };
}

/**
 * Определить локаль из различных источников
 */
export function detectLocale(event: APIGatewayProxyEvent): {
  locale: SupportedLocale;
  source: 'header' | 'query' | 'cookie' | 'default';
} {
  // 1. Проверяем query параметры
  const queryLocale = event.queryStringParameters?.locale;
  if (queryLocale && isSupportedLocale(queryLocale)) {
    return { locale: queryLocale, source: 'query' };
  }

  // 2. Проверяем заголовок Accept-Language
  const acceptLanguage = event.headers['Accept-Language'] || event.headers['accept-language'];
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().split('-')[0])
      .filter(lang => isSupportedLocale(lang));
    
    if (languages.length > 0) {
      return { locale: languages[0] as SupportedLocale, source: 'header' };
    }
  }

  // 3. Проверяем cookies
  const cookies = parseCookies(event.headers.Cookie || event.headers.cookie || '');
  const cookieLocale = cookies.locale;
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return { locale: cookieLocale, source: 'cookie' };
  }

  // 4. Используем локаль по умолчанию
  return { locale: getDefaultLocale(), source: 'default' };
}

/**
 * Middleware для добавления локализации к событию
 */
export function withLocalization<T extends APIGatewayProxyEvent>(
  handler: (event: LocalizedEvent) => Promise<any>
) {
  return async (event: T) => {
    const { locale, source } = detectLocale(event);
    const fallbackLocale = getFallbackLocale(locale);

    const localizedEvent: LocalizedEvent = {
      ...event,
      locale,
      localizationContext: {
        detectedLocale: locale,
        source,
        fallbackLocale
      }
    };

    return handler(localizedEvent);
  };
}

/**
 * Получить fallback локаль
 */
function getFallbackLocale(locale: SupportedLocale): SupportedLocale {
  if (locale === 'ky') return 'ru';
  if (locale === 'ru') return 'en';
  return 'en';
}

/**
 * Парсить cookies из строки
 */
function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (!cookieString) return cookies;
  
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  
  return cookies;
}

/**
 * Создать заголовки ответа с информацией о локали
 */
export function createLocalizedHeaders(
  locale: SupportedLocale,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept-Language',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Language': locale,
    'Vary': 'Accept-Language',
    ...additionalHeaders
  };
}

/**
 * Создать cookie для сохранения локали
 */
export function createLocaleCookie(
  locale: SupportedLocale,
  maxAge: number = 365 * 24 * 60 * 60 // 1 год
): string {
  return `locale=${locale}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

/**
 * Валидировать и нормализовать локаль
 */
export function validateAndNormalizeLocale(locale?: string): SupportedLocale {
  if (!locale) return getDefaultLocale();
  
  const normalizedLocale = locale.toLowerCase().split('-')[0];
  
  if (isSupportedLocale(normalizedLocale)) {
    return normalizedLocale;
  }
  
  return getDefaultLocale();
}

/**
 * Получить предпочтительную локаль пользователя
 */
export function getUserPreferredLocale(
  event: APIGatewayProxyEvent,
  userId?: string
): SupportedLocale {
  // В будущем можно добавить получение предпочтений из базы данных
  // const userPreferences = await getUserPreferences(userId);
  // if (userPreferences?.locale) return userPreferences.locale;
  
  return detectLocale(event).locale;
}

/**
 * Создать контекст локализации для логирования
 */
export function createLocalizationContext(event: LocalizedEvent) {
  return {
    locale: event.locale,
    detectedFrom: event.localizationContext.source,
    fallbackLocale: event.localizationContext.fallbackLocale,
    acceptLanguage: event.headers['Accept-Language'] || event.headers['accept-language'],
    userAgent: event.headers['User-Agent'] || event.headers['user-agent']
  };
}