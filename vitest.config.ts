import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin to fix the CJS interop issue for `import * as express from 'express'`.
 *
 * Boot.ts and boot-helper.ts use `import * as express from 'express'`, which is
 * TypeScript's CJS pattern that compiles to `const express = require('express')`.
 * However, in Vite's ESM/SSR mode, `import * as X` gives a namespace object that
 * is NOT callable. This plugin transforms the import BEFORE esbuild processes it,
 * converting the namespace import to a default import so that Vitest's
 * `interopDefault: true` can make it callable.
 *
 * Runs at `enforce: 'pre'` to execute before esbuild TypeScript compilation.
 */
function expressInteropPlugin(): Plugin {
  return {
    name: 'express-cjs-interop',
    enforce: 'pre',
    transform(code, id) {
      // Only transform project source files (not node_modules, test files, config)
      if (
        id.includes('node_modules') ||
        id.includes('__test__') ||
        id.includes('vitest.config') ||
        id.includes('vitest.setup')
      ) {
        return null;
      }
      if (code.includes("import * as express from 'express'")) {
        const transformed = code
          .replace(
            /import \* as express from 'express';/g,
            "import __expressDefault from 'express'; const express = __expressDefault;"
          );
        return { code: transformed, map: null };
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [expressInteropPlugin()],
  test: {
    // Environment
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],

    // Test discovery
    include: ['**/__test__/**/*.spec.ts', '**/__tests__/**/*.spec.ts'],
    exclude: [
      'node_modules',
      '.opencode',
      'dist',
      'build',
      'examples',
      '**/__test__/benchmarks/**',
    ],

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
        '**/*.test.ts',
        '**/*.d.ts',
        '**/*.js',
      ]
    },

    // Output and reporting
    reporter: ['default', 'junit'],
    outputFile: {
      junit: './reports/junit.xml'
    },

    // CJS/ESM interop - needed for express and other CJS modules
    // interopDefault: true makes `import X from 'cjs-module'` give the CJS export
    deps: {
      interopDefault: true,
    },

    // Isolation and performance
    isolate: true,
    threads: true,
    singleThread: false,
    maxThreads: 4,
    minThreads: 1,

    // File handling
    fileParallelism: false,

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  resolve: {
    // Prefer .ts source files over compiled .js files
    extensions: ['.mts', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
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
    }
  }
});
