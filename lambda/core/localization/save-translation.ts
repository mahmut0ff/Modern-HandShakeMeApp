/**
 * Save Translation
 * Сохранить перевод
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LocalizationService } from '../shared/services/localization.service';
import { Translation } from '../shared/types/localization';
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
    const { key, locale, value, category, description, pluralForms } = body;

    // Валидация обязательных полей
    if (!key || !locale || !value) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Key, locale, and value are required'
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

    const translation: Translation = {
      id: `${locale}_${key}_${Date.now()}`,
      key,
      locale,
      value,
      category: category || 'general',
      description,
      pluralForms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedTranslation = await localizationService.saveTranslation(translation);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Translation saved successfully',
        translation: savedTranslation
      })
    };

  } catch (error) {
    console.error('Error saving translation:', error);
    
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