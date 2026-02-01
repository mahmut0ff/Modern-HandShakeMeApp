/**
 * Get Localization Stats
 * Получить статистику локализации
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LocalizationService } from '../shared/services/localization.service';

const localizationService = new LocalizationService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const stats = await localizationService.getStats();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60' // 1 минута кэша
      },
      body: JSON.stringify(stats)
    };

  } catch (error) {
    console.error('Error getting localization stats:', error);
    
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