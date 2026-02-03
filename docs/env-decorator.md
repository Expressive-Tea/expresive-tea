# @Env Decorator

Complete guide to loading and validating environment variables with the `@Env` decorator in Expressive Tea.

---

## Overview

The `@Env` decorator provides first-class support for loading environment variables from `.env` files before application initialization. In v2.0.1, it includes optional **type-safe transformation** and **validation** support, allowing you to catch configuration errors at startup rather than runtime.

**Key Features**:
- 🔧 Loads `.env` files before Settings initialization
- 📚 Multiple `.env` file support (stacking)
- ✅ Required variable validation
- 🛡️ Type-safe environment variables with transformation
- 🔍 Integration with validation libraries (Zod, Yup, etc.)
- ⚡ Fail-fast error handling on invalid configuration

---

## Basic Usage

### Simple Environment Loading

```typescript
import { Env, Boot } from '@expressive-tea/core';

@Env()
class MyApp extends Boot {}

// Loads from .env in project root
```

**`.env` file**:
```bash
# .env
PORT=3000
DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=secret-key-123
```

**Access variables**:
```typescript
const port = process.env.PORT; // "3000"
const dbUrl = process.env.DATABASE_URL; // "postgres://localhost:5432/mydb"
```

---

### Custom Path

Load from a different `.env` file:

```typescript
@Env({ path: '.env.production' })
class MyApp extends Boot {}
```

**Use case**: Different environments
```bash
my-app/
├── .env              # Development (default)
├── .env.production   # Production
├── .env.test         # Testing
└── server.ts
```

---

### Required Variables

Validate that critical environment variables are present:

```typescript
@Env({
  path: '.env',
  required: ['DATABASE_URL', 'API_KEY']
})
class MyApp extends Boot {}
```

**Behavior**:
- ✅ If all required variables exist → Application starts
- ❌ If any are missing → Throws error at startup

**Error example**:
```bash
Error: Missing required environment variables: DATABASE_URL, API_KEY
```

---

### Multiple Files (Stacking)

Load multiple `.env` files in order by stacking decorators:

```typescript
@Env({ path: '.env' })
@Env({ path: '.env.local', override: true, silent: true })
class MyApp extends Boot {}
```

**Execution order** (decorators execute bottom-to-top in TypeScript):
1. Load `.env.local` (if exists, override values)
2. Load `.env` (base configuration)

**Use case**: Local overrides
```bash
# .env (committed to git)
PORT=3000
DATABASE_URL=postgres://localhost:5432/mydb

# .env.local (ignored by git, developer overrides)
DATABASE_URL=postgres://localhost:5432/mydb_custom
DEBUG=true
```

**Options**:
- `override: true` - Overwrite existing environment variables
- `silent: true` - Don't throw error if file doesn't exist

---

## Advanced Features (v2.0.1+)

### Type-Safe Environment Variables

In v2.0.1, you can transform and validate environment variables using the `transform` option:

```typescript
interface Env {
  port: number;
  dbUrl: string;
}

@Env<Env>({
  path: '.env',
  transform: (env) => ({
    port: parseInt(env.PORT || '3000'),
    dbUrl: env.DATABASE_URL
  })
})
class MyApp extends Boot {
  constructor() {
    super();
    
    // Type-safe access via Settings
    const env = Settings.getInstance().getEnv<Env>();
    console.log(env.port); // Type: number (not string!)
  }
}
```

**Benefits**:
- ✅ Type-safe access to environment variables
- ✅ Transform strings to numbers, booleans, etc.
- ✅ IDE autocomplete and type checking
- ✅ Catch type errors at compile time

---

### Integration with Zod

For production applications, use a validation library like **Zod** for comprehensive type safety:

