// Security Middleware for Lambda functions

import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { rateLimiter, RateLimitResult } from '../services/rate-limiter.service';
import { logger } from '../utils/logger';
import { badRequest, unauthorized } from '../utils/response';

export type SecurityHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

export interface SecurityConfig {
  rateLimit?: {
    enabled: boolean;
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (event: APIGatewayProxyEvent) => string;
  };
  cors?: {
    enabled: boolean;
    origins?: string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  };
  headers?: {
    enabled: boolean;
    customHeaders?: Record<string, string>;
  };
  ipWhitelist?: string[];
  ipBlacklist?: string[];
}

const defaultSecurityConfig: SecurityConfig = {
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (event) => getClientIdentifier(event),
  },
  cors: {
    enabled: true,
    origins: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: false,
  },
  headers: {
    enabled: true,
  },
};

export function withSecurity(
  handler: SecurityHandler,
  config: Partial<SecurityConfig> = {}
) {
  const finalConfig = { ...defaultSecurityConfig, ...config };

  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    try {
      // Handle CORS preflight requests
      if (event.httpMethod === 'OPTIONS') {
        return createCorsResponse(finalConfig.cors!);
      }

      // IP filtering
      const clientIp = getClientIp(event);
      if (!isIpAllowed(clientIp, finalConfig)) {
        logger.warn('IP blocked', { clientIp });
        return unauthorized('Access denied');
      }

      // Rate limiting
      if (finalConfig.rateLimit?.enabled) {
        const identifier = finalConfig.rateLimit.keyGenerator!(event);
        const rateLimitResult = await rateLimiter.checkRateLimit(identifier, {
          windowMs: finalConfig.rateLimit.windowMs,
          maxRequests: finalConfig.rateLimit.maxRequests,
        });

        if (!rateLimitResult.allowed) {
          logger.warn('Rate limit exceeded', { identifier, ...rateLimitResult });
          return createRateLimitResponse(rateLimitResult, finalConfig.cors!);
        }

        // Add rate limit headers to the response later
        (context as any).rateLimitResult = rateLimitResult;
      }

      // Execute the handler
      const response = await handler(event, context);

      // Add security headers
      return addSecurityHeaders(response, finalConfig, (context as any).rateLimitResult);

    } catch (error) {
      logger.error('Security middleware error', error);
      return {
        statusCode: 500,
        headers: getSecurityHeaders(finalConfig),
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Internal server error',
          },
        }),
      };
    }
  };
}

function getClientIdentifier(event: APIGatewayProxyEvent): string {
  // Try to get user ID from context (if authenticated)
  const userId = event.requestContext?.authorizer?.userId;
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const clientIp = getClientIp(event);
  return `ip:${clientIp}`;
}

function getClientIp(event: APIGatewayProxyEvent): string {
  // Check various headers for the real IP
  const xForwardedFor = event.headers['X-Forwarded-For'] || event.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = event.headers['X-Real-IP'] || event.headers['x-real-ip'];
  if (xRealIp) {
    return xRealIp;
  }

  return event.requestContext?.identity?.sourceIp || 'unknown';
}

function isIpAllowed(clientIp: string, config: SecurityConfig): boolean {
  // Check blacklist first
  if (config.ipBlacklist && config.ipBlacklist.includes(clientIp)) {
    return false;
  }

  // Check whitelist (if defined)
  if (config.ipWhitelist && config.ipWhitelist.length > 0) {
    return config.ipWhitelist.includes(clientIp);
  }

  return true;
}

function createCorsResponse(corsConfig: NonNullable<SecurityConfig['cors']>): APIGatewayProxyResult {
  const headers: Record<string, string> = {};

  if (corsConfig.origins) {
    headers['Access-Control-Allow-Origin'] = corsConfig.origins.join(', ');
  }

  if (corsConfig.methods) {
    headers['Access-Control-Allow-Methods'] = corsConfig.methods.join(', ');
  }

  if (corsConfig.headers) {
    headers['Access-Control-Allow-Headers'] = corsConfig.headers.join(', ');
  }

  if (corsConfig.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return {
    statusCode: 200,
    headers,
    body: '',
  };
}

function createRateLimitResponse(
  rateLimitResult: RateLimitResult,
  corsConfig: NonNullable<SecurityConfig['cors']>
): APIGatewayProxyResult {
  const headers = getRateLimitHeaders(rateLimitResult);
  
  // Add CORS headers
  if (corsConfig.enabled) {
    if (corsConfig.origins) {
      headers['Access-Control-Allow-Origin'] = corsConfig.origins[0] || '*';
    }
    if (corsConfig.headers) {
      headers['Access-Control-Allow-Headers'] = corsConfig.headers.join(', ');
    }
  }

  return {
    statusCode: 429,
    headers,
    body: JSON.stringify({
      success: false,
      error: {
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
      },
    }),
  };
}

function getRateLimitHeaders(rateLimitResult: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
    'X-RateLimit-Total': rateLimitResult.totalHits.toString(),
    'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
  };
}

function getSecurityHeaders(config: SecurityConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // CORS headers
  if (config.cors?.enabled) {
    if (config.cors.origins) {
      headers['Access-Control-Allow-Origin'] = config.cors.origins[0] || '*';
    }
    if (config.cors.methods) {
      headers['Access-Control-Allow-Methods'] = config.cors.methods.join(', ');
    }
    if (config.cors.headers) {
      headers['Access-Control-Allow-Headers'] = config.cors.headers.join(', ');
    }
    if (config.cors.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  // Security headers
  if (config.headers?.enabled) {
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    
    // Add custom headers
    if (config.headers.customHeaders) {
      Object.assign(headers, config.headers.customHeaders);
    }
  }

  return headers;
}

function addSecurityHeaders(
  response: APIGatewayProxyResult,
  config: SecurityConfig,
  rateLimitResult?: RateLimitResult
): APIGatewayProxyResult {
  const securityHeaders = getSecurityHeaders(config);
  
  // Add rate limit headers if available
  if (rateLimitResult) {
    Object.assign(securityHeaders, getRateLimitHeaders(rateLimitResult));
  }

  return {
    ...response,
    headers: {
      ...securityHeaders,
      ...response.headers,
    },
  };
}

// Predefined security configurations
export const securityConfigs = {
  // Strict security for authentication endpoints
  auth: {
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
    },
    cors: {
      enabled: true,
      origins: [process.env.FRONTEND_URL || '*'],
      credentials: true,
    },
    headers: {
      enabled: true,
    },
  },

  // Standard security for API endpoints
  api: {
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    cors: {
      enabled: true,
      origins: ['*'],
      credentials: false,
    },
    headers: {
      enabled: true,
    },
  },

  // Relaxed security for public endpoints
  public: {
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 200,
    },
    cors: {
      enabled: true,
      origins: ['*'],
      credentials: false,
    },
    headers: {
      enabled: true,
    },
  },
};

// Extend Context type to include rate limit result
declare global {
  namespace awslambda {
    interface Context {
      rateLimitResult?: RateLimitResult;
    }
  }
}