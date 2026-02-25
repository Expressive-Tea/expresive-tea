/**
 * SocketIOEngine Unit Tests
 *
 * Tests for Socket.IO engine initialization, metadata management,
 * and graceful shutdown.
 *
 * @since 2.0.0
 */
import SocketIOEngine from '../../../engines/socketio';
import { Metadata } from '@expressive-tea/commons';
import { SOCKET_IO_INSTANCE_KEY, SOCKET_IO_SECURE_INSTANCE_KEY } from '../../../engines/constants/constants';
import { Server as SocketIOServer } from 'socket.io';

// ---------------------------------------------------------------------------
// Mock socket.io so we never try to attach to a real HTTP server.
// SocketIOEngine does: new Server(httpServer, config)
// ---------------------------------------------------------------------------

vi.mock('socket.io', () => {
  const MockServer = vi.fn().mockImplementation(() => ({
    close: vi.fn((cb?: () => void) => cb?.())
  }));
  return { Server: MockServer };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEngine() {
  const mockServer = { listen: vi.fn(), on: vi.fn(), close: vi.fn() };
  const mockContext = {
    getApplication: vi.fn().mockReturnValue({ use: vi.fn(), get: vi.fn(), set: vi.fn() })
  };
  const mockSettings = { get: vi.fn() };

  const engine = new SocketIOEngine();
  (engine as any).context = mockContext;
  (engine as any).server = mockServer;
  (engine as any).serverSecure = undefined;
  (engine as any).settings = mockSettings;

  return { engine, mockServer, mockContext, mockSettings };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SocketIOEngine', () => {
  const MockServer = vi.mocked(SocketIOServer);

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore the mock implementation after clearAllMocks resets it
    MockServer.mockImplementation(() => ({
      close: vi.fn((cb?: () => void) => cb?.())
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  describe('init()', () => {
    test('should create a Socket.IO server instance', async () => {
      const { engine } = makeEngine();

      await engine.init();

      const io = (engine as any).io;
      expect(io).toBeDefined();
      expect(io.close).toBeDefined();
    });

    test('should pass HTTP server to Socket.IO Server constructor', async () => {
      const { engine, mockServer } = makeEngine();

      await engine.init();

      expect(MockServer).toHaveBeenCalledWith(mockServer, expect.objectContaining({ path: '/exp-tea/' }));
    });

    test('should configure /exp-tea/ as the Socket.IO path', async () => {
      const { engine } = makeEngine();

      await engine.init();

      const [, config] = MockServer.mock.calls[0];
      expect(config.path).toBe('/exp-tea/');
    });

    test('should configure websocket and polling transports', async () => {
      const { engine } = makeEngine();

      await engine.init();

      const [, config] = MockServer.mock.calls[0];
      expect(config.transports).toContain('websocket');
      expect(config.transports).toContain('polling');
    });

    test('should store Socket.IO instance in metadata', async () => {
      const { engine, mockContext } = makeEngine();
      const setMetaSpy = vi.spyOn(Metadata, 'set');

      await engine.init();

      expect(setMetaSpy).toHaveBeenCalledWith(SOCKET_IO_INSTANCE_KEY, expect.anything(), mockContext);
    });

    test('should leave ioSecure falsy when no secure server is configured', async () => {
      const { engine } = makeEngine();

      await engine.init();

      expect((engine as any).ioSecure).toBeFalsy();
    });

    test('should create a secure Socket.IO server when a secure HTTP server exists', async () => {
      const { engine } = makeEngine();
      const mockSecureServer = { listen: vi.fn(), on: vi.fn(), close: vi.fn() };
      (engine as any).serverSecure = mockSecureServer;

      await engine.init();

      // Two Server instances: one HTTP, one HTTPS
      expect(MockServer).toHaveBeenCalledTimes(2);
    });

    test('should store secure Socket.IO metadata when secure server exists', async () => {
      const { engine, mockContext } = makeEngine();
      const mockSecureServer = { listen: vi.fn(), on: vi.fn(), close: vi.fn() };
      (engine as any).serverSecure = mockSecureServer;
      const setMetaSpy = vi.spyOn(Metadata, 'set');

      await engine.init();

      expect(setMetaSpy).toHaveBeenCalledWith(SOCKET_IO_SECURE_INSTANCE_KEY, expect.anything(), mockContext);
    });
  });

  // -------------------------------------------------------------------------
  describe('stop()', () => {
    test('should close primary Socket.IO server', async () => {
      const { engine } = makeEngine();
      const mockIo = { close: vi.fn((cb?: () => void) => cb?.()) };
      (engine as any).io = mockIo;

      await engine.stop();

      expect(mockIo.close).toHaveBeenCalled();
    });

    test('should await io.close() to complete before returning', async () => {
      const { engine } = makeEngine();
      let closedAt = 0;
      const mockIo = {
        close: vi.fn((cb?: () => void) => {
          setTimeout(() => {
            closedAt = Date.now();
            cb?.();
          }, 20);
        })
      };
      (engine as any).io = mockIo;

      const before = Date.now();
      await engine.stop();

      expect(closedAt).toBeGreaterThanOrEqual(before);
    });

    test('should clear SOCKET_IO_INSTANCE_KEY metadata after stop', async () => {
      const { engine, mockContext } = makeEngine();
      (engine as any).io = { close: vi.fn((cb?: () => void) => cb?.()) };
      const setMetaSpy = vi.spyOn(Metadata, 'set');

      await engine.stop();

      expect(setMetaSpy).toHaveBeenCalledWith(SOCKET_IO_INSTANCE_KEY, null, mockContext);
    });

    test('should clear SOCKET_IO_SECURE_INSTANCE_KEY metadata after stop', async () => {
      const { engine, mockContext } = makeEngine();
      (engine as any).io = { close: vi.fn((cb?: () => void) => cb?.()) };
      const setMetaSpy = vi.spyOn(Metadata, 'set');

      await engine.stop();

      expect(setMetaSpy).toHaveBeenCalledWith(SOCKET_IO_SECURE_INSTANCE_KEY, null, mockContext);
    });

    test('should not throw when io is not initialized', async () => {
      const { engine } = makeEngine();
      (engine as any).io = undefined;

      await expect(engine.stop()).resolves.not.toThrow();
    });

    test('should close secure Socket.IO server if present', async () => {
      const { engine } = makeEngine();
      const mockIo = { close: vi.fn((cb?: () => void) => cb?.()) };
      const mockIoSecure = { close: vi.fn((cb?: () => void) => cb?.()) };
      (engine as any).io = mockIo;
      (engine as any).ioSecure = mockIoSecure;

      await engine.stop();

      expect(mockIo.close).toHaveBeenCalled();
      expect(mockIoSecure.close).toHaveBeenCalled();
    });

    test('should not throw when ioSecure is not initialized', async () => {
      const { engine } = makeEngine();
      (engine as any).io = { close: vi.fn((cb?: () => void) => cb?.()) };
      (engine as any).ioSecure = undefined;

      await expect(engine.stop()).resolves.not.toThrow();
    });

    test('should clear both metadata keys even without io instances', async () => {
      const { engine, mockContext } = makeEngine();
      (engine as any).io = undefined;
      (engine as any).ioSecure = undefined;
      const setMetaSpy = vi.spyOn(Metadata, 'set');

      await engine.stop();

      expect(setMetaSpy).toHaveBeenCalledWith(SOCKET_IO_INSTANCE_KEY, null, mockContext);
      expect(setMetaSpy).toHaveBeenCalledWith(SOCKET_IO_SECURE_INSTANCE_KEY, null, mockContext);
    });
  });

  // -------------------------------------------------------------------------
  describe('canRegister()', () => {
    test('should always return true', () => {
      expect(SocketIOEngine.canRegister()).toBe(true);
    });
  });
});
