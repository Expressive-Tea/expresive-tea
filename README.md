<p align="center">
  <a href="https://www.npmjs.com/package/@expressive-tea/core">
  <img alt="npm version" src="https://img.shields.io/npm/v/@expressive-tea/core?style=flat-square">
  </a>
  <a href="https://www.npmjs.com/package/@expressive-tea/core">
  <img alt="downloads" src="https://img.shields.io/npm/dw/@expressive-tea/core?style=flat-square">
  </a>
  <a href="https://snyk.io//test/github/Expressive-Tea/expresive-tea?targetFile=package.json">
  <img alt="vulnerabilities" src="https://img.shields.io/snyk/vulnerabilities/github/expressive-tea/expresive-tea?style=flat-square">
  </a>
  <a href="https://codecov.io/gh/Expressive-Tea/expresive-tea">
  <img alt="coverage" src="https://img.shields.io/codecov/c/github/expressive-tea/expresive-tea?label=coverage&style=flat-square">
  </a>
  <a href="https://travis-ci.org/Expressive-Tea/expresive-tea">
  <img alt="build" src="https://ci.zero-oneit.systems/buildStatus/icon?job=Expressive+Tea&style=flat-square">
  </a>
  <a href="https://github.com/Expressive-Tea/expresive-tea/stargazers">
  <img alt="stars" src="https://img.shields.io/github/stars/Expressive-Tea/expresive-tea?style=flat-square">
  </a>
  <a href="https://github.com/Expressive-Tea/expresive-tea/blob/main/LICENSE">
  <img alt="license" src="https://img.shields.io/github/license/Expressive-Tea/expresive-tea?style=flat-square">
  </a>
</p>

<br />
<p align="center">
  <a href="https://github.com/Expressive-Tea/expresive-tea">
    <img src="images/logo.png" alt="Logo" width="160" />
  </a>

  <h1 align="center">Expressive Tea</h1>

  <p align="center">
    <strong>A modern, TypeScript-first framework for building scalable Node.js applications</strong>
    <br />
    <em>Clean architecture • Dependency Injection • Decorator-driven • Express-powered</em>
    <br />
    <br />
    <a href="https://zero-oneit.github.io/expresive-tea/"><strong>📚 Documentation</strong></a>
    ·
    <a href="https://codesandbox.io/s/expressive-tea-2kmg7?fontsize=14&hidenavigation=1&theme=dark"><strong>🚀 Live Demo</strong></a>
    ·
    <a href="https://github.com/Expressive-Tea/expresive-tea/issues"><strong>🐛 Report Bug</strong></a>
    ·
    <a href="https://github.com/Expressive-Tea/expresive-tea/issues"><strong>💡 Request Feature</strong></a>
  </p>
</p>

---

> [!IMPORTANT]
> ### 📦 Package Renamed: `@expressive-tea/core`
> 
> **Expressive Tea has a new home on npm!** Starting with v2.0.0, install using:
> 
> ```bash
> npm install @expressive-tea/core
> ```
> 
> **Legacy package `@zerooneit/expressive-tea` will be maintained until April 30, 2026** for security patches only. Please migrate to `@expressive-tea/core` as soon as possible.
> 
> **Why the change?**
> - ✨ Better namespace organization (`@expressive-tea/*`)
> - 🌍 Community-focused ownership
> - 🚀 Clearer project identity
> 
> **Migration is simple:** Just update your `package.json` and imports remain the same!
> ```diff
> - "dependencies": { "@zerooneit/expressive-tea": "^1.2.0" }
> + "dependencies": { "@expressive-tea/core": "^2.0.0" }
> ```

---

> [!CAUTION]
> ### ⚠️ CRITICAL: v1.x Security Notice
> 
> **All versions 1.x are DEPRECATED and UNSUPPORTED** as of January 27, 2026.
> 
> **v1.3.x Beta** - 🔴 **CRITICAL SECURITY VULNERABILITY** - DO NOT USE  
> Contains critical cryptography flaws in Teapot/Teacup gateway. If you're using this, **STOP IMMEDIATELY** and upgrade to v2.0.0.
> 
> **v1.2.x Production** - 🟡 No crypto issues, but **deprecated** (InversifyJS v6 EOL)
> 
> **👉 Upgrade to v2.0.0 NOW** - See [Migration Guide](docs/MIGRATION_GUIDE_v2.md)

---

## ⚡ Quick Start

```bash
# Install the new package
npm install @expressive-tea/core

# Or with yarn
yarn add @expressive-tea/core
```

```typescript
import { ServerSettings, Route, Get, Boot } from '@expressive-tea/core';

@ServerSettings({ port: 3000 })
class App extends Boot {}

@Route('/hello')
class HelloController {
  @Get('/')
  sayHello() {
    return { message: 'Hello, World! 🍵' };
  }
}

new App().start();
// 🎉 Server running on http://localhost:3000
```

