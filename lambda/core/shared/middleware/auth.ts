import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { verify, sign, JwtPayload } from 'jsonwebtoken';
import { unauthorized } from '../utils/response';
import { logger } from '../utils/logger';
import { UserRepository } from '../repositories/user.repository';

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

interface JWTPayload extends JwtPayload {
  userId: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  email: string;
  phone?: string;
  isVerified: boolean;
}

const userRepository = new UserRepository();

export interface WithAuthOptions {
  roles?: ('CLIENT' | 'MASTER' | 'ADMIN')[];
}

export function withAuth(handler: AuthenticatedHandler, options?: WithAuthOptions) {
  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
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

      // Add auth context to event
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        auth: authContext
      };

      logger.info('Request authenticated', { 
        userId: authContext.userId,
        role: authContext.role 
      });

      return await handler(authenticatedEvent, context);

    } catch (error) {
      logger.error('Authentication error', error);
      return unauthorized('Authentication failed');
    }
  };
}

async function validateToken(token: string): Promise<AuthContext | null> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable not set');
      return null;
    }

    // Verify JWT token
    const decoded = verify(token, jwtSecret) as JWTPayload;
    
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
    if (error.name === 'TokenExpiredError') {
      logger.warn('JWT token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT token');
    } else {
      logger.error('Token validation failed', error);
    }
    return null;
  }
}

// Helper function to create JWT tokens (for login endpoints)
export function createJWTToken(user: {
  id: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  email?: string;
  phone?: string;
  isPhoneVerified: boolean;
}): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable not set');
  }

  const payload: JWTPayload = {
    userId: user.id,
    role: user.role,
    email: user.email || '',
    phone: user.phone,
    isVerified: user.isPhoneVerified
  };

  const options: any = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'handshakeme.app',
    audience: 'handshakeme.app'
  };

  return sign(payload, jwtSecret, options);
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