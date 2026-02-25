/**
 * EngineRegistry Tests
 * Tests for engine registration, dependency resolution, and circular dependency detection
 * @since 2.0.0
 */
import EngineRegistry from '../../../classes/EngineRegistry';
import ExpressiveTeaEngine from '../../../classes/Engine';
import { injectable } from 'inversify';

describe('EngineRegistry (Phase 2)', () => {
  // Test engines
  @injectable()
  class TestEngineA extends ExpressiveTeaEngine {
    static canRegister(): boolean {
      return true;
    }
  }

  @injectable()
  class TestEngineB extends ExpressiveTeaEngine {
    static canRegister(): boolean {
      return true;
    }
  }

  @injectable()
  class TestEngineC extends ExpressiveTeaEngine {
    static canRegister(): boolean {
      return true;
    }
  }

  @injectable()
  class TestEngineD extends ExpressiveTeaEngine {
    static canRegister(): boolean {
      return true;
    }
  }

  @injectable()
  class ConditionalEngine extends ExpressiveTeaEngine {
    static canRegister(): boolean {
      return false; // Never registers
    }
  }

  beforeEach(() => {
    EngineRegistry.clear();
  });

  afterEach(() => {
    EngineRegistry.clear();
  });

  describe('register()', () => {
    test('should register an engine with metadata', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const engine = EngineRegistry.getEngine('test-a');
      expect(engine).toBeDefined();
      expect(engine?.name).toBe('test-a');
      expect(engine?.version).toBe('1.0.0');
      expect(engine?.priority).toBe(0);
      expect(engine?.dependencies).toEqual([]);
    });

    test('should throw error when registering duplicate engine name', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      expect(() => {
        EngineRegistry.register({
          engine: TestEngineB,
          name: 'test-a', // Same name
          version: '2.0.0',
          priority: 5,
          dependencies: []
        });
      }).toThrow('Engine "test-a" is already registered');
    });

    test('should register multiple engines', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineB,
        name: 'test-b',
        version: '1.0.0',
        priority: 10,
        dependencies: ['test-a']
      });

      const engines = EngineRegistry.getAllEngines();
      expect(engines).toHaveLength(2);
      expect(engines.map((e) => e.name)).toEqual(expect.arrayContaining(['test-a', 'test-b']));
    });
  });

  describe('unregister()', () => {
    test('should unregister an engine by name', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const result = EngineRegistry.unregister('test-a');
      expect(result).toBe(true);
      expect(EngineRegistry.getEngine('test-a')).toBeUndefined();
    });

    test('should return false when unregistering non-existent engine', () => {
      const result = EngineRegistry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('clear()', () => {
    test('should clear all registered engines', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineB,
        name: 'test-b',
        version: '1.0.0',
        priority: 10,
        dependencies: []
      });

      EngineRegistry.clear();
      expect(EngineRegistry.getAllEngines()).toHaveLength(0);
    });
  });

  describe('getRegisteredEngines()', () => {
    test('should return engines in dependency order', () => {
      // Register in random order
      EngineRegistry.register({
        engine: TestEngineC,
        name: 'test-c',
        version: '1.0.0',
        priority: 20,
        dependencies: ['test-b']
      });

      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineB,
        name: 'test-b',
        version: '1.0.0',
        priority: 10,
        dependencies: ['test-a']
      });

      const engines = EngineRegistry.getRegisteredEngines();

      // Should be: test-a, test-b, test-c (dependency order)
      expect(engines).toEqual([TestEngineA, TestEngineB, TestEngineC]);
    });

    test('should filter engines by canRegister()', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: ConditionalEngine,
        name: 'conditional',
        version: '1.0.0',
        priority: 5,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(1);
      expect(engines[0]).toBe(TestEngineA);
    });

    test('should sort engines by priority when no dependencies', () => {
      EngineRegistry.register({
        engine: TestEngineC,
        name: 'test-c',
        version: '1.0.0',
        priority: 20,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineB,
        name: 'test-b',
        version: '1.0.0',
        priority: 10,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();

      // Should be sorted by priority: 0, 10, 20
      expect(engines).toEqual([TestEngineA, TestEngineB, TestEngineC]);
    });

    test('should handle complex dependency graph', () => {
      // Complex graph:
      //   A (priority 0) <- B (priority 10) <- D (priority 25)
      //                  <- C (priority 20) <- D (priority 25)
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineB,
        name: 'test-b',
        version: '1.0.0',
        priority: 10,
        dependencies: ['test-a']
      });

      EngineRegistry.register({
        engine: TestEngineC,
        name: 'test-c',
        version: '1.0.0',
        priority: 20,
        dependencies: ['test-a']
      });

      EngineRegistry.register({
        engine: TestEngineD,
        name: 'test-d',
        version: '1.0.0',
        priority: 25,
        dependencies: ['test-b', 'test-c']
      });

      const engines = EngineRegistry.getRegisteredEngines();

      // A must be first, D must be last
      expect(engines[0]).toBe(TestEngineA);
      expect(engines[3]).toBe(TestEngineD);

      // B and C must be after A and before D
      const indexB = engines.indexOf(TestEngineB);
      const indexC = engines.indexOf(TestEngineC);
      expect(indexB).toBeGreaterThan(0);
      expect(indexC).toBeGreaterThan(0);
      expect(indexB).toBeLessThan(3);
      expect(indexC).toBeLessThan(3);
    });
  });

  describe('Dependency Validation', () => {
    test('should throw error for missing dependency', () => {
      EngineRegistry.register({
        engine: TestEngineB,
        name: 'test-b',
        version: '1.0.0',
        priority: 10,
        dependencies: ['test-a'] // test-a not registered
      });

      expect(() => {
        EngineRegistry.getRegisteredEngines();
      }).toThrow('Engine "test-b" depends on "test-a" which is not registered or cannot be registered');
    });

    test('should throw error when dependency cannot register', () => {
      EngineRegistry.register({
        engine: ConditionalEngine,
        name: 'conditional',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineB,
        name: 'test-b',
        version: '1.0.0',
        priority: 10,
        dependencies: ['conditional']
      });

      expect(() => {
        EngineRegistry.getRegisteredEngines();
      }).toThrow('Engine "test-b" depends on "conditional" which is not registered or cannot be registered');
    });
  });

  describe('Circular Dependency Detection', () => {
    test('should detect simple circular dependency (A -> B -> A)', () => {
      @injectable()
      class CircularA extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      @injectable()
      class CircularB extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      EngineRegistry.register({
        engine: CircularA,
        name: 'circular-a',
        version: '1.0.0',
        priority: 0,
        dependencies: ['circular-b']
      });

      EngineRegistry.register({
        engine: CircularB,
        name: 'circular-b',
        version: '1.0.0',
        priority: 10,
        dependencies: ['circular-a']
      });

      expect(() => {
        EngineRegistry.getRegisteredEngines();
      }).toThrow(/Circular dependency detected/);
    });

    test('should detect complex circular dependency (A -> B -> C -> A)', () => {
      @injectable()
      class CircularA extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      @injectable()
      class CircularB extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      @injectable()
      class CircularC extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      EngineRegistry.register({
        engine: CircularA,
        name: 'circular-a',
        version: '1.0.0',
        priority: 0,
        dependencies: ['circular-b']
      });

      EngineRegistry.register({
        engine: CircularB,
        name: 'circular-b',
        version: '1.0.0',
        priority: 10,
        dependencies: ['circular-c']
      });

      EngineRegistry.register({
        engine: CircularC,
        name: 'circular-c',
        version: '1.0.0',
        priority: 20,
        dependencies: ['circular-a']
      });

      expect(() => {
        EngineRegistry.getRegisteredEngines();
      }).toThrow(/Circular dependency detected/);
    });

    test('should detect self-dependency', () => {
      @injectable()
      class SelfDependent extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      EngineRegistry.register({
        engine: SelfDependent,
        name: 'self-dep',
        version: '1.0.0',
        priority: 0,
        dependencies: ['self-dep'] // Self-dependency
      });

      expect(() => {
        EngineRegistry.getRegisteredEngines();
      }).toThrow(/Circular dependency detected/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty registry', () => {
      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toEqual([]);
    });

    test('should handle single engine', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const engines = EngineRegistry.getRegisteredEngines();
      expect(engines).toHaveLength(1);
      expect(engines[0]).toBe(TestEngineA);
    });

    test('should handle engines with multiple dependencies', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineB,
        name: 'test-b',
        version: '1.0.0',
        priority: 5,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineC,
        name: 'test-c',
        version: '1.0.0',
        priority: 10,
        dependencies: []
      });

      EngineRegistry.register({
        engine: TestEngineD,
        name: 'test-d',
        version: '1.0.0',
        priority: 20,
        dependencies: ['test-a', 'test-b', 'test-c']
      });

      const engines = EngineRegistry.getRegisteredEngines();

      // test-d must be last (depends on all others)
      expect(engines[3]).toBe(TestEngineD);
    });
  });

  describe('getAllEngines()', () => {
    test('should return all registered engines regardless of canRegister()', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      EngineRegistry.register({
        engine: ConditionalEngine,
        name: 'conditional',
        version: '1.0.0',
        priority: 5,
        dependencies: []
      });

      const allEngines = EngineRegistry.getAllEngines();
      expect(allEngines).toHaveLength(2);

      // getAllEngines returns all, getRegisteredEngines filters by canRegister
      const registeredEngines = EngineRegistry.getRegisteredEngines();
      expect(registeredEngines).toHaveLength(1);
    });
  });

  describe('getEngine()', () => {
    test('should return engine metadata by name', () => {
      EngineRegistry.register({
        engine: TestEngineA,
        name: 'test-a',
        version: '1.0.0',
        priority: 0,
        dependencies: []
      });

      const engine = EngineRegistry.getEngine('test-a');
      expect(engine).toBeDefined();
      expect(engine?.engine).toBe(TestEngineA);
      expect(engine?.name).toBe('test-a');
    });

    test('should return undefined for non-existent engine', () => {
      const engine = EngineRegistry.getEngine('non-existent');
      expect(engine).toBeUndefined();
    });
  });
});
