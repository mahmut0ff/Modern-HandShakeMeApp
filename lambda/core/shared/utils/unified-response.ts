/**
 * Unified response formatting for consistent API responses
 * Ensures all endpoints return the same format for mobile app compatibility
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { transformToSnakeCase } from './transform';
import { convertEnumsToLowercase } from './enum-converter';

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    page_size: number;
    total_pages: number;
    count: number;
    next: string | null;
    previous: string | null;
  };
  timestamp: string;
}

export interface ResponseOptions {
  skipTransform?: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
}

function createUnifiedResponse(
  statusCode: number,
  response: StandardResponse,
  options: ResponseOptions = {}
): APIGatewayProxyResult {
  const { skipTransform = false, headers = {} } = options;
  
  // Add timestamp
  response.timestamp = new Date().toISOString();
  
  // Transform to snake_case for mobile compatibility
  let transformedResponse = response;
  if (!skipTransform) {
    transformedResponse = convertEnumsToLowercase(response);
    transformedResponse = transformToSnakeCase(transformedResponse);
  }
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(transformedResponse)
  };
}

// Success responses
export function successResponse<T>(
  data: T,
  options: ResponseOptions = {}
): APIGatewayProxyResult {
  return createUnifiedResponse(
    options.statusCode || 200,
    {
      success: true,
      data
    },
    options
  );
}

export function createdResponse<T>(
  data: T,
  options: ResponseOptions = {}
): APIGatewayProxyResult {
  return createUnifiedResponse(
    201,
    {
      success: true,
      data
    },
    options
  );
}

export function paginatedResponse<T>(
  results: T[],
  count: number,
  page: number,
  pageSize: number,
  options: ResponseOptions = {}
): APIGatewayProxyResult {
  const totalPages = Math.ceil(count / pageSize);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;
  
  return createUnifiedResponse(
    options.statusCode || 200,
    {
      success: true,
      data: results,
      pagination: {
        page,
        page_size: pageSize,
        total_pages: totalPages,
        count,
        next: hasNext ? `?page=${page + 1}&page_size=${pageSize}` : null,
        previous: hasPrevious ? `?page=${page - 1}&page_size=${pageSize}` : null,
      }
    },
    options
  );
}

// Error responses
export function errorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: any,
  options: ResponseOptions = {}
): APIGatewayProxyResult {
  return createUnifiedResponse(
    statusCode,
    {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    { ...options, skipTransform: true } // Error responses don't need transformation
  );
}

// Standard error responses
export function badRequestResponse(
  message: string = 'Bad Request',
  details?: any
): APIGatewayProxyResult {
  return errorResponse('BAD_REQUEST', message, 400, details);
}

export function unauthorizedResponse(
  message: string = 'Unauthorized'
): APIGatewayProxyResult {
  return errorResponse('UNAUTHORIZED', message, 401);
}

export function forbiddenResponse(
  message: string = 'Forbidden'
): APIGatewayProxyResult {
  return errorResponse('FORBIDDEN', message, 403);
}

export function notFoundResponse(
  message: string = 'Resource not found'
): APIGatewayProxyResult {
  return errorResponse('NOT_FOUND', message, 404);
}

export function conflictResponse(
  message: string = 'Resource conflict',
  details?: any
): APIGatewayProxyResult {
  return errorResponse('CONFLICT', message, 409, details);
}

export function validationErrorResponse(
  message: string = 'Validation failed',
  details?: any
): APIGatewayProxyResult {
  return errorResponse('VALIDATION_ERROR', message, 400, details);
}

export function tooManyRequestsResponse(
  message: string = 'Too many requests'
): APIGatewayProxyResult {
  return errorResponse('TOO_MANY_REQUESTS', message, 429);
}

export function internalServerErrorResponse(
  message: string = 'Internal server error'
): APIGatewayProxyResult {
  return errorResponse('INTERNAL_SERVER_ERROR', message, 500);
}

// Utility function to handle common error types
export function handleCommonErrors(error: any): APIGatewayProxyResult | null {
  if (error.name === 'ZodError') {
    return validationErrorResponse('Validation failed', error.errors);
  }
  
  if (error.message.includes('token') || error.message.includes('Unauthorized')) {
    return unauthorizedResponse(error.message);
  }
  
  if (error.message.includes('not found') || error.message.includes('Not found')) {
    return notFoundResponse(error.message);
  }
  
  if (error.message.includes('already exists') || error.message.includes('conflict')) {
    return conflictResponse(error.message);
  }
  
  if (error.message.includes('insufficient') || error.message.includes('Insufficient')) {
    return badRequestResponse(error.message);
  }
  
  return null;
}