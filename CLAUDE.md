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
# Run a single test file by path (recommended for fast feedback)
yarn jest __test__/unit/classes/boot-extend.spec.ts --runTestsByPath

# Or using explicit path with node_modules binary
./node_modules/.bin/jest __test__/unit/classes/boot-extend.spec.ts --runTestsByPath

# Run a single test case by name (regex)
yarn jest -t "should initialize" --runInBand

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

## Environment and Tooling

- **Node engine**: `node >= 18.0.0` (see `package.json` "engines")
- **Package manager**: `yarn@4.x` (project `packageManager`). Use `yarn` commands unless otherwise noted
- **Jest configuration**: `jest.config.js` (ts-jest transformer, 30s timeout, coverage reporters configured)
- **Linting**: `eslint.config.js` and `tsconfig.linter.json` drive TypeScript lint rules used by ESLint/TypeScript parser
- **Formatting**: `.prettierrc` defines formatting preferences (120 cols, single quotes, semicolons enabled)
- **ESLint history**: The repo includes `tslint.json` (legacy) but the active linter is ESLint with `@typescript-eslint` (`eslint.config.js`). Rely on ESLint for new rules and fixes

## Testing Notes

- Framework uses Jest with ts-jest
- Test files: `__test__/unit/` and `__test__/integrations/`
- Mock classes in `__test__/__mocks__/` and `__test__/test-classes/`
- Test timeout: 30 seconds
- Coverage reports: `./coverage/`
- JUnit reports: `./reports/junit.xml`

**Test pattern**: Tests validate decorator metadata storage, mixin transformations, DI bindings, boot stage execution, and request lifecycle.

**Useful test helpers**:
- `yarn test:clear` clears Jest cache
- `yarn test:dev` runs tests without coverage to speed iteration
- For CI: `yarn test:ci` (linter strict + jest --ci)

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

## Code Style and Conventions

### Formatting & General Style
- Use Prettier baseline rules defined in `.prettierrc` (120 char print width, tabWidth 2, `singleQuote: true`, `semi: true`)
- Run `yarn format` for large changes; `yarn linter` will also auto-fix many issues
- Uses ESLint v9 flat config (eslint.config.js)
- Extends eslint-config-love (TypeScript strict rules)
- No implicit any allowed for core code

### Imports and Modules
- Prefer ES module style `import X from '...'` or named imports `import { foo } from '...'` where appropriate
- Avoid duplicate imports — ESLint enforces `no-duplicate-imports`
- Group imports by: 1) external packages, 2) internal packages (`@expressive-tea/*`), 3) local files — each group separated by a single blank line
- Use relative paths for local modules (e.g. `../helpers/promise-helper`) and absolute package-scoped imports for shared packages

