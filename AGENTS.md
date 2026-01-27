**Agents**
- Purpose: machine-readable guidance for autonomous agents working in this repo.
- Location: root of repo; reference configs in `package.json`, `.prettierrc`, `eslint.config.js`, `tsconfig.*`, and `jest.config.js`.
- Keep changes small, well-tested, and follow PR checklist in `.github/PULL_REQUEST_TEMPLATE.md`.

Build / Lint / Test Commands
- Full test (used in CI): `yarn test` — runs linter then `jest` with coverage. See `package.json` scripts.
- Run linter (fixing): `yarn linter` — runs `eslint --ext .ts . --fix` using `eslint.config.js`.
- Run linter for CI (no auto-fix): `yarn linter:ci`.
- Format files with Prettier: `yarn format` (reads `.prettierrc`).
- Build TypeScript: `yarn build` (compiles with `tsconfig.json`).
- Dev build (watch): `yarn build:dev` (tsc --watch).
- Clean build artifacts: `yarn clean:build`.
- Publish flow helpers: `yarn publish:prepare` (clean + build) and `yarn prepublishOnly` (runs tests then build).

- Running a single test file (recommended for fast feedback):

```bash
# run a single test file by path
yarn jest __test__/unit/classes/boot-extend.spec.ts --runTestsByPath

# or using explicit path with node_modules binary
./node_modules/.bin/jest __test__/unit/classes/boot-extend.spec.ts --runTestsByPath

# run a single test case by name (regex)
yarn jest -t "should initialize" --runInBand
```

- Useful test helpers:
  - `yarn test:clear` clears Jest cache.
  - `yarn test:dev` runs tests without coverage to speed iteration.
  - For CI: `yarn test:ci` (linter strict + jest --ci).

Environment / Tooling notes
- Node engine: `node >= 18.0.0` (see `package.json` "engines").
- Package manager: `yarn@4.x` (project `packageManager`). Use `yarn` commands unless otherwise noted.
- Jest configuration: `jest.config.js` (ts-jest transformer, 30s timeout, coverage reporters configured).
- Linting: `eslint.config.js` and `tsconfig.linter.json` drive TypeScript lint rules used by ESLint/TypeScript parser.
- Formatting: `.prettierrc` defines formatting preferences (120 cols, single quotes, semicolons enabled).

Repository-specific style and conventions
- Formatting & general style
  - Use Prettier baseline rules defined in `.prettierrc` (120 char print width, tabWidth 2, `singleQuote: true`, `semi: true`).
  - Run `yarn format` for large changes; `yarn linter` will also auto-fix many issues.

- Imports and modules
  - Prefer ES module style `import X from '...'` or named imports `import { foo } from '...'` where appropriate.
  - Avoid duplicate imports — ESLint enforces `no-duplicate-imports`.
  - Group imports by: 1) external packages, 2) internal packages (`@expressive-tea/*`), 3) local files — each group separated by a single blank line.
  - Use relative paths for local modules (e.g. `../helpers/promise-helper`) and absolute package-scoped imports for shared packages.

- TypeScript typing
  - Prefer explicit types for exported contracts (interfaces, types, public APIs). Files like `types/core.ts` show project conventions.
  - `any` is permitted sparingly for tests and places where typing is impractical but prefer `unknown` + narrowing when possible.
  - `Constructor<T>` and `TFunction` utility types are used in the codebase; match those patterns for consistency (`types/core.ts`).
  - Keep `emitDecoratorMetadata` and `experimentalDecorators` usage (they're enabled in `tsconfig.json`). When using decorators, annotate injected types where possible.

- Naming conventions
  - Classes and React-like constructs: PascalCase (e.g. `Boot`, `Settings`, `HTTPEngine`).
  - Types and interfaces: PascalCase with `I` prefix for external interfaces (project uses interfaces from `@expressive-tea/commons/interfaces`).
  - Functions and variables: camelCase.
  - Constants: UPPER_SNAKE_CASE only for true compile-time constants; otherwise use camelCase exported names (few constants exist in `engines/constants/constants.ts`).

- Files & directories
  - Keep one exported class/type per file unless tightly-coupled small helpers.
  - Test files live in `__test__/` following the pattern `*.spec.ts` or `*.test.ts`.

- Error handling
  - Use typed, domain-specific Error classes located in `exceptions/` (e.g. `BootLoaderExceptions.ts`, `RequestExceptions.ts`) for predictable error handling.
  - Throw explicit Error subclasses rather than raw strings.
  - Propagate errors up; prefer centralized handling in engine/startup code. Unit tests should assert thrown subclass types where practical.

- Dependency injection & decorators
  - The project uses `inversify` and `reflect-metadata`. Follow existing patterns in `inversify.config.ts`, `services/DependencyInjection.ts`, and class constructors.
  - When binding to the DI container, use the class or named identifier consistently (see `classes/Boot.ts` and `Boot.initializeContainer`).
  - Decorators are used in `decorators/` — match the existing decorator contract and document new decorators with JSDoc.

- Tests and mocks
  - Put unit tests under `__test__/unit/` and integration tests under `__test__/integrations/`.
  - Use the project mocks in `__test__/__mocks__/` when available; jest will pick them up automatically.
  - Prefer `--runInBand` when running flaky or environment-sensitive tests locally.
  - Use `jest-express`, `supertest`, and `ts-jest` as the codebase already relies on them.

- ESLint / tslint history
  - The repo includes `tslint.json` (legacy) but the active linter is ESLint with `@typescript-eslint` (`eslint.config.js`). Rely on ESLint for new rules and fixes.

- Documentation & JSDoc
  - Keep exported APIs documented using JSDoc comments (the repo uses `eslint-plugin-jsdoc` and `jsdoc.json` / `jsdocs.json` tools).
  - For public-facing changes update `README.md` and `CHANGELOG.md` and ensure your PR follows `.github/PULL_REQUEST_TEMPLATE.md` checklist.

- CI / PR expectations
  - All PRs must pass `yarn test` (linter + tests) before merge — enforced by `prepublishOnly` and CI workflows.
  - Provide at least two reviewers or one reviewer + maintainer merge per `CONTRIBUTING.md`.

Cursor / Copilot rules
- No repository-level Cursor rules found in `.cursor/rules/` or `.cursorrules`.
- No `copilot-instructions.md` found at `.github/copilot-instructions.md`.

If you are blocked
- Attempt `yarn linter` and `yarn test:dev` first; inspect failing test stack traces in `__test__/` and check `jest.config.js` for timeouts.
- Ask one targeted question referencing the failing test path and the expected behavior.

Quick references
- package.json: `package.json` (scripts and engines)
- lint config: `eslint.config.js`, `tsconfig.linter.json`
- prettier config: `.prettierrc`
- types: `types/core.ts`
- tests: `jest.config.js`, `__test__/`

End of AGENTS.md
