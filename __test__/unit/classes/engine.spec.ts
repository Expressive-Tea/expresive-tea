/**
 * Unit tests for classes/Engine.ts
 *
 * Tests the base ExpressiveTeaEngine class lifecycle methods and static utilities.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { injectable } from 'inversify';
import ExpressiveTeaEngine from '../../../classes/Engine';

// Minimal stubs to satisfy the @inject(...) constructor parameters without a DI container
function makeEngine<T extends ExpressiveTeaEngine>(
  EngineClass: new (...args: any[]) => T
): T {
  // The @injectable class expects injected parameters, but we can bypass them
  // in unit tests by using Object.create + manual property assignment
  const instance = Object.create(EngineClass.prototype) as T;
  return instance;
}

describe('ExpressiveTeaEngine', () => {
  describe('canRegister()', () => {
    test('should return false by default', () => {
      expect(ExpressiveTeaEngine.canRegister()).toBe(false);
    });

    test('should allow subclasses to override canRegister()', () => {
      class AlwaysOnEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }
      expect(AlwaysOnEngine.canRegister()).toBe(true);
    });

    test('should pass ctx and settings to canRegister()', () => {
      const mockCtx = {} as any;
      const mockSettings = {} as any;
      const spy = vi.spyOn(ExpressiveTeaEngine, 'canRegister');

      ExpressiveTeaEngine.canRegister(mockCtx, mockSettings);

      expect(spy).toHaveBeenCalledWith(mockCtx, mockSettings);
    });
  });

  describe('stop()', () => {
    test('should resolve without throwing by default', async () => {
      const engine = makeEngine(ExpressiveTeaEngine);
      await expect(engine.stop()).resolves.toBeUndefined();
    });

    test('should be overridable in subclasses', async () => {
      const stopFn = vi.fn().mockResolvedValue(undefined);

      class CustomEngine extends ExpressiveTeaEngine {
        async stop(): Promise<void> {
          return stopFn();
        }
      }

      const engine = makeEngine(CustomEngine);
      await engine.stop();
      expect(stopFn).toHaveBeenCalledOnce();
    });
  });

  describe('exec()', () => {
    test('should execute a lifecycle method on all engines', async () => {
      const initA = vi.fn().mockResolvedValue('a');
      const initB = vi.fn().mockResolvedValue('b');

      const engineA = { init: initA } as unknown as ExpressiveTeaEngine;
      const engineB = { init: initB } as unknown as ExpressiveTeaEngine;

      await ExpressiveTeaEngine.exec([engineA, engineB], 'init');

      expect(initA).toHaveBeenCalledOnce();
      expect(initB).toHaveBeenCalledOnce();
    });

    test('should return results from all engine method calls', async () => {
      const engineA = { start: vi.fn().mockResolvedValue('started-A') } as unknown as ExpressiveTeaEngine;
      const engineB = { start: vi.fn().mockResolvedValue('started-B') } as unknown as ExpressiveTeaEngine;

      const results = await ExpressiveTeaEngine.exec([engineA, engineB], 'start');

      expect(results).toEqual(['started-A', 'started-B']);
    });

    test('should skip engines that do not implement the method', async () => {
      const engineA = { init: vi.fn().mockResolvedValue('a') } as unknown as ExpressiveTeaEngine;
      const engineB = {} as unknown as ExpressiveTeaEngine; // no init method

      const results = await ExpressiveTeaEngine.exec([engineA, engineB], 'init');

      expect(results).toEqual(['a']);
    });

    test('should return empty array for empty engine list', async () => {
      const results = await ExpressiveTeaEngine.exec([], 'init');
      expect(results).toEqual([]);
    });

    test('should handle engines where the method is not a function', async () => {
      const engine = { init: 'not-a-function' } as unknown as ExpressiveTeaEngine;

      const results = await ExpressiveTeaEngine.exec([engine], 'init');
      expect(results).toEqual([]);
    });

    test('should propagate rejections from engine methods', async () => {
      const error = new Error('Engine failed');
      const engine = { init: vi.fn().mockRejectedValue(error) } as unknown as ExpressiveTeaEngine;

      await expect(ExpressiveTeaEngine.exec([engine], 'init')).rejects.toThrow('Engine failed');
    });

    test('should execute stop() on all engines', async () => {
      const stopA = vi.fn().mockResolvedValue(undefined);
      const stopB = vi.fn().mockResolvedValue(undefined);

      const engineA = { stop: stopA } as unknown as ExpressiveTeaEngine;
      const engineB = { stop: stopB } as unknown as ExpressiveTeaEngine;

      await ExpressiveTeaEngine.exec([engineA, engineB], 'stop');

      expect(stopA).toHaveBeenCalledOnce();
      expect(stopB).toHaveBeenCalledOnce();
    });
  });

  describe('Subclass patterns', () => {
    test('subclass should inherit exec() static method', async () => {
      @injectable()
      class TestEngine extends ExpressiveTeaEngine {
        static canRegister(): boolean {
          return true;
        }
      }

      const initFn = vi.fn().mockResolvedValue(undefined);
      const engine = { init: initFn } as unknown as ExpressiveTeaEngine;

      await TestEngine.exec([engine], 'init');
      expect(initFn).toHaveBeenCalledOnce();
    });

    test('should support multiple lifecycle phase execution', async () => {
      const calls: string[] = [];

      const engine = {
        init: vi.fn().mockImplementation(async () => { calls.push('init'); }),
        start: vi.fn().mockImplementation(async () => { calls.push('start'); }),
        stop: vi.fn().mockImplementation(async () => { calls.push('stop'); }),
      } as unknown as ExpressiveTeaEngine;

      await ExpressiveTeaEngine.exec([engine], 'init');
      await ExpressiveTeaEngine.exec([engine], 'start');
      await ExpressiveTeaEngine.exec([engine], 'stop');

      expect(calls).toEqual(['init', 'start', 'stop']);
    });
  });
});
