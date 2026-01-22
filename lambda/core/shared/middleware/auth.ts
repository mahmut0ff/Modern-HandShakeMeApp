import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/response';

export interface AuthUser {
  userId: string;
  role: 'MASTER' | 'CLIENT' | 'ADMIN';
  email: string;
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user: AuthUser;
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to event
 */
export function withAuth(
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>,
  options: { optional?: boolean } = {}
) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.optional) {
          // Allow unauthenticated access
          return handler(event);
        }
        return unauthorized('Missing or invalid authorization header');
      }
      
      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
      
      // Attach user to event
      (event as any).user = {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email
      };
      
      return handler(event);
    } catch (error) {
      if (options.optional) {
        return handler(event);
      }
      
      if (error.name === 'JsonWebTokenError') {
        return unauthorized('Invalid token');
      }
      
      if (error.name === 'TokenExpiredError') {
        return unauthorized('Token expired');
      }
      
      return unauthorized('Authentication failed');
    }
  };
}

// Legacy function for backward compatibility
export function requireAuth() {
  return async (event: APIGatewayProxyEvent): Promise<AuthUser> => {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: any = new Error('Missing or invalid authorization header');
      error.name = 'UnauthorizedError';
      throw error;
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
      
      return {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email
      };
    } catch (error) {
      const authError: any = new Error('Invalid or expired token');
      authError.name = 'UnauthorizedError';
      throw authError;
    }
  };
}
