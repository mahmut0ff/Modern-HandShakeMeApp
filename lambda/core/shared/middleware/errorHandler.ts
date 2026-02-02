import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { internalServerError, badRequest, unprocessableEntity } from '../utils/response';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export class ValidationError extends Error {
  public errors?: any;
  
  constructor(message: string, errors?: any) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

export function withErrorHandler(handler: LambdaHandler): LambdaHandler {
  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(event, context);
    } catch (error) {
      logger.error('Lambda function error', error, {
        requestId: context.awsRequestId,
        functionName: context.functionName,
        path: event.path,
        httpMethod: event.httpMethod
      });

      // Handle specific error types
      if (error instanceof ZodError) {
        return unprocessableEntity('Validation failed', {
          validationErrors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      const err = error as any;
      if (err.name === 'ValidationError') {
        return badRequest(err.message);
      }

      if (err.name === 'ConditionalCheckFailedException') {
        return badRequest('Resource conflict or not found');
      }

      if (err.name === 'ResourceNotFoundException') {
        return badRequest('Resource not found');
      }

      if (err.name === 'AccessDeniedException') {
        return badRequest('Access denied');
      }

      // Generic error response
      const errorMessage = err.message || 'An unexpected error occurred';
      return internalServerError(errorMessage);
    }
  };
}