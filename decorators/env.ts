import { existsSync } from 'fs';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
import logger from '@helpers/logger';

/**
 * Environment variable loading options with optional transformation
 * @interface EnvOptions
 * @template T - Type of transformed environment variables
 * @since 2.0.0
 */
export interface EnvOptions<T = Record<string, string>> {
  /**
   * Path to the .env file (relative to project root)
   * @default '.env'
   */
  path?: string;

  /**
   * Whether to override existing environment variables
   * @default false
   */
  override?: boolean;

  /**
   * List of required environment variables (will throw if missing)
   */
  required?: string[];

  /**
   * Whether to ignore missing .env file
   * @default false
   */
  silent?: boolean;

  /**
   * Optional transformation function for type-safe environment variables.
   * Receives parsed env vars and returns transformed result.
   * Use with validation libraries like Zod for runtime type safety.
   *
   * @param env - Parsed environment variables
   * @returns Transformed and validated environment variables
   * @since 2.0.1
   *
   * @example
   * import { z } from 'zod';
   * const EnvSchema = z.object({
   *   PORT: z.string().transform(Number),
   *   DATABASE_URL: z.string().url()
   * });
   *
   * @Env({
   *   transform: (env) => EnvSchema.parse(env),
   *   onTransformError: 'throw'
   * })
   */
  transform?: (env: Record<string, string>) => T;

  /**
   * Behavior when transform function throws an error
   * - 'throw': Re-throw error immediately (fail-fast, recommended for production)
   * - 'warn': Log warning and continue with unvalidated env
   * - 'ignore': Silent failure, continue without transform
   *
   * @default 'throw'
   * @since 2.0.1
   */
  onTransformError?: 'throw' | 'warn' | 'ignore';
}

/**
 * Global storage for transformed environment variables.
 * Set by @Env decorator when transform option is provided.
 * @private
 */
let transformedEnv: unknown = null;

/**
 * Store transformed environment variables in global storage.
 * Used internally by @Env decorator.
 *
 * @template T - Type of transformed environment variables
 * @param env - Transformed environment variables
 * @private
 * @since 2.0.1
 */
function storeTransformedEnv<T>(env: T): void {
  transformedEnv = env;
}

/**
 * Retrieve transformed environment variables from global storage.
 * Returns null if no transform was applied.
 *
 * @template T - Type of transformed environment variables
 * @returns Transformed environment variables or null
 * @since 2.0.1
 *
 * @example
 * const env = getTransformedEnv<MyEnvType>();
 * if (env) {
 *   console.log(env.PORT); // Type-safe access
 * }
 */
export function getTransformedEnv<T>(): T | null {
  return transformedEnv as T | null;
}

/**
 * Load environment variables from a .env file using dotenv.
 * Supports transformation and validation via optional transform function.
 *
 * @template T - Type of transformed environment variables
 * @param options - Environment loading options
 * @throws {Error} If required variables are missing, file is not found (when not silent), or transform fails (when onTransformError='throw')
 * @since 2.0.0
 * @private
 */
function loadEnvFile<T>(options: EnvOptions<T>): T | undefined {
  const {
    path: envPath = '.env',
    override = false,
    required = [],
    silent = false,
    transform,
    onTransformError = 'throw'
  } = options;

  const fullPath = resolve(process.cwd(), envPath);

  // Check if file exists
  if (!existsSync(fullPath)) {
    if (!silent) {
      throw new Error(`Environment file not found: ${fullPath}`);
    }
    return undefined;
  }

  // Load with dotenv
  const result = dotenv.config({
    path: fullPath,
    override
  });

  if (result.error && !silent) {
    throw new Error(`Failed to load ${fullPath}: ${result.error.message}`);
  }

  // Validate required variables
  const missing = required.filter((key) => process.env[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Apply transform if provided
  if (transform) {
    try {
      const envVars = result.parsed || {};
      const transformed = transform(envVars);

      // Store transformed result globally
      storeTransformedEnv(transformed);

      return transformed;
    } catch (error: unknown) {
      const errorMsg = `Environment transformation failed: ${error instanceof Error ? error.message : String(error)}`;

      if (onTransformError === 'throw') {
        throw new Error(errorMsg);
      } else if (onTransformError === 'warn') {
        logger.warn(`[Expressive Tea] ${errorMsg}`);
        if (error instanceof Error && error.stack) {
          logger.warn(error.stack);
        }
      }
      // 'ignore' - do nothing, return undefined
    }
  }

  return undefined;
}

/**
 * Class decorator to load environment variables from .env files before application initialization.
 *
 * This decorator can be stacked to load multiple .env files in order, allowing for
 * environment-specific overrides (e.g., .env → .env.local → .env.production).
 *
 * Environment variables are loaded BEFORE the Settings singleton is initialized,
 * ensuring they're available during the entire application lifecycle.
 *
 * **New in v2.0.1:** Optional type-safe transformation with validation libraries like Zod.
 *
 * @decorator {ClassDecorator} Env - Load environment variables from .env file
 * @template T - Type of transformed environment variables
 * @param options - Environment loading options
 * @returns Class decorator function
 * @since 2.0.0
 * @summary Load environment variables from .env files with optional type-safe transformation
 *
 * @example
 * // Basic usage - load from .env
 * @Env()
 * class MyApp extends Boot {}
 *
 * @example
 * // Load from custom path with required variables
 * @Env({
 *   path: '.env.production',
 *   required: ['DATABASE_URL', 'API_KEY']
 * })
 * class MyApp extends Boot {}
 *
 * @example
 * // Stack multiple .env files (loaded in order)
 * @Env({ path: '.env' })
 * @Env({ path: '.env.local', override: true, silent: true })
 * class MyApp extends Boot {}
 *
 * @example
 * // Type-safe transformation with Zod
 * import { z } from 'zod';
 *
 * const EnvSchema = z.object({
 *   PORT: z.string().transform(Number),
 *   DATABASE_URL: z.string().url(),
 *   API_KEY: z.string().min(32)
 * });
 *
 * type Env = z.infer<typeof EnvSchema>;
 *
 * @Env<Env>({
 *   path: '.env',
 *   required: ['DATABASE_URL', 'API_KEY'],
 *   transform: (env) => EnvSchema.parse(env),
 *   onTransformError: 'throw' // Fail fast on invalid env
 * })
 * class MyApp extends Boot {
 *   constructor() {
 *     super();
 *     // Access type-safe env
 *     const env = Settings.getInstance().getEnv<Env>();
 *     console.log(env.PORT); // Type: number
 *   }
 * }
 *
 * @example
 * // In your .env file:
 * // DATABASE_URL=postgres://localhost:5432/mydb
 * // API_KEY="secret-key-with-special-chars"
 * // PORT=3000
 */
export function Env<T = Record<string, string>>(options: EnvOptions<T> = {}): ClassDecorator {
  return (target) => {
    // Load env file immediately when decorator is applied
    loadEnvFile(options);
    return target;
  };
}
