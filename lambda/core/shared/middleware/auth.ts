import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { unauthorized } from '../utils/response';
import { logger } from '../utils/logger';
import { UserRepository } from '../repositories/user.repository';
import { verifyAccessToken, TokenPayload } from '../services/auth-token.service';

export interface AuthContext {
  userId: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  email: string;
  phone?: string;
  isVerified: boolean;
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  auth: AuthContext;
}

export type AuthenticatedHandler = (
  event: AuthenticatedEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

const userRepository = new UserRepository();

export interface WithAuthOptions {
  roles?: ('CLIENT' | 'MASTER' | 'ADMIN')[];
}

export function withAuth(handler: AuthenticatedHandler, options?: WithAuthOptions) {
  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    let authenticatedEvent: AuthenticatedEvent;

    try {
      // Extract authorization header
      const authHeader = event.headers.Authorization || event.headers.authorization;

      if (!authHeader) {
        logger.warn('Missing authorization header');
        return unauthorized('Authorization header required');
      }

      // Extract token from Bearer header
      const token = authHeader.replace('Bearer ', '');

      if (!token) {
        logger.warn('Missing bearer token');
        return unauthorized('Bearer token required');
      }

      // Validate token and extract user info
      const authContext = await validateToken(token);

      if (!authContext) {
        logger.warn('Invalid token', { token: token.substring(0, 10) + '...' });
        return unauthorized('Invalid token');
      }

      // Check role if specified
      if (options?.roles && options.roles.length > 0) {
        if (!options.roles.includes(authContext.role)) {
          logger.warn('Insufficient permissions', {
            userId: authContext.userId,
            role: authContext.role,
            requiredRoles: options.roles
          });
          return unauthorized('Insufficient permissions');
        }
      }

      logger.info('Request authenticated', {
        userId: authContext.userId,
        role: authContext.role
      });

      // Add auth context to event
      authenticatedEvent = {
        ...event,
        auth: authContext
      };

    } catch (error) {
      if ((error as any).statusCode) {
        // If it's already a response (like from unauthorized), return it
        return error as any;
      }
      logger.error('Authentication error', error);
      return unauthorized('Authentication failed');
    }

    // Call handler OUTSIDE of authentication try-catch
    // This ensures that any errors thrown by the handler (validation, DB, etc.)
    // are NOT caught here and returned as 401 Unauthorized.
    return await handler(authenticatedEvent, context);
  };
}

async function validateToken(token: string): Promise<AuthContext | null> {
  try {
    // Verify JWT token using consolidated service (includes blacklist check)
    const decoded = await verifyAccessToken(token);

    if (!decoded.userId || !decoded.role || !decoded.email) {
      logger.warn('Invalid JWT payload structure');
      return null;
    }

    // Verify user still exists and is active
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      logger.warn('User not found', { userId: decoded.userId });
      return null;
    }

    // Check if user is active (you can add isActive field to User interface)
    // if (!user.isActive) {
    //   logger.warn('User account is deactivated', { userId: decoded.userId });
    //   return null;
    // }

    return {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      phone: decoded.phone,
      isVerified: decoded.isVerified || user.isPhoneVerified
    };

  } catch (error: any) {
    logger.warn('Token validation failed', { error: error.message });
    return null;
  }
}

// Helper function to create JWT tokens (for login endpoints)
// DEPRECATED: Use generateTokenPair from auth-token.service.ts instead
export function createJWTToken(user: {
  id: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  email?: string;
  phone?: string;
  isPhoneVerified: boolean;
}): string {
  // This function is deprecated but kept for backward compatibility
  // Import and use generateAccessToken from auth-token.service.ts instead
  const { generateAccessToken } = require('../services/auth-token.service');
  return generateAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email || user.phone || '',
    phone: user.phone,
    isVerified: user.isPhoneVerified
  });
}

// Helper function for role-based authorization
export function requireRole(...allowedRoles: ('CLIENT' | 'MASTER' | 'ADMIN')[]) {
  return (handler: AuthenticatedHandler): AuthenticatedHandler => {
    return async (event: AuthenticatedEvent, context: Context) => {
      if (!allowedRoles.includes(event.auth.role)) {
        logger.warn('Insufficient permissions', {
          userId: event.auth.userId,
          role: event.auth.role,
          requiredRoles: allowedRoles
        });
        return unauthorized('Insufficient permissions');
      }

      return handler(event, context);
    };
  };
}

// Alias for compatibility
export const requireAuth = withAuth;