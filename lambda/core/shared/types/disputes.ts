// Dispute types for DynamoDB

export interface Dispute {
  id: string;
  orderId: string;
  projectId?: string;
  clientId: string;
  masterId: string;
  createdBy: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  priority: DisputePriority;
  resolution?: DisputeResolution;
  resolutionType?: DisputeResolutionType;
  resolutionNotes?: string;
  amountDisputed?: number;
  amountResolved?: number;
  mediatorId?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  type: EvidenceType;
  url: string;
  fileName?: string;
  fileSize?: number;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  message: string;
  messageType: MessageType;
  isInternal: boolean;
  createdAt: string;
}

export interface DisputeTimeline {
  id: string;
  disputeId: string;
  action: TimelineAction;
  description: string;
  userId: string;
  createdAt: string;
  details?: Record<string, any>;
}

// Enums
export type DisputeReason = 
  | 'QUALITY_ISSUES'
  | 'PAYMENT_DISPUTE'
  | 'COMMUNICATION_PROBLEMS'
  | 'DEADLINE_MISSED'
  | 'SCOPE_DISAGREEMENT'
  | 'CANCELLATION_REQUEST'
  | 'OTHER';

export type DisputeStatus = 
  | 'OPEN'
  | 'IN_REVIEW'
  | 'IN_MEDIATION'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';

export type DisputePriority = 
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export type DisputeResolution = 
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'PAY_MASTER'
  | 'NO_ACTION'
  | 'CUSTOM';

export type DisputeResolutionType = 
  | 'AUTOMATIC'
  | 'MEDIATED'
  | 'ADMIN_DECISION'
  | 'MUTUAL_AGREEMENT';

export type EvidenceType = 
  | 'IMAGE'
  | 'DOCUMENT'
  | 'VIDEO'
  | 'AUDIO';

export type MessageType = 
  | 'TEXT'
  | 'SYSTEM'
  | 'NOTIFICATION';

export type TimelineAction = 
  | 'DISPUTE_CREATED'
  | 'EVIDENCE_ADDED'
  | 'MESSAGE_SENT'
  | 'STATUS_CHANGED'
  | 'ESCALATED'
  | 'MEDIATION_REQUESTED'
  | 'RESOLUTION_PROPOSED'
  | 'RESOLUTION_ACCEPTED'
  | 'RESOLUTION_REJECTED'
  | 'DISPUTE_CLOSED';

// Request/Response types
export interface CreateDisputeRequest {
  orderId: string;
  reason: DisputeReason;
  description: string;
  evidence?: Array<{
    type: EvidenceType;
    url: string;
    description?: string;
  }>;
}

export interface UpdateDisputeStatusRequest {
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolutionType?: DisputeResolutionType;
  resolutionNotes?: string;
  amountResolved?: number;
}

export interface AddEvidenceRequest {
  evidence: Array<{
    type: EvidenceType;
    url: string;
    description?: string;
  }>;
}

export interface SendDisputeMessageRequest {
  message: string;
  messageType?: MessageType;
  isInternal?: boolean;
}

// Response types with populated data
export interface DisputeWithDetails extends Dispute {
  order: {
    id: string;
    title: string;
    budget?: number;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  master: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  mediator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  evidenceCount: number;
  messageCount: number;
}

export interface DisputeMessageWithSender extends DisputeMessage {
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
}

export interface DisputeTimelineWithUser extends DisputeTimeline {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// Pagination and filtering
export interface DisputeFilters {
  status?: DisputeStatus;
  priority?: DisputePriority;
  reason?: DisputeReason;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedDisputesResponse {
  disputes: DisputeWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  nextToken?: string;
}