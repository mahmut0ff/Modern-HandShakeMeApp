/**
 * Get Translations
 * Получить переводы
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LocalizationService } from '../shared/services/localization.service';
import { isSupportedLocale } from '../shared/utils/localization';

const localizationService = new LocalizationService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { locale, keys, category } = event.queryStringParameters || {};
    
    // Определяем локаль из заголовков или параметров
    const requestLocale = locale || 
      event.headers['Accept-Language']?.split(',')[0]?.split('-')[0] || 
      'ru';
    
    if (!isSupportedLocale(requestLocale)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Unsupported locale',
          supportedLocales: ['en', 'ru', 'ky']
        })
      };
    }

    let result;

    if (keys) {
      // Получить конкретные ключи
      const keyList = keys.split(',').map(k => k.trim());
      result = await localizationService.translateBulk({
        keys: keyList,
        locale: requestLocale
      });
    } else if (category) {
      // Получить переводы по категории
      const translations = await localizationService.getTranslationsByCategory(
        category,
        requestLocale
      );
      
      const translationsMap: Record<string, string> = {};
      for (const translation of translations) {
        translationsMap[translation.key] = translation.value;
      }
      
      result = {
        locale: requestLocale,
        translations: translationsMap,
        category,
        cached: false
      };
    } else {
      // Получить все переводы для локали
      const translations = await localizationService.exportTranslations(requestLocale);
      
      result = {
        locale: requestLocale,
        translations,
        cached: false
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // 5 минут кэша
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error getting translations:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};