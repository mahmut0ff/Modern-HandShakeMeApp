// Main exports for shared Lambda utilities

// Database
export * from './db/dynamodb-client';
export * from './db/dynamodb-keys';

// Events
export { EventPublisher, publishEvent } from './events/publisher';

// Middleware
export * from './middleware/auth';
export * from './middleware/errorHandler';
export * from './middleware/localization.middleware';
export { withSecurity, SecurityConfig } from './middleware/security';

// Repositories
export * from './repositories/user.repository';
export * from './repositories/order.repository';
export * from './repositories/notification.repository';

// Services
export { HealthService, HealthCheckResult } from './services/health.service';
export * from './services/rate-limiter.service';
export * from './services/notification.service';
export * from './services/s3.service';

// Types - export from main types file
export * from './types';

// Additional type exports (avoiding duplicates)
export type { ChatRoom, ChatRoomWithParticipants } from './types/chat';
export type { 
  Dispute, 
  DisputeStatus, 
  DisputeResolution,
  CreateDisputeRequest,
  UpdateDisputeStatusRequest,
  AddEvidenceRequest,
  SendDisputeMessageRequest
} from './types/disputes';
export type { InstantBooking, BookingStatus as InstantBookingStatus } from './types/instant-booking';
export type { KyrgyzstanBooking, KyrgyzstanAddress, PaymentStatus } from './types/kyrgyzstan';
export type { Translation } from './types/localization';

// Utils
export * from './utils/auth';
export * from './utils/logger';
export * from './utils/response';
export * from './utils/validation';
export * from './utils/unified-response';
export * from './utils/transform';

// Re-export commonly used types
export type {
  User,
  AuthContext,
  Application,
  PaginationParams,
  PaginatedResponse,
  SuccessResponse,
  ErrorResponse,
  DomainEvent,
  EventType,
  MasterAvailability,
  Category,
  Skill,
} from './types';