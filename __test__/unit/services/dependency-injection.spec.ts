import { Container, injectable } from 'inversify';
import DependencyInjection from '@services/DependencyInjection';

describe('Dependency Injection Service', () => {
  let containerBindSpy;
  let containerIsBoundSpy;
  let containerBindToMock;

  class SomeService {
  }

  beforeEach(() => {
    containerBindSpy = jest.spyOn(Container.prototype, 'bind');
    containerIsBoundSpy = jest.spyOn(Container.prototype, 'isBound');

    containerBindToMock = jest.fn();
    containerBindSpy.mockImplementation(() => ({to: containerBindToMock}));
    containerIsBoundSpy.mockImplementation(() => false);
  });

  afterEach(() => {
    containerBindSpy.mockReset();
    // Clean up any scopes created during tests
    const scopes = DependencyInjection.getAllScopeNames();
    scopes.forEach(scope => DependencyInjection.destroyScope(scope));
  });

  describe('Basic Provider Management', () => {
    test('should setup provider to dependency injection container', () => {
      DependencyInjection.setProvider(SomeService);

      expect(containerBindSpy).toHaveBeenCalledWith('SomeService');
      expect(containerBindToMock).toHaveBeenCalledWith(SomeService);
    });

    test('should setup provider to dependency injection container with name', () => {
      DependencyInjection.setProvider(SomeService, 'OtherProvider');

      expect(containerBindSpy).toHaveBeenCalledWith('OtherProvider');
      expect(containerBindToMock).toHaveBeenCalledWith(SomeService);
    });

    test('should ignore provider if is already on the container', () => {
      containerIsBoundSpy.mockImplementation(() => true);
      DependencyInjection.setProvider(SomeService, 'OtherProvider');

      expect(containerBindSpy).not.toHaveBeenCalledWith('OtherProvider');
    });
  });

  describe('Scoped Containers (Phase 1)', () => {
    describe('createScope()', () => {
      test('should create a new scoped container', () => {
        const scope = DependencyInjection.createScope('test-scope');

        expect(scope).toBeInstanceOf(Container);
        expect(DependencyInjection.hasScope('test-scope')).toBe(true);
      });

      test('should throw error if scope already exists', () => {
        DependencyInjection.createScope('duplicate-scope');

        expect(() => DependencyInjection.createScope('duplicate-scope'))
          .toThrow('Scope "duplicate-scope" already exists');
      });

      test('should create multiple independent scopes', () => {
        const scope1 = DependencyInjection.createScope('scope-1');
        const scope2 = DependencyInjection.createScope('scope-2');
        const scope3 = DependencyInjection.createScope('scope-3');

        expect(scope1).not.toBe(scope2);
        expect(scope2).not.toBe(scope3);
        expect(DependencyInjection.getAllScopeNames()).toHaveLength(3);
      });

      test('should inherit from root container', () => {
        // Restore original implementations for this test
        containerBindSpy.mockRestore();
        containerIsBoundSpy.mockRestore();

        @injectable()
        class RootService {
          getValue() { return 'root'; }
        }

        // Bind to root container
        DependencyInjection.Container.bind(RootService).toSelf();

        // Create scope and verify inheritance
        const scope = DependencyInjection.createScope('inheritance-test');
        const service = scope.get(RootService);

        expect(service).toBeInstanceOf(RootService);
        expect(service.getValue()).toBe('root');

        // Cleanup
        DependencyInjection.Container.unbind(RootService);
      });
    });

    describe('getScope()', () => {
      test('should retrieve existing scope', () => {
        const createdScope = DependencyInjection.createScope('retrieve-test');
        const retrievedScope = DependencyInjection.getScope('retrieve-test');

        expect(retrievedScope).toBe(createdScope);
      });

      test('should return undefined for non-existent scope', () => {
        const scope = DependencyInjection.getScope('non-existent');

        expect(scope).toBeUndefined();
      });
    });

    describe('destroyScope()', () => {
      test('should destroy existing scope', () => {
        DependencyInjection.createScope('destroy-test');
        const destroyed = DependencyInjection.destroyScope('destroy-test');

        expect(destroyed).toBe(true);
        expect(DependencyInjection.hasScope('destroy-test')).toBe(false);
      });

      test('should return false for non-existent scope', () => {
        const destroyed = DependencyInjection.destroyScope('non-existent');

        expect(destroyed).toBe(false);
      });

      test('should unbind all services in scope', () => {
        // Restore original implementations
        containerBindSpy.mockRestore();
        containerIsBoundSpy.mockRestore();

        @injectable()
        class ScopedService {
          getValue() { return 'scoped'; }
        }

        const scope = DependencyInjection.createScope('unbind-test');
        scope.bind(ScopedService).toSelf();

        expect(scope.isBound(ScopedService)).toBe(true);

        DependencyInjection.destroyScope('unbind-test');

        // Note: We can't test the destroyed scope directly, but we verify it's removed
        expect(DependencyInjection.getScope('unbind-test')).toBeUndefined();
      });
    });

    describe('hasScope()', () => {
      test('should return true for existing scope', () => {
        DependencyInjection.createScope('exists-test');

        expect(DependencyInjection.hasScope('exists-test')).toBe(true);
      });

      test('should return false for non-existent scope', () => {
        expect(DependencyInjection.hasScope('non-existent')).toBe(false);
      });
    });

    describe('getAllScopeNames()', () => {
      test('should return empty array when no scopes exist', () => {
        const scopes = DependencyInjection.getAllScopeNames();

        expect(scopes).toEqual([]);
      });

      test('should return all scope names', () => {
        DependencyInjection.createScope('scope-a');
        DependencyInjection.createScope('scope-b');
        DependencyInjection.createScope('scope-c');

        const scopes = DependencyInjection.getAllScopeNames();

        expect(scopes).toHaveLength(3);
        expect(scopes).toContain('scope-a');
        expect(scopes).toContain('scope-b');
        expect(scopes).toContain('scope-c');
      });

      test('should update after destroying scope', () => {
        DependencyInjection.createScope('temp-scope');
        expect(DependencyInjection.getAllScopeNames()).toContain('temp-scope');

        DependencyInjection.destroyScope('temp-scope');
        expect(DependencyInjection.getAllScopeNames()).not.toContain('temp-scope');
      });
    });

    describe('Scope Isolation', () => {
      test('should isolate bindings between scopes', () => {
        // Restore original implementations
        containerBindSpy.mockRestore();
        containerIsBoundSpy.mockRestore();

        @injectable()
        class ModuleAService {
          getName() { return 'Module A'; }
        }

        @injectable()
        class ModuleBService {
          getName() { return 'Module B'; }
        }

        const scopeA = DependencyInjection.createScope('module-a');
        const scopeB = DependencyInjection.createScope('module-b');

        scopeA.bind('ModuleService').to(ModuleAService);
        scopeB.bind('ModuleService').to(ModuleBService);

        const serviceA = scopeA.get<ModuleAService>('ModuleService');
        const serviceB = scopeB.get<ModuleBService>('ModuleService');

        expect(serviceA.getName()).toBe('Module A');
        expect(serviceB.getName()).toBe('Module B');
        expect(serviceA).not.toBe(serviceB);
      });

      test('should not share instances between scopes', () => {
        // Restore original implementations
        containerBindSpy.mockRestore();
        containerIsBoundSpy.mockRestore();

        @injectable()
        class Counter {
          private count = 0;
          increment() { this.count++; }
          getCount() { return this.count; }
        }

        const scope1 = DependencyInjection.createScope('counter-1');
        const scope2 = DependencyInjection.createScope('counter-2');

        scope1.bind(Counter).toSelf().inSingletonScope();
        scope2.bind(Counter).toSelf().inSingletonScope();

        const counter1 = scope1.get(Counter);
        const counter2 = scope2.get(Counter);

        counter1.increment();
        counter1.increment();
        counter2.increment();

        expect(counter1.getCount()).toBe(2);
        expect(counter2.getCount()).toBe(1);
      });
    });
  });

});
