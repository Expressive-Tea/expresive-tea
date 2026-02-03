# Configuration Files

Guide to using `.expressive-tea` configuration files in Expressive Tea.

---

## Overview

Expressive Tea supports flexible configuration via `.expressive-tea` files in multiple formats. Configuration files allow you to define server settings such as port numbers, SSL certificates, middleware options, and plugin configurations in a structured, version-controlled format.

Configuration files are loaded automatically during application initialization and merged with programmatic settings provided via the `@ServerSettings` decorator.

---

## Supported Formats

Expressive Tea supports two configuration file formats:

- **YAML**: `.expressive-tea.yaml` or `.expressive-tea.yml` (recommended)
- **JSON**: `.expressive-tea` (legacy support)

### Why YAML?

YAML is the recommended format for configuration files because:

- ✅ **Human-readable**: Cleaner syntax without quotes and brackets
- ✅ **Comments**: Native support for inline documentation
- ✅ **Multiline strings**: Better for complex values
- ✅ **Industry standard**: Widely used in DevOps (Docker, Kubernetes, CI/CD)

---

## File Priority

When multiple configuration files exist in your project root, Expressive Tea loads them in this priority order:

1. **`.expressive-tea.yaml`** (highest priority)
2. **`.expressive-tea.yml`** (second priority)
3. **`.expressive-tea`** (JSON format, lowest priority)

> **Important**: Only the **first file found** is loaded. If `.expressive-tea.yaml` exists, the other files are ignored.

### Example: Multiple Config Files

```bash
# Project structure
my-app/
├── .expressive-tea.yaml   ← This file is loaded (highest priority)
├── .expressive-tea.yml    ← Ignored
├── .expressive-tea        ← Ignored
└── server.ts
```

---

## Configuration Schema

The configuration file supports all properties from the `ExpressiveTeaServerProps` interface:

### Core Server Settings

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `port` | `number` | HTTP server port | `3000` |
| `securePort` | `number` | HTTPS server port | `4443` |
| `environment` | `string` | Application environment (e.g., `production`, `development`) | - |

### SSL/TLS Configuration

| Property | Type | Description |
|----------|------|-------------|
| `ssl.cert` | `string` | Path to SSL certificate file |
| `ssl.key` | `string` | Path to SSL private key file |
| `ssl.passphrase` | `string` | Passphrase for encrypted private key |

### Additional Settings

You can add any custom properties to the configuration file. They will be available via the `Settings` singleton:

```typescript
// Custom properties in config file
customProperty: "value"

// Access in code
const value = Settings.getInstance().get('customProperty');
```

---

## Examples

### YAML Format (.expressive-tea.yaml)

**Basic Configuration**:
```yaml
# Server ports
port: 3000
securePort: 4443

# Environment
environment: production
```

**With SSL Configuration**:
```yaml
port: 3000
securePort: 4443

ssl:
  cert: ./certs/server.crt
  key: ./certs/server.key
  passphrase: mySecretPassphrase
```

**With Custom Settings**:
```yaml
# Server settings
port: 8080
environment: development

# Custom application settings
database:
  host: localhost
  port: 5432
  name: myapp_dev
  pool:
    min: 2
    max: 10

cache:
  enabled: true
  ttl: 3600
  host: redis://localhost:6379

logging:
  level: debug
  format: json
```

**With Comments**:
```yaml
# Development environment configuration
port: 3000  # HTTP port for local development
securePort: 4443  # HTTPS port (rarely used in dev)

# Database connection (Docker container)
database:
  host: localhost  # Use 'db' for docker-compose
  port: 5432
  
# Feature flags
features:
  enableBetaFeatures: true  # Enable experimental features
  maintenanceMode: false
```

---

### JSON Format (.expressive-tea)

**Basic Configuration**:
```json
{
  "port": 3000,
  "securePort": 4443,
  "environment": "production"
}
```

**With SSL Configuration**:
```json
{
  "port": 3000,
  "securePort": 4443,
  "ssl": {
    "cert": "./certs/server.crt",
    "key": "./certs/server.key",
    "passphrase": "mySecretPassphrase"
  }
}
```

**With Custom Settings**:
```json
{
  "port": 8080,
  "environment": "development",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_dev",
    "pool": {
      "min": 2,
      "max": 10
    }
  },
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "host": "redis://localhost:6379"
  },
  "logging": {
    "level": "debug",
    "format": "json"
  }
}
```

---

## Using Configuration in Code

### Accessing Configuration Values

Configuration values are automatically loaded into the `Settings` singleton:

```typescript
import { Settings } from '@expressive-tea/core';

const settings = Settings.getInstance();

// Get specific value
const port = settings.get('port'); // 3000
const dbHost = settings.get('database.host'); // 'localhost'

// Get all options
const allSettings = settings.getOptions();
console.log(allSettings.port); // 3000
```

### Merging with Programmatic Settings

Configuration files are merged with settings provided via `@ServerSettings` decorator:

```typescript
import { ServerSettings, Boot } from '@expressive-tea/core';

// .expressive-tea.yaml contains: { port: 3000 }

@ServerSettings({
  port: 8080,  // Overrides file config
  environment: 'production'  // Adds to file config
})
class App extends Boot {}

// Result: { port: 8080, environment: 'production' }
```

**Merge Priority** (highest to lowest):
1. `@ServerSettings` decorator options
2. Configuration file (`.expressive-tea.yaml` / `.yml` / `.expressive-tea`)
3. Default values (`{ port: 3000, securePort: 4443 }`)

---

## Error Handling

### Invalid YAML

If your YAML file contains syntax errors, Expressive Tea throws a clear error:

