// Common types used across Lambda functions

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'CLIENT' | 'MASTER' | 'ADMIN';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContext {
  userId: string;
  role: string;
  email: string;
}

export interface APIGatewayAuthorizerContext {
  principalId: string;
  userId: string;
  role: string;
  email: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

// Event types for EventBridge
export enum EventType {
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_DELETED = 'order.deleted',
  APPLICATION_CREATED = 'application.created',
  APPLICATION_ACCEPTED = 'application.accepted',
  APPLICATION_REJECTED = 'application.rejected',
  PROJECT_CREATED = 'project.created',
  PROJECT_STATUS_CHANGED = 'project.status_changed',
  PROJECT_COMPLETED = 'project.completed',
  REVIEW_SUBMITTED = 'review.submitted',
  PAYMENT_RESERVED = 'payment.reserved',
  PAYMENT_RELEASED = 'payment.released',
  MESSAGE_SENT = 'message.sent',
}

export interface DomainEvent<T = unknown> {
  type: EventType;
  timestamp: string;
  userId: string;
  data: T;
  metadata?: Record<string, unknown>;
}
