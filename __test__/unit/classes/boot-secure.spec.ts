/**
 * Unit tests for Boot class with HTTPS/secure server support.
 *
 * Uses real HTTP/HTTPS servers with real express (no module mocking) because:
 * 1. Node.js built-in module exports are non-configurable in Vitest's ESM mode.
 * 2. https.createServer() requires a proper function listener, but mock express
 *    libraries (jest-express) return plain objects, not functions.
 *
 * This mirrors the pattern in boot.spec.ts and boot-lifecycle.spec.ts.
 * Certificate files: __test__/certs/{cert,key}.pem (self-signed, tests only).
 */
import * as path from 'path';
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import Module, { registerMock } from '../../test-classes/module';
import container from '../../../inversify.config';
import { Modules } from '../../../decorators/server';
import { type ExpressiveTeaApplication } from '@expressive-tea/commons';

// No express mock — real express provides a proper function listener so that
// https.createServer(options, app) does not throw ERR_INVALID_ARG_TYPE.

// Absolute paths to real self-signed test certificates.
const CERT_PATH = path.resolve(__dirname, '../../certs/cert.pem');
const KEY_PATH = path.resolve(__dirname, '../../certs/key.pem');

describe('Boot Class Secure Server', () => {
  @Modules([Module])
  class Bootstrap extends Boot {}

  class DefaultBootstrap extends Boot {}

  // Use ports in the 8000-8099 range — clear of other test files
  // (boot.spec.ts: 6000+, boot-extend.spec.ts: 4000+, boot-lifecycle.spec.ts: 10000+).
  let portCounter = 8000;
  let appInstances: ExpressiveTeaApplication[] = [];

  beforeEach(() => {
    appInstances = [];
  });

  afterEach(async () => {
    // Explicitly close all HTTP and HTTPS servers to release ports.
    for (const app of appInstances) {
      if (app?.server) {
        await new Promise<void>((resolve) => {
          app.server.close(() => resolve());
        });
      }
      if (app?.secureServer) {
        await new Promise<void>((resolve) => {
          app.secureServer.close(() => resolve());
        });
      }
    }
    appInstances = [];
    container.unbindAll();
    Settings.reset();
    // Give the OS time to fully release ports before the next test.
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  test('should create instance correctly', () => {
    const boot = new Bootstrap();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance(boot));
  });

  test('should start server as default', async () => {
    const boot = new DefaultBootstrap();
    // Set unique ports to avoid conflicts with other test files running sequentially.
    boot.settings.set('port', portCounter++);
    boot.settings.set('securePort', portCounter++);
    boot.settings.set('certificate', CERT_PATH);
    boot.settings.set('privateKey', KEY_PATH);

    const app = await boot.start();
    appInstances.push(app);

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance(boot));
    expect(app.server).toBeDefined();
    expect(app.secureServer).toBeDefined();
  });

  test('should start an application', async () => {
    const boot = new Bootstrap();
    boot.settings.set('port', portCounter++);
    boot.settings.set('securePort', portCounter++);
    boot.settings.set('certificate', CERT_PATH);
    boot.settings.set('privateKey', KEY_PATH);

    const app = await boot.start();
    appInstances.push(app);

    expect(app.server).toBeDefined();
    expect(app.secureServer).toBeDefined();
    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance(boot));
    expect(registerMock).toHaveBeenCalled();
  });
});
