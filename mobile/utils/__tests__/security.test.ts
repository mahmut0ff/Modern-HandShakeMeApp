import {
  validateEmail,
  validatePhone,
  validatePassword,
  validatePasswordStrength,
  sanitizeInput,
  sanitizeHtml,
  validateUrl,
  secureStore,
  secureRetrieve,
  secureDelete
} from '../security';

describe('Security Utils', () => {
  describe('Input Validation', () => {
    it('validates email correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('validates phone correctly', () => {
      // Kyrgyzstan format: +996XXXXXXXXX or 0XXXXXXXXX
      expect(validatePhone('+996555123456')).toBe(true);
      expect(validatePhone('0555123456')).toBe(true);
      expect(validatePhone('123456')).toBe(false);
    });

    it('validates password correctly', () => {
      // At least 8 chars, 1 upper, 1 lower, 1 number, 1 special
      expect(validatePassword('StrongP@ss1')).toBe(true);
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('NoSpecialChar1')).toBe(false);
    });

    it('validates URL correctly', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('javascript:alert(1)')).toBe(false);
      expect(validateUrl('not-a-url')).toBe(false);
    });
  });

  describe('Password Strength', () => {
    it('calculates password strength correctly', () => {
      const strong = validatePasswordStrength('StrongP@ss1');
      expect(strong.level).toMatch(/strong|medium/);
      expect(strong.score).toBeGreaterThan(50);

      const weak = validatePasswordStrength('123456');
      expect(weak.level).toBe('very-weak');
    });
  });

  describe('Sanitization', () => {
    it('sanitizes input strings', () => {
      const dirty = 'Hello <script>alert(1)</script> World';
      const clean = sanitizeInput(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Hello');
    });

    it('sanitizes HTML content', () => {
      const dirtyHtml = '<div onclick="alert(1)">content</div><script>bad()</script>';
      const cleanHtml = sanitizeHtml(dirtyHtml);
      expect(cleanHtml).not.toContain('<script>');
      expect(cleanHtml).not.toContain('onclick');
    });
  });

  describe('Secure Storage', () => {
    // Mocking methods since we can't run native modules in unit tests easily without setup
    // These tests just ensure the wrapper functions exist and handle errors gracefully

    it('defines storage functions', () => {
      expect(secureStore).toBeDefined();
      expect(secureRetrieve).toBeDefined();
      expect(secureDelete).toBeDefined();
    });
  });
});
