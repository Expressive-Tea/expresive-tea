import * as crypto from 'node:crypto';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
import { generateKeyPairSync } from 'node:crypto';
import { type NextFunction, type Request, type Response } from 'express';
import type ProxyRoute from '@classes/ProxyRoute';

export interface EncryptedMessage {
  iv: string;
  message: string;
  authTag: string;
}

export type TeaGatewayMessage = Record<string, any>;

export default class TeaGatewayHelper {
  /**
   * Encrypts a message using AES-256-GCM with a key derived from the provided signature.
   *
   * Uses HKDF to derive a separate encryption key from the signature, then encrypts
   * the JSON-serialized data with a random IV. Returns the IV, ciphertext, and auth tag
   * so the recipient can verify integrity and decrypt the payload.
   *
   * @param {TeaGatewayMessage} data - Plaintext object to encrypt
   * @param {Buffer} signature - 64-byte signature used as HKDF input keying material
   * @returns {EncryptedMessage} Encrypted message containing IV, ciphertext, and auth tag as hex/base64 strings
   * @since 2.0.0
   */
  static encrypt(data: TeaGatewayMessage, signature: Buffer): EncryptedMessage {
    const iv: Buffer = crypto.randomBytes(16);
    const packet: string = JSON.stringify(data);

    // HKDF key derivation - separate encryption key from signature
    const derivedKey = Buffer.from(
      crypto.hkdfSync('sha256', signature, Buffer.alloc(32), 'expressive-tea-encryption', 32)
    );

    // AES-256-GCM - authenticated encryption
    const cipher: crypto.CipherGCM = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    const encrypted: Buffer = Buffer.concat([cipher.update(packet), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      message: encrypted.toString('base64'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypts an AES-256-GCM encrypted message using a key derived from the provided signature.
   *
   * Validates the encrypted message format and signature length before decryption.
   * Verifies the GCM auth tag to detect tampering. Throws if validation or decryption fails.
   *
   * @param {EncryptedMessage} data - Encrypted payload with IV, ciphertext, and auth tag
   * @param {Buffer} signature - 64-byte signature used as HKDF input keying material (must match encryption)
   * @returns {TeaGatewayMessage} Decrypted and JSON-parsed message object
   * @throws {Error} If the message format is invalid, the signature is malformed, or decryption fails
   * @since 2.0.0
   */
  static decrypt(data: EncryptedMessage, signature: Buffer): TeaGatewayMessage {
    // Input validation
    if (!data || !data.iv || !data.message || !data.authTag) {
      throw new Error('Invalid encrypted message format');
    }
    if (!signature || signature.length !== 64) {
      throw new Error('Invalid signature');
    }

    const iv: Buffer = Buffer.from(data.iv, 'hex');
    const message: Buffer = Buffer.from(data.message, 'base64');
    const authTag: Buffer = Buffer.from(data.authTag, 'hex');

    // HKDF key derivation - same as encrypt
    const derivedKey = Buffer.from(
      crypto.hkdfSync('sha256', signature, Buffer.alloc(32), 'expressive-tea-encryption', 32)
    );

    // AES-256-GCM with auth tag verification
    const decipher: crypto.DecipherGCM = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);

    try {
      const decrypted: Buffer = Buffer.concat([decipher.update(message), decipher.final()]);
      return JSON.parse(decrypted.toString());
    } catch {
      throw new Error('Decryption failed: message tampered or wrong key');
    }
  }

  /**
   * Creates an Ed25519 digital signature over the provided data.
   *
   * @param {string} data - Data to sign, converted to a Buffer before signing
   * @param {string} privateKey - PEM-encoded Ed25519 private key
   * @param {string} passphrase - Passphrase to decrypt the private key
   * @returns {Buffer} Raw binary signature buffer
   * @since 2.0.0
   */
  static sign(data: string, privateKey: string, passphrase: string): Buffer {
    return crypto.sign(null, Buffer.from(data), {
      key: privateKey,
      passphrase
    });
  }

  /**
   * Verifies an Ed25519 signature against the provided data and public key.
   *
   * @param {string} data - Original data that was signed, converted to a Buffer for verification
   * @param {string} publicKey - PEM-encoded Ed25519 public key corresponding to the signing key
   * @param {Buffer} signature - Signature buffer to verify
   * @returns {boolean} True if the signature is valid, false otherwise
   * @since 2.0.0
   */
  static verify(data: string, publicKey: string, signature: Buffer) {
    return crypto.verify(
      null,
      Buffer.from(data),
      {
        key: publicKey
      },
      signature
    );
  }

  /**
   * Generate an Ed25519 key pair for Teapot/Teacup authentication.
   *
   * Ed25519 keys have a fixed size (256-bit / 32-byte) and do not require
   * a modulusLength parameter. The key format is deterministic and provides
   * high security with compact key sizes.
   *
   * @param {string} passphrase - Passphrase to encrypt the private key
   * @returns {{ privateKey: string; publicKey: string }} Generated public and private key pair in PEM format
   */
  static generateKeys(passphrase: string): { privateKey: string; publicKey: string } {
    return generateKeyPairSync('ed25519', {
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase
      }
    });
  }

  /**
   * Handles an incoming HTTP request by delegating to the proxy route's router.
   *
   * Calls `next()` if the proxy route has no registered clients, allowing the request
   * to fall through to downstream middleware or handlers.
   *
   * @param {ProxyRoute} proxyRoute - Proxy route instance managing client registrations and routing
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {void}
   * @since 2.0.0
   */
  static proxyResponse(proxyRoute: ProxyRoute, req: Request, res: Response, next: NextFunction) {
    const router = proxyRoute.registerRoute();

    if (!proxyRoute.hasClients()) {
      next();
      return;
    }

    router(req, res, next);
  }

  /**
   * Converts a Teapot-specific URL scheme to a standard HTTP/HTTPS protocol string.
   *
   * Recognizes `teapot:` as HTTP and `teapots:` as HTTPS, enabling transparent
   * protocol resolution for gateway connections.
   *
   * @param {string} schema - URL scheme from the server URL (e.g. `teapot:`, `teapots:`)
   * @returns {string} Corresponding HTTP protocol string (`http:` or `https:`)
   * @throws {Error} If the schema is not a recognized Teapot scheme
   * @since 2.0.0
   */
  static httpSchema(schema: string) {
    if (schema.includes('teapot')) return 'http:';
    if (schema.includes('teapots')) return 'https:';
    throw new Error(`Invalid Schema: ${schema}`);
  }
}
