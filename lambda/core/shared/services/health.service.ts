// Health Check Service for monitoring system components

import { logger } from '../utils/logger';
import { healthCheck as dynamoHealthCheck } from '../db/dynamodb-client';
import { cache } from '../cache/client';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  components: {
    [key: string]: ComponentHealth;
  };
  summary: {
    healthy: number;
    unhealthy: number;
    degraded: number;
    total: number;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
  lastChecked: string;
}

export class HealthService {
  private version: string;
  private environment: string;

  constructor() {
    this.version = process.env.APP_VERSION || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    logger.info('Starting health check');

    const components: { [key: string]: ComponentHealth } = {};

    // Check DynamoDB
    try {
      const dynamoStart = Date.now();
      const dynamoHealth = await dynamoHealthCheck();
      const dynamoTime = Date.now() - dynamoStart;

      components.dynamodb = {
        status: dynamoHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        responseTime: dynamoTime,
        details: dynamoHealth.details,
        lastChecked: timestamp,
      };
    } catch (error) {
      components.dynamodb = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: timestamp,
      };
    }

    // Check Cache (Redis/Memory)
    try {
      const cacheStart = Date.now();
      const cacheHealth = await cache.healthCheck();
      const cacheTime = Date.now() - cacheStart;

      components.cache = {
        status: cacheHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        responseTime: cacheTime,
        details: cacheHealth.details,
        lastChecked: timestamp,
      };
    } catch (error) {
      components.cache = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: timestamp,
      };
    }

    // Check Environment Variables
    components.environment = this.checkEnvironmentVariables();

    // Check Memory Usage
    components.memory = this.checkMemoryUsage();

    // Calculate summary
    const summary = this.calculateSummary(components);
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus(summary);

    const totalTime = Date.now() - startTime;
    
    logger.info('Health check completed', {
      status: overallStatus,
      duration: totalTime,
      summary,
    });

    return {
      status: overallStatus,
      timestamp,
      version: this.version,
      environment: this.environment,
      components,
      summary,
    };
  }

  private checkEnvironmentVariables(): ComponentHealth {
    const requiredVars = [
      'AWS_REGION',
      'DYNAMODB_TABLE',
      'JWT_SECRET',
    ];

    const optionalVars = [
      'REDIS_HOST',
      'REDIS_PORT',
      'REDIS_AUTH_TOKEN',
      'EVENT_BUS_NAME',
      'AWS_S3_BUCKET',
    ];

    const missing: string[] = [];
    const present: string[] = [];
    const optional: string[] = [];

    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        present.push(varName);
      } else {
        missing.push(varName);
      }
    });

    optionalVars.forEach(varName => {
      if (process.env[varName]) {
        optional.push(varName);
      }
    });

    const status = missing.length === 0 ? 'healthy' : 'unhealthy';

    return {
      status,
      details: {
        required: {
          present: present.length,
          missing: missing.length,
          missingVars: missing,
        },
        optional: {
          present: optional.length,
          total: optionalVars.length,
        },
      },
      lastChecked: new Date().toISOString(),
    };
  }

  private checkMemoryUsage(): ComponentHealth {
    const memUsage = process.memoryUsage();
    const totalMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    // Consider unhealthy if using more than 512MB (Lambda limit consideration)
    const status = totalMB > 512 ? 'degraded' : totalMB > 256 ? 'degraded' : 'healthy';

    return {
      status,
      details: {
        rss: `${totalMB}MB`,
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
      lastChecked: new Date().toISOString(),
    };
  }

  private calculateSummary(components: { [key: string]: ComponentHealth }) {
    let healthy = 0;
    let unhealthy = 0;
    let degraded = 0;

    Object.values(components).forEach(component => {
      switch (component.status) {
        case 'healthy':
          healthy++;
          break;
        case 'unhealthy':
          unhealthy++;
          break;
        case 'degraded':
          degraded++;
          break;
      }
    });

    return {
      healthy,
      unhealthy,
      degraded,
      total: healthy + unhealthy + degraded,
    };
  }

  private determineOverallStatus(summary: {
    healthy: number;
    unhealthy: number;
    degraded: number;
    total: number;
  }): 'healthy' | 'unhealthy' | 'degraded' {
    // If any critical component is unhealthy, system is unhealthy
    if (summary.unhealthy > 0) {
      return 'unhealthy';
    }
    
    // If any component is degraded, system is degraded
    if (summary.degraded > 0) {
      return 'degraded';
    }
    
    // All components are healthy
    return 'healthy';
  }

  // Quick health check for readiness probes
  async isReady(): Promise<boolean> {
    try {
      // Check critical components only
      const dynamoHealth = await dynamoHealthCheck();
      return dynamoHealth.status === 'healthy';
    } catch (error) {
      logger.error('Readiness check failed', error);
      return false;
    }
  }

  // Liveness check
  async isAlive(): Promise<boolean> {
    try {
      // Basic check that the service can respond
      return true;
    } catch (error) {
      logger.error('Liveness check failed', error);
      return false;
    }
  }

  // Get system metrics
  async getMetrics(): Promise<{
    uptime: number;
    memory: NodeJS.MemoryUsage;
    timestamp: string;
  }> {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();