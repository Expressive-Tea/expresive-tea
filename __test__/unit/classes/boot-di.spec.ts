/**
 * Boot DI Integration Tests
 * Tests for getContainer(), registerProvider(), and registerConstant() methods
 * @since 2.0.0
 */
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { injectable } from 'inversify';
import container from '../../../inversify.config';

describe('Boot DI Integration (Phase 1)', () => {
  // Test services
  @injectable()
  class UserService {
    getUsers() {
      return ['Alice', 'Bob'];
    }
  }

  @injectable()
  class DatabaseService {
    constructor() {
      // Empty constructor
    }
    connect() {
      return 'connected';
    }
  }

  @injectable()
  class CacheService {
    private data = new Map<string, any>();
    
    set(key: string, value: any) {
      this.data.set(key, value);
    }
    
    get(key: string) {
      return this.data.get(key);
    }
  }

  afterEach(() => {
    container.unbindAll();
  });

  describe('getContainer()', () => {
    test('should return the DI container', () => {
      class TestApp extends Boot {}
      
      const app = new TestApp();
      const appContainer = app.getContainer();

      expect(appContainer).toBeDefined();
      expect(appContainer.bind).toBeDefined();
      expect(appContainer.get).toBeDefined();
    });

    test('should return independent containers for different instances', () => {
      class App1 extends Boot {}
      class App2 extends Boot {}

      const app1 = new App1();
      const app2 = new App2();

      const container1 = app1.getContainer();
      const container2 = app2.getContainer();

      expect(container1).not.toBe(container2);
    });
  });

  describe('registerProvider()', () => {
    test('should register a provider in the container', () => {
      class TestApp extends Boot {
        constructor() {
          super();
          this.registerProvider(UserService, UserService);
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();
      const userService = appContainer.get(UserService);

      expect(userService).toBeInstanceOf(UserService);
      expect(userService.getUsers()).toEqual(['Alice', 'Bob']);
    });

    test('should register provider with custom identifier', () => {
      class TestApp extends Boot {
        constructor() {
          super();
          this.registerProvider('Users', UserService);
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();
      const userService = appContainer.get<UserService>('Users');

      expect(userService).toBeInstanceOf(UserService);
    });

    test('should not re-register if already bound', () => {
      class TestApp extends Boot {
        constructor() {
          super();
          this.registerProvider(UserService, UserService);
          this.registerProvider(UserService, UserService); // Should be ignored
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();
      
      expect(appContainer.isBound(UserService)).toBe(true);
    });

    test('should register multiple providers', () => {
      class TestApp extends Boot {
        constructor() {
          super();
          this.registerProvider(UserService, UserService);
          this.registerProvider(DatabaseService, DatabaseService);
          this.registerProvider(CacheService, CacheService);
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();

      const userService = appContainer.get(UserService);
      const dbService = appContainer.get(DatabaseService);
      const cacheService = appContainer.get(CacheService);

      expect(userService).toBeInstanceOf(UserService);
      expect(dbService).toBeInstanceOf(DatabaseService);
      expect(cacheService).toBeInstanceOf(CacheService);
    });
  });

  describe('registerConstant()', () => {
    test('should register a constant value', () => {
      class TestApp extends Boot {
        constructor() {
          super();
          this.registerConstant('API_URL', 'https://api.example.com');
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();
      const apiUrl = appContainer.get<string>('API_URL');

      expect(apiUrl).toBe('https://api.example.com');
    });

    test('should register multiple constants', () => {
      class TestApp extends Boot {
        constructor() {
          super();
          this.registerConstant('API_URL', 'https://api.example.com');
          this.registerConstant('MAX_RETRIES', 3);
          this.registerConstant('TIMEOUT', 5000);
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();

      expect(appContainer.get('API_URL')).toBe('https://api.example.com');
      expect(appContainer.get('MAX_RETRIES')).toBe(3);
      expect(appContainer.get('TIMEOUT')).toBe(5000);
    });

    test('should register complex objects as constants', () => {
      const config = {
        database: {
          host: 'localhost',
          port: 5432,
          name: 'testdb'
        },
        redis: {
          host: 'localhost',
          port: 6379
        }
      };

      class TestApp extends Boot {
        constructor() {
          super();
          this.registerConstant('CONFIG', config);
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();
      const retrievedConfig = appContainer.get('CONFIG');

      expect(retrievedConfig).toBe(config);
      expect((retrievedConfig as any).database.host).toBe('localhost');
    });

    test('should not re-register if already bound', () => {
      class TestApp extends Boot {
        constructor() {
          super();
          this.registerConstant('VALUE', 'first');
          this.registerConstant('VALUE', 'second'); // Should be ignored
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();

      expect(appContainer.get('VALUE')).toBe('first');
    });
  });

  describe('Provider and Constant Integration', () => {
    test('should use constants in providers', () => {
      @injectable()
      class ApiService {
        constructor() {
          // In real usage, would inject API_URL
        }

        getUrl(container: any) {
          return container.get('API_URL');
        }
      }

      class TestApp extends Boot {
        constructor() {
          super();
          this.registerConstant('API_URL', 'https://api.example.com');
          this.registerProvider(ApiService, ApiService);
        }
      }

      const app = new TestApp();
      const appContainer = app.getContainer();
      const apiService = appContainer.get(ApiService);

      expect(apiService.getUrl(appContainer)).toBe('https://api.example.com');
    });

    test('should isolate providers between app instances', () => {
      class App1 extends Boot {
        constructor() {
          super();
          this.registerConstant('APP_NAME', 'App 1');
          this.registerProvider(UserService, UserService);
        }
      }

      class App2 extends Boot {
        constructor() {
          super();
          this.registerConstant('APP_NAME', 'App 2');
          this.registerProvider(DatabaseService, DatabaseService);
        }
      }

      const app1 = new App1();
      const app2 = new App2();

      const container1 = app1.getContainer();
      const container2 = app2.getContainer();

      // Both containers are different instances
      expect(container1).not.toBe(container2);

      // Each has its own APP_NAME
      expect(container1.get('APP_NAME')).toBe('App 1');
      expect(container2.get('APP_NAME')).toBe('App 2');
      
      // Verify services are bound in their respective containers
      const userService = container1.get(UserService);
      const dbService = container2.get(DatabaseService);
      
      expect(userService).toBeInstanceOf(UserService);
      expect(dbService).toBeInstanceOf(DatabaseService);
    });
  });

  describe('Container Inheritance', () => {
    test('should inherit from parent container', () => {
      // Note: Boot's container has parent set to the global inversify container
      class TestApp extends Boot {}

      const app = new TestApp();
      const appContainer = app.getContainer();

      // Verify container has proper structure
      expect(appContainer).toBeDefined();
      expect(appContainer.bind).toBeDefined();
    });

    test('should access parent bindings', () => {
      // Bind something to the global container first
      const globalContainer = container;
      
      @injectable()
      class GlobalService {
        getValue() { return 'global'; }
      }

      globalContainer.bind(GlobalService).toSelf();

      class TestApp extends Boot {}
      const app = new TestApp();
      const appContainer = app.getContainer();

      // Should be able to resolve from parent
      const service = appContainer.get(GlobalService);
      expect(service.getValue()).toBe('global');

      // Cleanup
      globalContainer.unbind(GlobalService);
    });
  });

  describe('Settings Integration', () => {
    test('should work with Settings instance', () => {
      class TestApp extends Boot {
        constructor() {
          super();
          this.registerConstant('PORT', 3000);
        }
      }

      const app = new TestApp();

      expect(app.settings).toBeInstanceOf(Settings);
      expect(app.getContainer().get('PORT')).toBe(3000);
    });
  });
});
