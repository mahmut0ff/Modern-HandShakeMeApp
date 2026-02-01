import type { APIGatewayProxyResult } from 'aws-lambda';

export function success<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data
    })
  };
}

export function error(message: string, statusCode = 500, details?: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        details
      }
    })
  };
}

export function badRequest(message: string, details?: any): APIGatewayProxyResult {
  return error(message, 400, details);
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResult {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden'): APIGatewayProxyResult {
  return error(message, 403);
}

export function notFound(message = 'Not found'): APIGatewayProxyResult {
  return error(message, 404);
}

export function conflict(message: string, details?: any): APIGatewayProxyResult {
  return error(message, 409, details);
}

export function unprocessableEntity(message: string, details?: any): APIGatewayProxyResult {
  return error(message, 422, details);
}

export function internalServerError(message = 'Internal server error', details?: any): APIGatewayProxyResult {
  return error(message, 500, details);
}