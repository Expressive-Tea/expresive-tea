/**
 * Benchmark Helper Utilities
 * Provides reusable utilities for performance benchmarking
 */

/**
 * Statistics calculation for benchmark results
 */
export interface BenchmarkStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
  stdDev: number;
  variance: number;
}

/**
 * Memory measurement result
 */
export interface MemoryMeasurement {
  rss: number; // Resident Set Size (total memory allocated)
  heapTotal: number; // Total heap size
  heapUsed: number; // Heap memory used
  external: number; // External memory (C++ objects)
  arrayBuffers: number; // ArrayBuffer memory
}

/**
 * Calculate percentile from sorted array
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const index = Math.ceil((arr.length * p) / 100) - 1;
  return arr[Math.max(0, index)];
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[], mean: number): number {
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate statistics from array of measurements
 */
export function calculateStats(measurements: number[]): BenchmarkStats {
  if (measurements.length === 0) {
    throw new Error('Cannot calculate stats from empty array');
  }

  const sorted = [...measurements].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const stdDev = standardDeviation(sorted, avg);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg,
    median: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    stdDev,
    variance: Math.pow(stdDev, 2)
  };
}

/**
 * Format milliseconds to human-readable string
 */
export function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Measure memory usage
 */
export function measureMemory(): MemoryMeasurement {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers
  };
}

/**
 * Format memory measurement
 */
export function formatMemory(mem: MemoryMeasurement): string {
  return `RSS: ${formatBytes(mem.rss)}, Heap: ${formatBytes(mem.heapUsed)}/${formatBytes(mem.heapTotal)}`;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function and measure execution time
 */
export async function measureExecution<T>(
  fn: () => Promise<T> | T,
  warmup = false
): Promise<{ result: T; duration: number }> {
  if (warmup) {
    await fn();
  }

  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  return { result, duration };
}

/**
 * Run benchmark multiple times and collect statistics
 */
export async function runBenchmark<T>(
  name: string,
  fn: () => Promise<T> | T,
  iterations: number,
  warmup = true
): Promise<{ stats: BenchmarkStats; durations: number[] }> {
  console.log(`\nRunning benchmark: ${name} (${iterations} iterations)...`);

  const durations: number[] = [];

  // Warmup run
  if (warmup) {
    console.log('  Warming up...');
    await fn();
    await sleep(100);
  }

  // Actual measurements
  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureExecution(fn);
    durations.push(duration);

    if ((i + 1) % Math.ceil(iterations / 4) === 0) {
      console.log(`  Progress: ${i + 1}/${iterations}`);
    }
  }

  const stats = calculateStats(durations);

  console.log(`  Completed: avg=${formatTime(stats.avg)}, p95=${formatTime(stats.p95)}, p99=${formatTime(stats.p99)}`);

  return { stats, durations };
}

/**
 * Print statistics table
 */
export function printStats(name: string, stats: BenchmarkStats): void {
  console.log(`\n${name} Statistics:`);
  console.log(`  Min:     ${formatTime(stats.min)}`);
  console.log(`  Max:     ${formatTime(stats.max)}`);
  console.log(`  Avg:     ${formatTime(stats.avg)}`);
  console.log(`  Median:  ${formatTime(stats.median)}`);
  console.log(`  P95:     ${formatTime(stats.p95)}`);
  console.log(`  P99:     ${formatTime(stats.p99)}`);
  console.log(`  StdDev:  ${formatTime(stats.stdDev)}`);
}

/**
 * Calculate variance percentage between runs
 */
export function calculateVariance(durations: number[]): number {
  const stats = calculateStats(durations);
  return (stats.stdDev / stats.avg) * 100;
}
