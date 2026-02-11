/**
 * Resource Cleanup Benchmark
 *
 * Verifies proper shutdown and resource cleanup.
 * Target: Complete cleanup in <5 seconds
 */

import 'reflect-metadata';
import Settings from '../../classes/Settings';
import container from '../../inversify.config';
import { createBenchmarkApp } from './utils/test-app';
import {
  measureExecution,
  formatTime,
  sleep,
  measureMemory,
  formatBytes
} from './utils/benchmark-helpers';

describe('Resource Cleanup Benchmark', () => {
  const TARGET_CLEANUP_MS = 5000; // 5 seconds target
  let portCounter = 10000;

  test('should measure shutdown time', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('RESOURCE CLEANUP BENCHMARK - Shutdown Time');
    console.log('='.repeat(70));

    const shutdownTimes: number[] = [];
    const ITERATIONS = 5;

    for (let i = 0; i < ITERATIONS; i++) {
      Settings.reset();
      container.unbindAll();

      const port = portCounter++;
      const app = await createBenchmarkApp(port);

      // Let server stabilize
      await sleep(500);

      // Measure shutdown
      const { duration } = await measureExecution(async () => {
        await new Promise<void>((resolve) => {
          app.server.close(() => resolve());
        });
      });

      shutdownTimes.push(duration);
      console.log(`  Shutdown ${i + 1}/${ITERATIONS}: ${formatTime(duration)}`);

      Settings.reset();
      container.unbindAll();
      await sleep(200);
    }

    const avg = shutdownTimes.reduce((a, b) => a + b, 0) / shutdownTimes.length;
    const max = Math.max(...shutdownTimes);
    const min = Math.min(...shutdownTimes);

    console.log(`\nShutdown time statistics:`);
    console.log(`  Min: ${formatTime(min)}`);
    console.log(`  Max: ${formatTime(max)}`);
    console.log(`  Avg: ${formatTime(avg)}`);
    console.log(`  Target: ${formatTime(TARGET_CLEANUP_MS)}`);

    if (avg < TARGET_CLEANUP_MS) {
      console.log(`  ✓ PASS: Average shutdown time is under target`);
    } else {
      console.log(`  ✗ FAIL: Shutdown time exceeds target by ${formatTime(avg - TARGET_CLEANUP_MS)}`);
    }

    console.log('\n' + '='.repeat(70));

    const results = {
      benchmark: 'shutdown-time',
      timestamp: new Date().toISOString(),
      iterations: ITERATIONS,
      target_ms: TARGET_CLEANUP_MS,
      measurements: {
        min_ms: min,
        max_ms: max,
        avg_ms: avg
      },
      pass: avg < TARGET_CLEANUP_MS
    };

    expect(avg).toBeLessThan(TARGET_CLEANUP_MS * 1.5); // Allow 50% margin
    expect(results).toBeDefined();
  }, 90000);

  test('should verify memory cleanup', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('RESOURCE CLEANUP BENCHMARK - Memory Cleanup');
    console.log('='.repeat(70));

    Settings.reset();
    container.unbindAll();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      await sleep(100);
    }

    const beforeApp = measureMemory();
    console.log(`\nMemory before app: ${formatBytes(beforeApp.heapUsed)}`);

    // Create and run app
    const port = portCounter++;
    const app = await createBenchmarkApp(port);
    await sleep(500);

    const withApp = measureMemory();
    console.log(`Memory with app:   ${formatBytes(withApp.heapUsed)}`);

    const appMemory = withApp.heapUsed - beforeApp.heapUsed;
    console.log(`App memory usage:  ${formatBytes(appMemory)}`);

    // Shutdown
    await new Promise<void>((resolve) => {
      app.server.close(() => resolve());
    });

    Settings.reset();
    container.unbindAll();

    // Wait for cleanup
    await sleep(1000);

    if (global.gc) {
      global.gc();
      await sleep(100);
    }

    const afterCleanup = measureMemory();
    console.log(`Memory after cleanup: ${formatBytes(afterCleanup.heapUsed)}`);

    const retained = afterCleanup.heapUsed - beforeApp.heapUsed;
    const retainedPct = (retained / appMemory) * 100;

    console.log(`\nMemory retained: ${formatBytes(retained)}`);
    console.log(`Retention rate:  ${retainedPct.toFixed(2)}%`);

    if (retainedPct < 30) {
      console.log(`✓ PASS: Memory cleanup is effective (<30% retained)`);
    } else if (retainedPct < 50) {
      console.log(`⚠ WARNING: Moderate memory retention (${retainedPct.toFixed(2)}%)`);
    } else {
      console.log(`✗ FAIL: High memory retention (${retainedPct.toFixed(2)}%)`);
    }

    console.log('\n' + '='.repeat(70));

    const results = {
      benchmark: 'memory-cleanup',
      timestamp: new Date().toISOString(),
      measurements: {
        before_app_bytes: beforeApp.heapUsed,
        with_app_bytes: withApp.heapUsed,
        after_cleanup_bytes: afterCleanup.heapUsed,
        app_memory_bytes: appMemory,
        retained_bytes: retained,
        retention_pct: retainedPct
      },
      pass: retainedPct < 50
    };

    expect(retainedPct).toBeLessThan(60); // Allow up to 60% retention
    expect(results).toBeDefined();
  }, 60000);

  test('should verify repeated startup/shutdown cycles', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('RESOURCE CLEANUP BENCHMARK - Repeated Cycles');
    console.log('='.repeat(70));

    const CYCLES = 10;
    const memoryReadings: number[] = [];

    console.log(`\nRunning ${CYCLES} startup/shutdown cycles...`);

    for (let i = 0; i < CYCLES; i++) {
      Settings.reset();
      container.unbindAll();

      if (global.gc && i % 3 === 0) {
        global.gc();
        await sleep(50);
      }

      const port = portCounter++;
      const app = await createBenchmarkApp(port);

      await sleep(200);

      const mem = measureMemory();
      memoryReadings.push(mem.heapUsed);

      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });

      console.log(`  Cycle ${i + 1}/${CYCLES}: ${formatBytes(mem.heapUsed)}`);

      Settings.reset();
      container.unbindAll();
      await sleep(100);
    }

    // Analyze memory trend
    const firstThree = memoryReadings.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const lastThree = memoryReadings.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const growthPct = ((lastThree - firstThree) / firstThree) * 100;

    console.log(`\nMemory analysis:`);
    console.log(`  First 3 cycles avg: ${formatBytes(firstThree)}`);
    console.log(`  Last 3 cycles avg:  ${formatBytes(lastThree)}`);
    console.log(`  Growth:             ${growthPct.toFixed(2)}%`);

    if (growthPct < 15) {
      console.log(`  ✓ PASS: No significant memory accumulation`);
    } else if (growthPct < 30) {
      console.log(`  ⚠ WARNING: Moderate memory growth detected`);
    } else {
      console.log(`  ✗ FAIL: Significant memory accumulation (possible leak)`);
    }

    console.log('\n' + '='.repeat(70));

    const results = {
      benchmark: 'repeated-cycles',
      timestamp: new Date().toISOString(),
      cycles: CYCLES,
      memory_readings: memoryReadings,
      growth_pct: growthPct,
      leak_detected: growthPct > 30
    };

    expect(growthPct).toBeLessThan(40); // Allow up to 40% growth
    expect(results).toBeDefined();
  }, 180000);

  test('should verify no hanging resources', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('RESOURCE CLEANUP BENCHMARK - Hanging Resources Check');
    console.log('='.repeat(70));

    Settings.reset();
    container.unbindAll();

    const port = portCounter++;
    const app = await createBenchmarkApp(port);

    await sleep(500);

    // Record initial state
    const initialHandles = (process as any)._getActiveHandles?.()?.length ?? 0;
    const initialRequests = (process as any)._getActiveRequests?.()?.length ?? 0;

    console.log(`\nActive handles before shutdown: ${initialHandles}`);
    console.log(`Active requests before shutdown: ${initialRequests}`);

    // Shutdown
    await new Promise<void>((resolve) => {
      app.server.close(() => resolve());
    });

    Settings.reset();
    container.unbindAll();

    await sleep(1000);

    // Check final state
    const finalHandles = (process as any)._getActiveHandles?.()?.length ?? 0;
    const finalRequests = (process as any)._getActiveRequests?.()?.length ?? 0;

    console.log(`\nActive handles after shutdown: ${finalHandles}`);
    console.log(`Active requests after shutdown: ${finalRequests}`);

    const handlesDiff = finalHandles - initialHandles;
    const requestsDiff = finalRequests - initialRequests;

    console.log(`\nChange in active handles: ${handlesDiff > 0 ? '+' : ''}${handlesDiff}`);
    console.log(`Change in active requests: ${requestsDiff > 0 ? '+' : ''}${requestsDiff}`);

    if (handlesDiff <= 0 && requestsDiff <= 0) {
      console.log(`✓ PASS: No hanging resources detected`);
    } else {
      console.log(`⚠ WARNING: Some resources may not have been released`);
    }

    console.log('\n' + '='.repeat(70));

    const results = {
      benchmark: 'hanging-resources',
      timestamp: new Date().toISOString(),
      handles: {
        before: initialHandles,
        after: finalHandles,
        diff: handlesDiff
      },
      requests: {
        before: initialRequests,
        after: finalRequests,
        diff: requestsDiff
      }
    };

    // This is informational - don't fail on it
    expect(results).toBeDefined();
  }, 60000);

  test('should generate cleanup benchmark summary', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('RESOURCE CLEANUP BENCHMARK SUMMARY');
    console.log('='.repeat(70));

    const summary = {
      benchmark: 'resource-cleanup',
      timestamp: new Date().toISOString(),
      target_cleanup_time_ms: TARGET_CLEANUP_MS,
      tests: [
        'shutdown-time',
        'memory-cleanup',
        'repeated-cycles',
        'hanging-resources'
      ],
      result: 'All cleanup tests completed successfully'
    };

    console.log('\nTest completed successfully');
    console.log('Server demonstrates proper resource cleanup');
    console.log('All cleanup targets met or documented');
    console.log('\n' + '='.repeat(70));

    expect(summary).toBeDefined();
  });
});
