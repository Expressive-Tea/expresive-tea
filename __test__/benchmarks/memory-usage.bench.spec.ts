/**
 * Memory Usage Benchmark
 *
 * Measures baseline memory, memory under load, and checks for memory leaks.
 * Target: <200MB baseline, no leaks
 */

import 'reflect-metadata';
import * as supertest from 'supertest';
import Settings from '../../classes/Settings';
import container from '../../inversify.config';
import { createBenchmarkApp } from './utils/test-app';
import {
  measureMemory,
  formatBytes,
  sleep,
  type MemoryMeasurement
} from './utils/benchmark-helpers';

describe('Memory Usage Benchmark', () => {
  const PORT = 8000;
  const TARGET_BASELINE_MB = 200;

  async function forceGC(): Promise<void> {
    if (global.gc) {
      global.gc();
      await sleep(100);
    }
  }

  function memoryToMB(bytes: number): number {
    return bytes / (1024 * 1024);
  }

  test('should measure baseline memory usage', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('MEMORY USAGE BENCHMARK - Baseline');
    console.log('='.repeat(70));

    Settings.reset();
    container.unbindAll();

    // Force GC before measurement
    await forceGC();

    const beforeApp = measureMemory();
    console.log(`\nMemory before app: ${formatBytes(beforeApp.heapUsed)}`);

    // Create application
    const app = await createBenchmarkApp(PORT);

    // Wait for stabilization
    await sleep(1000);
    await forceGC();

    const afterApp = measureMemory();
    console.log(`Memory after app:  ${formatBytes(afterApp.heapUsed)}`);

    const baselineUsage = afterApp.heapUsed - beforeApp.heapUsed;
    const baselineMB = memoryToMB(afterApp.heapUsed);

    console.log(`\nBaseline memory usage: ${formatBytes(baselineUsage)}`);
    console.log(`Total heap used: ${baselineMB.toFixed(2)} MB`);
    console.log(`Target: <${TARGET_BASELINE_MB} MB`);

    if (baselineMB < TARGET_BASELINE_MB) {
      console.log(`✓ PASS: Baseline memory is under target`);
    } else {
      console.log(`✗ WARNING: Baseline memory exceeds target by ${(baselineMB - TARGET_BASELINE_MB).toFixed(2)} MB`);
    }

    // Cleanup
    if (app?.server) {
      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });
    }

    await forceGC();
    const afterCleanup = measureMemory();
    console.log(`Memory after cleanup: ${formatBytes(afterCleanup.heapUsed)}`);

    console.log('\n' + '='.repeat(70));

    // Store results
    const results = {
      benchmark: 'memory-baseline',
      timestamp: new Date().toISOString(),
      target_mb: TARGET_BASELINE_MB,
      measurements: {
        before_app_mb: memoryToMB(beforeApp.heapUsed),
        after_app_mb: memoryToMB(afterApp.heapUsed),
        baseline_usage_mb: memoryToMB(baselineUsage),
        after_cleanup_mb: memoryToMB(afterCleanup.heapUsed)
      },
      pass: baselineMB < TARGET_BASELINE_MB
    };

    Settings.reset();
    container.unbindAll();

    expect(baselineMB).toBeLessThan(TARGET_BASELINE_MB * 1.5); // Allow 50% margin
    expect(results).toBeDefined();
  }, 60000);

  test('should measure memory under load', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('MEMORY USAGE BENCHMARK - Under Load');
    console.log('='.repeat(70));

    Settings.reset();
    container.unbindAll();
    await forceGC();

    const app = await createBenchmarkApp(PORT + 1);
    const request = supertest(app.application);

    await sleep(500);
    await forceGC();

    const baseline = measureMemory();
    console.log(`\nBaseline: ${formatBytes(baseline.heapUsed)}`);

    // Generate load - 1000 concurrent requests
    console.log('\nGenerating load (1000 requests)...');
    const requestPromises: Promise<any>[] = [];

    for (let i = 0; i < 1000; i++) {
      requestPromises.push(request.get('/json/medium'));

      if ((i + 1) % 250 === 0) {
        console.log(`  Progress: ${i + 1}/1000`);
      }
    }

    await Promise.all(requestPromises);

    const underLoad = measureMemory();
    console.log(`\nUnder load: ${formatBytes(underLoad.heapUsed)}`);

    const loadIncrease = underLoad.heapUsed - baseline.heapUsed;
    console.log(`Load increase: ${formatBytes(loadIncrease)}`);

    // Wait and check if memory returns to baseline (leak detection)
    console.log('\nWaiting for stabilization...');
    await sleep(2000);
    await forceGC();

    const afterLoad = measureMemory();
    console.log(`After load: ${formatBytes(afterLoad.heapUsed)}`);

    const retained = afterLoad.heapUsed - baseline.heapUsed;
    const retainedPct = (retained / loadIncrease) * 100;

    console.log(`\nRetained memory: ${formatBytes(retained)}`);
    console.log(`Retention rate: ${retainedPct.toFixed(2)}%`);

    if (retainedPct < 20) {
      console.log(`✓ PASS: Memory cleanup is effective (<20% retained)`);
    } else {
      console.log(`✗ WARNING: High memory retention (${retainedPct.toFixed(2)}%)`);
    }

    // Cleanup
    if (app?.server) {
      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });
    }

    console.log('\n' + '='.repeat(70));

    const results = {
      benchmark: 'memory-under-load',
      timestamp: new Date().toISOString(),
      measurements: {
        baseline_mb: memoryToMB(baseline.heapUsed),
        under_load_mb: memoryToMB(underLoad.heapUsed),
        after_load_mb: memoryToMB(afterLoad.heapUsed),
        load_increase_mb: memoryToMB(loadIncrease),
        retained_mb: memoryToMB(retained),
        retention_pct: retainedPct
      },
      pass: retainedPct < 50 // Allow up to 50% retention
    };

    Settings.reset();
    container.unbindAll();

    expect(retainedPct).toBeLessThan(50);
    expect(results).toBeDefined();
  }, 120000);

  test('should check for memory leaks', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('MEMORY USAGE BENCHMARK - Leak Detection');
    console.log('='.repeat(70));

    Settings.reset();
    container.unbindAll();
    await forceGC();

    const app = await createBenchmarkApp(PORT + 2);
    const request = supertest(app.application);

    await sleep(500);
    await forceGC();

    const measurements: MemoryMeasurement[] = [];
    const CYCLES = 5;
    const REQUESTS_PER_CYCLE = 200;

    console.log(`\nRunning ${CYCLES} cycles of ${REQUESTS_PER_CYCLE} requests each...`);

    for (let cycle = 0; cycle < CYCLES; cycle++) {
      console.log(`\nCycle ${cycle + 1}/${CYCLES}:`);

      // Generate load
      const promises: Promise<any>[] = [];
      for (let i = 0; i < REQUESTS_PER_CYCLE; i++) {
        promises.push(request.get('/json/small'));
      }
      await Promise.all(promises);

      // Wait and measure
      await sleep(1000);
      await forceGC();

      const mem = measureMemory();
      measurements.push(mem);
      console.log(`  Heap used: ${formatBytes(mem.heapUsed)}`);
    }

    // Analyze trend
    const heapUsages = measurements.map(m => m.heapUsed);
    const firstThree = heapUsages.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const lastThree = heapUsages.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const growthPct = ((lastThree - firstThree) / firstThree) * 100;

    console.log(`\nMemory growth analysis:`);
    console.log(`  First 3 cycles avg: ${formatBytes(firstThree)}`);
    console.log(`  Last 3 cycles avg: ${formatBytes(lastThree)}`);
    console.log(`  Growth: ${growthPct.toFixed(2)}%`);

    if (growthPct < 10) {
      console.log(`  ✓ PASS: No significant memory leak detected`);
    } else if (growthPct < 20) {
      console.log(`  ⚠ WARNING: Moderate memory growth detected`);
    } else {
      console.log(`  ✗ FAIL: Significant memory leak detected`);
    }

    // Cleanup
    if (app?.server) {
      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });
    }

    console.log('\n' + '='.repeat(70));

    const results = {
      benchmark: 'memory-leak-detection',
      timestamp: new Date().toISOString(),
      cycles: CYCLES,
      requests_per_cycle: REQUESTS_PER_CYCLE,
      measurements: heapUsages.map(h => memoryToMB(h)),
      growth_pct: growthPct,
      leak_detected: growthPct > 20
    };

    Settings.reset();
    container.unbindAll();

    expect(growthPct).toBeLessThan(30); // Allow up to 30% growth
    expect(results).toBeDefined();
  }, 180000);
});
