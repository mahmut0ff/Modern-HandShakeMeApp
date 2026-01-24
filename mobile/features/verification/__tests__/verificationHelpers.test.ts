import {
  calculateCompletionPercentage,
  isVerificationComplete,
  getVerificationLevel,
  formatFileSize,
  validateFileSize,
  validateFileType,
  getStatusLabel,
  getOverallStatusLabel,
  sortDocumentsByPriority,
} from '../utils/verificationHelpers';

describe('verificationHelpers', () => {
  describe('calculateCompletionPercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculateCompletionPercentage(3, 5)).toBe(60);
      expect(calculateCompletionPercentage(5, 5)).toBe(100);
      expect(calculateCompletionPercentage(0, 5)).toBe(0);
    });

    it('handles zero total', () => {
      expect(calculateCompletionPercentage(0, 0)).toBe(0);
    });
  });

  describe('isVerificationComplete', () => {
    it('returns true when all required documents approved', () => {
      expect(isVerificationComplete(2, 2)).toBe(true);
      expect(isVerificationComplete(3, 2)).toBe(true);
    });

    it('returns false when not all required documents approved', () => {
      expect(isVerificationComplete(1, 2)).toBe(false);
      expect(isVerificationComplete(0, 2)).toBe(false);
    });
  });

  describe('getVerificationLevel', () => {
    it('returns correct level based on approved count', () => {
      expect(getVerificationLevel(1)).toBe('basic');
      expect(getVerificationLevel(3)).toBe('standard');
      expect(getVerificationLevel(6)).toBe('premium');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
    });
  });

  describe('validateFileSize', () => {
    it('validates file size correctly', () => {
      expect(validateFileSize(1024 * 1024, 10).valid).toBe(true);
      expect(validateFileSize(11 * 1024 * 1024, 10).valid).toBe(false);
    });

    it('returns error message for invalid size', () => {
      const result = validateFileSize(11 * 1024 * 1024, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateFileType', () => {
    it('validates allowed file types', () => {
      expect(validateFileType('image/jpeg').valid).toBe(true);
      expect(validateFileType('image/png').valid).toBe(true);
      expect(validateFileType('application/pdf').valid).toBe(true);
    });

    it('rejects invalid file types', () => {
      const result = validateFileType('text/plain');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getStatusLabel', () => {
    it('returns correct labels', () => {
      expect(getStatusLabel('pending')).toBe('Pending');
      expect(getStatusLabel('in_review')).toBe('Under Review');
      expect(getStatusLabel('approved')).toBe('Approved');
      expect(getStatusLabel('rejected')).toBe('Rejected');
    });
  });

  describe('getOverallStatusLabel', () => {
    it('returns correct labels', () => {
      expect(getOverallStatusLabel('unverified')).toBe('Not Verified');
      expect(getOverallStatusLabel('partial')).toBe('Partially Verified');
      expect(getOverallStatusLabel('in_review')).toBe('Under Review');
      expect(getOverallStatusLabel('verified')).toBe('Verified');
      expect(getOverallStatusLabel('rejected')).toBe('Verification Failed');
    });
  });

  describe('sortDocumentsByPriority', () => {
    it('sorts required documents first', () => {
      const docs = [
        { required: false, status: 'pending' },
        { required: true, status: 'pending' },
      ];
      const sorted = sortDocumentsByPriority(docs);
      expect(sorted[0].required).toBe(true);
    });

    it('sorts by status priority', () => {
      const docs = [
        { required: true, status: 'approved' },
        { required: true, status: 'rejected' },
        { required: true, status: 'pending' },
      ];
      const sorted = sortDocumentsByPriority(docs);
      expect(sorted[0].status).toBe('rejected');
      expect(sorted[1].status).toBe('pending');
      expect(sorted[2].status).toBe('approved');
    });
  });
});
