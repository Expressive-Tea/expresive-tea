/**
 * Unit tests for mixins/module.ts (Modulize)
 *
 * Tests the Modulize mixin which transforms a class into an Expressive Tea module
 * with DI support, router management, and controller registration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modulize } from '../../../mixins/module';
import DependencyInjection from '../../../services/DependencyInjection';

describe('Modulize Mixin', () => {
  let mockMount: ReturnType<typeof vi.fn>;
  let MockController: new () => { __mount: ReturnType<typeof vi.fn> };
  let MockProvider: new () => object;

  beforeEach(() => {
    mockMount = vi.fn();
    // Controller factory that creates objects with __mount method
    MockController = vi.fn().mockImplementation(() => ({
      __mount: mockMount
    })) as any;
    MockProvider = class MockProvider {};
    // Clean the DI container between tests
    DependencyInjection.Container.unbindAll();
  });

  afterEach(() => {
    DependencyInjection.Container.unbindAll();
  });

  describe('class transformation', () => {
    test('should return a class (constructor)', () => {
      class BaseModule {}

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [],
        mountpoint: '/'
      });

      expect(ModulizedModule).toBeTypeOf('function');
    });

    test('should produce instances with settings property', () => {
      class BaseModule {}
      const options = { controllers: [], mountpoint: '/api' };

      const ModulizedModule = Modulize(BaseModule, options);
      const instance = new ModulizedModule();

      expect(instance.settings).toEqual(options);
    });

    test('should produce instances with a router property', () => {
      class BaseModule {}

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [],
        mountpoint: '/'
      });
      const instance = new ModulizedModule();

      expect(instance.router).toBeDefined();
      // Router should have express Router methods
      expect(typeof instance.router.get).toBe('function');
      expect(typeof instance.router.post).toBe('function');
      expect(typeof instance.router.use).toBe('function');
    });

    test('should instantiate controllers on module creation', () => {
      class BaseModule {}

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [MockController],
        mountpoint: '/'
      });

      new ModulizedModule();
      expect(MockController).toHaveBeenCalledOnce();
    });

    test('should store controller instances in the controllers array', () => {
      class BaseModule {}

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [MockController],
        mountpoint: '/'
      });

      const instance = new ModulizedModule();
      expect(instance.controllers).toHaveLength(1);
    });

    test('should handle modules with no controllers', () => {
      class BaseModule {}

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [],
        mountpoint: '/'
      });

      const instance = new ModulizedModule();
      expect(instance.controllers).toHaveLength(0);
    });

    test('should register providers in the DI container', () => {
      const bindSpy = vi.spyOn(DependencyInjection.Container, 'bind');

      class BaseModule {}

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [],
        providers: [MockProvider],
        mountpoint: '/'
      });

      new ModulizedModule();

      // DependencyInjection.setProvider calls Container.bind
      expect(bindSpy).toHaveBeenCalled();
    });

    test('should handle modules with no providers', () => {
      class BaseModule {}

      expect(() => {
        const ModulizedModule = Modulize(BaseModule, {
          controllers: [],
          mountpoint: '/'
        });
        new ModulizedModule();
      }).not.toThrow();
    });
  });

  describe('__register()', () => {
    test('should mount controllers on the module router', () => {
      class BaseModule {}

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [MockController],
        mountpoint: '/'
      });

      const instance = new ModulizedModule();
      const mockServer = { use: vi.fn() } as any;

      instance.__register(mockServer);

      expect(mockMount).toHaveBeenCalledWith(instance.router);
    });

    test('should use the express server with correct mountpoint', () => {
      class BaseModule {}
      const mountpoint = '/api/v1';

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [MockController],
        mountpoint
      });

      const instance = new ModulizedModule();
      const mockServer = { use: vi.fn() } as any;

      instance.__register(mockServer);

      expect(mockServer.use).toHaveBeenCalledWith(mountpoint, instance.router);
    });

    test('should mount all controllers', () => {
      class BaseModule {}

      const mockMount2 = vi.fn();
      const MockController2 = vi.fn().mockImplementation(() => ({
        __mount: mockMount2
      })) as any;

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [MockController, MockController2],
        mountpoint: '/'
      });

      const instance = new ModulizedModule();
      const mockServer = { use: vi.fn() } as any;

      instance.__register(mockServer);

      expect(mockMount).toHaveBeenCalledOnce();
      expect(mockMount2).toHaveBeenCalledOnce();
    });

    test('should do nothing for empty controllers array', () => {
      class BaseModule {}

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [],
        mountpoint: '/empty'
      });

      const instance = new ModulizedModule();
      const mockServer = { use: vi.fn() } as any;

      instance.__register(mockServer);

      expect(mockServer.use).toHaveBeenCalledWith('/empty', instance.router);
    });
  });

  describe('base class inheritance', () => {
    test('should preserve base class methods', () => {
      class BaseModule {
        greet() {
          return 'hello';
        }
      }

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [],
        mountpoint: '/'
      });

      const instance = new ModulizedModule() as any;
      expect(instance.greet()).toBe('hello');
    });

    test('should handle base class with properties', () => {
      class BaseModule {
        name = 'base';
      }

      const ModulizedModule = Modulize(BaseModule, {
        controllers: [],
        mountpoint: '/'
      });

      const instance = new ModulizedModule() as any;
      expect(instance.name).toBe('base');
    });
  });
});
