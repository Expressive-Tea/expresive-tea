import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Environment variable loading options
 * @interface EnvOptions
 * @since 2.0.0
 */
export interface EnvOptions {
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
}

/**
 * Parse a .env file content into key-value pairs
 * 
 * Supports:
 * - Basic KEY=VALUE format
 * - Comments (lines starting with #)
 * - Quoted values (single and double quotes)
 * - Multiline values (quoted)
 * - Escape sequences in quoted strings
 * 
 * @param content - Raw .env file content
 * @returns Parsed environment variables
 * @since 2.0.0
 * @private
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  let currentKey: string | null = null;
  let currentValue = '';
  let inQuote: '\'' | '"' | null = null;

  for (let line of lines) {
    // Trim whitespace
    line = line.trim();

    // Skip empty lines and comments (only if not in a multiline value)
    if (!inQuote && (line === '' || line.startsWith('#'))) {
      continue;
    }

    // If we're continuing a multiline value
    if (inQuote) {
      const quoteIndex = line.indexOf(inQuote);
      if (quoteIndex >= 0) {
        // End of multiline value
        currentValue += '\n' + line.substring(0, quoteIndex);
        if (currentKey) {
          result[currentKey] = currentValue;
        }
        currentKey = null;
        currentValue = '';
        inQuote = null;
      } else {
        // Continue multiline value
        currentValue += '\n' + line;
      }
      continue;
    }

    // Parse KEY=VALUE
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }

    const key = line.substring(0, equalIndex).trim();
    let value = line.substring(equalIndex + 1).trim();

    // Handle quoted values
    if (value.startsWith('"') || value.startsWith('\'')) {
      const quote = value[0] as '\'' | '"';
      value = value.substring(1);

      const endQuoteIndex = value.indexOf(quote);
      if (endQuoteIndex >= 0) {
        // Single-line quoted value
        value = value.substring(0, endQuoteIndex);
        // Unescape special characters
        value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
        result[key] = value;
      } else {
        // Start of multiline quoted value
        currentKey = key;
        currentValue = value;
        inQuote = quote;
      }
    } else {
      // Unquoted value
      result[key] = value;
    }
  }

  return result;
}

/**
 * Load environment variables from a .env file
 * 
 * @param options - Environment loading options
 * @throws {Error} If required variables are missing or file is not found (when not silent)
 * @since 2.0.0
 * @private
 */
function loadEnvFile(options: EnvOptions): void {
  const {
    path: envPath = '.env',
    override = false,
    required = [],
    silent = false,
  } = options;

  const fullPath = resolve(process.cwd(), envPath);

  // Check if file exists
  if (!existsSync(fullPath)) {
    if (!silent) {
      throw new Error(`Environment file not found: ${fullPath}`);
    }
    return;
  }

  // Read and parse file
  const content = readFileSync(fullPath, 'utf-8');
  const parsed = parseEnvFile(content);

  // Set environment variables
  for (const [key, value] of Object.entries(parsed)) {
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  // Validate required variables
  const missing = required.filter((key) => process.env[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
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
 * @decorator {ClassDecorator} Env - Load environment variables from .env file
 * @param options - Environment loading options
 * @returns Class decorator function
 * @since 2.0.0
 * @summary Load environment variables from .env files
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
 * // In your .env file:
 * // DATABASE_URL=postgres://localhost:5432/mydb
 * // API_KEY="secret-key-with-special-chars"
 * // MULTI_LINE="Line 1
 * // Line 2
 * // Line 3"
 */
export function Env(options: EnvOptions = {}): ClassDecorator {
  return (target: any) => {
    // Load env file immediately when decorator is applied
    loadEnvFile(options);
    return target;
  };
}
