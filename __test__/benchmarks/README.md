# Expressive Tea 2.0 Performance Benchmark Suite

## Overview

This benchmark suite provides comprehensive performance testing for Expressive Tea 2.0, measuring startup time, HTTP throughput, memory usage, concurrent connections, and resource cleanup.

## Benchmarks

### 1. Startup Time Benchmark (`startup-time.bench.spec.ts`)

**Purpose:** Measures time from Boot instantiation to server listening

**Metrics:**
- Min, Max, Avg startup time
- P95, P99 percentiles
- Variance across runs

**Target:** <2 seconds for cold start

**Run:**
```bash
yarn jest __test__/benchmarks/startup-time.bench.spec.ts --runTestsByPath --detectOpenHandles
```

### 2. HTTP Throughput Benchmark (`http-throughput.bench.spec.ts`)

**Purpose:** Tests requests/second with various payload sizes

**Test Cases:**
- Empty response
- Small JSON (~1KB)
- Medium JSON (~10KB)
- Large JSON (~100KB)
- POST with body

**Metrics:**
- Requests per second
- Latency (avg, p50, p95, p99)

**Target:** >1000 req/sec for simple routes

**Run:**
```bash
yarn jest __test__/benchmarks/http-throughput.bench.spec.ts --runTestsByPath --detectOpenHandles
```

### 3. Memory Usage Benchmark (`memory-usage.bench.spec.ts`)

**Purpose:** Measures baseline memory, memory under load, and leak detection

**Test Cases:**
- Baseline memory usage
- Memory under load (1000 requests)
- Memory leak detection (repeated cycles)

**Metrics:**
- RSS, heap total, heap used
- Memory growth over time
- Retention rate after load

**Target:** <200MB baseline, no leaks

**Run:**
```bash
yarn jest __test__/benchmarks/memory-usage.bench.spec.ts --runTestsByPath --detectOpenHandles --expose-gc
```

**Note:** Use `--expose-gc` flag to enable garbage collection during tests.

### 4. Concurrent Connections Benchmark (`concurrent-connections.bench.spec.ts`)

**Purpose:** Tests application behavior under concurrent load

**Test Cases:**
- 100 concurrent connections
- 500 concurrent connections
- 1000 concurrent connections
- 2000 concurrent connections (stress test)

**Metrics:**
- Success rate
- Error count
- Latency distribution

**Target:** Handle 1000+ concurrent connections with >80% success rate

**Run:**
```bash
yarn jest __test__/benchmarks/concurrent-connections.bench.spec.ts --runTestsByPath --detectOpenHandles
```

### 5. Resource Cleanup Benchmark (`cleanup.bench.spec.ts`)

**Purpose:** Verifies proper shutdown and resource cleanup

**Test Cases:**
- Shutdown time measurement
- Memory cleanup verification
- Repeated startup/shutdown cycles
- Hanging resources check

**Metrics:**
- Shutdown duration
- Memory retention
- Active handles/requests after shutdown

**Target:** Complete cleanup in <5 seconds

**Run:**
```bash
yarn jest __test__/benchmarks/cleanup.bench.spec.ts --runTestsByPath --detectOpenHandles --expose-gc
```

## Running All Benchmarks

### Sequential Execution (Recommended)

Run each benchmark individually to avoid resource contention:

```bash
# Run all benchmarks
yarn jest __test__/benchmarks/ --runTestsByPath --detectOpenHandles --expose-gc --runInBand

# With silent mode for cleaner output
yarn jest __test__/benchmarks/ --runTestsByPath --detectOpenHandles --expose-gc --runInBand --silent
```

### Individual Benchmark Execution

```bash
# Startup time
yarn jest __test__/benchmarks/startup-time.bench.spec.ts --runTestsByPath

# HTTP throughput
yarn jest __test__/benchmarks/http-throughput.bench.spec.ts --runTestsByPath

# Memory usage (requires --expose-gc)
yarn jest __test__/benchmarks/memory-usage.bench.spec.ts --runTestsByPath --expose-gc

# Concurrent connections
yarn jest __test__/benchmarks/concurrent-connections.bench.spec.ts --runTestsByPath

# Resource cleanup (requires --expose-gc)
yarn jest __test__/benchmarks/cleanup.bench.spec.ts --runTestsByPath --expose-gc
```

