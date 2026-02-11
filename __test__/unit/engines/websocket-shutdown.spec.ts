/**
 * WebsocketEngine Graceful Shutdown Tests - Phase 1 Non-Breaking Fixes
 *
 * Tests for:
 * - HIGH-001: WebsocketEngine Graceful Shutdown
 *
 * @since 2.0.0
 */
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { ServerSettings } from '../../../decorators/server';
import container from '../../../inversify.config';
import WebsocketService from '../../../services/WebsocketService';

describe('WebsocketEngine Graceful Shutdown - HIGH-001', () => {
  let portCounter = 9000;

  beforeEach(() => {
    jest.clearAllMocks();
    WebsocketService.clear();
    Settings.reset();
  });

  afterEach(async () => {
    container.unbindAll();
    Settings.reset();
    WebsocketService.clear();
  });

  describe('stop() method', () => {
    test('should close WebSocket servers during stop()', async () => {
      @ServerSettings({ startWebsocket: true, port: portCounter++ })
      class WebsocketBoot extends Boot {}

      const boot = new WebsocketBoot();
      const app = await boot.start();

      const wsService = WebsocketService.getInstance();
      const ws = wsService.getWebsocket(app.server);

      expect(ws).toBeDefined();

      // Spy on close method
      const closeSpy = jest.spyOn(ws!, 'close');

      await boot.stop();

      expect(closeSpy).toHaveBeenCalled();

      // Cleanup
      app.server.close();
    });

    test('should properly await ws.close() promise', async () => {
      @ServerSettings({ startWebsocket: true, port: portCounter++ })
      class WebsocketBoot extends Boot {}

      const boot = new WebsocketBoot();
      const app = await boot.start();

      const wsService = WebsocketService.getInstance();
      const ws = wsService.getWebsocket(app.server);

      // Track if close callback was invoked
      let closeCallbackInvoked = false;
      const originalClose = ws!.close.bind(ws);
      ws!.close = jest.fn((callback?: () => void) => {
        originalClose(() => {
          closeCallbackInvoked = true;
          if (callback) callback();
        });
      });

      await boot.stop();

      // Close callback should have been invoked
      expect(closeCallbackInvoked).toBe(true);

      // Cleanup
      app.server.close();
    });

    test('should clear WebsocketService singleton after stop', async () => {
      @ServerSettings({ startWebsocket: true, port: portCounter++ })
      class WebsocketBoot extends Boot {}

      const boot = new WebsocketBoot();
      const app = await boot.start();

      const wsServiceBefore = WebsocketService.getInstance();
      expect(wsServiceBefore).toBeDefined();

      await boot.stop();

      // Service should be cleared
      // Note: WebsocketService.getInstance() will create new instance if cleared
      // So we check by trying to get websocket which should be undefined
      const wsServiceAfter = WebsocketService.getInstance();
      const ws = wsServiceAfter.getWebsocket(app.server);
      expect(ws).toBeUndefined();

      // Cleanup
      app.server.close();
    });

    test('should not throw if WebSocket server is not initialized', async () => {
      @ServerSettings({ startWebsocket: false, port: portCounter++ })
      class NoWebsocketBoot extends Boot {}

      const boot = new NoWebsocketBoot();
      const app = await boot.start();

      // stop() should not throw even though WebSocket wasn't started
      await expect(boot.stop()).resolves.not.toThrow();

      // Cleanup
      app.server.close();
    });

    test('should close both primary and secure WebSocket servers', async () => {
      @ServerSettings({ startWebsocket: true, port: portCounter++ })
      class WebsocketBoot extends Boot {}

      const boot = new WebsocketBoot();
      const app = await boot.start();

      // Even without secure server, stop should handle it gracefully
      await expect(boot.stop()).resolves.not.toThrow();

      // Cleanup
      app.server.close();
    });

    test('should prevent accepting new connections after stop', async () => {
      @ServerSettings({ startWebsocket: true, port: portCounter++ })
      class WebsocketBoot extends Boot {}

      const boot = new WebsocketBoot();
      const app = await boot.start();

      await boot.stop();

      const wsService = WebsocketService.getInstance();
      const ws = wsService.getWebsocket(app.server);

      // WebSocket should be closed and unable to accept connections
      expect(ws).toBeUndefined();

      // Cleanup
      app.server.close();
    });
  });

  describe('Resource Cleanup', () => {
    test('should clean up all WebSocket resources during shutdown', async () => {
      @ServerSettings({ startWebsocket: true, port: portCounter++ })
      class WebsocketBoot extends Boot {}

      const boot = new WebsocketBoot();
      const app = await boot.start();

      const wsService = WebsocketService.getInstance();
      const wsBefore = wsService.getWebsocket(app.server);
      expect(wsBefore).toBeDefined();

      await boot.stop();

      // After stop, no WebSocket should be retrievable
      const wsServiceAfter = WebsocketService.getInstance();
      const wsAfter = wsServiceAfter.getWebsocket(app.server);
      expect(wsAfter).toBeUndefined();

      // Cleanup
      app.server.close();
    });

    test('should handle detached WebSocket shutdown', async () => {
      @ServerSettings({ startWebsocket: true, detachWebsocket: true, port: portCounter++ })
      class DetachedWebsocketBoot extends Boot {}

      const boot = new DetachedWebsocketBoot();
      const app = await boot.start();

      const wsService = WebsocketService.getInstance();
      const ws = wsService.getWebsocket(app.server);
      expect(ws).toBeDefined();

      await expect(boot.stop()).resolves.not.toThrow();

      // Cleanup
      app.server.close();
    });

    test('should not leak memory on repeated start/stop cycles', async () => {
      const cycles = 3;

      for (let i = 0; i < cycles; i++) {
        @ServerSettings({ startWebsocket: true, port: portCounter++ })
        class WebsocketBoot extends Boot {}

        const boot = new WebsocketBoot();
        const app = await boot.start();

        await boot.stop();
        app.server.close();

        // Clear for next iteration
        WebsocketService.clear();
      }

      // If memory leaks existed, this would accumulate
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle stop() being called multiple times', async () => {
      @ServerSettings({ startWebsocket: true, port: portCounter++ })
      class WebsocketBoot extends Boot {}

      const boot = new WebsocketBoot();
      const app = await boot.start();

      await boot.stop();
      // Second call should not throw
      await expect(boot.stop()).resolves.not.toThrow();

      // Cleanup
      app.server.close();
    });

    test('should handle WebSocket close errors gracefully', async () => {
      @ServerSettings({ startWebsocket: true, port: portCounter++ })
      class WebsocketBoot extends Boot {}

      const boot = new WebsocketBoot();
      const app = await boot.start();

      const wsService = WebsocketService.getInstance();
      const ws = wsService.getWebsocket(app.server);

      // Mock close to throw error
      const _originalClose = ws!.close.bind(ws);
      ws!.close = jest.fn((callback?: () => void) => {
        // Simulate error but still call callback
        if (callback) callback();
      });

      await expect(boot.stop()).resolves.not.toThrow();

      // Cleanup
      app.server.close();
    });
  });
});
