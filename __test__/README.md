# Test Suite — Expressive Tea Core Framework

Test runner: **Vitest** (migrated from Jest in the `feature/comprehensive-audit-v2` branch).

## Structure

```
__test__/
├── __mocks__/          # Module mocks (fs, http, https, plugin)
├── benchmarks/         # Performance benchmarks (excluded from test runs)
├── certs/              # Self-signed TLS certs for HTTPS unit tests
├── fixtures/           # Shared test fixtures
├── integration/        # Legacy integration helpers (deprecated, use integrations/)
├── integrations/       # Integration test suites
│   ├── helpers/        # Server init helpers and test modules
│   │   └── modules/    # Express modules for teapot/teacup/root servers
│   ├── env-loading.spec.ts     # Environment variable loading
│   ├── server.spec.ts          # HTTP server integration
│   ├── teapot.spec.ts          # Teapot/Teacup proxy integration
│   └── websocket.spec.ts       # WebSocket integration
├── setup/              # Test setup utilities
├── test-classes/       # Shared test base classes (Module, etc.)
└── unit/               # Unit test suites
    ├── classes/        # Boot, Settings, Engine, EngineRegistry
    ├── decorators/     # @Route, @Module, @Server, @Env, etc.
    ├── engines/        # HTTP, SocketIO, WebSocket, Teapot
    ├── exceptions/     # Error classes
    ├── helpers/        # logger, server utilities
    ├── libs/           # Utility functions
    ├── mixins/         # Routerize, Modulize, Proxify
    ├── security/       # Security utilities
    └── services/       # DI container, WebSocket service
```

## Running Tests

```bash
# Run all tests
yarn vitest run

# Run in watch mode
yarn vitest

# Run with coverage
yarn vitest run --coverage

# Run a single file
yarn vitest run __test__/unit/classes/boot.spec.ts

# Run by pattern
yarn vitest run --reporter=verbose __test__/integrations/
```

## Configuration

`vitest.config.ts` — key settings:

| Setting | Value | Notes |
|---------|-------|-------|
| `maxThreads` | 4 | Parallel execution |
| `fileParallelism` | false | Sequential within each file |
| `isolate` | true | Per-file module isolation |
| `mockReset` | true | Mocks cleared between tests |
| `restoreMocks` | true | Spies restored between tests |
| `clearMocks` | true | Mock call history cleared |
| `testTimeout` | 30 000 ms | Generous for integration tests |
| `coverage.provider` | v8 | Built-in V8 coverage |

## Port Assignments

Integration and boot tests bind to real OS ports. These ranges are reserved to prevent conflicts during parallel execution:

| Port range | Test file |
|------------|-----------|
| 3100–3109, 4501–4510 | `integrations/websocket.spec.ts` |
| 4000–4099 | `unit/classes/boot-extend.spec.ts` |
| 6000–6099 | `integrations/server.spec.ts` |
| 7000–7099 | `unit/classes/boot-error.spec.ts` |
| 8080–8090 | `integrations/teapot.spec.ts` |
| 10 000–10 099 | `unit/classes/boot-lifecycle.spec.ts` |

## Mocking Patterns

### CJS Modules (express, ws, chalk, express-http-proxy)

Always use default imports (`import X from 'Y'`) rather than namespace imports (`import * as X from 'Y'`) for CJS modules used in source code. Vitest's SSR transform makes namespace objects non-callable.

```typescript
// CORRECT
import chalk from 'chalk';
import WebSocket from 'ws';
import proxy from 'express-http-proxy';

// WRONG — causes "__vite_ssr_import_N__ is not a function" at runtime
import * as chalk from 'chalk';
```

### Node Built-ins (http, https)

Node's built-in module exports are non-configurable, so `vi.spyOn()` throws `TypeError: Cannot redefine property`. Use `vi.mock()` (hoisted) instead:

```typescript
vi.mock('node:http');   // hoisted, creates configurable vi.fn() stubs
vi.mock('node:https');

beforeEach(() => {
  // Re-apply implementations after mockReset: true clears them
  vi.mocked(http.createServer).mockReturnValue(mockServer as any);
});
```

### Module-level Singletons (logger, Settings)

For modules that export a singleton configured at import time (e.g. `helpers/logger.ts` reads `process.env.LOG_LEVEL`), use `vi.resetModules()` + dynamic `await import()` to get a fresh instance per test:

```typescript
async function freshLogger(env = {}) {
  Object.assign(process.env, env);
  vi.resetModules();
  const mod = await import('../../../helpers/logger');
  return mod.default;
}
```

### Express / jest-express Mock

Tests that construct `Boot` subclasses need a callable `express()` factory. Use:

```typescript
vi.mock('express', () => {
  const jestExpress = require('jest-express');
  return {
    default: jestExpress,
    Router: jestExpress.Router,
    static: jestExpress.static,
    json: jestExpress.json,
    urlencoded: jestExpress.urlencoded,
    query: jestExpress.query,
  };
});
```

## Coverage

Current baseline (source `.ts` files only, `.js`/`.d.ts` excluded):

| Metric | Coverage |
|--------|----------|
| Statements | ~94% |
| Branches | ~93% |
| Functions | ~97% |
| Lines | ~94% |