## Benchmark Utilities

### Helper Functions (`utils/benchmark-helpers.ts`)

- `calculateStats()` - Calculate min, max, avg, median, p95, p99, stdDev
- `runBenchmark()` - Run function multiple times and collect statistics
- `measureExecution()` - Measure single execution time
- `measureMemory()` - Capture memory usage snapshot
- `formatTime()` - Human-readable time formatting
- `formatBytes()` - Human-readable memory formatting
- `printStats()` - Pretty-print statistics table

### Test Application (`utils/test-app.ts`)

Provides a simple Express Tea application with various endpoints for benchmarking:
- `GET /` - Empty response
- `GET /health` - Health check JSON
- `GET /echo/:message` - Echo parameter
- `POST /data` - Accept body and return
- `GET /json/small` - Small JSON response (~1KB)
- `GET /json/medium` - Medium JSON response (~10KB)
- `GET /json/large` - Large JSON response (~100KB)

## Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| Startup Time | <2s | <3s |
| Simple Route Throughput | >1000 req/sec | >500 req/sec |
| Baseline Memory | <200MB | <300MB |
| Concurrent Connections | 1000+ @ >80% | 1000+ @ >70% |
| Shutdown Time | <5s | <7.5s |
| Memory Leak | <10% growth | <30% growth |

## Results Storage

Benchmark results are stored in `/specs/audits/`:
- `2026-02-11-benchmark-results.json` - Raw benchmark data
- `2026-02-11-benchmark-summary.md` - Human-readable summary

## Best Practices

1. **Run benchmarks in isolation** - Use `--runInBand` to prevent interference
2. **Enable GC for memory tests** - Use `--expose-gc` flag
3. **Run multiple iterations** - Default 5-10 iterations for stable results
4. **Check variance** - High variance (>20%) indicates unstable measurements
5. **Avoid background load** - Close other applications during benchmarking
6. **Use consistent environment** - Same hardware, Node version, OS state

## Interpreting Results

### Startup Time
- **<2s**: Excellent
- **2-3s**: Good
- **3-5s**: Acceptable
- **>5s**: Needs optimization

### Throughput
- **>1000 req/sec**: Excellent
- **500-1000 req/sec**: Good
- **200-500 req/sec**: Acceptable
- **<200 req/sec**: Needs optimization

### Memory
- **<200MB baseline**: Excellent
- **200-300MB baseline**: Good
- **300-500MB baseline**: Acceptable
- **>500MB baseline**: Needs optimization
- **<10% leak growth**: No leak
- **10-20% leak growth**: Minor leak
- **>20% leak growth**: Significant leak

### Concurrent Connections
- **>95% success @ 1000**: Excellent
- **85-95% success @ 1000**: Good
- **70-85% success @ 1000**: Acceptable
- **<70% success @ 1000**: Needs optimization

## Troubleshooting

### High Variance
- Close background applications
- Run fewer concurrent tests
- Increase warmup iterations
- Check system resource availability

### Memory Test Issues
- Ensure `--expose-gc` flag is set
- Run tests in isolation with `--runInBand`
- Check for other Node processes using memory

### Timeout Errors
- Increase Jest timeout in individual tests
- Reduce number of iterations
- Check network connectivity

### Port Conflicts
- Benchmarks use ports 6000-11000
- Ensure ports are available
- Tests auto-increment ports to avoid conflicts

## Contributing

When adding new benchmarks:
1. Follow naming convention: `<feature>.benchmark.ts`
2. Use utilities from `utils/benchmark-helpers.ts`
3. Include clear targets and acceptance criteria
4. Add documentation to this README
5. Store results in structured format for aggregation

## Version History

- **2.0.0** (2026-02-11): Initial comprehensive benchmark suite for production readiness