### TypeScript Typing
- Prefer explicit types for exported contracts (interfaces, types, public APIs). Files like `types/core.ts` show project conventions
- `any` is permitted sparingly for tests and places where typing is impractical but prefer `unknown` + narrowing when possible
- `Constructor<T>` and `TFunction` utility types are used in the codebase; match those patterns for consistency (`types/core.ts`)
- Keep `emitDecoratorMetadata` and `experimentalDecorators` usage (they're enabled in `tsconfig.json`). When using decorators, annotate injected types where possible

### Naming Conventions
- Classes and React-like constructs: PascalCase (e.g. `Boot`, `Settings`, `HTTPEngine`)
- Types and interfaces: PascalCase with `I` prefix for external interfaces (project uses interfaces from `@expressive-tea/commons/interfaces`)
- Functions and variables: camelCase
- Constants: UPPER_SNAKE_CASE only for true compile-time constants; otherwise use camelCase exported names (few constants exist in `engines/constants/constants.ts`)

### Files & Directories
- Keep one exported class/type per file unless tightly-coupled small helpers
- Test files live in `__test__/` following the pattern `*.spec.ts` or `*.test.ts`

### Error Handling
- Use typed, domain-specific Error classes located in `exceptions/` (e.g. `BootLoaderExceptions.ts`, `RequestExceptions.ts`) for predictable error handling
- Throw explicit Error subclasses rather than raw strings
- Propagate errors up; prefer centralized handling in engine/startup code. Unit tests should assert thrown subclass types where practical

### Dependency Injection & Decorators
- The project uses `inversify` and `reflect-metadata`. Follow existing patterns in `inversify.config.ts`, `services/DependencyInjection.ts`, and class constructors
- When binding to the DI container, use the class or named identifier consistently (see `classes/Boot.ts` and `Boot.initializeContainer`)
- Decorators are used in `decorators/` — match the existing decorator contract and document new decorators with JSDoc
- Decorator usage is pervasive - always check metadata storage/retrieval patterns

### Tests and Mocks
- Put unit tests under `__test__/unit/` and integration tests under `__test__/integrations/`
- Use the project mocks in `__test__/__mocks__/` when available; jest will pick them up automatically
- Prefer `--runInBand` when running flaky or environment-sensitive tests locally
- Use `jest-express`, `supertest`, and `ts-jest` as the codebase already relies on them

### Documentation & JSDoc
- Keep exported APIs documented using JSDoc comments (the repo uses `eslint-plugin-jsdoc` and `jsdoc.json` / `jsdocs.json` tools)
- For public-facing changes update `README.md` and `CHANGELOG.md` and ensure your PR follows `.github/PULL_REQUEST_TEMPLATE.md` checklist

### CI / PR Expectations
- All PRs must pass `yarn test` (linter + tests) before merge — enforced by `prepublishOnly` and CI workflows
- Provide at least two reviewers or one reviewer + maintainer merge per `CONTRIBUTING.md`

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
- `@expressive-tea/metadata` - Metadata utilities

## Monorepo Structure

This project is part of a monorepo structure. The following packages are located in `/Users/chrnx/projects/expressive-tea/packages` with **full Read/Write access**:

- **`@expressive-tea/plugin`** - Plugin base class and utilities
- **`@expressive-tea/commons`** - Shared constants and metadata utilities
- **`@expressive-tea/metadata`** - Metadata handling and utilities

You have permission to edit and apply changes to these packages as needed when working on the framework.

## Package Management

This project uses **Yarn v4** (Berry):
- Package manager specified in `package.json`: `"packageManager": "yarn@4.11.0"`
- Configuration in `.yarnrc.yml`
- Always use `yarn` commands (not npm)

## Main Branch

The main development branch is **`develop`**, not `master`. Create PRs targeting `develop`.

## Staging Registry (Verdaccio)

Use a local Verdaccio instance as a staging npm registry to test publishing without touching the public registry.

- **Image**: `verdaccio/verdaccio:latest` (official)
- **Container name**: `verdaccio-expressive-tea`
- **Default URL**: http://localhost:4873
- **Anonymous publishing**: enabled (local only)
- **Allow same-version uploads**: aim to permit overwrites
- **Persistence**: not required. It's OK to run without volumes (ephemeral storage)

### Quick Commands

Start (Docker):
```bash
docker run -d --rm --name verdaccio-expressive-tea -p 4873:4873 verdaccio/verdaccio:latest
```

Start (Podman):
```bash
podman run -d --rm --name verdaccio-expressive-tea -p 4873:4873 docker.io/verdaccio/verdaccio:latest
```

Check if running (returns container id if up):
```bash
docker ps -q -f name=verdaccio-expressive-tea
```

Publish to local Verdaccio (example):
```bash
# point npm to local registry
npm set registry http://localhost:4873

# publish (from package root)
npm publish --registry http://localhost:4873

# restore default registry
npm set registry https://registry.npmjs.org/
```

### Notes & Recommendations

- The repo includes a minimal Verdaccio config under `.docs/verdaccio/config.yaml`. It configures anonymous access and allows publishing. Run the container with that config if you need deterministic behavior:

  ```bash
  docker run -d --rm --name verdaccio-expressive-tea -p 4873:4873 \
    -v $(pwd)/.docs/verdaccio/config.yaml:/verdaccio/conf/config.yaml \
    verdaccio/verdaccio:latest
  ```

- We prefer anonymous publishing for local staging. Do not expose this registry to the public network
- If Verdaccio rejects a same-version publish, you can either:
  - publish with `npm publish --force --registry http://localhost:4873`, or
  - delete the package version from Verdaccio UI/storage and re-publish
- Check container by name (`verdaccio-expressive-tea`) before starting a new one; start only if not running

Add this staging step to your local publish workflow to validate builds and packages before public publish.

## Agent Memory & Preferences

### Summary Behavior
- Keep summaries short and concise by default. Avoid long comprehensive summaries unless requested

### Verdaccio Staging Preferences (Persisted)
- Use official image: `verdaccio/verdaccio:latest`
- Container name: `verdaccio-expressive-tea`
- Default URL: http://localhost:4873
- Runtime: Docker or Podman (either is acceptable)
- Config: use `.docs/verdaccio/config.yaml` (provided) for deterministic behavior
- Anonymous publishing: enabled for local staging (do not expose externally)
- Allow same-version overwrite: enabled for staging
- Persistence: running without persistent volumes is acceptable
- Start behavior: check for a running container named `verdaccio-expressive-tea` and only start if not present

### Publishing Workflow Rule
- **Always test publishes against local Verdaccio before publishing to the public registry**

### Git Rules (Persisted)
- **NEVER commit directly to `main` or `develop`**. If on those branches, create a new feature branch first (default prefix: `feature/`)
- Follow GitFlow standards (feature/release/hotfix branches and flow)

### Automation Behavior
- These preferences are persisted in agent memory and should be applied automatically before any publish attempts performed by the agent

## Subagent Team Structure

**CRITICAL**: This project uses a specialized subagent team structure for all work.

### Team Overview

The Expressive Tea project has a defined team of specialized agents. **You are Claude Code acting as Tech Lead coordinator**. You must delegate all specialized tasks to the appropriate team members defined in **SUBAGENTS.md**.

### Core Team Members

- **🤠 Vaquerito** (Backend Specialist, Opus, `vaquerito`) - All implementation tasks
- **🏗️ Arquiterito** (Architect, Sonnet, `Plan`/`arquiterito`) - Architecture and infrastructure decisions
- **🔍 Coderito** (Code Reviewer, Sonnet, `coderito`) - Code quality enforcement
- **🔒 Securito** (Security, Haiku, `securito`) - Security audits and vulnerability checks
- **📝 Documentito** (Documentation, Haiku, `documentito`) - Technical documentation
- **🧪 Testerito** (Testing, Sonnet, `testerito`) - All testing tasks
- **🎯 Scrumito** (Coordinator, Haiku, `scrumito`/`Plan`) - Planning and delegation coordination

### Mandatory Delegation Rules

**ALWAYS delegate these tasks** (never perform directly):
- ✅ **Implementation** → Vaquerito (max 3 parallel instances)
- ✅ **Architecture decisions** → Arquiterito (max 2 parallel instances)
- ✅ **Code reviews** → Coderito (max 1 instance)
- ✅ **Security audits** → Securito (max 1 instance)
- ✅ **Documentation** → Documentito (max 1 instance)
- ✅ **Testing** → Testerito (max 3 parallel instances)
- ✅ **Planning/Coordination** → Scrumito (max 1 instance)

### Standard Workflow

1. **Tech Lead (You)** receives requirements from User
2. **Scrumito** works with Tech Lead on planning (if no plan exists)
3. User approves plan
4. **Scrumito** delegates to specialized team members
5. Team executes and reports through Scrumito
6. Final decisions rest with User (as ultimate Tech Lead)

### Important Notes

- **NEVER implement, review, test, or document directly** - always delegate
- All agents must reference both **CLAUDE.md** and **SUBAGENTS.md**
- Use the Task tool with appropriate subagent_type and model per SUBAGENTS.md
- Include agent name in task descriptions (e.g., "Vaquerito: Implement feature X")
- For parallel tasks, use single message with multiple Task calls

**See SUBAGENTS.md for complete team structure, invocation examples, and detailed workflow.**

## Quick References

- **subagent team**: `SUBAGENTS.md` (team structure, delegation rules, workflow)
- **package.json**: `package.json` (scripts and engines)
- **lint config**: `eslint.config.js`, `tsconfig.linter.json`
- **prettier config**: `.prettierrc`
- **types**: `types/core.ts`
- **tests**: `jest.config.js`, `__test__`
