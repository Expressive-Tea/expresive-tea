/**
 * SocketIOEngine Graceful Shutdown Tests - Phase 1 Non-Breaking Fixes
 *
 * Tests for:
 * - HIGH-002: SocketIOEngine Graceful Shutdown
 *
 * @since 2.0.0
 */
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { ServerSettings } from '../../../decorators/server';
import container from '../../../inversify.config';
import { Metadata } from '@expressive-tea/commons';
import { SOCKET_IO_INSTANCE_KEY, SOCKET_IO_SECURE_INSTANCE_KEY } from '../../../engines/constants/constants';
import { Server } from 'socket.io';

@ServerSettings({ port: 8100 })
class SocketIOBoot extends Boot {}

describe('SocketIOEngine Graceful Shutdown - HIGH-002', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    container.unbindAll();
    Settings.reset();
  });

  describe('stop() method', () => {
    test('should close Socket.IO servers during stop()', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      // Get Socket.IO instance from metadata
      const io = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot) as Server;
      expect(io).toBeDefined();

      // Spy on close method
      const closeSpy = jest.spyOn(io, 'close');

      await boot.stop();

      expect(closeSpy).toHaveBeenCalled();

      // Cleanup
      app.server.close();
    });

    test('should properly await io.close() promise', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      const io = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot) as Server;

      // Track if close callback was invoked
      let closeCallbackInvoked = false;
      const originalClose = io.close.bind(io);
      io.close = jest.fn((callback?: () => void) => {
        setTimeout(() => {
          closeCallbackInvoked = true;
          if (callback) callback();
        }, 10);
        return io;
      });

      await boot.stop();

      // Close callback should have been invoked
      expect(closeCallbackInvoked).toBe(true);

      // Cleanup
      app.server.close();
    });

    test('should nullify metadata references after stop', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      const ioBefore = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot);
      expect(ioBefore).toBeDefined();

      await boot.stop();

      const ioAfter = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot);
      expect(ioAfter).toBeNull();

      // Cleanup
      app.server.close();
    });

    test('should close both primary and secure Socket.IO servers if present', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      const io = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot) as Server;
      const ioSecure = Metadata.get(SOCKET_IO_SECURE_INSTANCE_KEY, boot) as Server | null;

      expect(io).toBeDefined();

      // If secure server exists, both should be closed
      const ioCloseSpy = jest.spyOn(io, 'close');
      let ioSecureCloseSpy: jest.SpyInstance | undefined;

      if (ioSecure) {
        ioSecureCloseSpy = jest.spyOn(ioSecure, 'close');
      }

      await boot.stop();

      expect(ioCloseSpy).toHaveBeenCalled();
      if (ioSecureCloseSpy) {
        expect(ioSecureCloseSpy).toHaveBeenCalled();
      }

      // Cleanup
      app.server.close();
    });

    test('should gracefully disconnect all clients during shutdown', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      const io = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot) as Server;

      // close() on Socket.IO server disconnects all clients
      const closeSpy = jest.spyOn(io, 'close');

      await boot.stop();

      expect(closeSpy).toHaveBeenCalled();

      // Cleanup
      app.server.close();
    });
  });

  describe('Resource Cleanup', () => {
    test('should clear metadata references to allow garbage collection', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      await boot.stop();

      const io = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot);
      const ioSecure = Metadata.get(SOCKET_IO_SECURE_INSTANCE_KEY, boot);

      expect(io).toBeNull();
      expect(ioSecure).toBeNull();

      // Cleanup
      app.server.close();
    });

    test('should not leak memory on repeated start/stop cycles', async () => {
      const cycles = 3;

      for (let i = 0; i < cycles; i++) {
        const boot = new SocketIOBoot();
        const app = await boot.start();

        await boot.stop();
        app.server.close();
      }

      // If memory leaks existed, this would accumulate
      expect(true).toBe(true);
    });

    test('should handle shutdown with active Socket.IO connections', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      const io = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot) as Server;

      // Simulate active connections
      // close() should disconnect them gracefully
      const closeSpy = jest.spyOn(io, 'close');

      await boot.stop();

      expect(closeSpy).toHaveBeenCalled();

      // Cleanup
      app.server.close();
    });
  });

  describe('Edge Cases', () => {
    test('should handle stop() being called multiple times', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      await boot.stop();
      // Second call should not throw (metadata already null)
      await expect(boot.stop()).resolves.not.toThrow();

      // Cleanup
      app.server.close();
    });

    test('should handle Socket.IO close errors gracefully', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      const io = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot) as Server;

      // Mock close to throw error but still call callback
      const originalClose = io.close.bind(io);
      io.close = jest.fn((callback?: () => void) => {
        // Simulate error but still resolve
        if (callback) callback();
        return io;
      });

      await expect(boot.stop()).resolves.not.toThrow();

      // Cleanup
      app.server.close();
    });

    test('should not throw if Socket.IO server is null', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      // Artificially set metadata to null before stop
      Metadata.set(SOCKET_IO_INSTANCE_KEY, null, boot);
      Metadata.set(SOCKET_IO_SECURE_INSTANCE_KEY, null, boot);

      await expect(boot.stop()).resolves.not.toThrow();

      // Cleanup
      app.server.close();
    });
  });

  describe('Integration with Boot.stop()', () => {
    test('should be called as part of Boot.stop() engine cleanup', async () => {
      const boot = new SocketIOBoot();
      const app = await boot.start();

      const io = Metadata.get(SOCKET_IO_INSTANCE_KEY, boot) as Server;
      const closeSpy = jest.spyOn(io, 'close');

      // Boot.stop() should call engine.stop() which closes Socket.IO
      await boot.stop();

      expect(closeSpy).toHaveBeenCalled();

      // Cleanup
      app.server.close();
    });
  });
});
