import 'reflect-metadata';
import { Env } from '../../decorators/env';
import Settings from '../../classes/Settings';
import { fileSettings } from '../../helpers/server';
import * as fs from 'fs';
import * as path from 'path';

describe('Full Environment Loading Integration', () => {
  const TEST_DIR = process.cwd();
  const configFiles = ['.expressive-tea.yaml', '.env'];

  beforeEach(() => {
    Settings.reset();
    configFiles.forEach((file) => {
      const filePath = path.join(TEST_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Clean process.env
    delete process.env.DATABASE_URL;
    delete process.env.API_KEY;
    delete process.env.PORT;
    delete process.env.OLD_VAR;
  });

  afterEach(() => {
    Settings.reset();
    configFiles.forEach((file) => {
      const filePath = path.join(TEST_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  test('should boot app with YAML config + transformed env', () => {
    // Create YAML config
    fs.writeFileSync(
      path.join(TEST_DIR, '.expressive-tea.yaml'),
      `port: 3000
securePort: 4443
environment: test
`
    );

    // Create env file
    fs.writeFileSync(
      path.join(TEST_DIR, '.env'),
      `DATABASE_URL=postgres://localhost:5432/test
API_KEY=test-key-12345
PORT=3000
`
    );

    interface Env {
      port: number;
      databaseUrl: string;
      apiKey: string;
    }

    // Apply decorators
    @Env<Env>({
      transform: (env) => ({
        port: parseInt(env.PORT),
        databaseUrl: env.DATABASE_URL,
        apiKey: env.API_KEY
      })
    })
    class _TestApp {}

    // Load config
    const { config, source } = fileSettings();
    expect(config.port).toBe(3000);
    expect(source).toBe('.expressive-tea.yaml');

    // Get Settings
    const settings = new Settings(config);
    expect(settings.get('port')).toBe(3000);
    expect(settings.get('environment')).toBe('test');

    // Get typed env
    const env = settings.getEnv<Env>();
    expect(env.port).toBe(3000);
    expect(env.databaseUrl).toBe('postgres://localhost:5432/test');
    expect(env.apiKey).toBe('test-key-12345');
  });

  test('should handle Zod-like validation (mocked)', () => {
    fs.writeFileSync(
      path.join(TEST_DIR, '.env'),
      `PORT=3000
DATABASE_URL=postgres://localhost:5432/db
API_KEY=valid-key-with-32-characters-here
`
    );

    // Mock Zod-like schema
    const mockSchema = {
      parse: jest.fn((env) => {
        const port = parseInt(env.PORT);
        if (isNaN(port) || port <= 0) {
          throw new Error('Invalid PORT');
        }
        if (!env.DATABASE_URL.startsWith('postgres://')) {
          throw new Error('Invalid DATABASE_URL');
        }
        if (env.API_KEY.length < 32) {
          throw new Error('API_KEY too short');
        }
        return {
          port,
          databaseUrl: env.DATABASE_URL,
          apiKey: env.API_KEY
        };
      })
    };

    @Env({
      transform: (env) => mockSchema.parse(env),
      onTransformError: 'throw'
    })
    class _TestApp {}

    expect(mockSchema.parse).toHaveBeenCalled();

    const settings = Settings.getInstance();
    const env = settings.getEnv() as { port: number; databaseUrl: string; apiKey: string };

    expect(env.port).toBe(3000);
    expect(env.databaseUrl).toBe('postgres://localhost:5432/db');
  });

  test('should maintain backward compatibility with v2.0.0', () => {
    // v2.0.0 style: JSON config only
    fs.writeFileSync(
      path.join(TEST_DIR, '.expressive-tea'),
      JSON.stringify({
        port: 8080,
        securePort: 8443
      })
    );

    const { config } = fileSettings();
    expect(config.port).toBe(8080);

    // v2.0.0 style: Basic @Env usage
    fs.writeFileSync(path.join(TEST_DIR, '.env'), 'OLD_VAR=old_value\n');

    @Env()
    class _OldApp {}

    expect(process.env.OLD_VAR).toBe('old_value');

    // Clean up JSON config file
    const jsonPath = path.join(TEST_DIR, '.expressive-tea');
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
    }
  });
});
