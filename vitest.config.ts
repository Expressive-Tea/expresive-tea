import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Environment
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],

    // Test discovery
    include: ['**/__test__/**/*.spec.ts', '**/__tests__/**/*.spec.ts', '**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'build', 'examples'],

    // Timeout and retries
    testTimeout: 30000,
    hookTimeout: 30000,

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportOnFailure: true,
      exclude: [
        'node_modules/',
        '__test__/',
        'dist/',
        'build/',
        'examples/',
        '**/*.spec.ts',
        '**/*.test.ts'
      ]
    },

    // Output and reporting
    reporter: ['default', 'junit'],
    outputFile: {
      junit: './reports/junit.xml'
    },

    // Isolation and performance
    isolate: true,
    threads: true,
    singleThread: false,
    maxThreads: 1,  // Start with single-threaded for stability, can increase later
    minThreads: 1,

    // File handling
    fileParallelism: false,

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  resolve: {
    alias: {
      '@classes': path.resolve(__dirname, './classes'),
      '@decorators': path.resolve(__dirname, './decorators'),
      '@engines': path.resolve(__dirname, './engines'),
      '@exceptions': path.resolve(__dirname, './exceptions'),
      '@helpers': path.resolve(__dirname, './helpers'),
      '@interfaces': path.resolve(__dirname, './interfaces'),
      '@libs': path.resolve(__dirname, './libs'),
      '@services': path.resolve(__dirname, './services'),
      '@types': path.resolve(__dirname, './types'),
      '@mixins': path.resolve(__dirname, './mixins'),
      '@config': path.resolve(__dirname, './config'),
      '@test-mocks': path.resolve(__dirname, './__test__/__mocks__'),
      '@test-classes': path.resolve(__dirname, './__test__/test-classes'),
      '@test-helpers': path.resolve(__dirname, './__test__/integrations/helpers'),
    }
  }
});
