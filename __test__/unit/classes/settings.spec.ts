import 'reflect-metadata';
import Settings from '../../../classes/Settings';
import { Env } from '../../../decorators/env';
import * as fs from 'fs';
import * as path from 'path';

interface SettingsOptionsProps {
  options: Record<string, any>;
  expected: Record<string, any>;
}

describe('Settings Class', () => {
  beforeEach(() => {
    Settings.reset();
  });
  test('should be existed', () => {
    expect(Settings).not.toBeUndefined();
  });

  test.each`
    options                   | expected
    ${undefined}              | ${{ port: 3000, securePort: 4443 }}
    ${{ port: 8080 }}         | ${{ port: 8080, securePort: 4443 }}
    ${{ port: 8080, a: 'b' }} | ${{ port: 8080, a: 'b', securePort: 4443 }}
    ${{ c: 'd' }}             | ${{ port: 3000, c: 'd', securePort: 4443 }}
  `(
    'should create a new instance with $options and return value correctly',
    ({ options, expected }: SettingsOptionsProps) => {
      const settings = new Settings(options);
      expect(settings.getOptions()).toStrictEqual(expected);
    }
  );

  test.each`
    options                   | expected
    ${undefined}              | ${{ port: 3000, securePort: 4443 }}
    ${{ port: 8080 }}         | ${{ port: 8080, securePort: 4443 }}
    ${{ port: 8080, a: 'b' }} | ${{ port: 8080, a: 'b', securePort: 4443 }}
    ${{ c: 'd' }}             | ${{ port: 3000, c: 'd', securePort: 4443 }}
  `('should merge $options with the existed values', ({ options, expected }: SettingsOptionsProps) => {
    const settings = new Settings();
    settings.merge(options);
    expect(settings.getOptions()).toStrictEqual(expected);
  });

  test('should get the same instance as singleton', () => {
    const settings = new Settings({ a: 'test' });
    const anotherSettings = new Settings();

    expect(settings).toStrictEqual(anotherSettings);
    expect(settings.getOptions()).toEqual(anotherSettings.getOptions());
  });

  test('should get the same instance as singleton', () => {
    const settings = Settings.getInstance();
    const anotherSettings = new Settings();

    expect(settings).toStrictEqual(anotherSettings);
    expect(settings.getOptions()).toEqual(anotherSettings.getOptions());
  });

  test('should be able to assign and get new setting value', () => {
    const settings = new Settings({ a: 'test' });

    expect(settings.get('a')).toEqual('test');

    settings.set('a', 400);
    expect(settings.get('a')).toEqual(400);
  });

  describe('Settings with Empty Config Files (Bug Test)', () => {
    const TEST_DIR = process.cwd();
    const configFiles = ['.expressive-tea.yaml', '.expressive-tea.yml', '.expressive-tea'];

    beforeEach(() => {
      Settings.reset();
      configFiles.forEach((file) => {
        const filePath = path.join(TEST_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
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

    test('should handle empty .expressive-tea.yaml without crashing', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '');

      // Bug: This will crash because yaml.load('') returns undefined
      // and Object.assign tries to merge undefined
      expect(() => {
        const settings = new Settings();
        expect(settings.getOptions()).toBeDefined();
      }).not.toThrow();
    });

    test('should handle empty .expressive-tea.yml without crashing', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), '');

      expect(() => {
        const settings = new Settings();
        expect(settings.getOptions()).toBeDefined();
      }).not.toThrow();
    });

    test('should handle .expressive-tea.yaml with only comments', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '# Configuration\n# Empty for now\n');

      expect(() => {
        const settings = new Settings();
        expect(settings.getOptions()).toBeDefined();
        expect(settings.getOptions().port).toBe(3000); // Should fall back to defaults
      }).not.toThrow();
    });

    test('should merge empty config with constructor options correctly', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '');

      const settings = new Settings({ customPort: 9000 });

      expect(settings.getOptions().port).toBe(3000); // Default
      expect(settings.getOptions().customPort).toBe(9000); // From constructor
    });

    test('should handle empty config with whitespace', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), '   \n  \n\t\n');

      expect(() => {
        const settings = new Settings();
        expect(settings.get('port')).toBe(3000);
      }).not.toThrow();
    });

    test('should use defaults when config is empty object', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '{}');

      const settings = new Settings();

      expect(settings.get('port')).toBe(3000);
      expect(settings.get('securePort')).toBe(4443);
    });

    test('should handle getInstance with empty config file', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '# Empty config\n');

      expect(() => {
        const settings = Settings.getInstance();
        expect(settings).toBeDefined();
        expect(settings.getOptions()).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('getEnv<T>()', () => {
    const TEST_DIR = process.cwd();

    beforeEach(() => {
      Settings.reset();
      const envPath = path.join(TEST_DIR, '.env');
      if (fs.existsSync(envPath)) {
        fs.unlinkSync(envPath);
      }
    });

    afterEach(() => {
      Settings.reset();
      const envPath = path.join(TEST_DIR, '.env');
      if (fs.existsSync(envPath)) {
        fs.unlinkSync(envPath);
      }
      delete process.env.TEST_VAR;
      delete process.env.PORT;
      delete process.env.HOST;
    });

    test('should return process.env when no transform', () => {
      process.env.TEST_VAR = 'test_value';

      const settings = Settings.getInstance();
      const env = settings.getEnv();

      expect(env.TEST_VAR).toBe('test_value');
    });

    test('should return transformed env when available', () => {
      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'PORT=3000\nHOST=localhost\n');

      interface Env {
        port: number;
        host: string;
      }

      @Env<Env>({
        transform: (env) => ({
          port: parseInt(env.PORT),
          host: env.HOST
        })
      })
      class _TestApp {}

      const settings = Settings.getInstance();
      const env = settings.getEnv<Env>();

      expect(env.port).toBe(3000);
      expect(typeof env.port).toBe('number');
      expect(env.host).toBe('localhost');
    });

    test('should have correct type inference', () => {
      interface CustomEnv {
        myPort: number;
        myHost: string;
      }

      fs.writeFileSync(path.join(TEST_DIR, '.env'), 'PORT=4000\n');

      @Env<CustomEnv>({
        transform: () => ({ myPort: 4000, myHost: 'test' })
      })
      class _TestApp {}

      const settings = Settings.getInstance();
      const env = settings.getEnv<CustomEnv>();

      // TypeScript should infer these types correctly
      const port: number = env.myPort;
      const host: string = env.myHost;

      expect(port).toBe(4000);
      expect(host).toBe('test');
    });
  });
});
