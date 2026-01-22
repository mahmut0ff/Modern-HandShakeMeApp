// Error handling middleware

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { error, internalError, validationError } from '../utils/response';

export type Handler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

// Custom error classes
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
  }
}

// Error handler middleware
export function withErrorHandler(handler: Handler): Handler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(event);
    } catch (err) {
      logger.error('Handler error', err);

      // Handle Zod validation errors
      if (err instanceof ZodError) {
        return validationError('Validation failed', err.errors);
      }

      // Handle custom app errors
      if (err instanceof AppError) {
        return error(err.code, err.message, err.statusCode, err.details);
      }

      // Handle unknown errors
      if (err instanceof Error) {
        // Don't expose internal error details in production
        const message =
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message;

        return internalError(message);
      }

      return internalError();
    }
  };
}
