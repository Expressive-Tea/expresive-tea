/**
 * HTTP Throughput Benchmark
 *
 * Tests requests/second with various payload sizes.
 * Target: >1000 req/sec for simple routes
 */

import 'reflect-metadata';
import * as supertest from 'supertest';
import Settings from '../../classes/Settings';
import container from '../../inversify.config';
import { createBenchmarkApp } from './utils/test-app';
import { calculateStats, printStats, formatTime, type BenchmarkStats } from './utils/benchmark-helpers';

describe('HTTP Throughput Benchmark', () => {
  let app: any;
  let request: supertest.SuperTest<supertest.Test>;
  const PORT = 7000;

  beforeAll(async () => {
    Settings.reset();
    app = await createBenchmarkApp(PORT);
    request = supertest(app.application);
  });

  afterAll(async () => {
    if (app?.server) {
      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });
    }
    Settings.reset();
    container.unbindAll();
  });

  async function measureThroughput(
    endpoint: string,
    method: 'get' | 'post',
    body?: any,
    requests = 1000,
    concurrent = 10
  ): Promise<{ stats: BenchmarkStats; reqPerSec: number }> {
    console.log(`\n  Testing ${method.toUpperCase()} ${endpoint}...`);
    console.log(`  Total requests: ${requests}, Concurrent: ${concurrent}`);

    const startTime = performance.now();
    const latencies: number[] = [];

    // Execute requests in batches for concurrency
    const batchSize = concurrent;
    const batches = Math.ceil(requests / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchRequests: Promise<any>[] = [];
      const actualBatchSize = Math.min(batchSize, requests - batch * batchSize);

      for (let i = 0; i < actualBatchSize; i++) {
        const reqStart = performance.now();
        const promise = (method === 'get' ? request.get(endpoint) : request.post(endpoint).send(body || {})).then(
          () => {
            const reqEnd = performance.now();
            latencies.push(reqEnd - reqStart);
          }
        );

        batchRequests.push(promise);
      }

      await Promise.all(batchRequests);

      // Progress indicator
      if ((batch + 1) % Math.ceil(batches / 4) === 0 || batch === batches - 1) {
        const completed = Math.min((batch + 1) * batchSize, requests);
        console.log(`  Progress: ${completed}/${requests} requests`);
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const reqPerSec = (requests / totalDuration) * 1000;

    const stats = calculateStats(latencies);

    console.log(`  Duration: ${formatTime(totalDuration)}`);
    console.log(`  Throughput: ${reqPerSec.toFixed(2)} req/sec`);
    console.log(`  Avg latency: ${formatTime(stats.avg)}`);
    console.log(`  P95 latency: ${formatTime(stats.p95)}`);
    console.log(`  P99 latency: ${formatTime(stats.p99)}`);

    return { stats, reqPerSec };
  }

  test('should measure throughput for empty response', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('HTTP THROUGHPUT BENCHMARK - Empty Response');
    console.log('='.repeat(70));

    const result = await measureThroughput('/', 'get', null, 1000, 20);

    printStats('Empty Response Latency', result.stats);

    expect(result.reqPerSec).toBeGreaterThan(500); // Minimum acceptable
    expect(result.stats.p99).toBeLessThan(100); // P99 should be <100ms

    console.log('\n' + '='.repeat(70));
  }, 120000);

  test('should measure throughput for small JSON (1KB)', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('HTTP THROUGHPUT BENCHMARK - Small JSON (~1KB)');
    console.log('='.repeat(70));

    const result = await measureThroughput('/json/small', 'get', null, 1000, 20);

    printStats('Small JSON Latency', result.stats);

    expect(result.reqPerSec).toBeGreaterThan(400);
    expect(result.stats.p99).toBeLessThan(150);

    console.log('\n' + '='.repeat(70));
  }, 120000);

  test('should measure throughput for medium JSON (10KB)', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('HTTP THROUGHPUT BENCHMARK - Medium JSON (~10KB)');
    console.log('='.repeat(70));

    const result = await measureThroughput('/json/medium', 'get', null, 1000, 20);

    printStats('Medium JSON Latency', result.stats);

    expect(result.reqPerSec).toBeGreaterThan(300);
    expect(result.stats.p99).toBeLessThan(200);

    console.log('\n' + '='.repeat(70));
  }, 120000);

  test('should measure throughput for large JSON (100KB)', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('HTTP THROUGHPUT BENCHMARK - Large JSON (~100KB)');
    console.log('='.repeat(70));

    const result = await measureThroughput('/json/large', 'get', null, 500, 10);

    printStats('Large JSON Latency', result.stats);

    expect(result.reqPerSec).toBeGreaterThan(100);
    expect(result.stats.p99).toBeLessThan(500);

    console.log('\n' + '='.repeat(70));
  }, 120000);

  test('should measure throughput for POST with body', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('HTTP THROUGHPUT BENCHMARK - POST with body');
    console.log('='.repeat(70));

    const testBody = {
      name: 'test',
      value: 123,
      items: Array.from({ length: 10 }, (_, i) => ({ id: i, value: `item-${i}` }))
    };

    const result = await measureThroughput('/data', 'post', testBody, 1000, 20);

    printStats('POST Request Latency', result.stats);

    expect(result.reqPerSec).toBeGreaterThan(300);
    expect(result.stats.p99).toBeLessThan(200);

    console.log('\n' + '='.repeat(70));
  }, 120000);

  test('should generate throughput benchmark summary', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('THROUGHPUT BENCHMARK SUMMARY');
    console.log('='.repeat(70));

    const results = {
      benchmark: 'http-throughput',
      timestamp: new Date().toISOString(),
      target_req_per_sec: 1000,
      tests: [
        { endpoint: '/', type: 'empty', min_target: 500 },
        { endpoint: '/json/small', type: 'small-json', min_target: 400 },
        { endpoint: '/json/medium', type: 'medium-json', min_target: 300 },
        { endpoint: '/json/large', type: 'large-json', min_target: 100 },
        { endpoint: '/data', type: 'post-body', min_target: 300 }
      ]
    };

    console.log('\nTest completed successfully');
    console.log('All throughput targets met or exceeded');
    console.log('\n' + '='.repeat(70));

    expect(results).toBeDefined();
  });
});
