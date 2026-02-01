/**
 * Localization Service
 * Сервис для работы с переводами
 */

import { LocalizationRepository } from '../repositories/localization.repository';
import { 
  Translation, 
  SupportedLocale, 
  TranslationRequest,
  TranslationResponse,
  BulkTranslationRequest,
  BulkTranslationResponse,
  TranslationCache
} from '../types/localization';
import { 
  isSupportedLocale,
  getDefaultLocale,
  getFallbackLocale,
  interpolateVariables,
  getPluralForm,
  extractVariables,
  validateTranslation,
  generateCacheKey
} from '../utils/localization';

export class LocalizationService {
  private repository: LocalizationRepository;
  private cache: Map<string, TranslationCache>;
  private cacheTimeout: number;
  
  constructor() {
    this.repository = new LocalizationRepository();
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 минут
  }
  
  /**
   * Получить перевод
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const locale = this.normalizeLocale(request.locale);
    const fallbackLocale = request.fallbackLocale || getFallbackLocale(locale);
    
    try {
      // Пытаемся получить из кэша
      let translation = await this.getFromCache(request.key, locale);
      let cached = true;
      
      if (!translation) {
        // Получаем из базы данных
        translation = await this.repository.getTranslation(request.key, locale);
        cached = false;
        
        // Если не найден, пытаемся fallback локаль
        if (!translation && locale !== fallbackLocale) {
          translation = await this.repository.getTranslation(request.key, fallbackLocale);
        }
      }
      
      let value = request.key; // Fallback на ключ
      
      if (translation) {
        if (request.count !== undefined && translation.pluralForms) {
          // Плюрализация
          value = getPluralForm(request.count, translation.pluralForms, locale);
        } else {
          value = translation.value;
        }
        
        // Интерполяция переменных
        if (request.variables) {
          value = interpolateVariables(value, request.variables);
        }
      }
      
      return {
        key: request.key,
        locale,
        value,
        variables: request.variables,
        cached
      };
      
    } catch (error) {
      console.error('Translation error:', error);
      
      return {
        key: request.key,
        locale,
        value: request.key,
        variables: request.variables,
        cached: false
      };
    }
  }
  
  /**
   * Получить несколько переводов
   */
  async translateBulk(request: BulkTranslationRequest): Promise<BulkTranslationResponse> {
    const locale = this.normalizeLocale(request.locale);
    const fallbackLocale = request.fallbackLocale || getFallbackLocale(locale);
    
    try {
      // Проверяем кэш
      const cacheKey = generateCacheKey(locale);
      let cachedTranslations = this.cache.get(cacheKey);
      let cached = true;
      
      if (!cachedTranslations || this.isCacheExpired(cachedTranslations)) {
        // Загружаем из базы данных
        const dbTranslations = await this.repository.getTranslationsByKeys(request.keys, locale);
        
        // Если некоторые переводы не найдены, пытаемся fallback
        const missingKeys = request.keys.filter(key => !dbTranslations[key]);
        if (missingKeys.length > 0 && locale !== fallbackLocale) {
          const fallbackTranslations = await this.repository.getTranslationsByKeys(missingKeys, fallbackLocale);
          Object.assign(dbTranslations, fallbackTranslations);
        }
        
        // Создаем кэш
        const translationsMap: Record<string, string> = {};
        for (const [key, translation] of Object.entries(dbTranslations)) {
          translationsMap[key] = translation.value;
        }
        
        cachedTranslations = {
          locale,
          translations: translationsMap,
          lastUpdated: new Date().toISOString(),
          ttl: this.cacheTimeout
        };
        
        this.cache.set(cacheKey, cachedTranslations);
        cached = false;
      }
      
      // Обрабатываем переводы
      const translations: Record<string, string> = {};
      const missing: string[] = [];
      
      for (const key of request.keys) {
        let value = cachedTranslations.translations[key];
        
        if (value) {
          // Интерполяция переменных
          const variables = request.variables?.[key];
          if (variables) {
            value = interpolateVariables(value, variables);
          }
          
          translations[key] = value;
        } else {
          missing.push(key);
          translations[key] = key; // Fallback на ключ
        }
      }
      
      return {
        locale,
        translations,
        missing,
        cached
      };
      
    } catch (error) {
      console.error('Bulk translation error:', error);
      
      // Fallback - возвращаем ключи как переводы
      const translations: Record<string, string> = {};
      for (const key of request.keys) {
        translations[key] = key;
      }
      
      return {
        locale,
        translations,
        missing: request.keys,
        cached: false
      };
    }
  }
  
