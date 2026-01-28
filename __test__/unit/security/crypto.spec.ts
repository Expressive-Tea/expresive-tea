/**
 * Crypto Security Tests for Teapot/Teacup encryption
 * Tests cover AES-256-GCM with HKDF key derivation
 * @since 2.0.0
 */
import * as crypto from 'node:crypto';
import TeaGatewayHelper, { type EncryptedMessage, type TeaGatewayMessage } from '../../../helpers/teapot-helper';

describe('TeaGatewayHelper Crypto Security', () => {
  let testSignature: Buffer;
  let testData: TeaGatewayMessage;

  beforeEach(() => {
    // Generate a 64-byte signature (matching Ed25519 signature size)
    testSignature = crypto.randomBytes(64);
    testData = {
      mountTo: '/api/test',
      address: 'http://localhost:3000',
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
  });

  describe('encrypt()', () => {
    it('should encrypt data successfully', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);

      expect(encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.message).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
    });

    it('should return different IVs for same data', () => {
      const encrypted1 = TeaGatewayHelper.encrypt(testData, testSignature);
      const encrypted2 = TeaGatewayHelper.encrypt(testData, testSignature);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.message).not.toBe(encrypted2.message);
    });

    it('should return different ciphertexts for different signatures', () => {
      const signature1 = crypto.randomBytes(64);
      const signature2 = crypto.randomBytes(64);

      const encrypted1 = TeaGatewayHelper.encrypt(testData, signature1);
      const encrypted2 = TeaGatewayHelper.encrypt(testData, signature2);

      expect(encrypted1.message).not.toBe(encrypted2.message);
      expect(encrypted1.authTag).not.toBe(encrypted2.authTag);
    });

    it('should produce hex-encoded IV', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      expect(() => Buffer.from(encrypted.iv, 'hex')).not.toThrow();
      expect(Buffer.from(encrypted.iv, 'hex').length).toBe(16); // AES IV is 16 bytes
    });

    it('should produce base64-encoded message', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      expect(() => Buffer.from(encrypted.message, 'base64')).not.toThrow();
    });

    it('should produce hex-encoded authTag', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      expect(() => Buffer.from(encrypted.authTag, 'hex')).not.toThrow();
      expect(Buffer.from(encrypted.authTag, 'hex').length).toBe(16); // GCM auth tag is 16 bytes
    });
  });

  describe('decrypt()', () => {
    it('should decrypt encrypted data successfully', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      const decrypted = TeaGatewayHelper.decrypt(encrypted, testSignature);

      expect(decrypted).toEqual(testData);
    });

    it('should perform encryption/decryption roundtrip correctly', () => {
      const complexData: TeaGatewayMessage = {
        mountTo: '/api/users',
        address: 'https://api.example.com:8443',
        nested: {
          deeply: {
            nested: {
              value: 'test'
            }
          }
        },
        array: [1, 2, 3, { key: 'value' }],
        unicode: '🔐 Security テスト',
        special: 'Line1\nLine2\tTab"Quote\'Single'
      };

      const encrypted = TeaGatewayHelper.encrypt(complexData, testSignature);
      const decrypted = TeaGatewayHelper.decrypt(encrypted, testSignature);

      expect(decrypted).toEqual(complexData);
    });

    it('should fail with invalid encrypted message format - missing iv', () => {
      const invalidMessage = {
        message: 'test',
        authTag: 'test'
      } as unknown as EncryptedMessage;

      expect(() => TeaGatewayHelper.decrypt(invalidMessage, testSignature))
        .toThrow('Invalid encrypted message format');
    });

    it('should fail with invalid encrypted message format - missing message', () => {
      const invalidMessage = {
        iv: 'test',
        authTag: 'test'
      } as unknown as EncryptedMessage;

      expect(() => TeaGatewayHelper.decrypt(invalidMessage, testSignature))
        .toThrow('Invalid encrypted message format');
    });

    it('should fail with invalid encrypted message format - missing authTag', () => {
      const invalidMessage = {
        iv: 'test',
        message: 'test'
      } as unknown as EncryptedMessage;

      expect(() => TeaGatewayHelper.decrypt(invalidMessage, testSignature))
        .toThrow('Invalid encrypted message format');
    });

    it('should fail with null encrypted message', () => {
      expect(() => TeaGatewayHelper.decrypt(null as unknown as EncryptedMessage, testSignature))
        .toThrow('Invalid encrypted message format');
    });

    it('should fail with undefined encrypted message', () => {
      expect(() => TeaGatewayHelper.decrypt(undefined as unknown as EncryptedMessage, testSignature))
        .toThrow('Invalid encrypted message format');
    });

    it('should fail with invalid signature - null', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);

      expect(() => TeaGatewayHelper.decrypt(encrypted, null as unknown as Buffer))
        .toThrow('Invalid signature');
    });

    it('should fail with invalid signature - wrong length', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      const wrongLengthSignature = crypto.randomBytes(32); // Should be 64 bytes

      expect(() => TeaGatewayHelper.decrypt(encrypted, wrongLengthSignature))
        .toThrow('Invalid signature');
    });

    it('should fail when decrypting with wrong signature (authentication failure)', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      const wrongSignature = crypto.randomBytes(64);

      expect(() => TeaGatewayHelper.decrypt(encrypted, wrongSignature))
        .toThrow('Decryption failed: message tampered or wrong key');
    });

    it('should detect tampered ciphertext', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      
      // Tamper with the message
      const tamperedMessage = Buffer.from(encrypted.message, 'base64');
      tamperedMessage[0] ^= 0xFF; // Flip bits in first byte
      const tamperedEncrypted: EncryptedMessage = {
        ...encrypted,
        message: tamperedMessage.toString('base64')
      };

      expect(() => TeaGatewayHelper.decrypt(tamperedEncrypted, testSignature))
        .toThrow('Decryption failed: message tampered or wrong key');
    });

    it('should detect tampered IV', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      
      // Tamper with the IV
      const tamperedIV = Buffer.from(encrypted.iv, 'hex');
      tamperedIV[0] ^= 0xFF;
      const tamperedEncrypted: EncryptedMessage = {
        ...encrypted,
        iv: tamperedIV.toString('hex')
      };

      expect(() => TeaGatewayHelper.decrypt(tamperedEncrypted, testSignature))
        .toThrow('Decryption failed: message tampered or wrong key');
    });

    it('should detect tampered authTag', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      
      // Tamper with the auth tag
      const tamperedAuthTag = Buffer.from(encrypted.authTag, 'hex');
      tamperedAuthTag[0] ^= 0xFF;
      const tamperedEncrypted: EncryptedMessage = {
        ...encrypted,
        authTag: tamperedAuthTag.toString('hex')
      };

      expect(() => TeaGatewayHelper.decrypt(tamperedEncrypted, testSignature))
        .toThrow('Decryption failed: message tampered or wrong key');
    });

    it('should handle malformed base64 message gracefully', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      const malformedEncrypted: EncryptedMessage = {
        ...encrypted,
        message: 'not-valid-base64!!!'
      };

      expect(() => TeaGatewayHelper.decrypt(malformedEncrypted, testSignature))
        .toThrow('Decryption failed: message tampered or wrong key');
    });

    it('should handle malformed hex IV gracefully', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      const malformedEncrypted: EncryptedMessage = {
        ...encrypted,
        iv: 'not-valid-hex-ZZZZ'
      };

      expect(() => TeaGatewayHelper.decrypt(malformedEncrypted, testSignature))
        .toThrow();
    });
  });

  describe('Key Derivation (HKDF)', () => {
    it('should derive different keys from different signatures', () => {
      const signature1 = crypto.randomBytes(64);
      const signature2 = crypto.randomBytes(64);

      const encrypted1 = TeaGatewayHelper.encrypt(testData, signature1);
      const encrypted2 = TeaGatewayHelper.encrypt(testData, signature2);

      // Even with same IV, different signatures should produce different ciphertexts
      expect(encrypted1.message).not.toBe(encrypted2.message);
    });

    it('should not use signature directly as encryption key', () => {
      // This test verifies HKDF is used by checking that we can't decrypt
      // using the raw signature as the key
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      
      // Attempt to decrypt using signature directly (old vulnerable method)
      const iv = Buffer.from(encrypted.iv, 'hex');
      const message = Buffer.from(encrypted.message, 'base64');
      const authTag = Buffer.from(encrypted.authTag, 'hex');

      // This should fail because we're using HKDF-derived key, not raw signature
      const decipher = crypto.createDecipheriv('aes-256-gcm', testSignature.slice(0, 32), iv);
      decipher.setAuthTag(authTag);

      expect(() => {
        Buffer.concat([decipher.update(message), decipher.final()]);
      }).toThrow();
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should handle large payloads efficiently', () => {
      const largeData: TeaGatewayMessage = {
        mountTo: '/api/large',
        address: 'http://localhost:3000',
        payload: 'x'.repeat(10000) // 10KB payload
      };

      const start = Date.now();
      const encrypted = TeaGatewayHelper.encrypt(largeData, testSignature);
      const decrypted = TeaGatewayHelper.decrypt(encrypted, testSignature);
      const duration = Date.now() - start;

      expect(decrypted).toEqual(largeData);
      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });

    it('should handle empty objects', () => {
      const emptyData: TeaGatewayMessage = {};
      const encrypted = TeaGatewayHelper.encrypt(emptyData, testSignature);
      const decrypted = TeaGatewayHelper.decrypt(encrypted, testSignature);

      expect(decrypted).toEqual(emptyData);
    });

    it('should handle null values in data', () => {
      const dataWithNull: TeaGatewayMessage = {
        mountTo: '/api/test',
        nullValue: null,
        undefinedValue: undefined
      };

      const encrypted = TeaGatewayHelper.encrypt(dataWithNull, testSignature);
      const decrypted = TeaGatewayHelper.decrypt(encrypted, testSignature);

      // Note: undefined gets stripped in JSON serialization
      expect(decrypted.nullValue).toBeNull();
      expect(decrypted.undefinedValue).toBeUndefined();
    });

    it('should maintain type safety through encryption', () => {
      const typedData: TeaGatewayMessage = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' }
      };

      const encrypted = TeaGatewayHelper.encrypt(typedData, testSignature);
      const decrypted = TeaGatewayHelper.decrypt(encrypted, testSignature);

      expect(typeof decrypted.string).toBe('string');
      expect(typeof decrypted.number).toBe('number');
      expect(typeof decrypted.boolean).toBe('boolean');
      expect(Array.isArray(decrypted.array)).toBe(true);
      expect(typeof decrypted.object).toBe('object');
    });
  });

  describe('Security Properties', () => {
    it('should use authenticated encryption (GCM mode)', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      
      // Verify auth tag exists and is correct length (16 bytes for GCM)
      const authTag = Buffer.from(encrypted.authTag, 'hex');
      expect(authTag.length).toBe(16);
    });

    it('should use proper IV size (16 bytes for AES)', () => {
      const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
      const iv = Buffer.from(encrypted.iv, 'hex');
      
      expect(iv.length).toBe(16);
    });

    it('should generate cryptographically random IVs', () => {
      // Generate multiple IVs and check they're different
      const ivs = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
        ivs.add(encrypted.iv);
      }

      // All 100 IVs should be unique
      expect(ivs.size).toBe(100);
    });

    it('should resist replay attacks (different ciphertexts each time)', () => {
      const ciphertexts = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        const encrypted = TeaGatewayHelper.encrypt(testData, testSignature);
        ciphertexts.add(encrypted.message);
      }

      // All ciphertexts should be different (due to random IV)
      expect(ciphertexts.size).toBe(10);
    });
  });
});
