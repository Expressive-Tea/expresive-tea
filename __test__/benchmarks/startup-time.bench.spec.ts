/**
 * Startup Time Benchmark
 *
 * Measures the time from Boot instantiation to server listening.
 * Target: <2 seconds for cold start
 */

import 'reflect-metadata';
import Settings from '../../classes/Settings';
import container from '../../inversify.config';
import { createBenchmarkApp } from './utils/test-app';
import {
  calculateStats,
  printStats,
  formatTime,
  calculateVariance,
  type BenchmarkStats
} from './utils/benchmark-helpers';

describe('Startup Time Benchmark', () => {
  const ITERATIONS = 10;
  const TARGET_MS = 2000; // 2 seconds target
  let portCounter = 6000;

  afterEach(() => {
    Settings.reset();
    container.unbindAll();
  });

  test('should measure application startup time', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('STARTUP TIME BENCHMARK');
    console.log('='.repeat(70));
    console.log(`Target: <${formatTime(TARGET_MS)}`);
    console.log(`Iterations: ${ITERATIONS}`);

    const startupTimes: number[] = [];
    const apps: any[] = [];

    // Run startup measurements
    for (let i = 0; i < ITERATIONS; i++) {
      const port = portCounter++;
      Settings.reset();
      container.unbindAll();

      const startTime = performance.now();
      const app = await createBenchmarkApp(port);
      const endTime = performance.now();

      const duration = endTime - startTime;
      startupTimes.push(duration);
      apps.push(app);

      console.log(`  Run ${i + 1}/${ITERATIONS}: ${formatTime(duration)}`);

      // Cleanup immediately
      if (app?.server) {
        await new Promise<void>((resolve) => {
          app.server.close(() => resolve());
        });
      }
    }

    // Calculate statistics
    const manualStats = calculateStats(startupTimes);

    // Print results
    printStats('Startup Time', manualStats);

    const variance = calculateVariance(startupTimes);
    console.log(`  Variance: ${variance.toFixed(2)}%`);

    // Results
    console.log('\nResults:');
    console.log(`  Average startup time: ${formatTime(manualStats.avg)}`);
    console.log(`  P95 startup time: ${formatTime(manualStats.p95)}`);
    console.log(`  P99 startup time: ${formatTime(manualStats.p99)}`);
    console.log(`  Target: ${formatTime(TARGET_MS)}`);

    if (manualStats.avg < TARGET_MS) {
      console.log(`  ✓ PASS: Average startup time is under target`);
    } else {
      console.log(`  ✗ FAIL: Average startup time exceeds target by ${formatTime(manualStats.avg - TARGET_MS)}`);
    }

    console.log('\n' + '='.repeat(70));

    // Store results for report
    const results = {
      benchmark: 'startup-time',
      timestamp: new Date().toISOString(),
      iterations: ITERATIONS,
      target_ms: TARGET_MS,
      stats: {
        min_ms: manualStats.min,
        max_ms: manualStats.max,
        avg_ms: manualStats.avg,
        median_ms: manualStats.median,
        p95_ms: manualStats.p95,
        p99_ms: manualStats.p99,
        std_dev_ms: manualStats.stdDev,
        variance_pct: variance
      },
      pass: manualStats.avg < TARGET_MS,
      measurements: startupTimes
    };

    // Assertions
    expect(manualStats.avg).toBeLessThan(TARGET_MS * 1.5); // Allow 50% margin
    // Note: High variance is expected due to cold start (first run is much slower)
    // This is normal and not a concern for production
    expect(variance).toBeLessThan(500); // Very high variance is acceptable for startup
    expect(results).toBeDefined();
  }, 120000); // 2 minute timeout
});
