/**
 * Import Translations
 * Импорт переводов из JSON
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LocalizationService } from '../shared/services/localization.service';
import { isSupportedLocale } from '../shared/utils/localization';

const localizationService = new LocalizationService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Request body is required'
        })
      };
    }

    const body = JSON.parse(event.body);
    const { locale, translations, category, overwrite } = body;

    // Валидация обязательных полей
    if (!locale || !translations) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Locale and translations are required'
        })
      };
    }

    if (!isSupportedLocale(locale)) {
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

    if (typeof translations !== 'object' || Array.isArray(translations)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Translations must be an object with key-value pairs'
        })
      };
    }

    const result = await localizationService.importTranslations(
      locale,
      translations,
      category || 'general',
      overwrite || false
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Translations imported successfully',
        result
      })
    };

  } catch (error) {
    console.error('Error importing translations:', error);
    
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