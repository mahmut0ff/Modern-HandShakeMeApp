/**
 * Dispute Helper Functions
 * Utilities for dispute management and status handling
 */

export interface DisputeReason {
  value: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * Get all dispute reasons
 */
export const getDisputeReasons = (): DisputeReason[] => {
  return [
    {
      value: 'quality',
      label: 'Quality Issue',
      icon: 'construct',
      description: 'Work quality doesn\'t meet expectations',
    },
    {
      value: 'payment',
      label: 'Payment Dispute',
      icon: 'cash',
      description: 'Disagreement about payment terms or amount',
    },
    {
      value: 'deadline',
      label: 'Deadline Issue',
      icon: 'time',
      description: 'Work not completed on time',
    },
    {
      value: 'communication',
      label: 'Communication Problem',
      icon: 'chatbubbles',
      description: 'Poor or lack of communication',
    },
    {
      value: 'scope',
      label: 'Scope Disagreement',
      icon: 'document-text',
      description: 'Disagreement about project scope',
    },
    {
      value: 'other',
      label: 'Other',
      icon: 'ellipsis-horizontal',
      description: 'Other issues not listed above',
    },
  ];
};

/**
 * Get dispute reason label
 */
export const getDisputeReasonLabel = (reason: string): string => {
  const reasons = getDisputeReasons();
  const found = reasons.find(r => r.value === reason);
  return found?.label || reason;
};

/**
 * Get dispute status label
 */
export const getDisputeStatusLabel = (
  status: 'open' | 'in_mediation' | 'resolved' | 'closed' | 'escalated'
): string => {
  const labels = {
    open: 'Open',
    in_mediation: 'In Mediation',
    resolved: 'Resolved',
    closed: 'Closed',
    escalated: 'Escalated',
  };
  return labels[status] || status;
};

/**
 * Get dispute status color
 */
export const getDisputeStatusColor = (
  status: 'open' | 'in_mediation' | 'resolved' | 'closed' | 'escalated'
): string => {
  const colors = {
    open: '#F59E0B', // orange
    in_mediation: '#3B82F6', // blue
    resolved: '#10B981', // green
    closed: '#6B7280', // gray
    escalated: '#EF4444', // red
  };
  return colors[status] || colors.open;
};

/**
 * Get priority label
 */
export const getPriorityLabel = (
  priority: 'low' | 'medium' | 'high' | 'urgent'
): string => {
  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[priority] || priority;
};

/**
 * Get priority color
 */
export const getPriorityColor = (
  priority: 'low' | 'medium' | 'high' | 'urgent'
): string => {
  const colors = {
    low: '#6B7280', // gray
    medium: '#F59E0B', // orange
    high: '#EF4444', // red
    urgent: '#DC2626', // dark red
  };
  return colors[priority] || colors.low;
};

/**
 * Get resolution type label
 */
export const getResolutionTypeLabel = (
  type: 'refund' | 'partial_refund' | 'redo_work' | 'compensation' | 'no_action'
): string => {
  const labels = {
    refund: 'Full Refund',
    partial_refund: 'Partial Refund',
    redo_work: 'Redo Work',
    compensation: 'Compensation',
    no_action: 'No Action',
  };
  return labels[type] || type;
};

/**
 * Check if dispute can be closed
 */
export const canCloseDispute = (
  status: string,
  isInitiator: boolean
): boolean => {
  return status === 'resolved' && isInitiator;
};

/**
 * Check if dispute can be escalated
 */
export const canEscalateDispute = (status: string): boolean => {
  return status === 'in_mediation';
};

/**
 * Check if mediation can be requested
 */
export const canRequestMediation = (status: string): boolean => {
  return status === 'open';
};

/**
 * Check if resolution can be accepted/rejected
 */
export const canRespondToResolution = (
  status: string,
  hasResolution: boolean
): boolean => {
  return status === 'in_mediation' && hasResolution;
};

/**
 * Format dispute date
 */
export const formatDisputeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

/**
 * Calculate dispute duration in days
 */
export const calculateDisputeDuration = (
  createdAt: string,
  resolvedAt?: string
): number => {
  const start = new Date(createdAt);
  const end = resolvedAt ? new Date(resolvedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Sort disputes by priority and date
 */
export const sortDisputesByPriority = <T extends { priority: string; createdAt: string }>(
  disputes: T[]
): T[] => {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  return [...disputes].sort((a, b) => {
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same priority, sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

/**
 * Filter disputes by status
 */
export const filterDisputesByStatus = <T extends { status: string }>(
  disputes: T[],
  status: string
): T[] => {
  if (status === 'all') return disputes;
  return disputes.filter(d => d.status === status);
};

/**
 * Get dispute statistics
 */
export const calculateDisputeStats = <T extends { status: string }>(
  disputes: T[]
): {
  total: number;
  open: number;
  inMediation: number;
  resolved: number;
  closed: number;
  escalated: number;
} => {
  return {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    inMediation: disputes.filter(d => d.status === 'in_mediation').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    closed: disputes.filter(d => d.status === 'closed').length,
    escalated: disputes.filter(d => d.status === 'escalated').length,
  };
};

/**
 * Validate dispute description
 */
export const validateDisputeDescription = (
  description: string
): { valid: boolean; error?: string } => {
  if (description.trim().length === 0) {
    return { valid: false, error: 'Description is required' };
  }

  if (description.trim().length < 20) {
    return { valid: false, error: 'Description must be at least 20 characters' };
  }

  if (description.length > 1000) {
    return { valid: false, error: 'Description must be less than 1000 characters' };
  }

  return { valid: true };
};

/**
 * Validate dispute amount
 */
export const validateDisputeAmount = (
  amount: string
): { valid: boolean; error?: string } => {
  if (!amount || amount.trim().length === 0) {
    return { valid: true }; // Amount is optional
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (numAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount > 1000000) {
    return { valid: false, error: 'Amount is too large' };
  }

  return { valid: true };
};
