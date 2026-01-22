// Localization service

import en from './locales/en.json';
import ru from './locales/ru.json';

const locales: Record<string, Record<string, string>> = {
  en,
  ru,
};

export function translate(key: string, locale = 'en'): string {
  const translations = locales[locale] || locales.en;
  return translations[key] || key;
}

export function formatDate(date: Date, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatCurrency(amount: number, locale = 'en'): string {
  const currency = locale === 'ru' ? 'RUB' : 'USD';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale).format(num);
}
