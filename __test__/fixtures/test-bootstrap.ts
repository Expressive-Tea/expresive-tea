/**
 * Test Bootstrap
 * Provides pre-configured Boot subclasses and helpers for integration and unit tests.
 */
import 'reflect-metadata';
import Boot from '../../classes/Boot';
import Settings from '../../classes/Settings';
import { Modules } from '../../decorators/server';
import container from '../../inversify.config';
import type { ExpressiveTeaApplication } from '@expressive-tea/commons';

// ─── Minimal Module for testing ───────────────────────────────────────────────

export const registerMock = vi.fn();

function TestModule() {}
TestModule.prototype.__register = registerMock;

// ─── Bootstrap Classes ────────────────────────────────────────────────────────

/** A bare Boot subclass with no modules or plugins — lowest footprint. */
export class DefaultTestBoot extends Boot {}

/** A Boot subclass with a single empty module registered. */
@Modules([TestModule as any])
export class MinimalTestBoot extends Boot {}

// ─── Lifecycle Helpers ────────────────────────────────────────────────────────

/**
 * Starts a Boot instance and returns its application.
 * Automatically tracks the application for teardown.
 */
export async function startBoot(bootInstance: Boot, tracker: ExpressiveTeaApplication[]): Promise<ExpressiveTeaApplication> {
  const app = await bootInstance.start();
  tracker.push(app);
  return app;
}

/**
 * Cleanly tears down all tracked application instances and resets global state.
 * Safe to call multiple times.
 */
export async function teardownAll(apps: ExpressiveTeaApplication[]): Promise<void> {
  const closingApps = apps.splice(0);
  for (const app of closingApps) {
    if (app?.server) {
      await new Promise<void>((resolve) => app.server.close(() => resolve())).catch(() => {});
    }
    if (app?.secureServer) {
      await new Promise<void>((resolve) => app.secureServer.close(() => resolve())).catch(() => {});
    }
  }
  try {
    container.unbindAll();
  } catch {
    // already empty
  }
  Settings.reset();
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// ─── Port Counter ─────────────────────────────────────────────────────────────

let _portBase = 8000;

/**
 * Returns the next unique test port and advances the internal counter.
 * Tests that use `resetSettings(nextTestPort())` won't collide with each other.
 */
export function nextTestPort(): number {
  return _portBase++;
}

/**
 * Configures the Settings singleton with a fresh port and no SSL config.
 * Call in `beforeEach` to isolate each test.
 */
export function prepareSettings(): number {
  const port = nextTestPort();
  Settings.reset();
  Settings.getInstance().set('port', port);
  Settings.getInstance().set('certificate', undefined);
  Settings.getInstance().set('privateKey', undefined);
  return port;
}
