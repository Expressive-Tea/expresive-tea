# TypeScript Path Aliases Configuration

This project now uses TypeScript path aliases for cleaner and more maintainable imports in both source and test files.

## Available Path Aliases

### Main Project (`@expressive-tea/core`)

#### Source Code Aliases

The following path aliases are available in source files:

- `@classes` → `classes/`
- `@decorators` → `decorators/`
- `@engines` → `engines/`
- `@exceptions` → `exceptions/`
- `@helpers` → `helpers/`
- `@interfaces` → `interfaces/`
- `@libs` → `libs/`
- `@services` → `services/`
- `@types` → `types/`
- `@mixins` → `mixins/`
- `@config` → `config/`

#### Test-Specific Aliases

Additional aliases available in test files (`__test__/**/*`):

- `@test-mocks` → `__test__/__mocks__/`
- `@test-classes` → `__test__/test-classes/`
- `@test-helpers` → `__test__/integrations/helpers/`

### Workspace Packages

The workspace packages (`@expressive-tea/commons`, `@expressive-tea/plugin`, `@expressive-tea/metadata`) use the same pattern:

- `@classes` → `src/classes/`
- `@decorators` → `src/decorators/`
- `@exceptions` → `src/exceptions/`
- `@helpers` → `src/helpers/`
- `@interfaces` → `src/interfaces/`
- `@types` → `src/types/`
- `@libs` → `src/libs/`
- `@constants` → `src/constants`

## Usage Examples

### Source Files

#### Before (Relative Paths)

```typescript
import { BOOT_STAGES } from '../constants';
import { getClass, getStage, setStage } from '../helpers';
import Settings from '../../../classes/Settings';
import { isNil } from '../../../../libs/utilities';
```

#### After (Path Aliases)

```typescript
import { BOOT_STAGES } from '@constants';
import { getClass, getStage, setStage } from '@helpers';
import Settings from '@classes/Settings';
import { isNil } from '@libs/utilities';
```

### Test Files

#### Before (Relative Paths)

```typescript
// In __test__/unit/classes/boot.spec.ts
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { Modules, Plug } from '../../../decorators/server';
import Module from '../../test-classes/module';
```

#### After (Path Aliases)

```typescript
// In __test__/unit/classes/boot.spec.ts
import Boot from '@classes/Boot';
import Settings from '@classes/Settings';
import { Modules, Plug } from '@decorators/server';
import Module from '@test-classes/module';
```

### Workspace Package Tests

#### Before (Relative Paths)

```typescript
// In packages/plugin/src/__test__/unit/plugin.spec.ts
import { Plugin } from '../../classes/Plugin';
import { BOOT_STAGES } from '../../constants';
import { DependencyNotFound } from '../../exceptions/dependency';
import { Stage } from '../../decorators/stage';
```

#### After (Path Aliases)

```typescript
// In packages/plugin/src/__test__/unit/plugin.spec.ts
import { Plugin } from '@classes/Plugin';
import { BOOT_STAGES } from '@constants';
import { DependencyNotFound } from '@exceptions/dependency';
import { Stage } from '@decorators/stage';
```

## Benefits

1. **Cleaner Code**: No more confusing `../../../` chains
2. **Easy Refactoring**: Moving files doesn't break imports
3. **Better Readability**: Clear indication of what module you're importing from
4. **IDE Support**: Better autocomplete and navigation
5. **Consistency**: Same pattern across source and test files
6. **Test Organization**: Special aliases for test utilities and mocks

## How It Works

The path aliases are configured in:

1. **TypeScript Source**: `tsconfig.json` (paths configuration)
2. **TypeScript Tests**: `tsconfig.spec.json` (extends base + adds test-specific paths)
3. **Jest**: `jest.config.js` (moduleNameMapper)

All three configurations are kept in sync to ensure the aliases work in compilation, type-checking, and testing.

## Configuration Files

### Main Project

- `tsconfig.json` - Source code path aliases
- `tsconfig.spec.json` - Test file path aliases (includes all source aliases + test-specific)
- `jest.config.js` - Jest module resolution

### Workspace Packages

Each package has:
- `tsconfig.json` - Extends `../tsconfig.base.json`
- `tsconfig.spec.json` - Test-specific configuration
- `jest.config.js` - Jest module resolution

## Example Migration

### Source File Example

**Before** (`src/decorators/stage.ts`):
```typescript
import { BOOT_STAGES } from '../constants';
import { getClass, getStage, setStage } from '../helpers';
```

**After** (`src/decorators/stage.ts`):
```typescript
import { BOOT_STAGES } from '@constants';
import { getClass, getStage, setStage } from '@helpers';
```

### Test File Example

**Before** (`__test__/unit/classes/boot.spec.ts`):
```typescript
import Boot from '../../../classes/Boot';
import Module from '../../test-classes/module';
```

**After** (`__test__/unit/classes/boot.spec.ts`):
```typescript
import Boot from '@classes/Boot';
import Module from '@test-classes/module';
```

## Testing

All tests work seamlessly with the path aliases thanks to the `moduleNameMapper` configuration in Jest.

To run tests:

```bash
# Main project
yarn test

# Main project (without coverage for faster feedback)
yarn test:dev

# Workspace packages
cd packages
yarn test
```

## Building

The build process automatically resolves the path aliases to relative paths in the compiled JavaScript output.

```bash
# Main project
yarn build

# Workspace packages
cd packages
yarn build
```

## Important Notes

- Path aliases are resolved at **compile time** only
- The compiled JavaScript uses **relative paths**
- You can use both the base alias (e.g., `@helpers`) and wildcard (e.g., `@helpers/object-helper`)
- Test files can use all source aliases **plus** test-specific aliases
- Always prefer path aliases over relative paths for cleaner code
- When writing tests, use `@test-mocks`, `@test-classes`, and `@test-helpers` for test utilities

## Migration Tips

1. Start with source files first, then migrate test files
2. Use your IDE's "Find and Replace" with regex for bulk updates
3. Test after each file or small batch of files
4. Common patterns to replace:
   - `'../../../classes/'` → `'@classes/'`
   - `'../../helpers/'` → `'@helpers/'`
   - `'../../test-classes/'` → `'@test-classes/'` (in tests)

