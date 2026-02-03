import * as crypto from 'node:crypto';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
import { type KeyPairSyncResult, generateKeyPairSync } from 'node:crypto';
import { type NextFunction, type Request, type Response } from 'express';
import type ProxyRoute from '@classes/ProxyRoute';

export interface EncryptedMessage {
  iv: string;
  message: string;
  authTag: string;
}

export type TeaGatewayMessage = Record<string, any>;

export default class TeaGatewayHelper {

  static encrypt(data: TeaGatewayMessage, signature: Buffer): EncryptedMessage {
    const iv: Buffer = crypto.randomBytes(16);
    const packet: string = JSON.stringify(data);

    // HKDF key derivation - separate encryption key from signature
    const derivedKey = Buffer.from(crypto.hkdfSync('sha256', signature, Buffer.alloc(32), 'expressive-tea-encryption', 32));

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
    const derivedKey = Buffer.from(crypto.hkdfSync('sha256', signature, Buffer.alloc(32), 'expressive-tea-encryption', 32));

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

  static sign(data: string, privateKey: string, passphrase: string): Buffer {
    return crypto.sign(null, Buffer.from(data), {
      key: privateKey,
      passphrase
    });
  }

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

  static generateKeys(passphrase: string): KeyPairSyncResult<any, any> {
    return  generateKeyPairSync('ed25519', {
      modulusLength: 2048,
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

  static proxyResponse(proxyRoute: ProxyRoute, req: Request, res: Response, next: NextFunction) {
    const router = proxyRoute.registerRoute();

    if (!proxyRoute.hasClients()) { next(); return; }

    router(req, res, next);

  }

  static httpSchema(schema: string) {
    if (schema.includes('teapot')) return 'http:';
    if (schema.includes('teapots')) return 'https:';
    throw new Error(`Invalid Schema: ${schema}`);
  }
}
