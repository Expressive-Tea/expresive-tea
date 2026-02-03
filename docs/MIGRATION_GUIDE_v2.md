# Migration Guide: v1.x to v2.0.0

> [!IMPORTANT]
> ## 📦 Package Renamed: `@expressive-tea/core`
> 
> **Starting with v2.0.0, Expressive Tea has moved to a new npm package:**
> 
> ```diff
> - npm install @zerooneit/expressive-tea
> + npm install @expressive-tea/core
> ```
> 
> **Legacy Support:** The old package `@zerooneit/expressive-tea` will receive security patches only until **April 30, 2026**.
> 
> **Your code remains unchanged** - only the package name in `package.json` needs updating!

---

> [!CAUTION]
> **⚠️ VERSIONS 1.x ARE DEPRECATED - IMMEDIATE ACTION REQUIRED**
> 
> **All versions before 2.0.0 are officially deprecated** as of January 27, 2026.
> 
> **Critical Issues in v1.x:**
> - ❌ Depends on deprecated InversifyJS 6.x
> - ❌ Critical security vulnerabilities in cryptography
> - ❌ No security patches will be released
> - ❌ No bug fixes will be released
> - ❌ No technical support available
> 
> **You must upgrade to v2.0.0 to receive:**
> - ✅ Security fixes for critical vulnerabilities
> - ✅ Modern InversifyJS 7.x support
> - ✅ Ongoing support and updates
> - ✅ Bug fixes and improvements
> 
> **Timeline:** v1.x support ended January 27, 2026. Upgrade immediately.

---

