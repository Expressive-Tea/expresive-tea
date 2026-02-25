/**
 * HTTPEngine.resolveStages() Tests
 * Tests to verify that boot stages execute sequentially (not in parallel)
 * Fixes issue #247 - race condition during boot stage execution
 * @since 2.0.0
 */
import HTTPEngine from '../../../engines/http';
import { BOOT_STAGES } from '@expressive-tea/commons';
import * as bootHelper from '../../../helpers/boot-helper';

// Mock the boot-helper module
jest.mock('../../../helpers/boot-helper');

describe('HTTPEngine.resolveStages() - Sequential Execution (Issue #247)', () => {
  let engine: HTTPEngine;
  let mockContext: any;
  let mockApp: any;
  let resolveStageCallOrder: { stage: BOOT_STAGES; timestamp: number; order: number }[];
  let callCounter: number;

  beforeEach(() => {
    // Reset tracking variables
    resolveStageCallOrder = [];
    callCounter = 0;

    // Mock application
    mockApp = {
      use: jest.fn(),
      get: jest.fn(),
      set: jest.fn()
    };

    // Mock context
    mockContext = {
      getApplication: jest.fn().mockReturnValue(mockApp)
    };

    // Create engine instance with mocked context
    engine = new HTTPEngine();
    (engine as any).context = mockContext;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Sequential Execution Verification', () => {
    test('should execute boot stages sequentially, not in parallel', async () => {
      // Mock resolveStage to track execution order and timing
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage: BOOT_STAGES) => {
        const order = callCounter++;
        const startTime = Date.now();

        resolveStageCallOrder.push({
          stage,
          timestamp: startTime,
          order
        });

        // Simulate async work (50ms delay)
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Execute resolveStages with multiple stages
      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.INITIALIZE_MIDDLEWARES, BOOT_STAGES.APPLICATION];

      await engine.resolveStages(stages);

      // Verify all stages were called
      expect(mockedResolveStage).toHaveBeenCalledTimes(3);

      // Verify execution order matches input order
      expect(resolveStageCallOrder[0].stage).toBe(BOOT_STAGES.BOOT_DEPENDENCIES);
      expect(resolveStageCallOrder[1].stage).toBe(BOOT_STAGES.INITIALIZE_MIDDLEWARES);
      expect(resolveStageCallOrder[2].stage).toBe(BOOT_STAGES.APPLICATION);

      // Verify sequential execution: each stage should start after the previous completes
      // Stage 1 should start at least 50ms after Stage 0 (due to the 50ms delay)
      const timeDiff1 = resolveStageCallOrder[1].timestamp - resolveStageCallOrder[0].timestamp;
      expect(timeDiff1).toBeGreaterThanOrEqual(45); // Allow small timing variance

      // Stage 2 should start at least 50ms after Stage 1
      const timeDiff2 = resolveStageCallOrder[2].timestamp - resolveStageCallOrder[1].timestamp;
      expect(timeDiff2).toBeGreaterThanOrEqual(45); // Allow small timing variance
    });

    test('should ensure BOOT_DEPENDENCIES completes before APPLICATION stage runs', async () => {
      let bootDependenciesCompleted = false;
      let applicationStarted = false;

      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage: BOOT_STAGES) => {
        if (stage === BOOT_STAGES.BOOT_DEPENDENCIES) {
          // Simulate async work
          await new Promise((resolve) => setTimeout(resolve, 30));
          bootDependenciesCompleted = true;
        }

        if (stage === BOOT_STAGES.APPLICATION) {
          applicationStarted = true;
          // Verify BOOT_DEPENDENCIES has completed before APPLICATION starts
          expect(bootDependenciesCompleted).toBe(true);
        }
      });

      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.APPLICATION];
      await engine.resolveStages(stages);

      expect(bootDependenciesCompleted).toBe(true);
      expect(applicationStarted).toBe(true);
    });

    test('should maintain sequential order with multiple stages', async () => {
      const executionLog: string[] = [];

      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage: BOOT_STAGES) => {
        executionLog.push(`start-${stage}`);

        // Variable delays to test sequential waiting
        const delays: Record<number, number> = {
          [BOOT_STAGES.BOOT_DEPENDENCIES]: 40,
          [BOOT_STAGES.INITIALIZE_MIDDLEWARES]: 20,
          [BOOT_STAGES.APPLICATION]: 30
        };

        await new Promise((resolve) => setTimeout(resolve, delays[stage] || 10));
        executionLog.push(`end-${stage}`);
      });

      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.INITIALIZE_MIDDLEWARES, BOOT_STAGES.APPLICATION];

      await engine.resolveStages(stages);

      // Verify each stage completes before the next starts
      expect(executionLog).toEqual([
        'start-0', // BOOT_DEPENDENCIES
        'end-0',
        'start-1', // INITIALIZE_MIDDLEWARES
        'end-1',
        'start-2', // APPLICATION
        'end-2'
      ]);
    });

    test('should pass extra arguments to each stage in sequence', async () => {
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.APPLICATION];
      const extraArg1 = { test: 'arg1' };
      const extraArg2 = 'arg2';

      await engine.resolveStages(stages, extraArg1, extraArg2);

      // Verify each stage received the extra arguments
      expect(mockedResolveStage).toHaveBeenNthCalledWith(
        1,
        BOOT_STAGES.BOOT_DEPENDENCIES,
        mockContext,
        mockApp,
        extraArg1,
        extraArg2
      );

      expect(mockedResolveStage).toHaveBeenNthCalledWith(
        2,
        BOOT_STAGES.APPLICATION,
        mockContext,
        mockApp,
        extraArg1,
        extraArg2
      );
    });
  });

  describe('Race Condition Prevention', () => {
    test('should prevent race conditions between BOOT_DEPENDENCIES and APPLICATION', async () => {
      const sharedState: { value: number } = { value: 0 };

      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage: BOOT_STAGES) => {
        if (stage === BOOT_STAGES.BOOT_DEPENDENCIES) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          sharedState.value = 100;
        }

        if (stage === BOOT_STAGES.APPLICATION) {
          // APPLICATION should see the value set by BOOT_DEPENDENCIES
          expect(sharedState.value).toBe(100);
          sharedState.value = 200;
        }
      });

      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.APPLICATION];
      await engine.resolveStages(stages);

      // Final state should reflect sequential execution
      expect(sharedState.value).toBe(200);
    });

    test('should handle errors in one stage without affecting sequential execution', async () => {
      const executionLog: string[] = [];
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage: BOOT_STAGES) => {
        executionLog.push(`stage-${stage}`);

        if (stage === BOOT_STAGES.INITIALIZE_MIDDLEWARES) {
          throw new Error('Stage error');
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.INITIALIZE_MIDDLEWARES, BOOT_STAGES.APPLICATION];

      // Expect error to be thrown
      await expect(engine.resolveStages(stages)).rejects.toThrow('Stage error');

      // Only stages up to the error should have executed
      expect(executionLog).toEqual([
        'stage-0', // BOOT_DEPENDENCIES
        'stage-1' // INITIALIZE_MIDDLEWARES (throws error)
      ]);

      // Stage 2 should NOT have executed
      expect(executionLog).not.toContain('stage-2');
    });

    test('should verify fix prevents parallel execution that caused issue #247', async () => {
      // This test simulates the race condition scenario described in issue #247
      let dependencySetupComplete = false;
      let applicationAccessedDependency = false;
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage: BOOT_STAGES) => {
        if (stage === BOOT_STAGES.BOOT_DEPENDENCIES) {
          // Simulate dependency setup taking time
          await new Promise((resolve) => setTimeout(resolve, 60));
          dependencySetupComplete = true;
        }

        if (stage === BOOT_STAGES.APPLICATION) {
          // With sequential execution, dependency should always be ready
          // With parallel execution (old code), this could fail
          expect(dependencySetupComplete).toBe(true);
          applicationAccessedDependency = true;
        }
      });

      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.APPLICATION];
      await engine.resolveStages(stages);

      expect(dependencySetupComplete).toBe(true);
      expect(applicationAccessedDependency).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty stages array', async () => {
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      await engine.resolveStages([]);

      expect(mockedResolveStage).not.toHaveBeenCalled();
    });

    test('should handle single stage', async () => {
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      await engine.resolveStages([BOOT_STAGES.APPLICATION]);

      expect(mockedResolveStage).toHaveBeenCalledTimes(1);
      expect(mockedResolveStage).toHaveBeenCalledWith(BOOT_STAGES.APPLICATION, mockContext, mockApp);
    });

    test('should handle stages with no extra arguments', async () => {
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      await engine.resolveStages([BOOT_STAGES.BOOT_DEPENDENCIES]);

      expect(mockedResolveStage).toHaveBeenCalledWith(BOOT_STAGES.BOOT_DEPENDENCIES, mockContext, mockApp);
    });

    test('should execute all stages even with fast completion', async () => {
      const executionLog: number[] = [];
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage: BOOT_STAGES) => {
        executionLog.push(stage);
        // Immediate completion (no delay)
      });

      const stages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.INITIALIZE_MIDDLEWARES, BOOT_STAGES.APPLICATION];

      await engine.resolveStages(stages);

      expect(executionLog).toEqual([0, 1, 2]);
      expect(mockedResolveStage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration with Boot Flow', () => {
    test('should properly sequence stages during typical boot flow', async () => {
      const bootFlow: string[] = [];
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);

      mockedResolveStage.mockImplementation(async (stage: BOOT_STAGES) => {
        bootFlow.push(`stage-${BOOT_STAGES[stage]}`);
        await new Promise((resolve) => setTimeout(resolve, 15));
      });

      // Simulate the typical init() call pattern
      const initStages = [BOOT_STAGES.BOOT_DEPENDENCIES, BOOT_STAGES.INITIALIZE_MIDDLEWARES, BOOT_STAGES.APPLICATION];

      await engine.resolveStages(initStages);

      expect(bootFlow).toEqual(['stage-BOOT_DEPENDENCIES', 'stage-INITIALIZE_MIDDLEWARES', 'stage-APPLICATION']);

      // Verify sequential execution
      expect(mockedResolveStage).toHaveBeenCalledTimes(3);
    });

    test('should handle multiple resolveStages calls in sequence', async () => {
      const mockedResolveStage = jest.mocked(bootHelper.resolveStage);
      let callCount = 0;

      mockedResolveStage.mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // First call (like init() does)
      await engine.resolveStages([
        BOOT_STAGES.BOOT_DEPENDENCIES,
        BOOT_STAGES.INITIALIZE_MIDDLEWARES,
        BOOT_STAGES.APPLICATION
      ]);

      const firstCallCount = callCount;
      expect(firstCallCount).toBe(3);

      // Second call (like init() does for additional stages)
      await engine.resolveStages([BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES, BOOT_STAGES.ON_HTTP_CREATION]);

      expect(callCount).toBe(5);
    });
  });
});
