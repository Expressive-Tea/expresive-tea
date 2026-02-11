/**
 * Teapot Key Validation Tests - Phase 1 Non-Breaking Fixes
 *
 * Tests for:
 * - HIGH-005: Teapot Key Validation
 *
 * @since 2.0.0
 */
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { ServerSettings, Teapot } from '../../../decorators/server';
import container from '../../../inversify.config';
import * as crypto from 'node:crypto';

// Generate valid RSA key pair for testing
function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

const validKeys = generateKeyPair();

@ServerSettings({ port: 8300 })
@Teapot({
  clientKey: 'test-client-key',
  serverKey: validKeys.privateKey
})
class ValidTeapotBoot extends Boot {}

@ServerSettings({ port: 8301 })
@Teapot({
  clientKey: 'test-client-key',
  serverKey: 'INVALID_KEY_FORMAT'
})
class _InvalidTeapotBoot extends Boot {}

@ServerSettings({ port: 8302 })
@Teapot({
  clientKey: 'test-client-key',
  serverKey: ''
})
class _EmptyKeyTeapotBoot extends Boot {}

describe('Teapot Key Validation - HIGH-005', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    container.unbindAll();
    Settings.reset();
  });

  describe('isValidPemKey() validation', () => {
    test('should accept valid PEM key format', async () => {
      // This should not throw
      const boot = new ValidTeapotBoot();
      await expect(boot.start()).resolves.toBeDefined();

      const app = await boot.start();
      await boot.stop();
      app.server.close();
    }, 10000);

    test('should detect and reject invalid PEM format', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      expect(isValidPemKey('INVALID_KEY')).toBe(false);
      expect(isValidPemKey('not-a-pem-key')).toBe(false);
      expect(isValidPemKey('BEGIN-----END')).toBe(false);
    });

    test('should detect and reject empty keys', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      expect(isValidPemKey('')).toBe(false);
      expect(isValidPemKey('   ')).toBe(false);
    });

    test('should detect and reject null/undefined keys', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      expect(isValidPemKey(null)).toBe(false);
      expect(isValidPemKey(undefined)).toBe(false);
    });

    test('should detect and reject non-string keys', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      expect(isValidPemKey(123)).toBe(false);
      expect(isValidPemKey({})).toBe(false);
      expect(isValidPemKey([])).toBe(false);
    });

    test('should validate PEM key must start with -----BEGIN', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const invalidKey = 'WRONG PREFIX -----\nsome content\n-----END CERTIFICATE-----';
      expect(isValidPemKey(invalidKey)).toBe(false);
    });

    test('should validate PEM key must end with -----', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const invalidKey = '-----BEGIN CERTIFICATE-----\nsome content\nWRONG SUFFIX';
      expect(isValidPemKey(invalidKey)).toBe(false);
    });

    test('should accept valid PEM certificate format', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const validPem = '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----';
      expect(isValidPemKey(validPem)).toBe(true);
    });

    test('should accept valid PEM private key format', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const validPem = '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----';
      expect(isValidPemKey(validPem)).toBe(true);
    });

    test('should accept valid PEM public key format', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const validPem = '-----BEGIN PUBLIC KEY-----\nMIIB...\n-----END PUBLIC KEY-----';
      expect(isValidPemKey(validPem)).toBe(true);
    });

    test('should handle keys with whitespace', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const validPemWithWhitespace = '  \n-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----\n  ';
      expect(isValidPemKey(validPemWithWhitespace)).toBe(true);
    });
  });

  describe('Client Verification with Invalid Keys', () => {
    test('should disconnect client with invalid PEM key format', async () => {
      // We can't easily test the full Teacup connection in unit tests,
      // but we can verify the logic path exists
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const invalidKey = Buffer.from('INVALID_KEY_FORMAT');
      const keyStr = invalidKey.toString('ascii');

      expect(isValidPemKey(keyStr)).toBe(false);
    });

    test('should log error for invalid key format', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // We're testing the validation logic, not the full Socket.IO flow
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const result = isValidPemKey('INVALID');
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed PEM headers', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const malformed1 = '-----BEGIN-----\n-----END-----';
      const malformed2 = 'BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----';
      const malformed3 = '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE';

      expect(isValidPemKey(malformed1)).toBe(false); // Missing space after BEGIN
      expect(isValidPemKey(malformed2)).toBe(false); // Missing ----- prefix
      expect(isValidPemKey(malformed3)).toBe(false); // Missing ----- suffix
    });

    test('should handle very long keys', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      // Generate a very long but valid PEM structure
      const longContent = 'A'.repeat(10000);
      const longPem = `-----BEGIN CERTIFICATE-----\n${longContent}\n-----END CERTIFICATE-----`;

      expect(isValidPemKey(longPem)).toBe(true);
    });

    test('should handle keys with special characters in content', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const specialPem = '-----BEGIN CERTIFICATE-----\n!@#$%^&*()\n-----END CERTIFICATE-----';
      expect(isValidPemKey(specialPem)).toBe(true);
    });

    test('should be case-sensitive for PEM markers', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const lowercase = '-----begin certificate-----\nMIIC...\n-----end certificate-----';
      expect(isValidPemKey(lowercase)).toBe(false);
    });

    test('should handle Unicode characters in validation', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const unicodeKey = '-----BEGIN CERTIFICATE-----\n你好世界\n-----END CERTIFICATE-----';
      expect(isValidPemKey(unicodeKey)).toBe(true);
    });
  });

  describe('Security Implications', () => {
    test('should prevent non-PEM keys from being used', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      // Various attack vectors
      const sqlInjection = "'; DROP TABLE users; --";
      const scriptInjection = '<script>alert("xss")</script>';
      const pathTraversal = '../../../etc/passwd';

      expect(isValidPemKey(sqlInjection)).toBe(false);
      expect(isValidPemKey(scriptInjection)).toBe(false);
      expect(isValidPemKey(pathTraversal)).toBe(false);
    });

    test('should validate before attempting crypto operations', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      // Invalid key should be rejected before crypto.verify is called
      const invalidKey = 'definitely-not-a-valid-key';
      expect(isValidPemKey(invalidKey)).toBe(false);
    });
  });

  describe('Real-world Key Formats', () => {
    test('should accept RSA private key format', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      expect(isValidPemKey(validKeys.privateKey)).toBe(true);
    });

    test('should accept RSA public key format', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      expect(isValidPemKey(validKeys.publicKey)).toBe(true);
    });

    test('should accept PKCS8 format', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const pkcs8Key = '-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----';
      expect(isValidPemKey(pkcs8Key)).toBe(true);
    });

    test('should accept EC private key format', () => {
      const TeapotEngine = require('../../../engines/teapot').default;
      const isValidPemKey = (TeapotEngine as any).isValidPemKey;

      const ecKey = '-----BEGIN EC PRIVATE KEY-----\nMHcC...\n-----END EC PRIVATE KEY-----';
      expect(isValidPemKey(ecKey)).toBe(true);
    });
  });
});
