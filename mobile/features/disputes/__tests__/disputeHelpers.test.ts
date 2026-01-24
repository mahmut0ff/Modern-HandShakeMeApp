import {
  getDisputeReasonLabel,
  getDisputeStatusLabel,
  getPriorityLabel,
  getResolutionTypeLabel,
  canCloseDispute,
  canEscalateDispute,
  canRequestMediation,
  canRespondToResolution,
  calculateDisputeDuration,
  sortDisputesByPriority,
  filterDisputesByStatus,
  calculateDisputeStats,
  validateDisputeDescription,
  validateDisputeAmount,
} from '../utils/disputeHelpers';

describe('disputeHelpers', () => {
  describe('getDisputeReasonLabel', () => {
    it('returns correct labels', () => {
      expect(getDisputeReasonLabel('quality')).toBe('Quality Issue');
      expect(getDisputeReasonLabel('payment')).toBe('Payment Dispute');
      expect(getDisputeReasonLabel('deadline')).toBe('Deadline Issue');
    });
  });

  describe('getDisputeStatusLabel', () => {
    it('returns correct labels', () => {
      expect(getDisputeStatusLabel('open')).toBe('Open');
      expect(getDisputeStatusLabel('in_mediation')).toBe('In Mediation');
      expect(getDisputeStatusLabel('resolved')).toBe('Resolved');
    });
  });

  describe('getPriorityLabel', () => {
    it('returns correct labels', () => {
      expect(getPriorityLabel('low')).toBe('Low');
      expect(getPriorityLabel('medium')).toBe('Medium');
      expect(getPriorityLabel('high')).toBe('High');
      expect(getPriorityLabel('urgent')).toBe('Urgent');
    });
  });

  describe('getResolutionTypeLabel', () => {
    it('returns correct labels', () => {
      expect(getResolutionTypeLabel('refund')).toBe('Full Refund');
      expect(getResolutionTypeLabel('partial_refund')).toBe('Partial Refund');
      expect(getResolutionTypeLabel('redo_work')).toBe('Redo Work');
    });
  });

  describe('canCloseDispute', () => {
    it('returns true for resolved dispute by initiator', () => {
      expect(canCloseDispute('resolved', true)).toBe(true);
    });

    it('returns false for non-initiator', () => {
      expect(canCloseDispute('resolved', false)).toBe(false);
    });

    it('returns false for non-resolved status', () => {
      expect(canCloseDispute('open', true)).toBe(false);
    });
  });

  describe('canEscalateDispute', () => {
    it('returns true for in_mediation status', () => {
      expect(canEscalateDispute('in_mediation')).toBe(true);
    });

    it('returns false for other statuses', () => {
      expect(canEscalateDispute('open')).toBe(false);
      expect(canEscalateDispute('resolved')).toBe(false);
    });
  });

  describe('canRequestMediation', () => {
    it('returns true for open status', () => {
      expect(canRequestMediation('open')).toBe(true);
    });

    it('returns false for other statuses', () => {
      expect(canRequestMediation('in_mediation')).toBe(false);
      expect(canRequestMediation('resolved')).toBe(false);
    });
  });

  describe('canRespondToResolution', () => {
    it('returns true when in mediation with resolution', () => {
      expect(canRespondToResolution('in_mediation', true)).toBe(true);
    });

    it('returns false without resolution', () => {
      expect(canRespondToResolution('in_mediation', false)).toBe(false);
    });

    it('returns false for other statuses', () => {
      expect(canRespondToResolution('open', true)).toBe(false);
    });
  });

  describe('calculateDisputeDuration', () => {
    it('calculates duration correctly', () => {
      const createdAt = '2024-01-01T00:00:00Z';
      const resolvedAt = '2024-01-08T00:00:00Z';
      expect(calculateDisputeDuration(createdAt, resolvedAt)).toBe(7);
    });
  });

  describe('sortDisputesByPriority', () => {
    it('sorts by priority correctly', () => {
      const disputes = [
        { priority: 'low', createdAt: '2024-01-01T00:00:00Z' },
        { priority: 'urgent', createdAt: '2024-01-02T00:00:00Z' },
        { priority: 'medium', createdAt: '2024-01-03T00:00:00Z' },
      ];
      const sorted = sortDisputesByPriority(disputes);
      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[2].priority).toBe('low');
    });
  });

  describe('filterDisputesByStatus', () => {
    it('filters by status correctly', () => {
      const disputes = [
        { status: 'open' },
        { status: 'resolved' },
        { status: 'open' },
      ];
      const filtered = filterDisputesByStatus(disputes, 'open');
      expect(filtered.length).toBe(2);
    });

    it('returns all for "all" status', () => {
      const disputes = [
        { status: 'open' },
        { status: 'resolved' },
      ];
      const filtered = filterDisputesByStatus(disputes, 'all');
      expect(filtered.length).toBe(2);
    });
  });

  describe('calculateDisputeStats', () => {
    it('calculates stats correctly', () => {
      const disputes = [
        { status: 'open' },
        { status: 'open' },
        { status: 'resolved' },
        { status: 'in_mediation' },
      ];
      const stats = calculateDisputeStats(disputes);
      expect(stats.total).toBe(4);
      expect(stats.open).toBe(2);
      expect(stats.resolved).toBe(1);
      expect(stats.inMediation).toBe(1);
    });
  });

  describe('validateDisputeDescription', () => {
    it('validates description correctly', () => {
      expect(validateDisputeDescription('').valid).toBe(false);
      expect(validateDisputeDescription('Short').valid).toBe(false);
      expect(validateDisputeDescription('This is a valid description with enough characters').valid).toBe(true);
    });
  });

  describe('validateDisputeAmount', () => {
    it('validates amount correctly', () => {
      expect(validateDisputeAmount('').valid).toBe(true); // Optional
      expect(validateDisputeAmount('100').valid).toBe(true);
      expect(validateDisputeAmount('-10').valid).toBe(false);
      expect(validateDisputeAmount('invalid').valid).toBe(false);
    });
  });
});
