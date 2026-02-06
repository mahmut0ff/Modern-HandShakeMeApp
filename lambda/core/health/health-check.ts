/**
 * Production-ready Health Check Endpoint
 * Comprehensive monitoring for all system components
 */

import { APIGatewayProxyHandler, Context } from 'aws-lambda';
import { HealthCheckResult, HealthChecks, ConfigurationCheck } from '../shared/types/health';
import { HealthUtils } from '../shared/utils/health';
import { HealthChecksService } from '../shared/services/health-checks.service';
import { logger } from '../shared/utils/logger';

// Application start time for uptime calculation
const startTime = Date.now();

// Configuration checks for required environment variables
const CONFIGURATION_CHECKS: ConfigurationCheck[] = [
  // Critical configuration
  { name: 'DynamoDB Table', envVar: 'DYNAMODB_TABLE', required: true },
  { name: 'AWS Region', envVar: 'AWS_REGION', required: true },
  { name: 'S3 Bucket', envVar: 'AWS_S3_BUCKET', required: false }, // Not required for local dev
  
  // Authentication
  { name: 'JWT Secret', envVar: 'JWT_SECRET', required: true, validator: HealthUtils.isValidJwtSecret, sensitive: true },
  
  // Notifications (not critical)
  { name: 'SNS Push Topic', envVar: 'SNS_PUSH_TOPIC_ARN', required: false, validator: HealthUtils.isValidAwsArn },
  { name: 'Admin Alert Topic', envVar: 'SNS_ADMIN_ALERT_TOPIC_ARN', required: false, validator: HealthUtils.isValidAwsArn },
  { name: 'From Email', envVar: 'FROM_EMAIL', required: false },
  
  // External services (optional)
  { name: 'Telegram Bot Token', envVar: 'TELEGRAM_BOT_TOKEN', required: false, sensitive: true },
  { name: 'Yandex Maps API Key', envVar: 'YANDEX_MAPS_API_KEY', required: false, sensitive: true },
  
  // Security
  { name: 'GDPR Salt', envVar: 'GDPR_SALT', required: false, sensitive: true }
];

/**
 * Detailed health check endpoint
 */
export const handler: APIGatewayProxyHandler = async (event, context) => {
  const checkStartTime = Date.now();
  
  try {
    const config = HealthUtils.getDefaultConfig();
    const healthService = new HealthChecksService(config);
    
    // Perform all health checks
    const checks: HealthChecks = {
      database: await healthService.checkDatabase(),
      storage: await healthService.checkStorage(),
      notifications: await healthService.checkNotifications(),
      memory: HealthUtils.checkMemoryUsage(context, config),
      configuration: HealthUtils.checkConfiguration(CONFIGURATION_CHECKS)
    };

    // Add external checks if enabled
    if (config.enableExternalChecks) {
      checks.external = {
        telegram: await healthService.checkTelegramBot(),
        yandexMaps: await healthService.checkYandexMaps(),
        email: await healthService.checkEmailService()
      };
    }

    // Build health check result
    const healthCheck: HealthCheckResult = {
      status: HealthUtils.determineOverallStatus(flattenChecks(checks)),
      timestamp: new Date().toISOString(),
      version: HealthUtils.getApplicationVersion(),
      environment: process.env.NODE_ENV || 'development',
      region: process.env.AWS_REGION || 'unknown',
      uptime: Date.now() - startTime,
      checks,
      metadata: HealthUtils.getLambdaMetadata(context)
    };

    const duration = Date.now() - checkStartTime;
    
    // Log health check results
    HealthUtils.logHealthCheck(healthCheck, duration);

    // Return response with appropriate status code
    const statusCode = HealthUtils.getHttpStatusCode(healthCheck.status);
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': healthCheck.status,
        'X-Health-Duration': duration.toString(),
        'X-Health-Version': healthCheck.version
      },
      body: JSON.stringify(healthCheck, null, 2)
    };

  } catch (error: any) {
    const duration = Date.now() - checkStartTime;
    
    logger.error('Health check failed with unexpected error', {
      error: error.message,
      stack: error.stack,
      duration
    });

    // Return minimal error response
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      duration
    };

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy'
      },
      body: JSON.stringify(errorResponse, null, 2)
    };
  }
};

/**
 * Simple health check for load balancers
 * Fast response with minimal checks
 */
export const simpleHealthHandler: APIGatewayProxyHandler = async (event, context) => {
  try {
    const config = HealthUtils.getDefaultConfig();
    const healthService = new HealthChecksService(config);
    
    // Only check critical services
    const [databaseCheck, memoryCheck] = await Promise.allSettled([
      healthService.checkDatabase(),
      Promise.resolve(HealthUtils.checkMemoryUsage(context, config))
    ]);

    // Determine if system is operational
    const isDatabaseHealthy = databaseCheck.status === 'fulfilled' && 
                             databaseCheck.value.status !== 'fail';
    const isMemoryHealthy = memoryCheck.status === 'fulfilled' && 
                           memoryCheck.value.status !== 'fail';
    
    const isHealthy = isDatabaseHealthy && isMemoryHealthy;
    
    return HealthUtils.createSimpleResponse(isHealthy);

  } catch (error: any) {
    logger.error('Simple health check failed', { error: error.message });
    return HealthUtils.createSimpleResponse(false);
  }
};

/**
 * Readiness probe - checks if service is ready to accept traffic
 */
export const readinessHandler: APIGatewayProxyHandler = async (event, context) => {
  try {
    const config = HealthUtils.getDefaultConfig();
    const healthService = new HealthChecksService(config);
    
    // Check critical dependencies
    const [databaseCheck, configCheck] = await Promise.allSettled([
      healthService.checkDatabase(),
      Promise.resolve(HealthUtils.checkConfiguration(
        CONFIGURATION_CHECKS.filter(check => check.required)
      ))
    ]);

    const isDatabaseReady = databaseCheck.status === 'fulfilled' && 
                           databaseCheck.value.status === 'pass';
    const isConfigReady = configCheck.status === 'fulfilled' && 
                         configCheck.value.status !== 'fail';
    
    const isReady = isDatabaseReady && isConfigReady;
    
    return {
      statusCode: isReady ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        ready: isReady,
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseCheck.status === 'fulfilled' ? databaseCheck.value.status : 'fail',
          configuration: configCheck.status === 'fulfilled' ? configCheck.value.status : 'fail'
        }
      })
    };

  } catch (error: any) {
    logger.error('Readiness check failed', { error: error.message });
    
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        ready: false,
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed'
      })
    };
  }
};

/**
 * Liveness probe - checks if service is alive (for Kubernetes)
 */
export const livenessHandler: APIGatewayProxyHandler = async (event, context) => {
  try {
    // Simple check - if we can respond, we're alive
    const memoryCheck = HealthUtils.checkMemoryUsage(context);
    const isAlive = memoryCheck.status !== 'fail';
    
    return {
      statusCode: isAlive ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        alive: isAlive,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startTime,
        memory: memoryCheck.status
      })
    };

  } catch (error: any) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        alive: false,
        timestamp: new Date().toISOString(),
        error: 'Liveness check failed'
      })
    };
  }
};

/**
 * Flatten nested health checks for overall status determination
 */
function flattenChecks(checks: HealthChecks): Record<string, any> {
  const flattened: Record<string, any> = {
    database: checks.database,
    storage: checks.storage,
    notifications: checks.notifications,
    memory: checks.memory,
    configuration: checks.configuration
  };

  if (checks.external) {
    Object.entries(checks.external).forEach(([key, value]) => {
      if (value) {
        flattened[`external_${key}`] = value;
      }
    });
  }

  return flattened;
}