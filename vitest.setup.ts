/**
 * Vitest Setup File
 * Initializes global dependencies and test environment
 */
import 'reflect-metadata';
import { vi } from 'vitest';

// Alias jest to vi for compatibility with packages that use jest.fn() internally (e.g. jest-express)
(globalThis as any).jest = vi;

// Suppress console output during tests unless explicitly needed
if (process.env.VITEST_DEBUG !== 'true') {
  // Keep console methods available but could add filtering here
}

// Set test environment variables
process.env.NODE_ENV = 'test';
