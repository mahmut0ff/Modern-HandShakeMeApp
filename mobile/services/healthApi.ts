import axios from 'axios';

// Create axios instance for health checks
const healthClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface HealthCheckDetail {
  status: CheckStatus;
  message?: string;
  lastChecked: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface HealthChecks {
  database: HealthCheckDetail;
  storage: HealthCheckDetail;
  notifications: HealthCheckDetail;
  memory: HealthCheckDetail;
  configuration: HealthCheckDetail;
  external?: {
    telegram?: HealthCheckDetail;
    yandexMaps?: HealthCheckDetail;
    email?: HealthCheckDetail;
  };
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  version: string;
  environment: string;
  region: string;
  uptime: number;
  checks: HealthChecks;
  metadata?: {
    lambdaMemoryLimit?: string;
    lambdaMemoryUsed?: number;
    lambdaRemainingTime?: number;
    functionName?: string;
    nodeVersion?: string;
  };
}

export interface SimpleHealthResult {
  healthy: boolean;
  timestamp: string;
}

export interface ReadinessResult {
  ready: boolean;
  timestamp: string;
  checks: {
    database: CheckStatus;
    configuration: CheckStatus;
  };
}

export interface LivenessResult {
  alive: boolean;
  timestamp: string;
  uptime: number;
  memory: CheckStatus;
}

// Detailed health check
export const getHealthStatus = async (): Promise<HealthCheckResult> => {
  try {
    const response = await healthClient.get('/health');
    return response.data;
  } catch (error: any) {
    // If health check fails, return unhealthy status
    if (error.response?.data) {
      return error.response.data;
    }
    
    throw error;
  }
};

// Simple health check (fast)
export const getSimpleHealth = async (): Promise<SimpleHealthResult> => {
  try {
    const response = await healthClient.get('/health/simple');
    return response.data;
  } catch (error: any) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
    };
  }
};

// Readiness probe
export const getReadiness = async (): Promise<ReadinessResult> => {
  try {
    const response = await healthClient.get('/health/ready');
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    
    return {
      ready: false,
      timestamp: new Date().toISOString(),
      checks: {
        database: 'fail',
        configuration: 'fail',
      },
    };
  }
};

// Liveness probe
export const getLiveness = async (): Promise<LivenessResult> => {
  try {
    const response = await healthClient.get('/health/live');
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    
    return {
      alive: false,
      timestamp: new Date().toISOString(),
      uptime: 0,
      memory: 'fail',
    };
  }
};

// Check if API is reachable
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const result = await getSimpleHealth();
    return result.healthy;
  } catch (error) {
    return false;
  }
};

// Get health status with retry
export const getHealthStatusWithRetry = async (
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<HealthCheckResult> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getHealthStatus();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError;
};

// Format uptime
export const formatUptime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}д ${hours % 24}ч`;
  } else if (hours > 0) {
    return `${hours}ч ${minutes % 60}м`;
  } else if (minutes > 0) {
    return `${minutes}м ${seconds % 60}с`;
  } else {
    return `${seconds}с`;
  }
};

// Get status color
export const getStatusColor = (status: HealthStatus | CheckStatus): string => {
  switch (status) {
    case 'healthy':
    case 'pass':
      return '#10B981'; // green
    case 'degraded':
    case 'warn':
      return '#F59E0B'; // yellow
    case 'unhealthy':
    case 'fail':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
};

// Get status icon
export const getStatusIcon = (status: HealthStatus | CheckStatus): string => {
  switch (status) {
    case 'healthy':
    case 'pass':
      return 'checkmark-circle';
    case 'degraded':
    case 'warn':
      return 'warning';
    case 'unhealthy':
    case 'fail':
      return 'close-circle';
    default:
      return 'help-circle';
  }
};

// Get status label
export const getStatusLabel = (status: HealthStatus | CheckStatus): string => {
  switch (status) {
    case 'healthy':
    case 'pass':
      return 'Работает';
    case 'degraded':
    case 'warn':
      return 'Предупреждение';
    case 'unhealthy':
    case 'fail':
      return 'Не работает';
    default:
      return 'Неизвестно';
  }
};

export const healthApi = {
  getHealthStatus,
  getSimpleHealth,
  getReadiness,
  getLiveness,
  checkApiConnection,
  getHealthStatusWithRetry,
  formatUptime,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
};