```typescript
import { z } from 'zod'; // npm install zod
import { Env, Boot, Settings } from '@expressive-tea/core';

// Define schema
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(32),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default(6379),
  ENABLE_CACHE: z.string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
});

// Infer TypeScript type from schema
type Env = z.infer<typeof EnvSchema>;

// Apply decorator with validation
@Env<Env>({
  path: '.env',
  required: ['DATABASE_URL', 'API_KEY'],
  transform: (env) => EnvSchema.parse(env),
  onTransformError: 'throw' // Fail fast on invalid env
})
class MyApp extends Boot {
  constructor() {
    super();
    
    // Type-safe access with full IDE support
    const env = Settings.getInstance().getEnv<Env>();
    
    console.log(env.PORT); // Type: number
    console.log(env.DATABASE_URL); // Type: string (validated URL format)
    console.log(env.ENABLE_CACHE); // Type: boolean
    console.log(env.REDIS_HOST); // Type: string (has default)
  }
}
```

**`.env` file**:
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=https://db.example.com:5432/mydb
API_KEY=sk-1234567890abcdef1234567890abcdef
REDIS_HOST=redis.example.com
REDIS_PORT=6379
ENABLE_CACHE=true
```

**What Zod validates**:
- ✅ `NODE_ENV` is one of: `development`, `production`, `test`
- ✅ `PORT` is a positive integer (string converted to number)
- ✅ `DATABASE_URL` is a valid URL format
- ✅ `API_KEY` is at least 32 characters long
- ✅ `REDIS_HOST` defaults to `'localhost'` if not provided
- ✅ `REDIS_PORT` defaults to `6379` if not provided (converted to number)
- ✅ `ENABLE_CACHE` is converted from string `"true"`/`"false"` to boolean

**Error example** (invalid env):
```bash
# .env with invalid PORT
PORT=abc  # Not a number!

# Application fails at startup with clear error:
Error: [
  {
    "code": "invalid_type",
    "expected": "number",
    "received": "nan",
    "path": ["PORT"],
    "message": "Expected number, received nan"
  }
]
```

---

### Custom Transform Function

You can implement your own validation logic:

```typescript
interface Env {
  port: number;
  isProduction: boolean;
  allowedOrigins: string[];
}

@Env<Env>({
  path: '.env',
  transform: (env) => {
    const port = parseInt(env.PORT || '3000');
    
    // Custom validation
    if (port < 1024 || port > 65535) {
      throw new Error(`Invalid PORT: ${port} (must be 1024-65535)`);
    }
    
    return {
      port,
      isProduction: env.NODE_ENV === 'production',
      allowedOrigins: env.CORS_ORIGINS?.split(',') || ['*']
    };
  },
  onTransformError: 'throw'
})
class MyApp extends Boot {}
```

**`.env` file**:
```bash
PORT=8080
NODE_ENV=production
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

**Result**:
```typescript
const env = Settings.getInstance().getEnv<Env>();
// {
//   port: 8080,
//   isProduction: true,
//   allowedOrigins: ['https://app.example.com', 'https://admin.example.com']
// }
```

---

## Error Handling

### onTransformError Option

Control how the application behaves when environment variable transformation fails:

```typescript
interface EnvOptions<T> {
  // ...
  onTransformError?: 'throw' | 'warn' | 'ignore';
}
```

#### `'throw'` (Default, Recommended)

Fail immediately at startup if validation fails:

```typescript
@Env({
  transform: (env) => EnvSchema.parse(env),
  onTransformError: 'throw' // Application won't start with invalid env
})
class MyApp extends Boot {}
```

**Use case**: Production applications where invalid configuration should prevent startup.

---

#### `'warn'`

Log a warning and continue with unvalidated environment variables:

```typescript
@Env({
  transform: (env) => EnvSchema.parse(env),
  onTransformError: 'warn' // Log warning, continue with process.env
})
class MyApp extends Boot {}
```

**Console output**:
```bash
[WARN] Environment validation failed: Invalid PORT value
Application starting with unvalidated environment variables...
```

**Use case**: Development environments where you want to see errors but not block startup.

---

#### `'ignore'`

Silently ignore validation errors and continue:

```typescript
@Env({
  transform: (env) => EnvSchema.parse(env),
  onTransformError: 'ignore' // Silent failure
})
class MyApp extends Boot {}
```

