import { log, logError, ErrorCategory } from '../src/utils/logger.js';

describe('logger', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  describe('log', () => {
    it('should write to stderr via console.error', () => {
      log('info', 'test message');
      expect(errorSpy).toHaveBeenCalled();
      const output = errorSpy.mock.calls[0]![0] as string;
      expect(output).toContain('[INFO]');
      expect(output).toContain('test message');
    });

    it('should include timestamp in ISO format', () => {
      log('info', 'timestamp test');
      const output = errorSpy.mock.calls[0]![0] as string;
      // ISO timestamp pattern: YYYY-MM-DDTHH:mm:ss
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should support debug level', () => {
      log('debug', 'debug msg');
      const output = errorSpy.mock.calls[0]![0] as string;
      expect(output).toContain('[DEBUG]');
    });

    it('should support warn level', () => {
      log('warn', 'warn msg');
      const output = errorSpy.mock.calls[0]![0] as string;
      expect(output).toContain('[WARN]');
    });

    it('should support error level', () => {
      log('error', 'error msg');
      const output = errorSpy.mock.calls[0]![0] as string;
      expect(output).toContain('[ERROR]');
    });

    it('should include context when provided', () => {
      log('info', 'contextual', { account: 'test@test.com' });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('contextual'),
        expect.stringContaining('test@test.com'),
      );
    });
  });

  describe('logError', () => {
    it('should log error with category and return message', () => {
      const err = new Error('something broke');
      const result = logError('testFn', err, ErrorCategory.GMAIL);

      expect(result).toContain('GMAIL');
      expect(result).toContain('something broke');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should use UNKNOWN category when not specified', () => {
      const err = new Error('oops');
      const result = logError('testFn', err);

      expect(result).toContain('UNKNOWN');
      expect(result).toContain('oops');
    });

    it('should handle errors with empty messages', () => {
      const err = new Error('');
      const result = logError('testFn', err, ErrorCategory.CONFIG);

      expect(result).toContain('CONFIG');
    });
  });

  describe('ErrorCategory', () => {
    it('should have all expected categories', () => {
      expect(ErrorCategory.GOOGLE_AUTH).toBe('GOOGLE_AUTH');
      expect(ErrorCategory.GMAIL).toBe('GMAIL');
      expect(ErrorCategory.GCAL).toBe('GCAL');
      expect(ErrorCategory.MS_AUTH).toBe('MS_AUTH');
      expect(ErrorCategory.MS_MAIL).toBe('MS_MAIL');
      expect(ErrorCategory.MS_CAL).toBe('MS_CAL');
      expect(ErrorCategory.ACCOUNT).toBe('ACCOUNT');
      expect(ErrorCategory.CONFIG).toBe('CONFIG');
      expect(ErrorCategory.TOON).toBe('TOON');
      expect(ErrorCategory.UNIFIED).toBe('UNIFIED');
    });
  });
});