This guide will help you migrate your Expressive Tea application from v1.x to v2.0.0.

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
- [Step-by-Step Migration](#step-by-step-migration)
- [Cryptography Changes](#cryptography-changes)
- [TypeScript Strict Mode](#typescript-strict-mode)
- [Dependency Injection Updates](#dependency-injection-updates)
- [Testing Your Migration](#testing-your-migration)
- [Troubleshooting](#troubleshooting)

---

## Overview

Expressive Tea v2.0.0 is a major release focused on:
- **Security**: Fixed critical cryptography vulnerabilities
- **Type Safety**: Enabled TypeScript strict mode
- **Architecture**: Enhanced DI and engine systems
- **Performance**: Removed internal lodash dependencies
- **Quality**: 92.75% test coverage

### Who Needs to Migrate?

- **All users** should update for security fixes
- **TypeScript users** will benefit from strict mode
- **Plugin developers** should test compatibility
- **Users of crypto module** must re-encrypt data

---

## Breaking Changes

### 0. Package Name Change (ACTION REQUIRED)

**Impact:** MEDIUM - Simple package.json update

**What Changed:**
- Package renamed from `@zerooneit/expressive-tea` to `@expressive-tea/core`
- Repository moved to `https://github.com/Expressive-Tea/expresive-tea`

**Action Required:**
```diff
// package.json
{
  "dependencies": {
-   "@zerooneit/expressive-tea": "^1.2.0"
+   "@expressive-tea/core": "^2.0.0"
  }
}
```

**No code changes needed!** All imports remain the same:
```typescript
// Still works exactly the same
import { Boot, Route, Get } from '@expressive-tea/core';
```

**Timeline:**
- `@zerooneit/expressive-tea` - Security patches only until April 30, 2026
- `@expressive-tea/core` - Actively maintained, all new features

---

### 1. Cryptography Module (CRITICAL)

**Impact:** HIGH - Data encrypted with v1.x cannot be decrypted in v2.0.0

**What Changed:**
- AES-256-GCM now uses HKDF (RFC 5869) for key derivation
- Authentication tag handling corrected
- PBKDF2 replaces MD5 for password hashing

**Action Required:**
```typescript
// Before migrating, decrypt all data with v1.x
const oldData = decryptV1(encryptedData);

// After migrating to v2.0.0, re-encrypt
const newData = encryptV2(oldData);
```

**Migration Script Example:**
```typescript
// Use the OLD package to decrypt
import { decrypt as decryptV1 } from '@zerooneit/expressive-tea@1.3.0-beta.6';
import { encrypt as encryptV2 } from '@zerooneit/expressive-tea@2.0.0';

async function migrateEncryptedData() {
  const records = await db.getEncryptedRecords();
  
  for (const record of records) {
    try {
      // Decrypt with old version
      const plaintext = decryptV1(record.data, oldPassword);
      
      // Re-encrypt with new version
      const newEncrypted = encryptV2(plaintext, newPassword);
      
      // Update database
      await db.updateRecord(record.id, { data: newEncrypted });
    } catch (error) {
      console.error(`Failed to migrate record ${record.id}:`, error);
    }
  }
}
```

---

### 2. TypeScript Strict Mode

**Impact:** MEDIUM - May cause compilation errors in consuming projects

**What Changed:**
- `strict: true` enabled for Expressive Tea core
- `noImplicitAny: true` enforced
- `strictNullChecks: true` enabled

**Action Required:**

**Option 1: Gradual Migration (Recommended)**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false,  // Keep this for now
    "strictNullChecks": false,
    "noImplicitAny": false
  }
}
```

**Option 2: Full Strict Mode (Best Practice)**
```json
// tsconfig.json  
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

**Common Fixes:**

```typescript
// Before: Implicit any
function handler(req, res) {
  res.send('hello');
}

// After: Explicit types
import { Request, Response } from 'express';
function handler(req: Request, res: Response) {
  res.send('hello');
}

// Before: Nullable value
const settings = Settings.getInstance();
settings.get('port'); // Might be undefined

// After: Null checks
const settings = Settings.getInstance();
const port = settings?.get('port') ?? 3000;

// Before: Uninitialized property
class MyController {
  private service;  // Error in strict mode
}

// After: Initialize or mark optional
class MyController {
  private service!: MyService;  // Definite assignment
  // OR
  private service?: MyService;  // Optional
}
```

---

### 3. Dependency Injection API

**Impact:** LOW - Old methods still work but deprecated

**What Changed:**
- Added scoped registration methods
- Enhanced container lifecycle

**Action Required:**

```typescript
// Old way (still works, deprecated)
import { DependencyInjection } from '@zerooneit/expressive-tea';
DependencyInjection.setProvider('MyService', MyService);

// New way (recommended)
import { DependencyInjection } from '@zerooneit/expressive-tea';

// Singleton (one instance for app lifetime)
DependencyInjection.registerSingleton('MyService', MyService);

// Transient (new instance each time)
DependencyInjection.registerTransient('TempService', TempService);

// Scoped (one instance per request)
DependencyInjection.registerScoped('RequestService', RequestService);
```

---

### 4. Generic Mixin Types

**Impact:** LOW - Improves type safety, optional to adopt

**What Changed:**
- Mixins now use generic types for better IntelliSense
- `ModulizedClass<TBase>`, `RouterizedClass<TBase>`, `ProxifiedClass<TBase>`

**Action Required:**

```typescript
// Before: No type safety
@Route('/api')
class MyController {
  // No autocomplete for mixin methods
}

// After: Full type safety (automatic)
@Route('/api')
class MyController {
  // IDE now knows about this.router, this.mountpoint, etc.
}

// If extending manually:
import { RouterizedClass, Constructor } from '@zerooneit/expressive-tea';

function createController<T extends Constructor>(Base: T): RouterizedClass<T> {
  @Route('/api')
  class Controller extends Base {
    // Full type safety
  }
  return Controller;
}
```

---

## Step-by-Step Migration

### Step 1: Backup Your Data

```bash
# Backup database
pg_dump mydb > backup_before_v2.sql

# Backup encrypted files
cp -r /path/to/encrypted /path/to/encrypted.backup
```

### Step 2: Update Dependencies

```bash
# Update to v2.0.0
npm install @zerooneit/expressive-tea@2.0.0

# Or with yarn
yarn add @zerooneit/expressive-tea@2.0.0
```

### Step 3: Handle Encrypted Data (If Using Crypto Module)

See [Cryptography Changes](#cryptography-changes) section above.

### Step 4: Update TypeScript Configuration

```json
// tsconfig.json - Start with compatibility mode
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "commonjs",
    "lib": ["ES2017"],
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    
    // Start with these disabled
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    
    // Enable one by one
    // "strictNullChecks": true,  // Step 1
    // "noImplicitAny": true,     // Step 2
    // "strict": true              // Step 3
  }
}
```

### Step 5: Run Tests

```bash
# Run your test suite
npm test

# If tests fail, see Troubleshooting section
```

### Step 6: Update DI Registrations (Optional)

```typescript
// In your bootstrap or main file
import { DependencyInjection } from '@zerooneit/expressive-tea';

// Replace old setProvider calls
// Old:
// DependencyInjection.setProvider('UserService', UserService);

// New:
DependencyInjection.registerSingleton('UserService', UserService);
DependencyInjection.registerTransient('LogService', LogService);
DependencyInjection.registerScoped('RequestContext', RequestContext);
```

### Step 7: Enable Strict Mode (Recommended)

```bash
# Enable strict checks incrementally
# 1. Enable strictNullChecks
# 2. Fix compilation errors
# 3. Enable noImplicitAny
# 4. Fix compilation errors  
# 5. Enable full strict mode
```

---

## Cryptography Changes

### Understanding the Changes

**Old Implementation (v1.x - INSECURE):**
```
Password → MD5 Hash → AES-256-GCM Key
                   ↓
            Broken auth tag handling
```

**New Implementation (v2.0.0 - SECURE):**
```
Password → PBKDF2 (100k iterations) → Master Key
                                    ↓
                               HKDF Derivation
                                    ↓
                            AES-256-GCM Key
                                    ↓
                        Proper auth tag handling
```

### Migration Script Template

```typescript
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Crypto as CryptoV1 } from '@zerooneit/expressive-tea@1.3.0-beta.6';
import { Crypto as CryptoV2 } from '@zerooneit/expressive-tea@2.0.0';

interface EncryptedRecord {
  id: string;
  data: string;
  algorithm: string;
}

async function migrateEncryptedDatabase() {
  const oldCrypto = new CryptoV1();
  const newCrypto = new CryptoV2();
  
  // Your old password
  const oldPassword = process.env.OLD_ENCRYPTION_PASSWORD;
  const newPassword = process.env.NEW_ENCRYPTION_PASSWORD; // Can be same or different
  
  // Get all encrypted records from your database
  const records = await yourDatabase.find({ encrypted: true });
  
  let successCount = 0;
  let failCount = 0;
  
  for (const record of records) {
    try {
      // Decrypt with v1.x
      const plaintext = oldCrypto.decrypt(record.encryptedData, oldPassword);
      
      // Re-encrypt with v2.0.0
      const newEncrypted = newCrypto.encrypt(plaintext, newPassword);
      
      // Update record
      await yourDatabase.update(record.id, {
        encryptedData: newEncrypted,
        algorithm: 'AES-256-GCM-HKDF',
        migratedAt: new Date()
      });
      
      successCount++;
    } catch (error) {
      console.error(`Failed to migrate record ${record.id}:`, error);
      failCount++;
      
      // Log for manual review
      await logFailedMigration(record.id, error);
    }
  }
  
  console.log(`Migration complete: ${successCount} succeeded, ${failCount} failed`);
}

// Run migration
migrateEncryptedDatabase()
  .then(() => console.log('Migration finished'))
  .catch(err => console.error('Migration failed:', err));
```

---

## TypeScript Strict Mode

### Common Errors and Fixes

#### Error: Property has no initializer

```typescript
// ❌ Error
class UserController {
  private userService;
}

// ✅ Fix 1: Definite assignment assertion
class UserController {
  private userService!: UserService;  // Initialized elsewhere
}

// ✅ Fix 2: Optional property
class UserController {
  private userService?: UserService;
}

// ✅ Fix 3: Initialize in constructor
class UserController {
  private userService: UserService;
  
  constructor() {
    this.userService = new UserService();
  }
}
```

#### Error: Implicit any type

```typescript
// ❌ Error
function handler(req, res) {
  res.json({ message: 'hello' });
}

// ✅ Fix: Add explicit types
import { Request, Response } from 'express';

function handler(req: Request, res: Response) {
  res.json({ message: 'hello' });
}
```

#### Error: Object is possibly undefined

```typescript
// ❌ Error
const settings = Settings.getInstance();
const port = settings.get('port');  // settings might be undefined

// ✅ Fix 1: Nullish coalescing
const settings = Settings.getInstance();
const port = settings?.get('port') ?? 3000;

// ✅ Fix 2: Null check
const settings = Settings.getInstance();
if (settings) {
  const port = settings.get('port');
}

// ✅ Fix 3: Non-null assertion (if you're certain)
const settings = Settings.getInstance()!;
const port = settings.get('port');
```

---

## Dependency Injection Updates

### New Registration Methods

```typescript
import { DependencyInjection } from '@zerooneit/expressive-tea';

// Singleton: One instance for application lifetime
// Use for: Database connections, configuration services
DependencyInjection.registerSingleton('Database', DatabaseService);

// Transient: New instance every time
// Use for: Temporary operations, stateless services
DependencyInjection.registerTransient('EmailSender', EmailService);

// Scoped: One instance per request
// Use for: Request context, user session data
DependencyInjection.registerScoped('RequestLogger', LoggerService);
```

### Migration Example

```typescript
// Before (v1.x)
import { DependencyInjection } from '@zerooneit/expressive-tea';
import { DatabaseService, CacheService, LogService } from './services';

DependencyInjection.setProvider('Database', DatabaseService);
DependencyInjection.setProvider('Cache', CacheService);  
DependencyInjection.setProvider('Logger', LogService);

// After (v2.0.0) - More explicit control
import { DependencyInjection } from '@zerooneit/expressive-tea';
import { DatabaseService, CacheService, LogService } from './services';

// Singleton: One database connection for app
DependencyInjection.registerSingleton('Database', DatabaseService);

// Singleton: One cache instance for app
DependencyInjection.registerSingleton('Cache', CacheService);

// Scoped: New logger per request
DependencyInjection.registerScoped('Logger', LogService);
```

---

## New Features in v2.0

### 1. Health Check System

**What It Is:**
Built-in health check endpoints for Kubernetes, load balancers, and monitoring systems.

**How to Use:**
```typescript
import { Boot, HealthCheck } from '@zerooneit/expressive-tea';

@HealthCheck({
  checks: [
    {
      name: 'database',
      check: async () => {
        const isConnected = await db.ping();
        return { status: isConnected ? 'pass' : 'fail' };
      },
      critical: true,  // Blocks readiness probe if fails
      timeout: 5000
    },
    {
      name: 'cache',
      check: async () => {
        const isReady = await redis.ping();
        return {
          status: isReady ? 'pass' : 'warn',  // Warn but don't fail
          details: { connected: isReady }
        };
      }
    }
  ]
})
class MyApp extends Boot {}
```

**Endpoints:**
- `GET /health` - Detailed health status with all checks
- `GET /health/live` - Liveness probe (always 200 if server running)
- `GET /health/ready` - Readiness probe (200 only if all critical checks pass)

**Kubernetes Integration:**
```yaml
# deployment.yaml
spec:
  containers:
  - name: my-app
    livenessProbe:
      httpGet:
        path: /health/live
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

---

### 2. Environment Variable Support

**What It Is:**
First-class support for `.env` files with validation and type safety.

**How to Use:**
```typescript
import { Boot, Env } from '@zerooneit/expressive-tea';

// Load environment variables from .env files
@Env({ path: '.env', required: ['DATABASE_URL', 'API_KEY'] })
@Env({ path: '.env.local', override: true, silent: true })
class MyApp extends Boot {}
```

**Features:**
- Parse `.env` files (KEY=VALUE format)
- Support quotes and escape sequences
- Validate required variables
- Override control for environment-specific configs
- Multiline values support

**.env Example:**
```bash
# Database configuration
DATABASE_URL=postgres://localhost:5432/mydb
DATABASE_POOL_SIZE=20

# API Keys
API_KEY="secret-key-with-special-chars"
JWT_SECRET="another-secret"

# Multiline values
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----"
```

**Migration from dotenv:**
```typescript
// Before (using dotenv)
import * as dotenv from 'dotenv';
dotenv.config();

class MyApp extends Boot {}

// After (using @Env decorator)
import { Env } from '@zerooneit/expressive-tea';

@Env({ path: '.env' })
class MyApp extends Boot {}
```

---

### 3. ESLint v9 Flat Config

**What Changed:**
Migrated from ESLint v8 (`.eslintrc.js`) to ESLint v9 (flat config `eslint.config.mjs`).

**Benefits:**
- Faster linting performance
- Better TypeScript integration
- Simpler configuration
- Modern ESLint features

**If You're Using Custom ESLint Config:**
```javascript
// Before (.eslintrc.js)
module.exports = {
  extends: ['@zerooneit/expressive-tea'],
  rules: {
    'no-console': 'warn'
  }
};

// After (eslint.config.mjs)
import expressiveTeaConfig from '@zerooneit/expressive-tea/eslint.config.mjs';

export default [
  ...expressiveTeaConfig,
  {
    rules: {
      'no-console': 'warn'
    }
  }
];
```

---

## Testing Your Migration


### Test Checklist

- [ ] Application starts without errors
- [ ] All routes respond correctly
- [ ] Dependency injection works
- [ ] Encrypted data can be decrypted
- [ ] TypeScript compiles without errors
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Performance is acceptable

### Test Script

```bash
#!/bin/bash

echo "Starting migration tests..."

# 1. Build the application
echo "Building application..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Build successful"

# 2. Run TypeScript compiler
echo "Checking TypeScript..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "⚠️  TypeScript errors found (may be expected in strict mode)"
else
  echo "✅ TypeScript check passed"
fi

# 3. Run tests
echo "Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi
echo "✅ Tests passed"

# 4. Start server (with timeout)
echo "Starting server..."
timeout 10s npm start &
SERVER_PID=$!
sleep 5

# 5. Check if server is responding
echo "Checking server health..."
curl -f http://localhost:3000/health || {
  echo "❌ Server health check failed"
  kill $SERVER_PID
  exit 1
}
echo "✅ Server is healthy"

# Cleanup
kill $SERVER_PID

echo "✅ All migration tests passed!"
```

---

## Troubleshooting

### Issue: "Cannot decrypt data"

**Cause:** Using v2.0.0 crypto to decrypt v1.x encrypted data

**Solution:**
1. Keep v1.x installed temporarily
2. Decrypt data with v1.x
3. Re-encrypt with v2.0.0
4. See [Cryptography Changes](#cryptography-changes)

```bash
# Install both versions temporarily
npm install @zerooneit/expressive-tea@2.0.0
npm install @zerooneit/expressive-tea-v1@npm:@zerooneit/expressive-tea@1.3.0-beta.6

# Use migration script
node migrate-crypto.js

# Remove v1 when done
npm uninstall @zerooneit/expressive-tea-v1
```

---

### Issue: TypeScript compilation errors

**Cause:** Strict mode enabled, code not compatible

**Solution 1 - Disable strict mode temporarily:**
```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

**Solution 2 - Fix errors incrementally:**
```bash
# Enable one strict flag at a time
# 1. strictNullChecks
# 2. noImplicitAny  
# 3. strictBindCallApply
# etc.
```

---

### Issue: "Property has no initializer"

**Cause:** Strict property initialization checks

**Solution:**
```typescript
// Option 1: Definite assignment assertion
private service!: MyService;

// Option 2: Initialize in constructor
constructor() {
  this.service = new MyService();
}

// Option 3: Make optional
private service?: MyService;

// Option 4: Provide default
private service: MyService = new MyService();
```

---

### Issue: DI not resolving services

**Cause:** Services not registered or wrong scope

**Solution:**
```typescript
// Make sure services are registered before use
import { DependencyInjection } from '@zerooneit/expressive-tea';

// Register in correct order
DependencyInjection.registerSingleton('Database', DatabaseService);
DependencyInjection.registerSingleton('UserService', UserService);  // Depends on Database

// Check registration
const container = DependencyInjection.getContainer();
console.log(container.isBound('UserService'));  // Should be true
```

---

### Issue: Tests failing after migration

**Cause:** Various - check test output

**Common fixes:**

1. **Update test TypeScript config:**
```json
// tsconfig.spec.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": false,  // Looser for tests
    "types": ["jest", "node"]
  },
  "include": ["**/*.spec.ts", "**/*.test.ts"]
}
```

2. **Update jest config:**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.spec.json'  // Use test config
    }
  }
};
```

3. **Clear jest cache:**
```bash
npm test -- --clearCache
```

---

## Getting Help

### Resources

- **GitHub Issues:** https://github.com/Expressive-Tea/expresive-tea/issues
- **Documentation:** https://zero-oneit.github.io/expresive-tea/
- **Changelog:** See CHANGELOG.md for complete v2.0.0 changes

### Reporting Issues

When reporting migration issues, please include:

```
1. Expressive Tea version you're migrating from
2. Node.js version
3. TypeScript version
4. Full error message and stack trace
5. Minimal reproduction code
6. Migration steps you've taken
```

### Community Support

- Open an issue on GitHub with the `migration` label
- Include "v2 Migration" in the issue title
- Provide context about your use case

---

## Summary

v2.0.0 is a major improvement to Expressive Tea with critical security fixes, enhanced type safety, and better architecture. While the migration requires attention to cryptography changes and TypeScript strict mode, the benefits include:

✅ Secure cryptography (HKDF + proper AES-GCM)  
✅ Type safety with strict mode  
✅ Better IDE support with generic types  
✅ Enhanced dependency injection  
✅ 92.75% test coverage  
✅ Improved performance  

**Migration Timeline Recommendation:**

- **Week 1:** Update dependencies, test in development
- **Week 2:** Migrate encrypted data, enable strict mode incrementally
- **Week 3:** Full testing in staging environment
- **Week 4:** Production deployment

Good luck with your migration! 🚀