**Use case**: Rare. Only when validation is truly optional.

---

### Common Validation Patterns

#### Validate Required Secrets

```typescript
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  API_KEY: z.string().regex(/^sk-[a-zA-Z0-9]{32}$/, 'Invalid API_KEY format')
});

@Env({
  transform: (env) => EnvSchema.parse(env),
  onTransformError: 'throw'
})
class MyApp extends Boot {}
```

---

#### Validate Numeric Ranges

```typescript
const EnvSchema = z.object({
  PORT: z.string()
    .transform(Number)
    .pipe(z.number().int().min(1024).max(65535)),
  MAX_CONNECTIONS: z.string()
    .transform(Number)
    .pipe(z.number().int().positive().max(1000))
});
```

---

#### Validate URLs and Emails

```typescript
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  SUPPORT_EMAIL: z.string().email(),
  WEBHOOK_URL: z.string().url().startsWith('https://') // Enforce HTTPS
});
```

---

#### Provide Defaults

```typescript
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
});
```

---

## API Reference

### EnvOptions Interface

```typescript
interface EnvOptions<T = Record<string, string>> {
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
   * Optional transform function to validate and type-cast environment variables
   * @since 2.0.1
   */
  transform?: (env: Record<string, string>) => T;

  /**
   * Behavior when transform function throws an error
   * - 'throw': Fail immediately (recommended for production)
   * - 'warn': Log warning and continue with unvalidated env
   * - 'ignore': Silent failure
   * @default 'throw'
   * @since 2.0.1
   */
  onTransformError?: 'throw' | 'warn' | 'ignore';
}
```

---

### Settings.getEnv<T>()

Retrieve the transformed environment variables:

```typescript
class Settings {
  /**
   * Get environment variables with type safety
   * @returns Transformed environment variables (if transform was used),
   *          otherwise returns process.env
   * @since 2.0.1
   */
  getEnv<T = NodeJS.ProcessEnv>(): T;
}
```

**Usage**:
```typescript
import { Settings } from '@expressive-tea/core';

type Env = {
  port: number;
  dbUrl: string;
};

const env = Settings.getInstance().getEnv<Env>();
console.log(env.port); // Type: number
```

---

## Best Practices

### 1. Always Use Validation in Production

```typescript
// ❌ BAD: No validation, errors happen at runtime
@Env()
class MyApp extends Boot {
  start() {
    const port = parseInt(process.env.PORT!); // Might be NaN!
  }
}

// ✅ GOOD: Fail fast at startup with clear errors
@Env({
  transform: (env) => EnvSchema.parse(env),
  onTransformError: 'throw'
})
class MyApp extends Boot {}
```

---

### 2. Use Zod for Complex Validation

```typescript
// ❌ BAD: Manual validation is error-prone
@Env({
  transform: (env) => {
    if (!env.PORT || isNaN(Number(env.PORT))) throw new Error('Invalid PORT');
    if (!env.DATABASE_URL) throw new Error('Missing DATABASE_URL');
    // ... lots of manual checks
  }
})

// ✅ GOOD: Declarative schema with Zod
const EnvSchema = z.object({
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url()
});

@Env({
  transform: (env) => EnvSchema.parse(env)
})
```

---

### 3. Separate Secrets from Config

```bash
# ✅ GOOD: Secrets in .env (not committed)
# .env
DATABASE_PASSWORD=super-secret
API_KEY=sk-1234567890abcdef

# .gitignore
.env
.env.local
.env.production
```

```yaml
# ✅ GOOD: Structure in .expressive-tea.yaml (committed)
# .expressive-tea.yaml
port: 3000
database:
  host: localhost
  port: 5432
```

---

### 4. Provide Sensible Defaults

```typescript
const EnvSchema = z.object({
  PORT: z.string().transform(Number).default(3000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_CACHE: z.string().transform((v) => v === 'true').default(false)
});
```

**Benefit**: Application works out-of-the-box for development without requiring `.env` file.

---

### 5. Document Required Variables