**[Try it live on CodeSandbox →](https://codesandbox.io/s/expressive-tea-2kmg7?fontsize=14&hidenavigation=1&theme=dark)**

---

## 🎯 Why Expressive Tea?

### The Problem
Building Node.js applications is powerful, but messy. You get a blank canvas with Express—no structure, no conventions, just middleware chaos. Sound familiar?

### The Solution
**Expressive Tea** brings the elegance of modern frameworks to Node.js, without the bloat. Think NestJS simplicity meets Express flexibility.

### 🌟 What Makes It Special

| Feature | What You Get |
|---------|-------------|
| 🎨 **Clean Architecture** | Decorators organize your code beautifully—no more spaghetti routes |
| 🔌 **Plugin Everything** | Share database configs, auth, websockets across projects |
| 💉 **Smart DI** | Singleton, Transient, Scoped services—InversifyJS under the hood |
| 🛡️ **Type-Safe** | Full TypeScript strict mode—catch bugs before they ship |
| 🔒 **Secure by Default** | AES-256-GCM + HKDF crypto, built-in security best practices |
| ⚡ **Production Ready** | 92%+ test coverage, battle-tested in real applications |
| 🎯 **Express Compatible** | Use ANY Express middleware—gradual migration friendly |
| 📦 **Zero Lock-in** | BYOA (Bring Your Own Architecture)—we don't force opinions |

---

## 🚀 What's New in v2.0

**Major security and architecture improvements!**

```diff
+ ✅ Security: Fixed critical crypto vulnerabilities (AES-256-GCM + HKDF)
+ ✅ Type Safety: Full TypeScript strict mode support
+ ✅ DI: Scoped dependency injection (Singleton/Transient/Scoped)
+ ✅ Health Checks: Built-in health endpoints for Kubernetes/monitoring
+ ✅ Environment: .env file support with @Env decorator
+ ✅ Performance: Native utilities, removed lodash dependencies
+ ✅ ESLint: Migrated to ESLint v9 flat config
+ ✅ Quality: 95%+ coverage, all tests passing
```

**⚠️ Breaking Changes:**
- Cryptography format changed (must re-encrypt data)
- TypeScript strict mode enabled
- Node.js 18+ required
- Express 5.x required
- ESLint v9 (flat config)

**[📖 Full Changelog](CHANGELOG.md)** • **[🔄 Migration Guide](docs/MIGRATION_GUIDE_v2.md)**

---

## 💡 Features That'll Make You Smile

### 🎨 Decorator-Driven Development
```typescript
@Route('/api/users')
class UserController {
  @Get('/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post('/')
  async createUser(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }
}
```

### 🔌 Pluggable Architecture
```typescript
import { AuthPlugin } from '@my-org/auth-plugin';
import { DatabasePlugin } from '@my-org/db-plugin';

@ServerSettings({
  port: 3000,
  plugins: [AuthPlugin, DatabasePlugin]
})
class App extends Boot {}
```

### 💉 Dependency Injection
```typescript
@injectable()
class UserService {
  constructor(
    @inject(TYPES.Database) private db: Database,
    @inject(TYPES.Logger) private logger: Logger
  ) {}
}
```

### 🎯 Type-Safe Everything
```typescript
// Generics everywhere
class ApiResponse<T> {
  constructor(
    public data: T,
    public status: number
  ) {}
}

@Get('/users')
getUsers(): ApiResponse<User[]> {
  return new ApiResponse(users, 200);
}
```

### 🏥 Built-in Health Checks
```typescript
@HealthCheck({
  checks: [
    {
      name: 'database',
      check: async () => {
        const isConnected = await db.ping();
        return { status: isConnected ? 'pass' : 'fail' };
      },
      critical: true, // Blocks readiness probe if fails
      timeout: 5000
    }
  ]
})
class App extends Boot {}

// Endpoints:
// GET /health       - Detailed health status
// GET /health/live  - Liveness probe (K8s)
// GET /health/ready - Readiness probe (K8s)
```

### 🌍 Environment Variable Support
```typescript
// Load from .env files
@Env({ path: '.env', required: ['DATABASE_URL', 'API_KEY'] })
@Env({ path: '.env.local', override: true, silent: true })
class App extends Boot {}

// In your .env:
// DATABASE_URL=postgres://localhost:5432/mydb
// API_KEY="secret-key"
```

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js** ≥ 18.0.0
- **TypeScript** ≥ 5.0.0
- **Express** ≥ 5.0.0

### Configure TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "commonjs",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    
    // Recommended for maximum safety
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

### Install

```bash
# npm
npm install @expressive-tea/core reflect-metadata

# yarn
yarn add @expressive-tea/core reflect-metadata
```

### Your First App

**1. Create your server:**
```typescript
// server.ts
import 'reflect-metadata';
import { ServerSettings, Boot } from '@expressive-tea/core';

@ServerSettings({
  port: 3000,
  controllers: [HelloController]
})
class MyApp extends Boot {}

export default MyApp;
```

**2. Add a controller:**
```typescript
// controllers/hello.controller.ts
import { Route, Get } from '@expressive-tea/core';

@Route('/hello')
export class HelloController {
  @Get('/')
  sayHello() {
    return { message: 'Hello, Expressive Tea! 🍵' };
  }
}
```

**3. Start it up:**
```typescript
// main.ts
import MyApp from './server';

const app = new MyApp();
app.start().then(() => {
  console.log('🚀 Server is running!');
});
```

**[📚 Full Tutorial →](https://zero-oneit.github.io/expresive-tea/)**

---

## 🎓 Learn More

### 📖 Documentation
- [Complete Guide](https://zero-oneit.github.io/expresive-tea/) - Full documentation
- [API Reference](https://zero-oneit.github.io/expresive-tea/api/) - Complete API docs
- [Examples](https://github.com/Expressive-Tea/expressive-tea-sandbox) - Sample projects

### 🔄 Migration & Upgrading
- [Migration Guide v1 → v2](docs/MIGRATION_GUIDE_v2.md) - Step-by-step upgrade
- [Release Notes v2.0](docs/RELEASE_NOTES_v2.0.0.md) - What's new
- [Deprecation Notice](docs/DEPRECATION_NOTICE.md) - v1.x timeline

### 🛡️ Security
- [Security Policy](SECURITY.md) - Vulnerability reporting
- [Changelog](CHANGELOG.md) - Version history

---

## 🤝 Contributing

We love contributions! Whether it's bug fixes, features, or docs.

**Quick links:**
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines
- [Issues](https://github.com/Expressive-Tea/expresive-tea/issues) - Report bugs or request features

```bash
# Get started
git clone https://github.com/Expressive-Tea/expresive-tea.git
cd expresive-tea
yarn install
yarn test
```

---

## 💬 Community & Support

### Get Help
- 📖 [Documentation](https://zero-oneit.github.io/expresive-tea/)
- 💬 [Gitter Chat](https://gitter.im/Expressive-Tea/expresive-tea)
- 📧 [Email Support](mailto:support@expressive-tea.io)
- 🐛 [GitHub Issues](https://github.com/Expressive-Tea/expresive-tea/issues)
- 🔖 [Stack Overflow](https://stackoverflow.com/questions/tagged/expressive-tea) - Use tag `expressive-tea`

### Stay Connected
- 🐦 Twitter: [@expressive_tea](https://twitter.com/expressive_tea)
- 📧 Email: [support@expressive-tea.io](mailto:support@expressive-tea.io)
- 👨‍💻 Author: [Diego Resendez](https://twitter.com/diegoresendez)

---

## 🌟 Built With

| Technology | Purpose |
|------------|---------|
| [Express](https://expressjs.com/) | Fast, unopinionated web framework |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [InversifyJS](https://inversify.io/) | Powerful dependency injection |
| [Reflect Metadata](https://github.com/rbuckton/reflect-metadata) | Decorator metadata support |

---

## 🏆 Sponsors

Building Expressive Tea takes time and dedication. If this project helps you, consider sponsoring!

**Principal Sponsor:**

<p align="center">
  <a href="https://zerooneit.com" target="_blank">
    <img src="images/zero-oneit.png" width="180" alt="Zero-OneIT" />
  </a>
</p>

**Interested in sponsoring?** Contact [projects@zero-oneit.com](mailto:projects@zero-oneit.com)

---

## 📄 License

Apache-2.0 License - see [LICENSE](LICENSE) file for details

<p align="center">
  <a href="https://app.fossa.io/projects/git%2Bgithub.com%2FExpressive-Tea%2Fexpresive-tea?ref=badge_large">
    <img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2FExpressive-Tea%2Fexpresive-tea.svg?type=large" />
  </a>
</p>

---

## 📌 Versioning

We use [Semantic Versioning](http://semver.org/) (SemVer). See [tags](https://github.com/Expressive-Tea/expresive-tea/tags) for available versions.

---

## 👥 Contributors

**Lead Developer:** [Diego Resendez](https://github.com/zerooneit)

See all [contributors](https://github.com/Expressive-Tea/expresive-tea/contributors) who've helped shape Expressive Tea.

---

## ❤️ Credits

Logo and banner designed by [Freepik](http://www.freepik.com)

---

<p align="center">
  Made with ☕ and 🍵 by the Expressive Tea Team
  <br />
  <sub>Start brewing better Node.js apps today!</sub>
</p>
