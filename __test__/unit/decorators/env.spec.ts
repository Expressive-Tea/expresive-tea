import 'reflect-metadata';
import { Env, getTransformedEnv } from '../../../decorators/env';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../../helpers/logger';

describe('@Env Decorator', () => {
  const TEST_DIR = process.cwd();
  const envFiles = ['.env', '.env.test', '.env.custom'];

  beforeEach(() => {
    // Clean env files
    envFiles.forEach((file) => {
      const filePath = path.join(TEST_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Reset process.env test variables
    delete process.env.TEST_VAR;
    delete process.env.REQUIRED_VAR;
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.DATABASE_URL;
    delete process.env.API_KEY;
    delete process.env.BASE_VAR;
    delete process.env.LOCAL_VAR;
    delete process.env.SHARED_VAR;
    delete process.env.OTHER_VAR;
  });

  afterEach(() => {
    // Clean up
    envFiles.forEach((file) => {
      const filePath = path.join(TEST_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  describe('Basic Usage', () => {
    test('should load env from default .env path', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'TEST_VAR=test_value\n');

      @Env()
      class _TestApp {}

      expect(process.env.TEST_VAR).toBe('test_value');
    });

    test('should load env from custom path', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env.custom'), 'TEST_VAR=custom_value\n');

      @Env({ path: '.env.custom' })
      class _TestApp {}

      expect(process.env.TEST_VAR).toBe('custom_value');
    });

    test('should throw on missing file when not silent', () => {
      expect(() => {
        @Env({ path: '.env.missing' })
        class _TestApp {}
      }).toThrow(/Environment file not found/);
    });

    test('should not throw on missing file when silent', () => {
      expect(() => {
        @Env({ path: '.env.missing', silent: true })
        class _TestApp {}
      }).not.toThrow();
    });
  });

  describe('Required Variables', () => {
    test('should validate required variables', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'REQUIRED_VAR=value\n');

      expect(() => {
        @Env({ required: ['REQUIRED_VAR'] })
        class _TestApp {}
      }).not.toThrow();

      expect(process.env.REQUIRED_VAR).toBe('value');
    });

    test('should throw when required variables are missing', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'OTHER_VAR=value\n');

      expect(() => {
        @Env({ required: ['REQUIRED_VAR'] })
        class _TestApp {}
      }).toThrow(/Missing required environment variables: REQUIRED_VAR/);
    });
  });

  describe('Transform Function', () => {
    test('should call transform function with env vars', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'PORT=3000\nHOST=localhost\n');

      const transformSpy = jest.fn((env) => ({
        port: parseInt(env.PORT),
        host: env.HOST
      }));

      @Env({ transform: transformSpy })
      class _TestApp {}

      expect(transformSpy).toHaveBeenCalledWith(expect.objectContaining({ PORT: '3000', HOST: 'localhost' }));
    });

    test('should store transformed result', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'PORT=3000\n');

      interface Env {
        port: number;
      }

      @Env<Env>({
        transform: (env) => ({ port: parseInt(env.PORT) })
      })
      class _TestApp {}

      const transformed = getTransformedEnv<Env>();
      expect(transformed).toEqual({ port: 3000 });
      expect(typeof transformed?.port).toBe('number');
    });
  });

  describe('Error Handling (onTransformError)', () => {
    test('should throw on transform error when onTransformError="throw"', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'PORT=invalid\n');

      expect(() => {
        @Env({
          transform: (env) => {
            const port = parseInt(env.PORT);
            if (isNaN(port)) throw new Error('Invalid PORT');
            return { port };
          },
          onTransformError: 'throw'
        })
        class _TestApp {}
      }).toThrow(/Environment transformation failed/);
    });

    test('should warn on transform error when onTransformError="warn"', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'PORT=invalid\n');

      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

      expect(() => {
        @Env({
          transform: (env) => {
            const port = parseInt(env.PORT);
            if (isNaN(port)) throw new Error('Invalid PORT');
            return { port };
          },
          onTransformError: 'warn'
        })
        class _TestApp {}
      }).not.toThrow();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Environment transformation failed'));

      warnSpy.mockRestore();
    });

    test('should ignore transform error when onTransformError="ignore"', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'PORT=invalid\n');

      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

      expect(() => {
        @Env({
          transform: (env) => {
            const port = parseInt(env.PORT);
            if (isNaN(port)) throw new Error('Invalid PORT');
            return { port };
          },
          onTransformError: 'ignore'
        })
        class _TestApp {}
      }).not.toThrow();

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('Stacked Decorators', () => {
    test('should support multiple @Env decorators', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'BASE_VAR=base\n');
      fs.writeFileSync(path.join(TEST_DIR, '.env.test'), 'LOCAL_VAR=local\n');

      @Env({ path: '.env' })
      @Env({ path: '.env.test' })
      class _TestApp {}

      expect(process.env.BASE_VAR).toBe('base');
      expect(process.env.LOCAL_VAR).toBe('local');
    });

    test('should override with later decorator when override=true', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'SHARED_VAR=original\n');
      fs.writeFileSync(path.join(TEST_DIR, '.env.test'), 'SHARED_VAR=overridden\n');

      @Env({ path: '.env' })
      @Env({ path: '.env.test', override: true })
      class _TestApp {}

      expect(process.env.SHARED_VAR).toBe('overridden');
    });
  });
});
