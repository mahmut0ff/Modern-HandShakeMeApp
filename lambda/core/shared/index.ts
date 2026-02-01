// Main exports for shared Lambda utilities

// Database
export * from './db/dynamodb-client';
export * from './db/dynamodb-keys';

// Cache
export * from './cache/client';

// Events
export * from './events/publisher';

// Middleware
export * from './middleware/auth';
export * from './middleware/errorHandler';
export * from './middleware/localization.middleware';
export * from './middleware/security';

// Repositories
export * from './repositories/user.repository';
export * from './repositories/order.repository';
export * from './repositories/notification.repository';

// Services
export * from './services/health.service';
export * from './services/rate-limiter.service';
export * from './services/notification.service';
export * from './services/s3.service';
export * from './services/cache.service';

// Types
export * from './types';
export * from './types/chat';
export * from './types/disputes';
export * from './types/files';
export * from './types/gdpr';
export * from './types/health';
export * from './types/instant-booking';
export * from './types/kyrgyzstan';
export * from './types/localization';

// Utils
export * from './utils/auth';
export * from './utils/logger';
export * from './utils/response';
export * from './utils/validation';
export * from './utils/unified-response';
export * from './utils/transform';
export * from './utils/sanitize';

// Re-export commonly used types
export type {
  User,
  AuthContext,
  Order,
  Application,
  Notification,
  PaginationParams,
  PaginatedResponse,
  SuccessResponse,
  ErrorResponse,
  DomainEvent,
  EventType,
} from './types';