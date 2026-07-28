import { datetimeLocalToIso, isoToDatetimeLocal, dateStringToIso, todayDateString } from './date.utils';

describe('date.utils', () => {
  describe('todayDateString', () => {
    it('should return today as YYYY-MM-DD in UTC', () => {
      const result = todayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe(new Date().toISOString().substring(0, 10));
    });
  });

  describe('datetimeLocalToIso', () => {
    it('should return null for null input', () => {
      expect(datetimeLocalToIso(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(datetimeLocalToIso(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(datetimeLocalToIso('')).toBeNull();
    });

    it('should convert local datetime string to UTC ISO', () => {
      const result = datetimeLocalToIso('2025-06-15T14:30');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      // The resulting UTC time depends on local TZ; just verify it is a valid ISO string
      expect(new Date(result!).toISOString()).toBe(result!);
    });
  });

  describe('isoToDatetimeLocal', () => {
    it('should return null for null input', () => {
      expect(isoToDatetimeLocal(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(isoToDatetimeLocal(undefined)).toBeNull();
    });

    it('should convert UTC ISO string to local datetime-local format', () => {
      const result = isoToDatetimeLocal('2025-06-15T14:30:00.000Z');
      // Must match YYYY-MM-DDTHH:mm format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should round-trip: isoToDatetimeLocal then datetimeLocalToIso returns same UTC minute', () => {
      const original = '2025-06-15T14:30:00.000Z';
      const local = isoToDatetimeLocal(original)!;
      const backToIso = datetimeLocalToIso(local)!;
      // Allow up to 1 minute difference due to seconds being stripped
      const diff = Math.abs(new Date(original).getTime() - new Date(backToIso).getTime());
      expect(diff).toBeLessThan(60_000);
    });
  });

  describe('dateStringToIso', () => {
    it('should return null for null input', () => {
      expect(dateStringToIso(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(dateStringToIso(undefined)).toBeNull();
    });

    it('should convert YYYY-MM-DD to midnight UTC ISO', () => {
      const result = dateStringToIso('2025-06-15');
      expect(result).toBe('2025-06-15T00:00:00.000Z');
    });
  });
});
