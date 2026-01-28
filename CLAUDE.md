# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expressive Tea is a decorator-driven TypeScript framework built on Express.js with dependency injection (InversifyJS). It provides a modular, plugin-based architecture with well-defined boot stages for building server-side applications.

## Essential Commands

### Development
```bash
yarn build              # Compile TypeScript
yarn build:dev          # Watch mode compilation
yarn clean:build        # Remove all compiled .js, .d.ts, and map files
```

### Testing
```bash
yarn test               # Run all tests with coverage (includes linting)
yarn test:dev           # Run tests without coverage (for development)
yarn test:clear         # Clear Jest cache
yarn test:ci            # CI-specific test run
```

### Linting
```bash
yarn linter             # Run ESLint with auto-fix
yarn linter:ci          # Run ESLint without auto-fix (for CI)
yarn format             # Format code with Prettier
```

### Running Individual Tests
```bash
# Run a single test file
npx jest __test__/unit/classes/boot.spec.ts

# Run tests matching a pattern
npx jest --testNamePattern="should initialize"

# Run with watch mode
npx jest --watch __test__/unit/decorators/
```

## Architecture Overview

### Core Boot System

The framework is built around a **Boot class** that orchestrates the entire application lifecycle through **boot stages**:

1. **BOOT_DEPENDENCIES** - Hard requirement plugins/setup
2. **BOOT_INITIALIZATION** - Service initialization
3. **APPLICATION** - Module registration
4. **AFTER_APPLICATION_MIDDLEWARES** - Post-app setup
5. **ON_HTTP_CREATION** - HTTP/HTTPS server hooks
6. **START** - Final startup phase

**Boot Flow**: `initializeHttp()` → `initializeContainer()` → `registerEngines()` → `engines.init()` (reverse order) → `engines.start()` (forward order)

### Dependency Injection

The DI system wraps InversifyJS and provides:
- Global container with parent-child relationships
- Root container defined in `inversify.config.ts`
- Auto-injection of framework services (Server, Settings, Context)
- Module-level provider registration

**Key DI Bindings** (in `TYPES`):
- `TYPES.Context` - Boot instance
- `TYPES.Server` - HTTP server
- `TYPES.SecureServer` - HTTPS server (optional)
- `TYPES.Settings` - Settings singleton

### Module System

Modules are the primary organizational unit:

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
  mountpoint: '/api'
})
class ApiModule {}
```

**Modulize Mixin** transforms module classes to:
- Create Express router instance
- Instantiate all controllers from DI
- Register providers globally with DI
- Mount to application at specified path

### Controller/Router System

Controllers use decorator-based routing:

```typescript
@Route('/users')
class UserController {
  @Get('/:id')
  getUser(@param('id') id: string) { }

  @Post()
  @Middleware(authMiddleware)
  create(@body() data: any) { }

  @Param('id')  // Route param middleware
  validateId(req, res, next, param, id) { }
}
```

**Routerize Mixin**:
- Scans metadata for route handlers
- Builds Express router in constructor
- Wraps handlers with argument mapping logic
- Supports auto-response or manual response handling

### Parameter Injection

Controllers support automatic parameter injection:
- `@request` / `@response` / `@next` - Express objects
- `@param('name')` - URL parameters
- `@query('name')` - Query string parameters
- `@body('field')` - Request body fields
- Decorators without arguments return entire object

**Implementation**: Metadata stored via `ARGUMENTS_KEY`, mapped during request execution by `mapArguments()` helper.

### Middleware Declaration

Three levels of middleware:
1. **Application-level**: via `@Plug` decorator on Boot class
2. **Class-level**: via `@Middleware` on controller class (all routes)
3. **Method-level**: via `@Middleware` on route method (specific route)

Middlewares are prepended (unshift) so later decorators run first.

### Engine System

Engines execute during boot and control major subsystems:
- **HTTPEngine** - Core HTTP/HTTPS serving, boot stage resolution, module mounting
- **SocketIOEngine** - Socket.IO initialization
- **WebsocketEngine** - WebSocket server (conditional via `startWebsocket` setting)
- **TeapotEngine** - Remote server gateway (conditional)
- **TeacupEngine** - Remote server connector (conditional)

Each engine:
- Receives DI-injected dependencies (Context, Server, Settings)
- Implements `canRegister()` to conditionally enable
- Implements `init()` for setup phase
- Implements `start()` for activation phase

### Metadata-Driven Architecture

The entire framework uses `reflect-metadata` via `@expressive-tea/commons/classes/Metadata`:
- `ROUTER_HANDLERS_KEY` - HTTP verb handlers on controllers
- `ROUTER_MIDDLEWARES_KEY` - Middleware arrays
- `ARGUMENTS_KEY` - Parameter decorator mappings
- `REGISTERED_MODULE_KEY` - Modules to register
- `BOOT_STAGES_KEY` - Boot stage plugins
- `PROXY_SETTING_KEY` - Proxy configurations

All decorators store metadata, all mixins read metadata to construct runtime behavior.

### Plugin System

Two plugin types:

**Simple Plugin** (`@Plug`):
```typescript
@Plug(BOOT_STAGES.APPLICATION, 'cors-setup', async (server) => {
  server.use(cors());
}, true)  // true = required, false = soft dependency
```

**Advanced Plugin** (`@Pour`):
```typescript
@Pour(MyPlugin, ...constructorArgs)  // Extends @expressive-tea/plugin Plugin class
```

Plugins execute at specified boot stages. Hard dependencies throw `BootLoaderRequiredExceptions` on failure, soft dependencies log but continue.

### Proxy System

Proxies enable request forwarding:

```typescript
@ProxyContainer('/legacy', 'http://old-api.internal')
class LegacyProxy {
  @ProxyOption('host')  // Dynamic host selection (must be sync)
  host(req, res) {
    return 'http://chosen-host';
  }
}

