// Health check utilities

import { Context } from 'aws-lambda';
import { HealthCheckConfig, HealthStatus, HealthMetadata, ConfigurationCheck } from '../types/health';
import { logger } from './logger';

export class HealthUtils {
  
  /**
   * Default health check configuration
   */
  static getDefaultConfig(): HealthCheckConfig {
    return {
      timeouts: {
        database: 5000,    // 5 seconds
        storage: 3000,     // 3 seconds
        notifications: 2000, // 2 seconds
        external: 10000    // 10 seconds
      },
      thresholds: {
        memoryWarning: 75,     // 75%
        memoryCritical: 90,    // 90%
        responseTimeWarning: 1000,  // 1 second
        responseTimeCritical: 3000  // 3 seconds
      },
      enableExternalChecks: process.env.ENABLE_EXTERNAL_HEALTH_CHECKS === 'true',
      enableDetailedChecks: process.env.ENABLE_DETAILED_HEALTH_CHECKS !== 'false'
    };
  }

  /**
   * Execute a health check with timeout
   */
  static async executeWithTimeout<T>(
    checkFunction: () => Promise<T>,
    timeoutMs: number,
    checkName: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Health check '${checkName}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      checkFunction()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Get Lambda metadata from context
   */
  static getLambdaMetadata(context?: Context): HealthMetadata {
    const memoryUsage = process.memoryUsage();
    
    return {
      lambdaMemoryLimit: context ? parseInt(context.memoryLimitInMB) : 0,
      lambdaMemoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      lambdaRemainingTime: context ? context.getRemainingTimeInMillis() : 0,
      nodeVersion: process.version,
      awsRegion: process.env.AWS_REGION || 'unknown',
      functionName: context?.functionName || process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
      functionVersion: context?.functionVersion || process.env.AWS_LAMBDA_FUNCTION_VERSION || 'unknown'
    };
  }

  /**
   * Check memory usage with Lambda-specific logic
   */
  static checkMemoryUsage(context?: Context, config?: HealthCheckConfig): HealthStatus {
    const memoryUsage = process.memoryUsage();
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    
    // Use Lambda memory limit if available
    const lambdaLimitMB = context ? parseInt(context.memoryLimitInMB) : totalMB;
    const usagePercent = (usedMB / lambdaLimitMB) * 100;
    
    const thresholds = config?.thresholds || this.getDefaultConfig().thresholds;
    
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `Memory: ${usedMB}MB / ${lambdaLimitMB}MB (${usagePercent.toFixed(1)}%)`;
    
    if (usagePercent > thresholds.memoryCritical) {
      status = 'fail';
      message += ' - Critical memory usage';
    } else if (usagePercent > thresholds.memoryWarning) {
      status = 'warn';
      message += ' - High memory usage';
    }
    
    return {
      status,
      message,
      lastChecked: new Date().toISOString(),
      details: {
        heapUsed: usedMB,
        heapTotal: totalMB,
        lambdaLimit: lambdaLimitMB,
        usagePercent: Math.round(usagePercent),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      }
    };
  }

  /**
   * Check configuration variables
   */
  static checkConfiguration(checks: ConfigurationCheck[]): HealthStatus {
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      missing: [] as string[],
      invalid: [] as string[]
    };

    for (const check of checks) {
      const value = process.env[check.envVar];
      
      if (!value) {
        if (check.required) {
          results.failed++;
          results.missing.push(check.name);
        } else {
          results.warnings++;
        }
        continue;
      }

      if (check.validator && !check.validator(value)) {
        results.failed++;
        results.invalid.push(check.name);
        continue;
      }

      results.passed++;
    }

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `Configuration: ${results.passed} passed`;

    if (results.failed > 0) {
      status = 'fail';
      message += `, ${results.failed} failed`;
      if (results.missing.length > 0) {
        message += ` (missing: ${results.missing.join(', ')})`;
      }
      if (results.invalid.length > 0) {
        message += ` (invalid: ${results.invalid.join(', ')})`;
      }
    } else if (results.warnings > 0) {
      status = 'warn';
      message += `, ${results.warnings} warnings`;
    }

    return {
      status,
      message,
      lastChecked: new Date().toISOString(),
      details: {
        total: checks.length,
        passed: results.passed,
        failed: results.failed,
        warnings: results.warnings,
        missing: results.missing,
        invalid: results.invalid
      }
    };
  }

  /**
   * Determine overall health status from individual checks
   */
  static determineOverallStatus(checks: Record<string, HealthStatus>): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('fail')) {
      return 'unhealthy';
    } else if (statuses.includes('warn')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get appropriate HTTP status code for health status
   */
  static getHttpStatusCode(healthStatus: 'healthy' | 'unhealthy' | 'degraded'): number {
    switch (healthStatus) {
      case 'healthy':
        return 200;
      case 'degraded':
        return 200; // Still operational
      case 'unhealthy':
        return 503; // Service unavailable
      default:
        return 500;
    }
  }

  /**
   * Create a simple health status for load balancers
   */
  static createSimpleResponse(isHealthy: boolean): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  } {
    return {
      statusCode: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': isHealthy ? 'healthy' : 'unhealthy'
      },
      body: isHealthy ? 'OK' : 'Service Unavailable'
    };
  }

  /**
   * Log health check results
   */
  static logHealthCheck(result: any, duration: number): void {
    const logData = {
      status: result.status,
      duration,
      checks: Object.keys(result.checks).reduce((acc, key) => {
        acc[key] = result.checks[key].status;
        return acc;
      }, {} as Record<string, string>),
      version: result.version,
      environment: result.environment
    };

    if (result.status === 'healthy') {
      logger.info('Health check completed', logData);
    } else if (result.status === 'degraded') {
      logger.warn('Health check shows degraded status', logData);
    } else {
      logger.error('Health check failed', logData);
    }
  }

  /**
   * Validate environment variable as URL
   */
  static isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate environment variable as JWT secret (minimum length)
   */
  static isValidJwtSecret(value: string): boolean {
    return value.length >= 32; // Minimum 32 characters for JWT secret
  }

  /**
   * Validate environment variable as AWS ARN
   */
  static isValidAwsArn(value: string): boolean {
    return /^arn:aws:[a-zA-Z0-9-]+:[a-zA-Z0-9-]*:\d{12}:[a-zA-Z0-9-_/:.]+$/.test(value);
  }

  /**
   * Get application version from package.json or environment
   */
  static getApplicationVersion(): string {
    // Try environment variable first
    if (process.env.APP_VERSION) {
      return process.env.APP_VERSION;
    }

    // Try to read from package.json
    try {
      const packageJson = require('../../../package.json');
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
}