```bash
Error: Invalid YAML in .expressive-tea.yaml: bad indentation of a mapping entry (2:1)

 1 | port: 3000
 2 | securePort 4443  # Missing colon
-----^
```

### Invalid JSON

If your JSON file contains syntax errors:

```bash
Error: Invalid JSON in .expressive-tea: Unexpected token } in JSON at position 45
```

### File Loading Debug

To see which configuration file was loaded, enable debug logging:

```bash
DEBUG=* node server.js

# Output:
# [Expressive Tea] Loaded configuration from: .expressive-tea.yaml
```

Or check programmatically:

```typescript
import { fileSettings } from '@expressive-tea/core';

const { config, source } = fileSettings();
console.log(`Loaded from: ${source}`); // '.expressive-tea.yaml'
```

---

## Best Practices

### 1. Use YAML for New Projects

```yaml
# ✅ GOOD: Clean, readable YAML
port: 3000
database:
  host: localhost
  port: 5432
```

```json
// ❌ AVOID: Verbose JSON (unless required for tooling)
{
  "port": 3000,
  "database": {
    "host": "localhost",
    "port": 5432
  }
}
```

### 2. Add Comments for Clarity

```yaml
# Server configuration
port: 3000  # HTTP port for development

# Database settings (matches docker-compose.yml)
database:
  host: db  # Docker service name
  port: 5432
```

### 3. Separate Environment-Specific Settings

**Don't**: Store secrets in configuration files (use `.env` instead)

```yaml
# ❌ BAD: Secrets in config file (committed to git)
database:
  password: "super-secret-password"
  apiKey: "sk-1234567890abcdef"
```

```yaml
# ✅ GOOD: Use environment variables for secrets
database:
  host: localhost
  port: 5432
  # PASSWORD loaded from .env file
```

```bash
# .env (not committed to git)
DATABASE_PASSWORD=super-secret-password
API_KEY=sk-1234567890abcdef
```

### 4. Keep Configuration Files Small

Configuration files should contain **structural settings**, not dynamic data:

```yaml
# ✅ GOOD: Structural configuration
port: 3000
cors:
  enabled: true
  origins: "*"
logging:
  level: info
```

```yaml
# ❌ BAD: Dynamic data (use database/external config instead)
users:
  - name: John
    email: john@example.com
  - name: Jane
    email: jane@example.com
```

### 5. Version Control Best Practices

```gitignore
# .gitignore

# Commit base configuration
# .expressive-tea.yaml  ← Committed

# Ignore environment-specific overrides
.expressive-tea.local.yaml
.expressive-tea.production.yaml

# Always ignore secrets
.env
.env.local
.env.production
```

---

## Troubleshooting

### Configuration Not Loading

**Problem**: Changes to configuration file are not reflected in the application.

**Solution**: Restart the application. Configuration files are loaded once at startup.

```bash
# Restart your application
npm run dev
```

---

### Wrong File Being Loaded

**Problem**: Unexpected configuration values are being used.

**Solution**: Check file priority. If you have multiple config files, only the first one found is loaded:

```bash
# Check which files exist
ls -la .expressive-tea*

# Remove unwanted files
rm .expressive-tea.yml  # Keep only .expressive-tea.yaml
```

---

### YAML Indentation Errors

**Problem**: `Invalid YAML: bad indentation` error.

**Solution**: YAML uses **2 spaces** for indentation (not tabs):

```yaml
# ❌ BAD: Inconsistent indentation
database:
    host: localhost  # 4 spaces
  port: 5432  # 2 spaces

# ✅ GOOD: Consistent 2-space indentation
database:
  host: localhost
  port: 5432
```

**Tip**: Use a YAML-aware editor with syntax highlighting (VS Code, WebStorm, etc.)

---

### Values Not Overriding Defaults

**Problem**: Configuration file values are being overridden by `@ServerSettings`.

**Solution**: Remember merge priority. `@ServerSettings` decorator options override file config:

```yaml
# .expressive-tea.yaml
port: 3000
```

```typescript
@ServerSettings({
  port: 8080  // ← This wins
})
class App extends Boot {}
```

If you want file config to win, don't specify the property in `@ServerSettings`:

```typescript
@ServerSettings({
  // port: not specified, uses file config (3000)
  environment: 'production'
})
class App extends Boot {}
```

---

## Migration from v2.0.0

### Step 1: Check Existing Configuration

If you have an existing `.expressive-tea` JSON file:

```bash
# Check if you have a JSON config file
ls -la .expressive-tea

# Example content:
# { "port": 3000, "securePort": 4443 }
```

### Step 2: Convert to YAML (Optional)

Create a new `.expressive-tea.yaml` file:

```yaml
# .expressive-tea.yaml (new)
port: 3000
securePort: 4443
```

### Step 3: Test and Remove Old File

```bash
# Test with YAML file
npm run dev

# If working correctly, remove old JSON file
rm .expressive-tea
```

### No Migration Required

Your existing `.expressive-tea` JSON file continues to work in v2.0.1. YAML support is an optional enhancement.

---

## Related Documentation

- [Environment Variables Guide](./env-decorator.md) - Load secrets from `.env` files
- [Server Settings](../README.md#server-settings) - Programmatic configuration via `@ServerSettings`
- [Settings API Reference](../README.md#settings-api) - Using the `Settings` singleton

---

## Summary

- ✅ Supports YAML (`.yaml`, `.yml`) and JSON formats
- ✅ File priority: `.expressive-tea.yaml` > `.expressive-tea.yml` > `.expressive-tea`
- ✅ Automatic loading and merging with programmatic settings
- ✅ Clear error messages for invalid files
- ✅ Backward compatible with v2.0.0

**Recommended**: Use `.expressive-tea.yaml` for new projects and migrate existing JSON configs when convenient.
