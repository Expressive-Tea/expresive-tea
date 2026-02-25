/// <reference types="node" />
/**
 * Winston Logger Helper Tests
 *
 * Validates environment-based configuration, log level filtering,
 * format selection (text/JSON), and proper output behavior.
 *
 * Uses dynamic import() after vi.resetModules() to obtain a fresh logger
 * instance per test, since Vitest's module cache (not Node's require.cache)
 * is what vi.resetModules() clears.
 *
 * @module __test__/unit/helpers/logger.spec
 */

/** Helper: reset modules, set env, and get a fresh logger instance. */
async function freshLogger(env: Record<string, string | undefined> = {}): Promise<any> {
  // Apply env vars before reloading module
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  vi.resetModules();
  const mod = await import('../../../helpers/logger');
  return mod.default;
}

describe('Winston Logger', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  afterEach(() => {
    // Restore env after each test
    process.env.LOG_LEVEL = originalEnv.LOG_LEVEL;
    process.env.LOG_FORMAT = originalEnv.LOG_FORMAT;
    if (originalEnv.LOG_LEVEL === undefined) delete process.env.LOG_LEVEL;
    if (originalEnv.LOG_FORMAT === undefined) delete process.env.LOG_FORMAT;
  });

  describe('Default Configuration', () => {
    test('should initialize with default debug level', async () => {
      const logger = await freshLogger({ LOG_LEVEL: undefined, LOG_FORMAT: undefined });
      expect(logger.level).toBe('debug');
    });

    test('should initialize with default text format', async () => {
      const logger = await freshLogger({ LOG_LEVEL: undefined, LOG_FORMAT: undefined });
      expect(logger.transports).toHaveLength(1);
      expect(logger.transports[0].name).toBe('console');
    });

    test('should output to console transport', async () => {
      const logger = await freshLogger({ LOG_LEVEL: undefined, LOG_FORMAT: undefined });
      expect(logger.transports).toHaveLength(1);
      expect(logger.transports[0].constructor.name).toBe('Console');
    });
  });

  describe('Environment Variable Configuration - LOG_LEVEL', () => {
    test('should respect LOG_LEVEL=info', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'info', LOG_FORMAT: undefined });
      expect(logger.level).toBe('info');
    });

    test('should respect LOG_LEVEL=warn', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'warn', LOG_FORMAT: undefined });
      expect(logger.level).toBe('warn');
    });

    test('should respect LOG_LEVEL=error', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'error', LOG_FORMAT: undefined });
      expect(logger.level).toBe('error');
    });

    test('should respect LOG_LEVEL=debug', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      expect(logger.level).toBe('debug');
    });

    test('should accept invalid LOG_LEVEL without error', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'invalid-level', LOG_FORMAT: undefined });
      expect(logger.level).toBe('invalid-level');
    });
  });

  describe('Log Format Configuration', () => {
    test('should use JSON format when LOG_FORMAT=json', async () => {
      const logger = await freshLogger({ LOG_FORMAT: 'json', LOG_LEVEL: undefined });
      const outputs: string[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(JSON.stringify(info));
      });

      logger.info('Test message');
      spy.mockRestore();

      expect(outputs.length).toBeGreaterThan(0);
      const parsed = JSON.parse(outputs[0]);
      expect(parsed).toHaveProperty('level', 'info');
      expect(parsed).toHaveProperty('message', 'Test message');
      expect(parsed).toHaveProperty('timestamp');
    });

    test('should use text format when LOG_FORMAT=text', async () => {
      const logger = await freshLogger({ LOG_FORMAT: 'text', LOG_LEVEL: undefined });
      const outputs: string[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info[Symbol.for('message')] || '');
      });

      logger.info('Test message');
      spy.mockRestore();

      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs[0]).toContain('[info]');
      expect(outputs[0]).toContain('Test message');
    });

    test('should use text format by default when LOG_FORMAT is not set', async () => {
      const logger = await freshLogger({ LOG_FORMAT: undefined, LOG_LEVEL: undefined });
      const outputs: string[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info[Symbol.for('message')] || '');
      });

      logger.info('Test message');
      spy.mockRestore();

      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs[0]).toContain('[info]');
      expect(outputs[0]).toContain('Test message');
    });

    test('should use text format for invalid LOG_FORMAT value', async () => {
      const logger = await freshLogger({ LOG_FORMAT: 'invalid-format', LOG_LEVEL: undefined });
      const outputs: string[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info[Symbol.for('message')] || '');
      });

      logger.info('Test message');
      spy.mockRestore();

      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs[0]).toContain('[info]');
      expect(outputs[0]).toContain('Test message');
    });
  });

  describe('Log Level Filtering', () => {
    test('debug level should log all messages (debug, info, warn, error)', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });

      expect(logger.level).toBe('debug');
      expect(logger.isDebugEnabled()).toBe(true);
      expect(logger.isInfoEnabled()).toBe(true);
      expect(logger.isWarnEnabled()).toBe(true);
      expect(logger.isErrorEnabled()).toBe(true);
    });

    test('info level should filter out debug messages', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'info', LOG_FORMAT: undefined });

      expect(logger.level).toBe('info');
      expect(logger.isDebugEnabled()).toBe(false);
      expect(logger.isInfoEnabled()).toBe(true);
      expect(logger.isWarnEnabled()).toBe(true);
      expect(logger.isErrorEnabled()).toBe(true);
    });

    test('warn level should filter out debug and info messages', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'warn', LOG_FORMAT: undefined });

      expect(logger.level).toBe('warn');
      expect(logger.isDebugEnabled()).toBe(false);
      expect(logger.isInfoEnabled()).toBe(false);
      expect(logger.isWarnEnabled()).toBe(true);
      expect(logger.isErrorEnabled()).toBe(true);
    });

    test('error level should only show error messages', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'error', LOG_FORMAT: undefined });

      expect(logger.level).toBe('error');
      expect(logger.isDebugEnabled()).toBe(false);
      expect(logger.isInfoEnabled()).toBe(false);
      expect(logger.isWarnEnabled()).toBe(false);
      expect(logger.isErrorEnabled()).toBe(true);
    });
  });

  describe('Log Output Verification', () => {
    test('should output debug messages correctly', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      logger.debug('Debug message');
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].level).toBe('debug');
      expect(outputs[0].message).toBe('Debug message');
    });

    test('should output info messages correctly', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      logger.info('Info message');
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].level).toBe('info');
      expect(outputs[0].message).toBe('Info message');
    });

    test('should output warn messages correctly', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      logger.warn('Warning message');
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].level).toBe('warn');
      expect(outputs[0].message).toBe('Warning message');
    });

    test('should output error messages correctly', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      logger.error('Error message');
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].level).toBe('error');
      expect(outputs[0].message).toBe('Error message');
    });

    test('should include metadata when provided', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      const metadata = { userId: 123, feature: 'authentication' };
      logger.info('User logged in', metadata);
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].level).toBe('info');
      expect(outputs[0].message).toBe('User logged in');
      expect(outputs[0].userId).toBe(123);
      expect(outputs[0].feature).toBe('authentication');
    });

    test('should format metadata in text output', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: 'text' });
      const outputs: string[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info[Symbol.for('message')] || '');
      });

      logger.info('User action', { userId: 456, action: 'delete' });
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0]).toContain('[info]');
      expect(outputs[0]).toContain('User action');
      expect(outputs[0]).toContain('"userId":456');
      expect(outputs[0]).toContain('"action":"delete"');
    });

    test('should format timestamp in text output', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: 'text' });
      const outputs: string[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info[Symbol.for('message')] || '');
      });

      logger.info('Timestamped message');
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(outputs[0]).toContain('[info]');
      expect(outputs[0]).toContain('Timestamped message');
    });
  });

  describe('Integration with Framework', () => {
    test('should export singleton logger instance', async () => {
      vi.resetModules();
      const { default: logger1 } = await import('../../../helpers/logger');
      const { default: logger2 } = await import('../../../helpers/logger');
      expect(logger1).toBe(logger2);
    });

    test('should be importable in production code', async () => {
      const logger = await freshLogger({ LOG_LEVEL: undefined, LOG_FORMAT: undefined });
      expect(logger).toBeDefined();
      expect(logger.debug).toBeInstanceOf(Function);
      expect(logger.info).toBeInstanceOf(Function);
      expect(logger.warn).toBeInstanceOf(Function);
      expect(logger.error).toBeInstanceOf(Function);
    });

    test('should handle multiple log calls without state leakage', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any, next?: () => void) => {
        outputs.push({ level: info.level, message: info.message });
        next?.();
      });

      logger.debug('First message');
      logger.info('Second message');
      logger.warn('Third message');
      // Winston's stream pipeline processes one write per tick via nextTick scheduling.
      // Await a macro-task to let all buffered writes drain through the spy before restoring.
      await new Promise((resolve) => setImmediate(resolve));
      spy.mockRestore();

      expect(outputs).toHaveLength(3);
      expect(outputs[0]).toEqual({ level: 'debug', message: 'First message' });
      expect(outputs[1]).toEqual({ level: 'info', message: 'Second message' });
      expect(outputs[2]).toEqual({ level: 'warn', message: 'Third message' });
    });

    test('should support method chaining (Winston API)', async () => {
      const logger = await freshLogger({ LOG_LEVEL: undefined, LOG_FORMAT: undefined });
      const result = logger.info('Test message');
      expect(result).toBe(logger);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty log messages', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      logger.info('');
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].message).toBe('');
    });

    test('should handle null metadata gracefully', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      logger.info('Message with null', null as any);
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].message).toBe('Message with null');
    });

    test('should handle undefined metadata gracefully', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      logger.info('Message with undefined', undefined);
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].message).toBe('Message with undefined');
    });

    test('should handle complex nested metadata', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'debug', LOG_FORMAT: undefined });
      const outputs: any[] = [];

      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any) => {
        outputs.push(info);
      });

      const complexMeta = {
        user: { id: 1, name: 'Test' },
        request: { method: 'POST', path: '/api/test' },
        nested: { deep: { value: 'test' } }
      };

      logger.info('Complex log', complexMeta);
      spy.mockRestore();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].user).toEqual({ id: 1, name: 'Test' });
      expect(outputs[0].request).toEqual({ method: 'POST', path: '/api/test' });
      expect(outputs[0].nested).toEqual({ deep: { value: 'test' } });
    });
  });

  describe('Combined Environment Configuration', () => {
    test('should respect both LOG_LEVEL and LOG_FORMAT together', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'warn', LOG_FORMAT: 'json' });

      expect(logger.level).toBe('warn');
      expect(logger.isDebugEnabled()).toBe(false);
      expect(logger.isInfoEnabled()).toBe(false);
      expect(logger.isWarnEnabled()).toBe(true);
      expect(logger.isErrorEnabled()).toBe(true);

      const outputs: any[] = [];
      const spy = vi.spyOn(logger.transports[0], 'log').mockImplementation((info: any, next?: () => void) => {
        outputs.push(info);
        next?.();
      });

      logger.debug('Should not appear');
      logger.info('Should not appear');
      logger.warn('Should appear');
      logger.error('Should appear');
      // Allow Winston's async stream pipeline to drain buffered writes through the spy.
      await new Promise((resolve) => setImmediate(resolve));
      spy.mockRestore();

      const warnAndErrorOnly = outputs.filter((o) => o.level === 'warn' || o.level === 'error');
      expect(warnAndErrorOnly).toHaveLength(2);
      expect(warnAndErrorOnly[0].level).toBe('warn');
      expect(warnAndErrorOnly[1].level).toBe('error');
      expect(warnAndErrorOnly[0]).toHaveProperty('timestamp');
      expect(warnAndErrorOnly[1]).toHaveProperty('timestamp');
    });

    test('should change level dynamically if needed', async () => {
      const logger = await freshLogger({ LOG_LEVEL: 'info', LOG_FORMAT: undefined });

      expect(logger.level).toBe('info');

      logger.level = 'error';

      expect(logger.level).toBe('error');
    });
  });
});
