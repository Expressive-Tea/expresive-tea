/**
 * Test Utilities
 * Common helper functions for Vitest test suites across the expressive-tea framework.
 */
import { vi } from 'vitest';
import * as net from 'net';
import Settings from '../../classes/Settings';
import container from '../../inversify.config';
import type { ExpressiveTeaApplication } from '@expressive-tea/commons';

// ─── Port Management ──────────────────────────────────────────────────────────

let _portCounter = 7000;

/**
 * Returns the next available port number from the internal counter.
 * Use `findFreePort` for guaranteed free port detection.
 */
export function nextPort(): number {
  return _portCounter++;
}

/**
 * Probes an OS port to verify it is free. Falls back to `nextPort()` on error.
 */
export async function findFreePort(start?: number): Promise<number> {
  const basePort = start ?? nextPort();
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(findFreePort(basePort + 1)));
    server.listen(basePort, () => {
      const addr = server.address() as net.AddressInfo;
      server.close(() => resolve(addr.port));
    });
  });
}

// ─── Settings Helpers ─────────────────────────────────────────────────────────

/**
 * Resets global Settings singleton and InversifyJS container.
 * Call in `beforeEach` / `afterEach` to prevent state leakage between tests.
 */
export function resetSettings(port?: number): void {
  Settings.reset();
  if (port !== undefined) {
    Settings.getInstance().set('port', port);
  }
  Settings.getInstance().set('certificate', undefined);
  Settings.getInstance().set('privateKey', undefined);
}

/**
 * Tears down an array of `ExpressiveTeaApplication` instances by closing their
 * HTTP (and optional HTTPS) servers. Resets Settings and the DI container.
 */
export async function teardownApps(apps: ExpressiveTeaApplication[]): Promise<void> {
  for (const app of apps) {
    if (app?.server) {
      await new Promise<void>((resolve) => app.server.close(() => resolve()));
    }
    if (app?.secureServer) {
      await new Promise<void>((resolve) => app.secureServer.close(() => resolve()));
    }
  }
  try {
    container.unbindAll();
  } catch {
    // container may already be empty
  }
  Settings.reset();
  // Small delay to allow the OS to fully release bound ports
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// ─── Mock Utilities ───────────────────────────────────────────────────────────

/**
 * Creates a lightweight HTTP/HTTPS server mock compatible with the expressive-tea
 * engine setup (supports `listen`, `close`, `on`, `listeners`, `removeAllListeners`).
 */
export function createServerMock(opts: { callOnListen?: boolean } = {}) {
  const mock: any = {
    listen: vi.fn().mockImplementation((_port?: number, cb?: () => void) => {
      if (opts.callOnListen && cb) cb();
    }),
    listeners: vi.fn().mockReturnValue([]),
    removeAllListeners: vi.fn().mockReturnValue({ url: '' }),
    close: vi.fn().mockImplementation((cb?: () => void) => {
      if (cb) cb();
    }),
    on: vi.fn().mockImplementation((event: string, cb: (...args: any[]) => void) => {
      if (event !== 'error') cb();
      return false;
    })
  };
  return mock;
}

/**
 * Creates a mock for the `@expressive-tea/plugin` Plugin class.
 */
export function createPluginMock() {
  const mockRegister = vi.fn((appSettings: any, registeredPlugins: any[]) => {
    registeredPlugins.push({ name: 'MockPlugin', priority: 999 });
    return registeredPlugins;
  });
  const mockGetRegisteredStage = vi.fn(() => []);

  const PluginMock = vi.fn().mockImplementation(function () {
    this.priority = 999;
    return { getRegisteredStage: mockGetRegisteredStage, register: mockRegister };
  });

  return { PluginMock, mockRegister, mockGetRegisteredStage };
}

// ─── Custom Assertions ────────────────────────────────────────────────────────

/**
 * Asserts that a promise rejects with an error whose message contains `substring`.
 */
export async function expectRejectsWith(promise: Promise<unknown>, substring: string): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected rejection containing "${substring}" but the promise resolved.`);
  } catch (err: any) {
    if (err instanceof Error && err.message.includes('Expected rejection')) throw err;
    if (!(err instanceof Error) || !err.message.includes(substring)) {
      throw new Error(
        `Expected error message to include "${substring}", got: "${(err as any)?.message ?? err}"`
      );
    }
  }
}

/**
 * Waits until `predicate` returns truthy or `timeoutMs` elapses.
 */
export async function waitUntil(predicate: () => boolean, timeoutMs = 5000, intervalMs = 50): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitUntil timed out after ${timeoutMs}ms`);
}

// ─── Decorator Test Helpers ───────────────────────────────────────────────────

/**
 * Reads decorator metadata from a class or prototype, safely returning `undefined`
 * when `reflect-metadata` is not available or the key does not exist.
 */
export function getMetadata<T = unknown>(metadataKey: any, target: any, propertyKey?: string | symbol): T | undefined {
  if (propertyKey !== undefined) {
    return Reflect.getMetadata(metadataKey, target, propertyKey) as T | undefined;
  }
  return Reflect.getMetadata(metadataKey, target) as T | undefined;
}
