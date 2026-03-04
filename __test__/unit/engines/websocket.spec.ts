/**
 * WebsocketEngine Unit Tests
 *
 * Tests for WebSocket engine conditional initialization, WebSocket server
 * creation (attached and detached modes), and graceful shutdown.
 *
 * @since 2.0.0
 */
import WebsocketEngine from '../../../engines/websocket';
import WebsocketService from '../../../services/WebsocketService';
import Settings from '../../../classes/Settings';

// ---------------------------------------------------------------------------
// Mock 'ws' module.
//
// WebsocketEngine imports:  import { WebSocketServer } from 'ws'
// And uses:                 new WebSocketServer({ ... })
//
// We provide a minimal constructable Server class.
// ---------------------------------------------------------------------------

vi.mock('ws', () => {
  class MockWsServer {
    close = vi.fn((cb?: () => void) => cb?.());
    clients = new Set();
  }

  return {
    // Default export is the ws class (also callable)
    default: vi.fn(),
    // Named export matching ws ESM wrapper
    WebSocketServer: MockWsServer
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEngine(settingsOverrides: Record<string, unknown> = {}) {
  const mockServer = { listen: vi.fn(), on: vi.fn(), close: vi.fn() };
  const mockContext = { getApplication: vi.fn() };
  const mockSettings = {
    get: vi.fn().mockImplementation((key: string) => settingsOverrides[key])
  };

  const engine = new WebsocketEngine();
  (engine as any).context = mockContext;
  (engine as any).server = mockServer;
  (engine as any).serverSecure = undefined;
  (engine as any).settings = mockSettings;

  return { engine, mockServer, mockContext, mockSettings };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WebsocketEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    WebsocketService.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    WebsocketService.clear();
  });

  // -------------------------------------------------------------------------
  describe('init()', () => {
    test('should set canStart=false when startWebsocket is not configured', async () => {
      const { engine } = makeEngine({ startWebsocket: undefined });

      await engine.init();

      expect((engine as any).canStart).toBe(false);
    });

    test('should set canStart=false when startWebsocket is false', async () => {
      const { engine } = makeEngine({ startWebsocket: false });

      await engine.init();

      expect((engine as any).canStart).toBe(false);
    });

    test('should set canStart=true when startWebsocket is true', async () => {
      const { engine } = makeEngine({ startWebsocket: true });

      await engine.init();

      expect((engine as any).canStart).toBe(true);
    });

    test('should not initialize WebsocketService when startWebsocket is false', async () => {
      const { engine } = makeEngine({ startWebsocket: false });
      const initSpy = vi.spyOn(WebsocketService, 'init');

      await engine.init();

      expect(initSpy).not.toHaveBeenCalled();
    });

    test('should call WebsocketService.init() when startWebsocket is true', async () => {
      const { engine } = makeEngine({ startWebsocket: true });
      const initSpy = vi.spyOn(WebsocketService, 'init');

      await engine.init();

      expect(initSpy).toHaveBeenCalled();
    });

    test('should create a WebSocket server when startWebsocket is true', async () => {
      const { engine, mockServer } = makeEngine({ startWebsocket: true });

      await engine.init();

      const ws = WebsocketService.getInstance().getWebsocket(mockServer as any);
      expect(ws).toBeDefined();
    });

    test('should call setHttpServer with HTTP server', async () => {
      const { engine, mockServer } = makeEngine({ startWebsocket: true });
      const setHttpSpy = vi.spyOn(WebsocketService.getInstance(), 'setHttpServer');

      await engine.init();

      expect(setHttpSpy).toHaveBeenCalledWith(mockServer);
    });

    test('should set isDetached=true when detachWebsocket setting is truthy', async () => {
      const { engine } = makeEngine({ startWebsocket: true, detachWebsocket: true });

      await engine.init();

      expect((engine as any).isDetached).toBe(true);
    });

    test('should set isDetached=false when detachWebsocket is not set', async () => {
      const { engine } = makeEngine({ startWebsocket: true, detachWebsocket: undefined });

      await engine.init();

      expect((engine as any).isDetached).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('stop()', () => {
    test('should return early without throwing when canStart is false', async () => {
      const { engine } = makeEngine({ startWebsocket: false });
      await engine.init();

      await expect(engine.stop()).resolves.not.toThrow();
    });

    test('should not call WebsocketService.clear() when canStart is false', async () => {
      const { engine } = makeEngine({ startWebsocket: false });
      await engine.init();
      const clearSpy = vi.spyOn(WebsocketService, 'clear');

      await engine.stop();

      expect(clearSpy).not.toHaveBeenCalled();
    });

    test('should close the WebSocket server during stop', async () => {
      const { engine, mockServer } = makeEngine({ startWebsocket: true });
      await engine.init();

      const ws = WebsocketService.getInstance().getWebsocket(mockServer as any);
      const closeSpy = vi.spyOn(ws!, 'close');

      await engine.stop();

      expect(closeSpy).toHaveBeenCalled();
    });

    test('should call WebsocketService.clear() after stopping', async () => {
      const { engine } = makeEngine({ startWebsocket: true });
      await engine.init();
      const clearSpy = vi.spyOn(WebsocketService, 'clear');

      await engine.stop();

      expect(clearSpy).toHaveBeenCalled();
    });

    test('should await ws.close() to complete before returning', async () => {
      const { engine, mockServer } = makeEngine({ startWebsocket: true });
      await engine.init();

      let closedAt = 0;
      const ws = WebsocketService.getInstance().getWebsocket(mockServer as any)!;
      ws.close = vi.fn((cb?: () => void) => {
        setTimeout(() => {
          closedAt = Date.now();
          cb?.();
        }, 10);
      });

      const before = Date.now();
      await engine.stop();

      expect(closedAt).toBeGreaterThanOrEqual(before);
    });
  });

  // -------------------------------------------------------------------------
  describe('canRegister()', () => {
    test('should return false when settings is undefined', () => {
      expect(WebsocketEngine.canRegister(undefined, undefined)).toBe(false);
    });

    test('should return false when startWebsocket is not set', () => {
      const settings = { get: vi.fn().mockReturnValue(undefined) } as unknown as Settings;
      expect(WebsocketEngine.canRegister(undefined, settings)).toBe(false);
    });

    test('should return false when startWebsocket is false', () => {
      const settings = { get: vi.fn().mockReturnValue(false) } as unknown as Settings;
      expect(WebsocketEngine.canRegister(undefined, settings)).toBe(false);
    });

    test('should return true when startWebsocket is true', () => {
      const settings = { get: vi.fn().mockReturnValue(true) } as unknown as Settings;
      expect(WebsocketEngine.canRegister(undefined, settings)).toBe(true);
    });

    test('should return true when startWebsocket is a truthy value', () => {
      const settings = { get: vi.fn().mockReturnValue(1) } as unknown as Settings;
      expect(WebsocketEngine.canRegister(undefined, settings)).toBe(true);
    });
  });
});
