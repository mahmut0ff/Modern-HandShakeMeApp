/**
 * Delete Translation
 * Удалить перевод
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LocalizationService } from '../shared/services/localization.service';
import { isSupportedLocale } from '../shared/utils/localization';

const localizationService = new LocalizationService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { key, locale } = event.pathParameters || {};

    if (!key || !locale) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Key and locale are required'
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

    await localizationService.deleteTranslation(key, locale);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Translation deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error deleting translation:', error);
    
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