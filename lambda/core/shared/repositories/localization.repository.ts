/**
 * Localization Repository
 * Репозиторий для работы с переводами в DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand,
  BatchWriteCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { 
  Translation, 
  SupportedLocale, 
  TranslationCache,
  LocalizationStats
} from '../types/localization';

export class LocalizationRepository {
  private client: DynamoDBDocumentClient;
  private translationsTable: string;
  private cacheTable: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.translationsTable = process.env.TRANSLATIONS_TABLE || 'translations';
    this.cacheTable = process.env.TRANSLATION_CACHE_TABLE || 'translation-cache';
  }

  /**
   * Получить перевод по ключу и локали
   */
  async getTranslation(key: string, locale: SupportedLocale): Promise<Translation | null> {
    try {
      const response = await this.client.send(new GetCommand({
        TableName: this.translationsTable,
        Key: {
          pk: `TRANSLATION#${key}`,
          sk: `LOCALE#${locale}`
        }
      }));

      if (!response.Item) return null;

      return {
        id: response.Item.id,
        key: response.Item.key,
        locale: response.Item.locale,
        value: response.Item.value,
        category: response.Item.category,
        description: response.Item.description,
        variables: response.Item.variables || [],
        pluralForms: response.Item.pluralForms,
        createdAt: response.Item.createdAt,
        updatedAt: response.Item.updatedAt
      };
    } catch (error) {
      console.error('Error getting translation:', error);
      return null;
    }
  }

  /**
   * Получить переводы по нескольким ключам
   */
  async getTranslationsByKeys(
    keys: string[], 
    locale: SupportedLocale
  ): Promise<Record<string, Translation>> {
    const result: Record<string, Translation> = {};
    
    try {
      // DynamoDB BatchGet ограничен 100 элементами
      const chunks = this.chunkArray(keys, 100);
      
      for (const chunk of chunks) {
        const requestItems = chunk.map(key => ({
          pk: `TRANSLATION#${key}`,
          sk: `LOCALE#${locale}`
        }));

        const response = await this.client.send(new QueryCommand({
          TableName: this.translationsTable,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
          ExpressionAttributeValues: {
            ':pk': `TRANSLATION#${chunk[0]}`,
            ':sk': `LOCALE#${locale}`
          }
        }));

        if (response.Items) {
          for (const item of response.Items) {
            result[item.key] = {
              id: item.id,
              key: item.key,
              locale: item.locale,
              value: item.value,
              category: item.category,
              description: item.description,
              variables: item.variables || [],
              pluralForms: item.pluralForms,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            };
          }
        }
      }
    } catch (error) {
      console.error('Error getting translations by keys:', error);
    }

    return result;
  }

  /**
   * Сохранить перевод
   */
  async saveTranslation(translation: Translation): Promise<Translation> {
    try {
      const item = {
        pk: `TRANSLATION#${translation.key}`,
        sk: `LOCALE#${translation.locale}`,
        id: translation.id,
        key: translation.key,
        locale: translation.locale,
        value: translation.value,
        category: translation.category || 'general',
        description: translation.description,
        variables: translation.variables || [],
        pluralForms: translation.pluralForms,
        createdAt: translation.createdAt,
        updatedAt: new Date().toISOString(),
        gsi1pk: `LOCALE#${translation.locale}`,
        gsi1sk: `CATEGORY#${translation.category || 'general'}#${translation.key}`
      };

      await this.client.send(new PutCommand({
        TableName: this.translationsTable,
        Item: item
      }));

      return {
        ...translation,
        updatedAt: item.updatedAt
      };
    } catch (error) {
      console.error('Error saving translation:', error);
      throw error;
    }
  }

  /**
   * Сохранить несколько переводов
   */
  async saveTranslations(translations: Translation[]): Promise<void> {
    try {
      // DynamoDB BatchWrite ограничен 25 элементами
      const chunks = this.chunkArray(translations, 25);
      
      for (const chunk of chunks) {
        const writeRequests = chunk.map(translation => ({
          PutRequest: {
            Item: {
              pk: `TRANSLATION#${translation.key}`,
              sk: `LOCALE#${translation.locale}`,
              id: translation.id,
              key: translation.key,
              locale: translation.locale,
              value: translation.value,
              category: translation.category || 'general',
              description: translation.description,
              variables: translation.variables || [],
              pluralForms: translation.pluralForms,
              createdAt: translation.createdAt,
              updatedAt: new Date().toISOString(),
              gsi1pk: `LOCALE#${translation.locale}`,
              gsi1sk: `CATEGORY#${translation.category || 'general'}#${translation.key}`
            }
          }
        }));

        await this.client.send(new BatchWriteCommand({
          RequestItems: {
            [this.translationsTable]: writeRequests
          }
        }));
      }
    } catch (error) {
      console.error('Error saving translations:', error);
      throw error;
    }
  }

  /**
   * Удалить перевод
   */
  async deleteTranslation(key: string, locale: SupportedLocale): Promise<void> {
    try {
      await this.client.send(new DeleteCommand({
        TableName: this.translationsTable,
        Key: {
          pk: `TRANSLATION#${key}`,
          sk: `LOCALE#${locale}`
        }
      }));
    } catch (error) {
      console.error('Error deleting translation:', error);
      throw error;
    }
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
    try {
      const params: any = {
        TableName: this.translationsTable,
        FilterExpression: 'contains(#value, :query) OR contains(#key, :query)',
        ExpressionAttributeNames: {
          '#value': 'value',
          '#key': 'key'
        },
        ExpressionAttributeValues: {
          ':query': query.toLowerCase()
        },
        Limit: limit
      };

      if (locale) {
        params.FilterExpression += ' AND locale = :locale';
        params.ExpressionAttributeValues[':locale'] = locale;
      }

      if (category) {
        params.FilterExpression += ' AND category = :category';
        params.ExpressionAttributeValues[':category'] = category;
      }

      const response = await this.client.send(new ScanCommand(params));
      
      return (response.Items || []).map(item => ({
        id: item.id,
        key: item.key,
        locale: item.locale,
        value: item.value,
        category: item.category,
        description: item.description,
        variables: item.variables || [],
        pluralForms: item.pluralForms,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error('Error searching translations:', error);
      return [];
    }
  }

  /**
   * Получить переводы по категории
   */
  async getTranslationsByCategory(
    category: string,
    locale?: SupportedLocale,
    limit?: number
  ): Promise<Translation[]> {
    try {
      const params: any = {
        TableName: this.translationsTable,
        IndexName: 'GSI1',
        KeyConditionExpression: locale 
          ? 'gsi1pk = :locale AND begins_with(gsi1sk, :category)'
          : 'begins_with(gsi1sk, :category)',
        ExpressionAttributeValues: locale 
          ? {
              ':locale': `LOCALE#${locale}`,
              ':category': `CATEGORY#${category}#`
            }
          : {
              ':category': `CATEGORY#${category}#`
            }
      };

      if (limit) {
        params.Limit = limit;
      }

      const response = await this.client.send(new QueryCommand(params));
      
      return (response.Items || []).map(item => ({
        id: item.id,
        key: item.key,
        locale: item.locale,
        value: item.value,
        category: item.category,
        description: item.description,
        variables: item.variables || [],
        pluralForms: item.pluralForms,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error('Error getting translations by category:', error);
      return [];
    }
  }

  /**
   * Получить переводы по локали
   */
  async getTranslationsByLocale(
    locale: SupportedLocale,
    category?: string
  ): Promise<Translation[]> {
    try {
      const params: any = {
        TableName: this.translationsTable,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :locale',
        ExpressionAttributeValues: {
          ':locale': `LOCALE#${locale}`
        }
      };

      if (category) {
        params.KeyConditionExpression += ' AND begins_with(gsi1sk, :category)';
        params.ExpressionAttributeValues[':category'] = `CATEGORY#${category}#`;
      }

      const response = await this.client.send(new QueryCommand(params));
      
      return (response.Items || []).map(item => ({
        id: item.id,
        key: item.key,
        locale: item.locale,
        value: item.value,
        category: item.category,
        description: item.description,
        variables: item.variables || [],
        pluralForms: item.pluralForms,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error('Error getting translations by locale:', error);
      return [];
    }
  }

  /**
   * Получить статистику локализации
   */
  async getLocalizationStats(): Promise<LocalizationStats> {
    try {
      const response = await this.client.send(new ScanCommand({
        TableName: this.translationsTable,
        Select: 'ALL_ATTRIBUTES'
      }));

      const items = response.Items || [];
      const totalTranslations = items.length;
      const byLocale: Record<SupportedLocale, number> = { en: 0, ru: 0, ky: 0 };
      const byCategory: Record<string, number> = {};
      const keysByLocale: Record<SupportedLocale, Set<string>> = { 
        en: new Set(), 
        ru: new Set(), 
        ky: new Set() 
      };

      for (const item of items) {
        const locale = item.locale as SupportedLocale;
        const category = item.category || 'general';
        
        byLocale[locale]++;
        byCategory[category] = (byCategory[category] || 0) + 1;
        keysByLocale[locale].add(item.key);
      }

      // Вычисляем полноту переводов
      const allKeys = new Set<string>();
      Object.values(keysByLocale).forEach(keys => {
        keys.forEach(key => allKeys.add(key));
      });

      const completeness: Record<SupportedLocale, number> = {
        en: allKeys.size > 0 ? (keysByLocale.en.size / allKeys.size) * 100 : 0,
        ru: allKeys.size > 0 ? (keysByLocale.ru.size / allKeys.size) * 100 : 0,
        ky: allKeys.size > 0 ? (keysByLocale.ky.size / allKeys.size) * 100 : 0
      };

      return {
        totalTranslations,
        byLocale,
        byCategory,
        completeness,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting localization stats:', error);
      return {
        totalTranslations: 0,
        byLocale: { en: 0, ru: 0, ky: 0 },
        byCategory: {},
        completeness: { en: 0, ru: 0, ky: 0 },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Сохранить кэш переводов
   */
  async saveTranslationCache(cache: TranslationCache): Promise<void> {
    try {
      await this.client.send(new PutCommand({
        TableName: this.cacheTable,
        Item: {
          pk: `CACHE#${cache.locale}`,
          sk: 'TRANSLATIONS',
          locale: cache.locale,
          translations: cache.translations,
          lastUpdated: cache.lastUpdated,
          ttl: Math.floor(Date.now() / 1000) + (cache.ttl / 1000) // TTL в секундах
        }
      }));
    } catch (error) {
      console.error('Error saving translation cache:', error);
    }
  }

  /**
   * Получить кэш переводов
   */
  async getTranslationCache(locale: SupportedLocale): Promise<TranslationCache | null> {
    try {
      const response = await this.client.send(new GetCommand({
        TableName: this.cacheTable,
        Key: {
          pk: `CACHE#${locale}`,
          sk: 'TRANSLATIONS'
        }
      }));

      if (!response.Item) return null;

      return {
        locale: response.Item.locale,
        translations: response.Item.translations,
        lastUpdated: response.Item.lastUpdated,
        ttl: response.Item.ttl * 1000 // Конвертируем обратно в миллисекунды
      };
    } catch (error) {
      console.error('Error getting translation cache:', error);
      return null;
    }
  }

  /**
   * Разбить массив на чанки
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}