Create an `.env.example` file:

```bash
# .env.example (committed to git)

# Server Configuration
PORT=3000
NODE_ENV=development

# Database (required)
DATABASE_URL=postgres://localhost:5432/mydb

# Redis Cache (optional, defaults to localhost:6379)
# REDIS_HOST=localhost
# REDIS_PORT=6379

# API Keys (required for production)
API_KEY=your-api-key-here
JWT_SECRET=your-jwt-secret-min-32-chars
```

**Usage**:
```bash
# New developer setup
cp .env.example .env
# Edit .env with actual values
```

---

## Troubleshooting

### Variables Not Loading

**Problem**: Environment variables from `.env` file are not available.

**Solution**: Ensure `@Env()` decorator is applied to your Boot class:

```typescript
// ❌ BAD: Decorator missing
class MyApp extends Boot {}

// ✅ GOOD: Decorator applied
@Env()
class MyApp extends Boot {}
```

---

### Transform Function Not Called

**Problem**: `transform` function doesn't execute.

**Solution**: Check that you're using v2.0.1 or later:

```bash
npm list @expressive-tea/core
# Should show: @expressive-tea/core@2.0.1 or higher
```

---

### Type-Safe Env Returns `any`

**Problem**: `Settings.getEnv<Env>()` doesn't provide type safety.

**Solution**: Ensure you're using the generic parameter:

```typescript
// ❌ BAD: No type parameter
const env = Settings.getInstance().getEnv(); // Type: any

// ✅ GOOD: Explicit type parameter
const env = Settings.getInstance().getEnv<Env>(); // Type: Env
```

---

### Zod Schema Errors

**Problem**: Zod throws confusing validation errors.

**Solution**: Use Zod's error formatting:

```typescript
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error'; // npm install zod-validation-error

@Env({
  transform: (env) => {
    try {
      return EnvSchema.parse(env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw fromZodError(error); // Human-readable errors
      }
      throw error;
    }
  }
})
```

---

## Migration from v2.0.0

### No Breaking Changes

All existing `@Env()` usage continues to work without modifications:

```typescript
// v2.0.0 code (still works in v2.0.1)
@Env({ path: '.env', required: ['DATABASE_URL'] })
class MyApp extends Boot {}
```

---

### Optional: Add Type Safety

Enhance your existing code with type-safe transformations:

**Before (v2.0.0)**:
```typescript
@Env({ path: '.env' })
class MyApp extends Boot {
  start() {
    const port = parseInt(process.env.PORT || '3000');
    const dbUrl = process.env.DATABASE_URL!; // Unsafe!
  }
}
```

**After (v2.0.1)**:
```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.string().transform(Number).default(3000),
  DATABASE_URL: z.string().url()
});

type Env = z.infer<typeof EnvSchema>;

@Env<Env>({
  path: '.env',
  transform: (env) => EnvSchema.parse(env),
  onTransformError: 'throw'
})
class MyApp extends Boot {
  constructor() {
    super();
    const env = Settings.getInstance().getEnv<Env>();
    console.log(env.PORT); // Type: number, guaranteed valid
  }
}
```

---

## Related Documentation

- [Configuration Files](./configuration-files.md) - Using `.expressive-tea.yaml` for structure settings
- [Settings API](../README.md#settings-api) - Settings singleton reference
- [Zod Documentation](https://zod.dev) - Schema validation library

---

## Summary

- ✅ Load environment variables from `.env` files
- ✅ Support for multiple files (stacking)
- ✅ Required variable validation
- ✅ **NEW in v2.0.1**: Type-safe transformations with `transform` option
- ✅ **NEW in v2.0.1**: Integration with Zod and other validation libraries
- ✅ **NEW in v2.0.1**: Configurable error handling with `onTransformError`
- ✅ **NEW in v2.0.1**: `Settings.getEnv<T>()` for type-safe access
- ✅ Backward compatible with v2.0.0

**Recommended**: Use Zod validation with `onTransformError: 'throw'` for production applications to catch configuration errors at startup.
