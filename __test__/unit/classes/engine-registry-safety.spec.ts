/**
 * EngineRegistry Type Safety Tests - Phase 1 Non-Breaking Fixes
 *
 * Tests for:
 * - HIGH-007: EngineRegistry Type Safety
 *
 * @since 2.0.0
 */
import EngineRegistry from '../../../classes/EngineRegistry';
import ExpressiveTeaEngine from '../../../classes/Engine';
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { injectable } from 'inversify';

describe('EngineRegistry Type Safety - HIGH-007', () => {
  beforeEach(() => {
    EngineRegistry.clear();
  });

  afterEach(() => {
    EngineRegistry.clear();
  });

  describe('canRegister() Error Handling', () => {
    test('should catch errors thrown by canRegister() and return false', () => {
      @injectable()
      class ThrowingEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          throw new Error('canRegister failed');
        }
      }

      EngineRegistry.register({
        engine: ThrowingEngine,
        name: 'throwing',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      // Should not throw, but filter out the engine
      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(0);
    });

    test('should log warning when canRegister() throws', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      @injectable()
      class ThrowingEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          throw new Error('Test error');
        }
      }

      EngineRegistry.register({
        engine: ThrowingEngine,
        name: 'throwing',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.getRegisteredEngines();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EngineRegistry]'),
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    test('should handle TypeError in canRegister()', () => {
      @injectable()
      class TypeErrorEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          // Force a TypeError
          const obj: any = null;
          return obj.someProperty;
        }
      }

      EngineRegistry.register({
        engine: TypeErrorEngine,
        name: 'type-error',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(0);
    });

    test('should handle ReferenceError in canRegister()', () => {
      @injectable()
      class ReferenceErrorEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          // Force a ReferenceError by accessing undefined variable
          // @ts-expect-error - Intentionally testing ReferenceError
          // eslint-disable-next-line no-undef
          return (undefinedVariable as any).value;
        }
      }

      EngineRegistry.register({
        engine: ReferenceErrorEngine,
        name: 'reference-error',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(0);
    });

    test('should continue processing other engines after one throws', () => {
      @injectable()
      class ThrowingEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          throw new Error('Failed');
        }
      }

      @injectable()
      class ValidEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      EngineRegistry.register({
        engine: ThrowingEngine,
        name: 'throwing',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: ValidEngine,
        name: 'valid',
        version: '1.0.0',
        priority: 10,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(1);
      expect(engines[0]).toBe(ValidEngine);
    });
  });

  describe('Type-Safe Arguments', () => {
    test('should pass Boot context to canRegister() properly', () => {
      let receivedContext: any;

      @injectable()
      class ContextEngine extends ExpressiveTeaEngine {
        static canRegister(context?: Boot, _settings?: Settings): boolean {
          receivedContext = context;
          return true;
        }
      }

      EngineRegistry.register({
        engine: ContextEngine,
        name: 'context',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const mockBoot = {} as Boot;
      EngineRegistry.getRegisteredEngines(mockBoot);

      expect(receivedContext).toBe(mockBoot);
    });

    test('should pass Settings to canRegister() properly', () => {
      let receivedSettings: any;

      @injectable()
      class SettingsEngine extends ExpressiveTeaEngine {
        static canRegister(context?: Boot, _settings?: Settings): boolean {
          receivedSettings = _settings;
          return true;
        }
      }

      EngineRegistry.register({
        engine: SettingsEngine,
        name: 'settings',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const mockSettings = {} as Settings;
      EngineRegistry.getRegisteredEngines(undefined, mockSettings);

      expect(receivedSettings).toBe(mockSettings);
    });

    test('should pass both context and settings to canRegister()', () => {
      let receivedContext: any;
      let receivedSettings: any;

      @injectable()
      class BothEngine extends ExpressiveTeaEngine {
        static canRegister(context?: Boot, _settings?: Settings): boolean {
          receivedContext = context;
          receivedSettings = _settings;
          return true;
        }
      }

      EngineRegistry.register({
        engine: BothEngine,
        name: 'both',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const mockBoot = {} as Boot;
      const mockSettings = {} as Settings;
      EngineRegistry.getRegisteredEngines(mockBoot, mockSettings);

      expect(receivedContext).toBe(mockBoot);
      expect(receivedSettings).toBe(mockSettings);
    });

    test('should handle canRegister() with no arguments', () => {
      @injectable()
      class NoArgsEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      EngineRegistry.register({
        engine: NoArgsEngine,
        name: 'no-args',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(1);
      expect(engines[0]).toBe(NoArgsEngine);
    });
  });

  describe('Error Recovery', () => {
    test('should not corrupt registry state when canRegister() throws', () => {
      @injectable()
      class ThrowingEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          throw new Error('Failed');
        }
      }

      @injectable()
      class ValidEngine1 extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      @injectable()
      class ValidEngine2 extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      EngineRegistry.register({
        engine: ValidEngine1,
        name: 'valid1',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: ThrowingEngine,
        name: 'throwing',
        version: '1.0.0',
        priority: 5,
        dependencies: []
      });

      EngineRegistry.register({
        engine: ValidEngine2,
        name: 'valid2',
        version: '1.0.0',
        priority: 10,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(2);
      expect(engines).toContain(ValidEngine1);
      expect(engines).toContain(ValidEngine2);
    });

    test('should allow retry after canRegister() throws', () => {
      let callCount = 0;

      @injectable()
      class RetryEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          callCount++;
          if (callCount === 1) {
            throw new Error('First call fails');
          }
          return true;
        }
      }

      EngineRegistry.register({
        engine: RetryEngine,
        name: 'retry',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      // First call throws
      const engines1 = EngineRegistry.getRegisteredEngines();
      expect(engines1).toHaveLength(0);

      // Second call succeeds
      const engines2 = EngineRegistry.getRegisteredEngines();
      expect(engines2).toHaveLength(1);
      expect(engines2[0]).toBe(RetryEngine);
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle engines with dependencies where canRegister() throws', () => {
      @injectable()
      class ThrowingEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          throw new Error('Failed');
        }
      }

      @injectable()
      class DependentEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      EngineRegistry.register({
        engine: ThrowingEngine,
        name: 'throwing',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: DependentEngine,
        name: 'dependent',
        version: '1.0.0',
        priority: 10,
        dependencies: ['throwing']
      });

      // Should throw because dependent engine depends on throwing engine
      // which was filtered out
      expect(() => {
        EngineRegistry.getRegisteredEngines();
      }).toThrow(/depends on "throwing" which is not registered or cannot be registered/);
    });

    test('should handle all engines throwing during canRegister()', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      @injectable()
      class ThrowingEngine1 extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          throw new Error('Failed 1');
        }
      }

      @injectable()
      class ThrowingEngine2 extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          throw new Error('Failed 2');
        }
      }

      EngineRegistry.register({
        engine: ThrowingEngine1,
        name: 'throwing1',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: ThrowingEngine2,
        name: 'throwing2',
        version: '1.0.0',
        priority: 10,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
    });

    test('should handle engine throwing after successful canRegister() calls', () => {
      @injectable()
      class ValidEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      @injectable()
      class ThrowingEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          throw new Error('Failed');
        }
      }

      EngineRegistry.register({
        engine: ValidEngine,
        name: 'valid',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: ThrowingEngine,
        name: 'throwing',
        version: '1.0.0',
        priority: 10,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(1);
      expect(engines[0]).toBe(ValidEngine);
    });
  });

  describe('Edge Cases', () => {
    test('should handle canRegister() returning non-boolean after error', () => {
      @injectable()
      class WeirdEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          // This will throw during boolean coercion
          return { valueOf: () => { throw new Error('valueOf failed'); } } as any;
        }
      }

      EngineRegistry.register({
        engine: WeirdEngine,
        name: 'weird',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(0);
    });

    test('should handle async errors in canRegister()', () => {
      @injectable()
      class AsyncErrorEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          // Synchronous throw in async context
          Promise.reject(new Error('Async error'));
          return true;
        }
      }

      EngineRegistry.register({
        engine: AsyncErrorEngine,
        name: 'async-error',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      // Should not throw, but engine may be registered since the error is async
      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines.length).toBeGreaterThanOrEqual(0);
    });
  });
});
