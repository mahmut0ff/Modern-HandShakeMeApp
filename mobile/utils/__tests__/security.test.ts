import {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  checkPasswordStrength,
  maskSensitiveData,
  isValidFileType,
  isValidFileSize,
  isSafeURL,
  RateLimiter,
  CSP,
} from '../security';

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const input = 'Test "quoted" text';
      const result = sanitizeInput(input);
      expect(result).toContain('&quot;');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('1234567890')).toBe(true);
    });

    it('should reject invalid phone', () => {
      expect(isValidPhone('1')).toBe(false); // Too short (only 1 digit)
      expect(isValidPhone('abc')).toBe(false); // Not a number
      expect(isValidPhone('+0123456789')).toBe(false); // Starts with 0 after +
      expect(isValidPhone('')).toBe(false); // Empty string
    });
  });

  describe('checkPasswordStrength', () => {
    it('should give high score for strong password', () => {
      const result = checkPasswordStrength('StrongP@ss123');
      expect(result.score).toBeGreaterThanOrEqual(4);
    });

    it('should give low score for weak password', () => {
      const result = checkPasswordStrength('weak');
      expect(result.score).toBeLessThan(3);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback', () => {
      const result = checkPasswordStrength('password');
      expect(result.feedback).toContain('Добавьте заглавные буквы');
      expect(result.feedback).toContain('Добавьте цифры');
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask data correctly', () => {
      const result = maskSensitiveData('1234567890', 4);
      expect(result).toBe('******7890');
    });

    it('should not mask short data', () => {
      const result = maskSensitiveData('123', 4);
      expect(result).toBe('123');
    });
  });

  describe('isValidFileType', () => {
    it('should validate allowed file types', () => {
      expect(isValidFileType('image.jpg', ['jpg', 'png'])).toBe(true);
      expect(isValidFileType('document.pdf', ['pdf', 'doc'])).toBe(true);
    });

    it('should reject disallowed file types', () => {
      expect(isValidFileType('script.exe', ['jpg', 'png'])).toBe(false);
      expect(isValidFileType('file.txt', ['pdf', 'doc'])).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file size', () => {
      const fiveMB = 5 * 1024 * 1024;
      expect(isValidFileSize(fiveMB, 10)).toBe(true);
    });

    it('should reject large files', () => {
      const fifteenMB = 15 * 1024 * 1024;
      expect(isValidFileSize(fifteenMB, 10)).toBe(false);
    });
  });

  describe('isSafeURL', () => {
    it('should validate safe URLs', () => {
      expect(isSafeURL('https://example.com')).toBe(true);
      expect(isSafeURL('http://example.com')).toBe(true);
    });

    it('should reject unsafe URLs', () => {
      expect(isSafeURL('javascript:alert(1)')).toBe(false);
      expect(isSafeURL('invalid-url')).toBe(false);
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(3, 1000);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests over limit', () => {
      const limiter = new RateLimiter(2, 1000);
      limiter.isAllowed('user1');
      limiter.isAllowed('user1');
      expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('should reset limits', () => {
      const limiter = new RateLimiter(1, 1000);
      limiter.isAllowed('user1');
      limiter.reset('user1');
      expect(limiter.isAllowed('user1')).toBe(true);
    });
  });

  describe('CSP', () => {
    it('should detect unsafe content', () => {
      expect(CSP.isSafeContent('<script>alert(1)</script>')).toBe(false);
      expect(CSP.isSafeContent('<div onclick="alert(1)">Test</div>')).toBe(false);
      expect(CSP.isSafeContent('<a href="javascript:alert(1)">Link</a>')).toBe(false);
    });

    it('should allow safe content', () => {
      expect(CSP.isSafeContent('<div>Safe content</div>')).toBe(true);
      expect(CSP.isSafeContent('Plain text')).toBe(true);
    });

    it('should strip dangerous content', () => {
      const dangerous = '<script>alert(1)</script><div>Safe</div>';
      const result = CSP.stripDangerousContent(dangerous);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<div>Safe</div>');
    });
  });
});