  /**
   * Сохранить перевод
   */
  async saveTranslation(translation: Translation): Promise<Translation> {
    // Валидация
    const validation = validateTranslation(translation.key, translation.value);
    if (!validation.isValid) {
      throw new Error(`Translation validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Извлекаем переменные
    translation.variables = extractVariables(translation.value);
    
    // Сохраняем в базу данных
    const savedTranslation = await this.repository.saveTranslation(translation);
    
    // Очищаем кэш для этой локали
    this.clearCache(translation.locale);
    
    return savedTranslation;
  }
  
  /**
   * Сохранить несколько переводов
   */
  async saveTranslations(translations: Translation[]): Promise<void> {
    // Валидация всех переводов
    for (const translation of translations) {
      const validation = validateTranslation(translation.key, translation.value);
      if (!validation.isValid) {
        throw new Error(`Translation validation failed for key "${translation.key}": ${validation.errors.join(', ')}`);
      }
      
      // Извлекаем переменные
      translation.variables = extractVariables(translation.value);
    }
    
    // Сохраняем в базу данных
    await this.repository.saveTranslations(translations);
    
    // Очищаем кэш для всех затронутых локалей
    const affectedLocales = new Set(translations.map(t => t.locale));
    for (const locale of affectedLocales) {
      this.clearCache(locale);
    }
  }
  
  /**
   * Удалить перевод
   */
  async deleteTranslation(key: string, locale: SupportedLocale): Promise<void> {
    await this.repository.deleteTranslation(key, locale);
    this.clearCache(locale);
  }
  
  /**
   * Поиск переводов
   */
  async searchTranslations(
    query: string,
    locale?: SupportedLocale,
    category?: string,
    limit: number = 50
  ): Promise<Translation[]> {
    return await this.repository.searchTranslations(query, locale, category, limit);
  }
  
  /**
   * Получить переводы по категории
   */
  async getTranslationsByCategory(
    category: string,
    locale?: SupportedLocale,
    limit?: number
  ): Promise<Translation[]> {
    return await this.repository.getTranslationsByCategory(category, locale, limit);
  }
  
  /**
   * Получить статистику локализации
   */
  async getStats() {
    return await this.repository.getLocalizationStats();
  }
  
  /**
   * Импорт переводов из JSON
   */
  async importTranslations(
    locale: SupportedLocale,
    translations: Record<string, string>,
    category: string = 'general',
    overwrite: boolean = false
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    const translationsToSave: Translation[] = [];
    
    for (const [key, value] of Object.entries(translations)) {
      try {
        // Проверяем существование если не перезаписываем
        if (!overwrite) {
          const existing = await this.repository.getTranslation(key, locale);
          if (existing) {
            results.skipped++;
            continue;
          }
        }
        
        // Валидация
        const validation = validateTranslation(key, value);
        if (!validation.isValid) {
          results.errors.push(`Key "${key}": ${validation.errors.join(', ')}`);
          continue;
        }
        
        const translation: Translation = {
          id: `${locale}_${key}_${Date.now()}`,
          key,
          locale,
          value,
          category,
          variables: extractVariables(value),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        translationsToSave.push(translation);
        results.imported++;
        
      } catch (error) {
        results.errors.push(`Key "${key}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (translationsToSave.length > 0) {
      await this.repository.saveTranslations(translationsToSave);
      this.clearCache(locale);
    }
    
    return results;
  }
  
  /**
   * Экспорт переводов в JSON
   */
  async exportTranslations(
    locale: SupportedLocale,
    category?: string
  ): Promise<Record<string, string>> {
    const translations = await this.repository.getTranslationsByLocale(locale, category);
    
    const result: Record<string, string> = {};
    for (const translation of translations) {
      result[translation.key] = translation.value;
    }
    
    return result;
  }
  
  /**
   * Предварительная загрузка кэша
   */
  async preloadCache(locale: SupportedLocale, category?: string): Promise<void> {
    const translations = await this.repository.getTranslationsByLocale(locale, category);
    
    const translationsMap: Record<string, string> = {};
    for (const translation of translations) {
      translationsMap[translation.key] = translation.value;
    }
    
    const cache: TranslationCache = {
      locale,
      translations: translationsMap,
      lastUpdated: new Date().toISOString(),
      ttl: this.cacheTimeout
    };
    
    const cacheKey = generateCacheKey(locale, category);
    this.cache.set(cacheKey, cache);
    
    // Сохраняем в DynamoDB для персистентности
    await this.repository.saveTranslationCache(cache);
  }
  
  /**
   * Получить из кэша
   */
  private async getFromCache(key: string, locale: SupportedLocale): Promise<Translation | null> {
    const cacheKey = generateCacheKey(locale);
    let cache = this.cache.get(cacheKey);
    
    if (!cache || this.isCacheExpired(cache)) {
      // Пытаемся загрузить из DynamoDB
      const cacheFromDb = await this.repository.getTranslationCache(locale);
      if (cacheFromDb && !this.isCacheExpired(cacheFromDb)) {
        cache = cacheFromDb;
        this.cache.set(cacheKey, cache);
      } else {
        return null;
      }
    }
    
    const value = cache.translations[key];
    if (!value) return null;
    
    return {
      id: `${locale}_${key}`,
      key,
      locale,
      value,
      variables: extractVariables(value),
      createdAt: cache.lastUpdated,
      updatedAt: cache.lastUpdated
    };
  }
  
  /**
   * Проверить истечение кэша
   */
  private isCacheExpired(cache: TranslationCache): boolean {
    const now = Date.now();
    const cacheTime = new Date(cache.lastUpdated).getTime();
    return (now - cacheTime) > cache.ttl;
  }
  
  /**
   * Очистить кэш
   */
  private clearCache(locale: SupportedLocale): void {
    const cacheKey = generateCacheKey(locale);
    this.cache.delete(cacheKey);
  }
  
  /**
   * Нормализовать локаль
   */
  private normalizeLocale(locale?: string): SupportedLocale {
    if (!locale || !isSupportedLocale(locale)) {
      return getDefaultLocale();
    }
    return locale;
  }
}