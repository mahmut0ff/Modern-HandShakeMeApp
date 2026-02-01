// Health check types and interfaces

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  region: string;
  uptime: number;
  checks: HealthChecks;
  metadata: HealthMetadata;
}

export interface HealthChecks {
  database: HealthStatus;
  storage: HealthStatus;
  notifications: HealthStatus;
  memory: HealthStatus;
  configuration: HealthStatus;
  external?: {
    telegram?: HealthStatus;
    yandexMaps?: HealthStatus;
    email?: HealthStatus;
  };
}

export interface HealthStatus {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
  lastChecked: string;
  details?: Record<string, any>;
}

export interface HealthMetadata {
  lambdaMemoryLimit: number;
  lambdaMemoryUsed: number;
  lambdaRemainingTime: number;
  nodeVersion: string;
  awsRegion: string;
  functionName: string;
  functionVersion: string;
}

export interface HealthCheckConfig {
  timeouts: {
    database: number;
    storage: number;
    notifications: number;
    external: number;
  };
  thresholds: {
    memoryWarning: number; // percentage
    memoryCritical: number; // percentage
    responseTimeWarning: number; // ms
    responseTimeCritical: number; // ms
  };
  enableExternalChecks: boolean;
  enableDetailedChecks: boolean;
}

export interface ServiceCheck {
  name: string;
  check: () => Promise<HealthStatus>;
  timeout: number;
  critical: boolean; // if true, failure makes overall status unhealthy
}

export interface ConfigurationCheck {
  name: string;
  envVar: string;
  required: boolean;
  validator?: (value: string) => boolean;
  sensitive?: boolean; // don't include value in response
}