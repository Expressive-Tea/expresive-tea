/**
 * Unit tests for mixins/proxy.ts
 *
 * Tests the Proxify mixin that wraps a base class with HTTP proxy capabilities.
 *
 * express-http-proxy is mocked to avoid real HTTP proxying.
 * logger is mocked to suppress output.
 * DependencyInjection container interactions are allowed (real container with cleanup).
 */

// Hoist mock objects to make them accessible in test assertions
const mockProxyHandler = vi.hoisted(() => vi.fn());
const mockHttpProxy = vi.hoisted(() => vi.fn(() => mockProxyHandler));

// Mock express-http-proxy default export
vi.mock('express-http-proxy', () => {
  return { default: mockHttpProxy };
});

vi.mock('@helpers/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

import { Metadata, PROXY_SETTING_KEY } from '@expressive-tea/commons';
import { Proxify } from '../../../mixins/proxy';
import DependencyInjection from '../../../services/DependencyInjection';
import logger from '../../../helpers/logger';

describe('Proxify mixin', () => {
  afterEach(() => {
    // Clean up DI container bindings to prevent test interference
    try {
      DependencyInjection.Container.unbindAll();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('class transformation', () => {
    test('should return a constructor function', () => {
      class BaseProxy {}

      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://api.example.com');

      expect(typeof ProxiedClass).toBe('function');
    });

    test('should return a class that extends the base class', () => {
      class BaseProxy {
        greet() {
          return 'hello';
        }
      }

      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://api.example.com');
      const instance = new ProxiedClass();

      expect(instance).toBeInstanceOf(BaseProxy);
    });

    test('should preserve base class methods on instances', () => {
      class BaseProxy {
        baseMethod() {
          return 'from-base';
        }
      }

      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://api.example.com');
      const instance = new ProxiedClass() as any;

      expect(instance.baseMethod()).toBe('from-base');
    });
  });

  describe('proxy instance properties', () => {
    test('should set the source property from the source argument', () => {
      class BaseProxy {}

      const ProxiedClass = Proxify(BaseProxy, '/my-service', 'http://service.com');
      const instance = new ProxiedClass();

      expect(instance.source).toBe('/my-service');
    });

    test('should set the target property from the targetUrl argument', () => {
      class BaseProxy {}

      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://target.api.com');
      const instance = new ProxiedClass();

      expect(instance.target).toBe('http://target.api.com');
    });

    test('should create a proxyHandler using httpProxy with the target URL', () => {
      class BaseProxy {}

      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://target.api.com');
      new ProxiedClass();

      expect(mockHttpProxy).toHaveBeenCalledWith('http://target.api.com');
    });

    test('should assign the proxyHandler returned by httpProxy', () => {
      class BaseProxy {}

      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://example.com');
      const instance = new ProxiedClass();

      expect(instance.proxyHandler).toBe(mockProxyHandler);
    });
  });

  describe('__register method', () => {
    test('should call server.use with the source path and proxy handler', () => {
      class BaseProxy {}

      const metaGetSpy = vi.spyOn(Metadata, 'get').mockImplementation((_key, _target, option) => {
        if (option) return undefined;
        return {
          name: 'BaseProxy',
          source: '/api',
          targetUrl: 'http://example.com'
        };
      });

      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://example.com');
      const instance = new ProxiedClass();
      const mockServer = { use: vi.fn() } as any;

      instance.__register(mockServer);

      expect(mockServer.use).toHaveBeenCalledWith('/api', instance.proxyHandler);
      metaGetSpy.mockRestore();
    });

    test('should log proxy registration info', () => {
      class BaseProxy {}

      vi.spyOn(Metadata, 'get').mockImplementation((_key, _target, option) => {
        if (option) return undefined;
        return {
          name: 'BaseProxy',
          source: '/api',
          targetUrl: 'http://example.com'
        };
      });

      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://example.com');
      const instance = new ProxiedClass();
      const mockServer = { use: vi.fn() } as any;

      instance.__register(mockServer);

      expect(logger.info).toHaveBeenCalled();
    });

    test('should use instance source in server.use call', () => {
      class BaseProxy {}

      vi.spyOn(Metadata, 'get').mockImplementation((_key, _target, option) => {
        if (option) return undefined;
        return {
          name: 'BaseProxy',
          source: '/services',
          targetUrl: 'http://svc.com'
        };
      });

      const ProxiedClass = Proxify(BaseProxy, '/services', 'http://svc.com');
      const instance = new ProxiedClass();
      const mockServer = { use: vi.fn() } as any;

      instance.__register(mockServer);

      const [path] = (mockServer.use as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(path).toBe('/services');
    });
  });

  describe('DI container binding', () => {
    test('should attempt to bind the proxied class to the DI container', () => {
      const bindSpy = vi.spyOn(DependencyInjection.Container, 'bind').mockReturnValue({
        to: vi.fn()
      } as any);
      vi.spyOn(DependencyInjection.Container, 'isBound').mockReturnValue(false);

      class BaseProxy {}
      Proxify(BaseProxy, '/api', 'http://example.com');

      expect(bindSpy).toHaveBeenCalledWith(BaseProxy);
    });

    test('should unbind existing binding before rebinding', () => {
      const unbindSpy = vi.spyOn(DependencyInjection.Container, 'unbind').mockReturnValue(undefined as any);
      vi.spyOn(DependencyInjection.Container, 'isBound').mockReturnValue(true);
      vi.spyOn(DependencyInjection.Container, 'bind').mockReturnValue({ to: vi.fn() } as any);

      class BaseProxy {}
      Proxify(BaseProxy, '/api', 'http://example.com');

      expect(unbindSpy).toHaveBeenCalledWith(BaseProxy);
    });

    test('should silently handle DI container binding errors', () => {
      vi.spyOn(DependencyInjection.Container, 'isBound').mockImplementation(() => {
        throw new Error('Container error');
      });

      class BaseProxy {}

      // Should not throw even if DI binding fails
      expect(() => {
        Proxify(BaseProxy, '/api', 'http://example.com');
      }).not.toThrow();
    });
  });

  describe('host metadata', () => {
    test('should use host.value as proxy target when host metadata exists', () => {
      const mockHostFn = vi.fn().mockReturnValue('http://dynamic-host.com');
      const hostDescriptor = { value: mockHostFn };

      vi.spyOn(Metadata, 'get').mockImplementation((_key, _target, option) => {
        if (option === 'host') return hostDescriptor;
        return undefined;
      });

      class BaseProxy {}
      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://default.com');
      new ProxiedClass();

      // httpProxy should be called with the bound host function (not the default target)
      const callArg = (mockHttpProxy as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      // The argument should be a bound function (when host is set), not a string
      expect(typeof callArg).toBe('function');
    });

    test('should use the target URL as proxy target when no host metadata exists', () => {
      vi.spyOn(Metadata, 'get').mockReturnValue(undefined);

      class BaseProxy {}
      const ProxiedClass = Proxify(BaseProxy, '/api', 'http://default-target.com');
      new ProxiedClass();

      const callArg = (mockHttpProxy as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(callArg).toBe('http://default-target.com');
    });
  });
});
