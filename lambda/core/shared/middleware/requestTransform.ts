import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { badRequest } from '../utils/response';
import { logger } from '../utils/logger';

export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

export function withRequestTransform(handler: LambdaHandler): LambdaHandler {
  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    // Log incoming request
    logger.info('Incoming request', {
      path: event.path,
      httpMethod: event.httpMethod,
      queryStringParameters: event.queryStringParameters,
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type'],
        'user-agent': event.headers['user-agent'] || event.headers['User-Agent']
      }
    });

    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: ''
      };
    }

    // Validate JSON body for POST/PUT requests
    if ((event.httpMethod === 'POST' || event.httpMethod === 'PUT') && event.body) {
      try {
        JSON.parse(event.body);
      } catch (error: any) {
        logger.warn('Invalid JSON in request body', { error: error.message });
        return badRequest('Invalid JSON in request body');
      }
    }

    // Transform query parameters to handle common cases
    if (event.queryStringParameters) {
      // Convert string booleans to actual booleans
      const transformedParams: { [key: string]: any } = {};
      
      for (const [key, value] of Object.entries(event.queryStringParameters)) {
        if (value === 'true') {
          transformedParams[key] = true;
        } else if (value === 'false') {
          transformedParams[key] = false;
        } else if (!isNaN(Number(value)) && value !== '') {
          transformedParams[key] = Number(value);
        } else {
          transformedParams[key] = value;
        }
      }
      
      event.queryStringParameters = transformedParams;
    }

    return await handler(event, context);
  };
}