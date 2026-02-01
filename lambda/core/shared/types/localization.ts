/**
 * Localization Types
 * Типы для системы локализации
 */

export type SupportedLocale = 'en' | 'ru' | 'ky';

export interface Translation {
  id: string;
  key: string;
  locale: SupportedLocale;
  value: string;
  category?: string;
  description?: string;
  variables?: string[]; // Список переменных в переводе
  pluralForms?: PluralForms;
  createdAt: string;
  updatedAt: string;
}

export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export interface TranslationRequest {
  key: string;
  locale?: SupportedLocale;
  variables?: Record<string, string | number>;
  count?: number; // Для плюрализации
  fallbackLocale?: SupportedLocale;
}

export interface TranslationResponse {
  key: string;
  locale: SupportedLocale;
  value: string;
  variables?: Record<string, string | number>;
  cached: boolean;
}

export interface BulkTranslationRequest {
  keys: string[];
  locale?: SupportedLocale;
  variables?: Record<string, Record<string, string | number>>;
  fallbackLocale?: SupportedLocale;
}

export interface BulkTranslationResponse {
  locale: SupportedLocale;
  translations: Record<string, string>;
  missing: string[];
  cached: boolean;
}

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
  pluralRules: PluralRule[];
}

export interface PluralRule {
  condition: string;
  form: keyof PluralForms;
}

export interface CurrencyFormat {
  locale: SupportedLocale;
  currency: string;
  symbol: string;
  position: 'before' | 'after';
  space: boolean;
}

export interface DateTimeFormat {
  locale: SupportedLocale;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  timezone: string;
}

export interface NumberFormat {
  locale: SupportedLocale;
  decimal: string;
  thousands: string;
  precision: number;
}

export interface TranslationCache {
  locale: SupportedLocale;
  translations: Record<string, string>;
  lastUpdated: string;
  ttl: number;
}

export interface LocalizationStats {
  totalTranslations: number;
  byLocale: Record<SupportedLocale, number>;
  byCategory: Record<string, number>;
  completeness: Record<SupportedLocale, number>; // Процент переведенных ключей
  lastUpdated: string;
}

export interface TranslationImport {
  locale: SupportedLocale;
  translations: Record<string, string | PluralForms>;
  category?: string;
  overwrite?: boolean;
}

export interface TranslationExport {
  locale: SupportedLocale;
  format: 'json' | 'csv' | 'xlsx';
  category?: string;
  includeEmpty?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  key: string;
  locale: SupportedLocale;
  type: 'missing_variable' | 'invalid_syntax' | 'empty_value' | 'duplicate_key';
  message: string;
}

export interface ValidationWarning {
  key: string;
  locale: SupportedLocale;
  type: 'unused_variable' | 'long_text' | 'missing_plural';
  message: string;
}