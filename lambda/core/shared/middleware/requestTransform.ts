/**
 * Request transformation middleware
 * Transforms incoming requests from snake_case (mobile/API) to camelCase (backend/database)
 * Converts lowercase enums to UPPERCASE for database operations
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { transformToCamelCase } from '../utils/transform';
import { convertEnumsToUppercase } from '../utils/enum-converter';
import { logger } from '../utils/logger';

export interface TransformOptions {
  /**
   * Keys to exclude from transformation (e.g., file upload fields)
   */
  excludeKeys?: string[];
  
  /**
   * Whether to preserve query parameters in their original format
   * Default: true
   */
  preserveQueryParams?: boolean;
  
  /**
   * Whether to transform enum values from lowercase to UPPERCASE
   * Default: true
   */
  transformEnums?: boolean;
}

export type Handler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

/**
 * Middleware that transforms request body from snake_case to camelCase
 * and converts lowercase enums to UPPERCASE
 * 
 * @param handler - The Lambda handler function to wrap
 * @param options - Transformation options
 * @returns Wrapped handler with request transformation
 * 
 * @example
 * ```typescript
 * async function createOrderHandler(event: APIGatewayProxyEvent) {
 *   const body = JSON.parse(event.body || '{}');
 *   // body is now in camelCase with UPPERCASE enums
 *   // e.g., { budgetType: 'FIXED', requiredSkills: [1, 2, 3] }
 * }
 * 
 * export const handler = withRequestTransform(createOrderHandler);
 * ```
 */
export function withRequestTransform(
  handler: Handler,
  options: TransformOptions = {}
): Handler {
  const {
    excludeKeys = [],
    preserveQueryParams = true,
    transformEnums = true,
  } = options;

  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Only transform if there's a body
      if (event.body) {
        const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
        
        // Handle application/json requests
        if (contentType.includes('application/json')) {
          try {
            const originalBody = JSON.parse(event.body);
            
            logger.debug('Original request body', { body: originalBody });
            
            // Transform snake_case to camelCase
            let transformedBody = transformToCamelCase(originalBody);
            
            // NOTE: Enum conversion is NOT done here!
            // Enums should remain in lowercase (as sent by mobile app) for validation
            // Enum conversion to UPPERCASE happens in the handler before database operations
            
            // Exclude specified keys from transformation
            if (excludeKeys.length > 0) {
              for (const key of excludeKeys) {
                if (originalBody[key] !== undefined) {
                  transformedBody[key] = originalBody[key];
                }
              }
            }
            
            logger.debug('Transformed request body', { body: transformedBody });
            
            // Replace event body with transformed version
            event.body = JSON.stringify(transformedBody);
          } catch (parseError) {
            logger.error('Failed to parse request body', { error: parseError });
            // If parsing fails, let the handler deal with it
          }
        } else if (contentType.includes('multipart/form-data')) {
          // For multipart/form-data, preserve the body as-is
          // File uploads should not be transformed
          logger.debug('Skipping transformation for multipart/form-data request');
        } else {
          logger.debug('Skipping transformation for non-JSON request', { contentType });
        }
      }
      
      // Query parameters are preserved in their original format by default
      // This is because query params are typically used for filtering/pagination
      // and should match the database field names (camelCase)
      if (!preserveQueryParams && event.queryStringParameters) {
        try {
          const transformedParams = transformToCamelCase(event.queryStringParameters);
          event.queryStringParameters = transformedParams;
          logger.debug('Transformed query parameters', { params: transformedParams });
        } catch (transformError) {
          logger.error('Failed to transform query parameters', { error: transformError });
        }
      }
      
      // Call the original handler with the transformed event
      return await handler(event);
    } catch (error) {
      // Log transformation errors but don't fail the request
      logger.error('Request transformation error', { 
        error,
        path: event.path,
        method: event.httpMethod,
      });
      
      // Re-throw to let error handler middleware handle it
      throw error;
    }
  };
}

/**
 * Helper function to check if a field should be excluded from transformation
 * Useful for file upload fields or other special cases
 */
export function isFileField(key: string, value: any): boolean {
  // Check if the value looks like a file object
  if (typeof value === 'object' && value !== null) {
    return (
      'filename' in value ||
      'mimetype' in value ||
      'encoding' in value ||
      'buffer' in value
    );
  }
  
  // Check if the key suggests it's a file field
  const fileFieldPatterns = [
    /file$/i,
    /upload$/i,
    /attachment$/i,
    /document$/i,
    /photo$/i,
    /image$/i,
  ];
  
  return fileFieldPatterns.some(pattern => pattern.test(key));
}
