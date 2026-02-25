/**
 * HTTPEngine Unit Tests
 *
 * Tests for HTTP engine initialization, start, stop lifecycle,
 * proxy container resolution, and stage execution.
 *
 * @since 2.0.0
 */
import HTTPEngine from '../../../engines/http';
import { BOOT_STAGES, BOOT_ORDER } from '@expressive-tea/commons';
import * as bootHelper from '../../../helpers/boot-helper';

vi.mock('../../../helpers/boot-helper');

function makeEngine() {
  const mockApp = {
    use: vi.fn(),
    get: vi.fn(),
    set: vi.fn()
  };

  const mockServer = {
    listen: vi.fn(),
    close: vi.fn((cb?: (err?: Error) => void) => cb?.()),
    removeAllListeners: vi.fn(),
    on: vi.fn()
  };

  const mockContext = {
    getApplication: vi.fn().mockReturnValue(mockApp)
  };

  const mockSettings = {
    get: vi.fn().mockReturnValue(3000)
  };

  const engine = new HTTPEngine();
  (engine as any).context = mockContext;
  (engine as any).server = mockServer;
  (engine as any).serverSecure = undefined;
  (engine as any).settings = mockSettings;

  return { engine, mockApp, mockServer, mockContext, mockSettings };
}

describe('HTTPEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('init()', () => {
    test('should call resolveDirectives with context and app', async () => {
      const { engine, mockContext, mockApp } = makeEngine();
      const mockedResolveDirectives = vi.mocked(bootHelper.resolveDirectives);

      await engine.init();

      expect(mockedResolveDirectives).toHaveBeenCalledWith(mockContext, mockApp);
    });

    test('should call resolveStatic with context and app', async () => {
      const { engine, mockContext, mockApp } = makeEngine();
      const mockedResolveStatic = vi.mocked(bootHelper.resolveStatic);

      await engine.init();

      expect(mockedResolveStatic).toHaveBeenCalledWith(mockContext, mockApp);
    });

    test('should call resolveProxyContainers during init', async () => {
      const { engine } = makeEngine();
      const resolveProxyContainersSpy = vi.spyOn(engine, 'resolveProxyContainers');

      await engine.init();

      expect(resolveProxyContainersSpy).toHaveBeenCalled();
    });

    test('should resolve BOOT_ORDER stages sequentially', async () => {
      const { engine } = makeEngine();
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);
      const stagesCalled: BOOT_STAGES[] = [];

      mockedResolveStage.mockImplementation(async (stage) => {
        stagesCalled.push(stage);
      });

      await engine.init();

      // BOOT_ORDER = [BOOT_DEPENDENCIES, INITIALIZE_MIDDLEWARES, APPLICATION]
      expect(stagesCalled).toContain(BOOT_STAGES.BOOT_DEPENDENCIES);
      expect(stagesCalled).toContain(BOOT_STAGES.INITIALIZE_MIDDLEWARES);
      expect(stagesCalled).toContain(BOOT_STAGES.APPLICATION);
    });

    test('should resolve AFTER_APPLICATION_MIDDLEWARES with HTTP server', async () => {
      const { engine, mockContext, mockApp, mockServer } = makeEngine();
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      await engine.init();

      expect(mockedResolveStage).toHaveBeenCalledWith(
        BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES,
        mockContext,
        mockApp,
        mockServer,
        undefined // no secure server
      );
    });

    test('should resolve ON_HTTP_CREATION stage with HTTP server', async () => {
      const { engine, mockContext, mockApp, mockServer } = makeEngine();
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      await engine.init();

      expect(mockedResolveStage).toHaveBeenCalledWith(
        BOOT_STAGES.ON_HTTP_CREATION,
        mockContext,
        mockApp,
        mockServer,
        undefined
      );
    });

    test('should pass both HTTP and HTTPS servers when secure server exists', async () => {
      const { engine, mockContext, mockApp, mockServer } = makeEngine();
      const mockSecureServer = { listen: vi.fn(), close: vi.fn(), removeAllListeners: vi.fn(), on: vi.fn() };
      (engine as any).serverSecure = mockSecureServer;
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      await engine.init();

      expect(mockedResolveStage).toHaveBeenCalledWith(
        BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES,
        mockContext,
        mockApp,
        mockServer,
        mockSecureServer
      );
    });
  });

  describe('start()', () => {
    test('should listen on HTTP server with configured port', async () => {
      const { engine, mockServer, mockSettings } = makeEngine();
      mockSettings.get.mockReturnValue(4000);
      mockServer.on = vi.fn((event: string, cb: (...args: any[]) => void) => {
        if (event === 'listening') cb();
      });

      await engine.start();

      expect(mockServer.listen).toHaveBeenCalledWith(4000);
    });

    test('should return array containing HTTP server', async () => {
      const { engine, mockServer } = makeEngine();
      mockServer.on = vi.fn((event: string, cb: (...args: any[]) => void) => {
        if (event === 'listening') cb();
      });

      const result = await engine.start();

      expect(result).toContain(mockServer);
    });

    test('should resolve START stage after servers listen', async () => {
      const { engine, mockServer } = makeEngine();
      mockServer.on = vi.fn((event: string, cb: (...args: any[]) => void) => {
        if (event === 'listening') cb();
      });
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      await engine.start();

      expect(mockedResolveStage).toHaveBeenCalledWith(
        BOOT_STAGES.START,
        expect.anything(),
        expect.anything(),
        mockServer
      );
    });

    test('should reject when server emits error', async () => {
      const { engine, mockServer } = makeEngine();
      const listenError = new Error('EADDRINUSE');
      mockServer.on = vi.fn((event: string, cb: (...args: any[]) => void) => {
        if (event === 'error') cb(listenError);
      });

      await expect(engine.start()).rejects.toThrow('EADDRINUSE');
    });

    test('should not include null (absent secure server) in result', async () => {
      const { engine, mockServer } = makeEngine();
      // serverSecure is undefined
      mockServer.on = vi.fn((event: string, cb: (...args: any[]) => void) => {
        if (event === 'listening') cb();
      });

      const result = await engine.start();

      expect(result.length).toBe(1);
      expect(result[0]).toBe(mockServer);
    });

    test('should also listen on secure server when it exists', async () => {
      const { engine, mockServer } = makeEngine();
      const mockSecureServer = {
        listen: vi.fn(),
        on: vi.fn((event: string, cb: (...args: any[]) => void) => {
          if (event === 'listening') cb();
        }),
        close: vi.fn(),
        removeAllListeners: vi.fn()
      };
      (engine as any).serverSecure = mockSecureServer;
      (engine as any).settings = { get: vi.fn().mockImplementation((key: string) => (key === 'securePort' ? 4443 : 4000)) };

      mockServer.on = vi.fn((event: string, cb: (...args: any[]) => void) => {
        if (event === 'listening') cb();
      });

      const result = await engine.start();

      expect(mockSecureServer.listen).toHaveBeenCalledWith(4443);
      expect(result.length).toBe(2);
    });
  });

  describe('stop()', () => {
    test('should remove all listeners from HTTP server before closing', async () => {
      const { engine, mockServer } = makeEngine();

      await engine.stop();

      expect(mockServer.removeAllListeners).toHaveBeenCalled();
    });

    test('should close HTTP server', async () => {
      const { engine, mockServer } = makeEngine();

      await engine.stop();

      expect(mockServer.close).toHaveBeenCalled();
    });

    test('should not throw when server is undefined', async () => {
      const { engine } = makeEngine();
      (engine as any).server = undefined;

      await expect(engine.stop()).resolves.not.toThrow();
    });

    test('should close HTTPS server if present', async () => {
      const { engine } = makeEngine();
      const mockSecureServer = {
        close: vi.fn((cb?: (err?: Error) => void) => cb?.()),
        removeAllListeners: vi.fn()
      };
      (engine as any).serverSecure = mockSecureServer;

      await engine.stop();

      expect(mockSecureServer.close).toHaveBeenCalled();
      expect(mockSecureServer.removeAllListeners).toHaveBeenCalled();
    });

    test('should propagate server close errors', async () => {
      const { engine, mockServer } = makeEngine();
      mockServer.close = vi.fn((cb?: (err?: Error) => void) => cb?.(new Error('close failed')));

      await expect(engine.stop()).rejects.toThrow('close failed');
    });

    test('should properly await server.close callback', async () => {
      const { engine, mockServer } = makeEngine();
      let callbackCalled = false;
      mockServer.close = vi.fn((cb?: (err?: Error) => void) => {
        setTimeout(() => {
          callbackCalled = true;
          cb?.();
        }, 10);
      });

      await engine.stop();

      expect(callbackCalled).toBe(true);
    });
  });

  describe('resolveStages()', () => {
    test('should execute stages in order', async () => {
      const { engine } = makeEngine();
      const executionOrder: BOOT_STAGES[] = [];
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage) => {
        executionOrder.push(stage);
      });

      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.INITIALIZE_MIDDLEWARES, BOOT_STAGES.APPLICATION];
      await engine.resolveStages(stages);

      expect(executionOrder).toEqual([
        BOOT_STAGES.BOOT_DEPENDENCIES,
        BOOT_STAGES.INITIALIZE_MIDDLEWARES,
        BOOT_STAGES.APPLICATION
      ]);
    });

    test('should execute stages sequentially not in parallel', async () => {
      const { engine } = makeEngine();
      const completionOrder: string[] = [];
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage) => {
        completionOrder.push(`start-${stage}`);
        await new Promise((resolve) => setTimeout(resolve, 20));
        completionOrder.push(`end-${stage}`);
      });

      await engine.resolveStages([BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.APPLICATION]);

      expect(completionOrder).toEqual([
        `start-${BOOT_STAGES.BOOT_DEPENDENCIES}`,
        `end-${BOOT_STAGES.BOOT_DEPENDENCIES}`,
        `start-${BOOT_STAGES.APPLICATION}`,
        `end-${BOOT_STAGES.APPLICATION}`
      ]);
    });

    test('should handle empty stages array without calling resolveStage', async () => {
      const { engine } = makeEngine();
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      await engine.resolveStages([]);

      expect(mockedResolveStage).not.toHaveBeenCalled();
    });

    test('should pass context and app to each stage', async () => {
      const { engine, mockContext, mockApp } = makeEngine();
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      await engine.resolveStages([BOOT_STAGES.BOOT_DEPENDENCIES]);

      expect(mockedResolveStage).toHaveBeenCalledWith(BOOT_STAGES.BOOT_DEPENDENCIES, mockContext, mockApp);
    });

    test('should pass extra arguments to each stage', async () => {
      const { engine, mockContext, mockApp, mockServer } = makeEngine();
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);
      const extra = { data: 'extra' };

      await engine.resolveStages([BOOT_STAGES.START], mockServer, extra);

      expect(mockedResolveStage).toHaveBeenCalledWith(BOOT_STAGES.START, mockContext, mockApp, mockServer, extra);
    });

    test('should stop execution on stage error and not run remaining stages', async () => {
      const { engine } = makeEngine();
      const executed: BOOT_STAGES[] = [];
      const mockedResolveStage = vi.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage) => {
        executed.push(stage);
        if (stage === BOOT_STAGES.INITIALIZE_MIDDLEWARES) {
          throw new Error('Stage failed');
        }
      });

      await expect(
        engine.resolveStages([BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.INITIALIZE_MIDDLEWARES, BOOT_STAGES.APPLICATION])
      ).rejects.toThrow('Stage failed');

      expect(executed).toEqual([BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.INITIALIZE_MIDDLEWARES]);
      expect(executed).not.toContain(BOOT_STAGES.APPLICATION);
    });
  });

  describe('resolveProxyContainers()', () => {
    test('should not throw when no proxy containers are registered', () => {
      const { engine } = makeEngine();
      expect(() => engine.resolveProxyContainers()).not.toThrow();
    });

    test('should call resolveProxy for each registered proxy container', () => {
      const { engine } = makeEngine();
      const mockedResolveProxy = vi.mocked(bootHelper.resolveProxy);

      // Manually inject proxy containers via metadata mock
      const ProxyContainer = class {
        __register = vi.fn();
      };

      // Mock Metadata.get to return a proxy container
      const { Metadata } = require('@expressive-tea/commons');
      vi.spyOn(Metadata, 'get').mockReturnValue([ProxyContainer]);

      engine.resolveProxyContainers();

      expect(mockedResolveProxy).toHaveBeenCalledWith(ProxyContainer, expect.anything());
    });
  });

  describe('canRegister()', () => {
    test('should always return true', () => {
      expect(HTTPEngine.canRegister()).toBe(true);
    });
  });
});
