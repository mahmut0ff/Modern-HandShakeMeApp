import { formatCurrency, formatDate, formatPhoneNumber } from '../../../utils/format';

describe('format utilities', () => {
  describe('formatCurrency', () => {
    it('should format number to currency', () => {
      const result1 = formatCurrency(1000);
      expect(result1).toContain('1');
      expect(result1).toContain('000');
      expect(result1).toContain('сом');
      
      expect(formatCurrency(0)).toBe('0 сом');
    });

    it('should handle string input', () => {
      const result = formatCurrency('1000');
      expect(result).toContain('1');
      expect(result).toContain('000');
      expect(result).toContain('сом');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-1000);
      expect(result).toContain('-');
      expect(result).toContain('1');
      expect(result).toContain('000');
      expect(result).toContain('сом');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1');
      expect(result).toContain('000');
      expect(result).toContain('сом');
    });

    it('should handle decimal places', () => {
      const result1 = formatCurrency(1234.56);
      expect(result1).toContain('1');
      expect(result1).toContain('234');
      expect(result1).toContain('56');
      expect(result1).toContain('сом');
      
      const result2 = formatCurrency(1234.567);
      expect(result2).toContain('57'); // rounds to 2 decimals
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const date = '2026-01-23T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/); // DD.MM.YYYY format
    });

    it('should format Date object', () => {
      const date = new Date('2026-01-23');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('should handle different date formats', () => {
      expect(formatDate('2026-01-23')).toBeTruthy();
      expect(formatDate('2026/01/23')).toBeTruthy();
    });

    it('should include time when specified', () => {
      const date = '2026-01-23T10:30:00Z';
      const formatted = formatDate(date, true);
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Kyrgyz phone number', () => {
      expect(formatPhoneNumber('+996700123456')).toBe('+996 700 12 34 56');
      expect(formatPhoneNumber('996700123456')).toBe('+996 700 12 34 56');
    });

    it('should handle phone without country code', () => {
      expect(formatPhoneNumber('0700123456')).toBe('0700 12 34 56');
    });

    it('should handle already formatted phone', () => {
      const formatted = '+996 700 12 34 56';
      expect(formatPhoneNumber(formatted)).toBeTruthy();
    });

    it('should handle invalid phone numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('')).toBe('');
    });

    it('should remove non-digit characters', () => {
      expect(formatPhoneNumber('+996 (700) 123-456')).toBe('+996 700 12 34 56');
    });
  });
});
