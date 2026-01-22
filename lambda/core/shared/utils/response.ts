import { transformToSnakeCase } from './transform';
import { convertEnumsToLowercase } from './enum-converter';
import { APIGatewayProxyResult } from 'aws-lambda';

interface ResponseOptions {
  skipTransform?: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
}

export function createResponse(statusCode: number, data: any, headers: Record<string, string> = {}, skipTransform: boolean = false): APIGatewayProxyResult {
  // Transform data to snake_case for mobile app compatibility (unless explicitly skipped)
  let transformedData = data;
  
  if (!skipTransform) {
    // First convert enums to lowercase
    transformedData = convertEnumsToLowercase(data);
    // Then transform keys to snake_case (this also handles Date conversion)
    transformedData = transformToSnakeCase(transformedData);
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
    body: JSON.stringify(transformedData)
  };
}

export function createErrorResponse(statusCode: number, code: string, message: string): APIGatewayProxyResult {
  return createResponse(statusCode, {
    error: code,
    message: message
  });
}

// Standard success response with automatic transformation
// Supports both old signature: success(data, statusCode) and new signature: success(data, options)
export function success(data: any, statusCodeOrOptions?: number | ResponseOptions): APIGatewayProxyResult {
  let statusCode = 200;
  let skipTransform = false;
  let headers = {};
  
  // Handle backward compatibility with old signature: success(data, statusCode)
  if (typeof statusCodeOrOptions === 'number') {
    statusCode = statusCodeOrOptions;
  } else if (statusCodeOrOptions) {
    // New signature: success(data, options)
    statusCode = statusCodeOrOptions.statusCode || 200;
    skipTransform = statusCodeOrOptions.skipTransform || false;
    headers = statusCodeOrOptions.headers || {};
  }
  
  return createResponse(statusCode, { data }, headers, skipTransform);
}

// Paginated response with correct format for mobile app
export function paginated(
  results: any[],
  count: number,
  page: number,
  pageSize: number,
  options?: ResponseOptions
): APIGatewayProxyResult {
  const totalPages = Math.ceil(count / pageSize);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;
  
  const paginationData = {
    results,
    count,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    next: hasNext ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: hasPrevious ? `?page=${page - 1}&page_size=${pageSize}` : null,
  };
  
  const statusCode = options?.statusCode || 200;
  const skipTransform = options?.skipTransform || false;
  const headers = options?.headers || {};
  
  return createResponse(statusCode, paginationData, headers, skipTransform);
}

// Standard error response with snake_case format
export function error(code: string, message: string, statusCode: number, details?: any): APIGatewayProxyResult {
  const errorResponse: any = {
    error: {
      code,
      message,
    }
  };
  
  if (details) {
    errorResponse.error.details = details;
  }
  
  // Error responses are already in snake_case format, so we skip transformation
  return createResponse(statusCode, errorResponse, {}, true);
}

// Standard error responses
export function badRequest(message: string = 'Bad Request', details?: any): APIGatewayProxyResult {
  return error('BAD_REQUEST', message, 400, details);
}

export function unauthorized(message: string = 'Unauthorized', details?: any): APIGatewayProxyResult {
  return error('UNAUTHORIZED', message, 401, details);
}

export function forbidden(message: string = 'Forbidden', details?: any): APIGatewayProxyResult {
  return error('FORBIDDEN', message, 403, details);
}

export function notFound(message: string = 'Not Found', details?: any): APIGatewayProxyResult {
  return error('NOT_FOUND', message, 404, details);
}

export function conflict(message: string = 'Conflict', details?: any): APIGatewayProxyResult {
  return error('CONFLICT', message, 409, details);
}

export function tooManyRequests(message: string = 'Too Many Requests', details?: any): APIGatewayProxyResult {
  return error('TOO_MANY_REQUESTS', message, 429, details);
}

export function internalServerError(message: string = 'Internal Server Error', details?: any): APIGatewayProxyResult {
  return error('INTERNAL_SERVER_ERROR', message, 500, details);
}

// Alias for backward compatibility
export const internalError = internalServerError;

// Validation error helper
export function validationError(message: string = 'Validation failed', details?: any): APIGatewayProxyResult {
  return error('VALIDATION_ERROR', message, 400, details);
}