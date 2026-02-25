/**
 * Plugin mock for Vitest tests.
 *
 * Uses a real class rather than vi.fn().mockImplementation() because
 * vitest.config.ts sets `mockReset: true`, which clears mockImplementation
 * between tests. Class methods are immune to mockReset.
 */
import { vi } from 'vitest';

export let mockPluginArguments: unknown[] = [];

/**
 * Spy references for call tracking in tests.
 * These are called inside class methods so mockReset only clears call history,
 * not the method itself.
 */
export const mockRegister = vi.fn(function (this: any, appSettings: any, registeredPlugins: any[]) {
  registeredPlugins.push({
    name: 'Mocked',
    priority: 999
  });
  return registeredPlugins;
});

export const mockGetRegisteredStage = vi.fn(() => []);

class MockPlugin {
  priority = 999;

  constructor(...pluginArgs: unknown[]) {
    mockPluginArguments = pluginArgs;
    // Restore implementations if they were cleared by mockReset
    if (!mockRegister.getMockImplementation()) {
      mockRegister.mockImplementation(function (appSettings: any, registeredPlugins: any[]) {
        registeredPlugins.push({ name: 'Mocked', priority: 999 });
        return registeredPlugins;
      });
    }
    if (!mockGetRegisteredStage.getMockImplementation()) {
      mockGetRegisteredStage.mockReturnValue([]);
    }
  }

  register(appSettings: any, registeredPlugins: any[]) {
    return mockRegister.call(this, appSettings, registeredPlugins);
  }

  getRegisteredStage(stage?: any) {
    return mockGetRegisteredStage(stage);
  }
}

export default MockPlugin as any;