@Proxies([LegacyProxy])
class Bootstrap extends Boot {}
```

**ProxyRoute** class uses **LoadBalancer** for round-robin distribution across multiple servers.

### Teapot/Teacup System

Remote server gateway using encrypted Socket.IO:
- **Teapot** (server): Accepts connections from remote Teacup instances, proxies requests
- **Teacup** (client): Connects to Teapot, makes local server accessible remotely

```typescript
// Server
@Teapot({ clientKey: 'shared-secret', serverKey: 'server-secret' })
class TeapotServer extends Boot {}

// Client
@Teacup({ serverUrl: 'https://teapot.com', clientKey: 'shared-secret',
          address: 'http://localhost:3000', mountTo: '/remote' })
class TeacupClient extends Boot {}
```

Uses key exchange and encryption for security. LoadBalancer distributes requests if multiple Teacups register at same mount point.

### WebSocket Integration

**WebSocket**:
- Enabled via `@ServerSettings({ startWebsocket: true })`
- Managed by WebsocketService singleton
- Supports both HTTP and HTTPS (ws/wss)

**Socket.IO**:
- Always enabled (SocketIOEngine)
- Instances stored in metadata: `SOCKET_IO_INSTANCE_KEY`, `SOCKET_IO_SECURE_INSTANCE_KEY`
- Accessible for custom Socket.IO logic

## Key Directories

```
/classes/       - Core classes (Boot, Settings, Engine, ProxyRoute, LoadBalancer)
/decorators/    - All decorator implementations (server, router, module, proxy, annotations)
/mixins/        - Mixin functions (Modulize, Routerize, Proxify)
/engines/       - Engine implementations (http, socketio, websocket, teapot, teacup)
/services/      - Service singletons (DependencyInjection, WebsocketService)
/helpers/       - Helper functions (boot-helper, server, decorators, teapot-helper)
/types/         - TypeScript type definitions and DI identifiers
/interfaces/    - Internal interfaces
/exceptions/    - Exception classes (BootLoader, Request exceptions)
/__test__/      - Jest tests (unit/ and integrations/)
```

## TypeScript Configuration

**Required tsconfig.json settings**:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "es2017",
    "module": "commonjs",
    "lib": ["es2017", "dom"]
  }
}
```

The codebase uses:
- No strict mode (`strict: false`)
- CommonJS modules
- ES2017 target
- Decorator metadata emission is critical

## Testing Notes

- Framework uses Jest with ts-jest
- Test files: `__test__/unit/` and `__test__/integrations/`
- Mock classes in `__test__/__mocks__/` and `__test__/test-classes/`
- Test timeout: 30 seconds
- Coverage reports: `./coverage/`
- JUnit reports: `./reports/junit.xml`

**Test pattern**: Tests validate decorator metadata storage, mixin transformations, DI bindings, boot stage execution, and request lifecycle.

## Common Patterns

### Creating an Application

```typescript
// 1. Define service (provider)
class UserService {
  getUsers() { /* ... */ }
}

// 2. Define controller
@Route('/users')
class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async list() {
    return this.userService.getUsers();
  }
}

// 3. Define module
@Module({
  controllers: [UserController],
  providers: [UserService],
  mountpoint: '/api'
})
class ApiModule {}

// 4. Bootstrap application
@ServerSettings({ port: 3000 })
@Modules([ApiModule])
class App extends Boot {}

// 5. Start server
const app = new App();
const { application, server } = await app.start();
// Server already listening from Boot.start()
```

### Request Lifecycle

```
HTTP Request
  ↓
Express routing (via module mountpoint + controller route)
  ↓
Class-level middlewares execute
  ↓
Method-level middlewares execute
  ↓
@Param decorator handlers execute (if present)
  ↓
Controller method invoked:
  - Parameters mapped via decorators (@param, @body, @query, etc.)
  - Method executes
  ↓
Response handling:
  - If @View decorator: template rendered
  - Else: auto-response with return value
  ↓
Exceptions: caught and passed to Express error handler
```

## Code Style

- Uses ESLint v9 flat config (eslint.config.js)
- Extends eslint-config-love (TypeScript strict rules)
- Prettier for formatting
- No implicit any allowed for core code
- Decorator usage is pervasive - always check metadata storage/retrieval patterns

## Important Implementation Notes

1. **Decorators are metadata storage**: Nearly all decorators just store metadata; mixins read metadata to build runtime behavior
2. **Mixins transform classes**: Modulize, Routerize, Proxify wrap classes and add properties/methods
3. **DI is module-scoped**: Providers registered at module level become globally available
4. **Boot stages are sequential**: Each stage must complete before next begins
5. **Engines run twice**: `init()` in reverse order, `start()` in forward order
6. **Request handlers auto-respond**: Unless headers already sent or `next()` called
7. **Settings are singleton**: Global Settings instance unless explicitly isolated
8. **Metadata keys from commons**: Import from `@expressive-tea/commons/constants`

## Dependencies

**Core runtime**:
- `express` ^5.0.1
- `inversify` ^7.0.0
- `reflect-metadata` 0.2.2
- `socket.io` 4.8.1
- `ws` 8.18.3

**Plugin packages** (peer dependencies):
- `@expressive-tea/commons` - Shared constants, metadata utilities
- `@expressive-tea/plugin` - Plugin base class

## Package Management

This project uses **Yarn v4** (Berry):
- Package manager specified in `package.json`: `"packageManager": "yarn@4.11.0"`
- Configuration in `.yarnrc.yml`
- Always use `yarn` commands (not npm)

## Main Branch

The main development branch is **`develop`**, not `master`. Create PRs targeting `develop`.
