# Logging in Expressive Tea

Complete guide to Winston structured logging in Expressive Tea.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Usage Examples](#usage-examples)
5. [Log Levels](#log-levels)
6. [Output Formats](#output-formats)
7. [Metadata and Context](#metadata-and-context)
8. [Best Practices](#best-practices)
9. [Production Configuration](#production-configuration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Expressive Tea uses **Winston v3.19.0** for structured, configurable logging. Winston replaces direct `console.*` calls throughout the framework with a production-grade logging solution that provides:

### Key Features

- ✅ **Structured Logging**: Output logs with metadata and context
- ✅ **Configurable Levels**: Filter logs by severity (error, warn, info, debug)
- ✅ **Multiple Formats**: Human-readable text or machine-parseable JSON
- ✅ **Environment-Based**: Configure via `LOG_LEVEL` and `LOG_FORMAT` variables
- ✅ **Backward Compatible**: Defaults maintain existing console output behavior
- ✅ **Production Ready**: 100% test coverage with 33 comprehensive tests
- ✅ **Zero Configuration**: Works out-of-the-box without setup

### Why Winston?

Winston is the industry-standard logging library for Node.js because:

- **Performance**: Optimized for high-throughput applications
- **Flexibility**: Supports multiple transports (console, files, external services)
- **Extensibility**: Plugin architecture for custom formatters and transports
- **Structured Format**: Native support for JSON logging (ideal for log aggregation)
- **Ecosystem**: Widely adopted with extensive community support
- **Enterprise Features**: Integrates with cloud logging platforms (CloudWatch, Stackdriver, etc.)

### Comparison with console.*

| Feature | console.* | Winston |
|---------|-----------|---------|
| Log Levels | No filtering | ✅ Error, Warn, Info, Debug |
| Structured Data | No metadata | ✅ Full object context |
| Format Control | Fixed format | ✅ Text, JSON, custom |
| Production Ready | No | ✅ Yes |
| Timestamp Included | No | ✅ Automatic ISO format |
| Environment Config | Manual code | ✅ Environment variables |
| Log Aggregation | Not suitable | ✅ JSON format |

---

## Quick Start

The Winston logger is **built into Expressive Tea** and requires no setup. It works immediately after framework initialization.

### Default Behavior (Development)

By default, Expressive Tea logs at `debug` level in human-readable `text` format, maintaining the appearance of `console.*` calls:

```bash
# Application logs appear as before
2026-02-11T10:30:45.123Z [debug]: Loading configuration file
2026-02-11T10:30:45.234Z [info]: Server initialized on port 3000
2026-02-11T10:30:45.345Z [error]: Database connection timeout
```

### Using the Logger

Import the logger in your application code:

```typescript
import logger from '@helpers/logger';

// Log at different levels
logger.debug('Debug information for development');
logger.info('Important application event');
logger.warn('Warning: Potential issue');
logger.error('Error: Operation failed', { errorCode: 500 });
```

### Switching to JSON Format (Production)

Set an environment variable to enable structured JSON logging:

```bash
# Enable JSON output for log aggregation
LOG_FORMAT=json node server.js
```

Output becomes:
```json
{"level":"info","message":"Server started","timestamp":"2026-02-11T10:30:45.123Z","port":3000}
```

---

## Configuration

### Environment Variables

The logger respects two environment variables for configuration:

#### LOG_LEVEL

Controls the minimum log level threshold. Messages below this level are filtered out.

```bash
# Syntax
LOG_LEVEL=<level>

# Valid values
LOG_LEVEL=error    # Only errors
LOG_LEVEL=warn     # Warnings and errors
LOG_LEVEL=info     # Info, warnings, and errors (recommended for production)
LOG_LEVEL=debug    # All messages (development default)
```

**Default**: `debug` (all messages shown)

**Example**:
```bash
# Production: Show only warnings and errors
LOG_LEVEL=warn npm start

# Development: Show everything
LOG_LEVEL=debug npm start
```

#### LOG_FORMAT

Controls the output format for readability and machine processing.

```bash
# Syntax
LOG_FORMAT=<format>

# Valid values
LOG_FORMAT=text    # Human-readable (development default)
LOG_FORMAT=json    # Structured JSON (production default)
```

**Default**: `text` (human-readable)

**Example**:
```bash
# Pretty-print for development
LOG_FORMAT=text npm run dev

# Structured JSON for aggregation
LOG_FORMAT=json npm start
```

### Combined Configuration

Set both variables for complete control:

```bash
# Production: Only show info+ logs in JSON format
LOG_LEVEL=info LOG_FORMAT=json npm start

# Development: All logs in text format
LOG_LEVEL=debug LOG_FORMAT=text npm run dev

# Strict mode: Only errors, JSON output
LOG_LEVEL=error LOG_FORMAT=json npm start
```

---

## Usage Examples

### Basic Logging

Log simple messages without metadata:

```typescript
import logger from '@helpers/logger';

logger.debug('User service initialized');
logger.info('Request received');
logger.warn('API rate limit approaching');
logger.error('Database query failed');
```

**Output (text format)**:
```
2026-02-11T10:30:45.123Z [debug]: User service initialized
2026-02-11T10:30:45.234Z [info]: Request received
2026-02-11T10:30:45.345Z [warn]: API rate limit approaching
2026-02-11T10:30:46.456Z [error]: Database query failed
```

### Logging with Metadata

Pass context objects as the second parameter:

```typescript
import logger from '@helpers/logger';

// User authentication
logger.info('User logged in', {
  userId: 12345,
  username: 'john.doe',
  email: 'john@example.com',
  ipAddress: '192.168.1.100'
});

// Request processing
logger.info('API request completed', {
  method: 'POST',
  path: '/api/users',
  statusCode: 201,
  duration: '125ms',
  requestId: 'req-xyz-789'
});

// Error context
logger.error('Payment processing failed', {
  paymentId: 'pay-456',
  amount: 99.99,
  reason: 'Insufficient funds',
  retryable: true,
  errorCode: 'ERR_INSUFFICIENT_FUNDS'
});
```

**Output (text format)**:
```
2026-02-11T10:30:45.123Z [info]: User logged in {"userId":12345,"username":"john.doe","email":"john@example.com","ipAddress":"192.168.1.100"}
2026-02-11T10:30:45.234Z [info]: API request completed {"method":"POST","path":"/api/users","statusCode":201,"duration":"125ms","requestId":"req-xyz-789"}
2026-02-11T10:30:45.345Z [error]: Payment processing failed {"paymentId":"pay-456","amount":99.99,"reason":"Insufficient funds","retryable":true,"errorCode":"ERR_INSUFFICIENT_FUNDS"}
```

**Output (JSON format)**:
```json
{"level":"info","message":"User logged in","timestamp":"2026-02-11T10:30:45.123Z","userId":12345,"username":"john.doe","email":"john@example.com","ipAddress":"192.168.1.100"}
{"level":"info","message":"API request completed","timestamp":"2026-02-11T10:30:45.234Z","method":"POST","path":"/api/users","statusCode":201,"duration":"125ms","requestId":"req-xyz-789"}
{"level":"error","message":"Payment processing failed","timestamp":"2026-02-11T10:30:45.345Z","paymentId":"pay-456","amount":99.99,"reason":"Insufficient funds","retryable":true,"errorCode":"ERR_INSUFFICIENT_FUNDS"}
```

### Logging Errors

Include error details for debugging:

```typescript
import logger from '@helpers/logger';

try {
  await database.connect();
} catch (error) {
  logger.error('Database connection failed', {
    host: 'db.example.com',
    port: 5432,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    retryable: true,
    nextRetryIn: '5s'
  });
}
```

**Output (JSON format)**:
```json
{
  "level": "error",
  "message": "Database connection failed",
  "timestamp": "2026-02-11T10:30:45.123Z",
  "host": "db.example.com",
  "port": 5432,
  "errorMessage": "ECONNREFUSED 127.0.0.1:5432",
  "errorStack": "Error: connect ECONNREFUSED 127.0.0.1:5432\n    at ...",
  "retryable": true,
  "nextRetryIn": "5s"
}
```

### Dynamic Log Level Changes

Change the log level at runtime:

```typescript
import logger from '@helpers/logger';

// Set initial level from environment
// logger.level = 'info'  (set via LOG_LEVEL env var)

// During troubleshooting, enable debug logging
logger.level = 'debug';
logger.debug('Detailed diagnostic information');

// Back to normal operation
logger.level = 'info';
```

---

## Log Levels

Winston defines a standard log level hierarchy (most to least severe):

### Error (Most Severe)

Use for failures that require immediate attention:

```typescript
logger.error('Critical operation failed', {
  operation: 'payment_processing',
  errorCode: 'ERR_PAYMENT_FAILED',
  shouldAlert: true
});
```

**Use cases**:
- Application crashes
- Database connection failures
- Failed critical operations
- Unhandled exceptions
- Configuration errors

**Recommended for**: Production monitoring and alerts

### Warn

Use for unexpected situations that don't stop execution:

```typescript
logger.warn('Slow query detected', {
  query: 'SELECT * FROM users WHERE...',
  duration: '2500ms',
  threshold: '1000ms'
});
```

**Use cases**:
- Deprecated features used
- Performance degradation
- Resource limits approaching
- Unusual but recoverable conditions
- Configuration warnings

**Recommended for**: Attention before problems occur

### Info

Use for important application events:

```typescript
logger.info('User signup completed', {
  userId: 'usr_12345',
  email: 'new@example.com',
  source: 'web',
  timestamp: Date.now()
});
```

**Use cases**:
- Application startup/shutdown
- Feature usage tracking
- User actions (login, signup)
- Configuration loaded
- Major milestones

**Recommended for**: Production and development

### Debug (Least Severe)

Use for detailed diagnostic information:

```typescript
logger.debug('Processing request', {
  method: 'GET',
  path: '/api/users/123',
  queryParams: { include: 'posts', limit: 10 },
  headers: { authorization: 'Bearer ...' }
});
```

**Use cases**:
- Function entry/exit
- Variable values
- Request/response bodies
- Iteration progress
- Calculation details

**Recommended for**: Development only

### Log Level Filtering

When you set `LOG_LEVEL`, higher severity levels are always included:

```bash
# LOG_LEVEL=error
# Shows: error
# Hides: warn, info, debug

# LOG_LEVEL=warn
# Shows: error, warn
# Hides: info, debug

# LOG_LEVEL=info
# Shows: error, warn, info
# Hides: debug

# LOG_LEVEL=debug
# Shows: error, warn, info, debug
# (All levels visible)
```

**Visual Hierarchy**:
```
error ──────────────────────── (Most severe)
  │
warn
  │
info
  │
debug ──────────────────────── (Least severe)
```

---

## Output Formats

### Text Format (Default)

Human-readable format ideal for development and interactive debugging.

**Example**:
```
2026-02-11T10:30:45.123Z [info]: Server started on port 3000
2026-02-11T10:30:45.234Z [warn]: Configuration warning {"feature":"authentication"}
2026-02-11T10:30:45.345Z [error]: Connection timeout {"host":"db.local","timeout":5000}
```

**Format breakdown**:
- `2026-02-11T10:30:45.123Z` - ISO timestamp
- `[info]` - Log level in brackets
- `Server started...` - Message
- `{...metadata...}` - Optional JSON metadata

**Use cases**:
- Local development
- Manual log inspection
- Interactive debugging
- CI/CD logs (for readability)

**Enable**:
```bash
LOG_FORMAT=text npm run dev
# or (default)
npm run dev
```

### JSON Format (Structured)

Machine-parseable JSON format ideal for production log aggregation.

**Example**:
```json
{"level":"info","message":"Server started on port 3000","timestamp":"2026-02-11T10:30:45.123Z","port":3000}
{"level":"warn","message":"Configuration warning","timestamp":"2026-02-11T10:30:45.234Z","feature":"authentication"}
{"level":"error","message":"Connection timeout","timestamp":"2026-02-11T10:30:45.345Z","host":"db.local","timeout":5000}
```

**Format breakdown**:
- `"level"` - Log level as string
- `"message"` - Log message
- `"timestamp"` - ISO format timestamp
- Additional fields - Custom metadata

**Use cases**:
- Production deployment
- Log aggregation (ELK, CloudWatch, Splunk)
- Automated analysis and alerting
- JSON parsing for monitoring tools
- Integration with third-party logging services

**Enable**:
```bash
LOG_FORMAT=json npm start
```

### Format Comparison

| Aspect | Text | JSON |
|--------|------|------|
| Readability | ✅ Human-friendly | ❌ Verbose |
| Parseability | ❌ Complex regex | ✅ Direct JSON.parse |
| Log Aggregation | ❌ Not ideal | ✅ Perfect |
| File Size | ✅ Compact | ❌ Larger |
| Development | ✅ Recommended | ❌ Verbose |
| Production | ⚠️ Acceptable | ✅ Recommended |
| Timestamp | ✅ Included | ✅ Included |
| Metadata | ✅ JSON appended | ✅ Fields merged |

---

## Metadata and Context

### Passing Metadata

All log methods accept a second parameter for context data:

```typescript
// Single metadata object
logger.info('User action', {
  userId: 123,
  action: 'profile_update',
  fields: ['email', 'phone']
});

// Nested objects
logger.error('Payment failed', {
  payment: {
    id: 'pay_xyz',
    amount: 99.99,
    currency: 'USD'
  },
  customer: {
    id: 'cust_abc',
    email: 'user@example.com'
  },
  reason: 'Card declined'
});

// Arrays in metadata
logger.info('Batch operation completed', {
  itemsProcessed: 150,
  itemIds: [1, 2, 3, 4, 5], // First 5
  duration: '2.5s',
  errors: 2
});
```

### Request Context

Common metadata for HTTP requests:

```typescript
import logger from '@helpers/logger';

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuid();

  logger.info('HTTP request started', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response when complete
  res.on('finish', () => {
    logger.info('HTTP request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - req.startTime
    });
  });

  next();
});
```

### User Context

Track user actions throughout the application:

```typescript
import logger from '@helpers/logger';

async function updateUserProfile(userId: string, changes: any) {
  const userContext = {
    userId,
    action: 'profile_update',
    timestamp: new Date().toISOString(),
    changeFields: Object.keys(changes)
  };

  try {
    logger.info('Profile update started', userContext);

    const result = await database.users.update(userId, changes);

    logger.info('Profile update completed', {
      ...userContext,
      success: true,
      recordsModified: result.modifiedCount
    });

    return result;
  } catch (error) {
    logger.error('Profile update failed', {
      ...userContext,
      error: error instanceof Error ? error.message : String(error),
      errorCode: error.code,
      shouldRetry: error.retriable
    });
    throw error;
  }
}
```

### Performance Monitoring

Log performance metrics with context:

```typescript
import logger from '@helpers/logger';

async function fetchUserData(userId: string) {
  const startTime = Date.now();
  const metrics = {
    userId,
    operation: 'fetchUserData',
    startTime
  };

  try {
    const user = await database.users.findById(userId);
    const duration = Date.now() - startTime;

    logger.info('User data fetched', {
      ...metrics,
      duration,
      success: true,
      cacheHit: false
    });

    return user;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('User data fetch failed', {
      ...metrics,
      duration,
      error: error instanceof Error ? error.message : String(error)
    });

    throw error;
  }
}
```

---

## Best Practices

### 1. Use Appropriate Log Levels

Choose the right level for each message:

```typescript
// ✅ GOOD: Appropriate levels
logger.error('Payment processing failed', { orderId, reason });
logger.warn('API rate limit at 90%', { remaining, resetAt });
logger.info('User logged in', { userId });
logger.debug('Loading configuration from file', { path });

// ❌ BAD: Wrong levels
logger.error('User logged in'); // Too severe for normal action
logger.debug('Payment failed'); // Should be error
logger.info('Debug variable x = 5'); // Should be debug
```

### 2. Include Sufficient Context

Metadata should enable debugging without code access:

```typescript
// ✅ GOOD: Complete context
logger.error('Database operation failed', {
  operation: 'INSERT INTO users',
  table: 'users',
  errorCode: error.code,
  errorMessage: error.message,
  userId: userId, // Identify which user was affected
  retryable: error.retriable
});

// ❌ BAD: Insufficient context
logger.error('Database error'); // What database? What operation?
```

### 3. Never Log Sensitive Data

Exclude passwords, tokens, and PII:

```typescript
// ✅ GOOD: Sanitized logging
logger.info('User authenticated', {
  userId: user.id,
  email: user.email, // OK - needed for debugging
  // password: NOT logged
  // token: NOT logged
  // creditCard: NOT logged
  authMethod: 'oauth2'
});

// ❌ BAD: Exposing secrets
logger.info('User authenticated', {
  userId,
  password: user.password, // DANGER! Never log
  apiKey: env.API_KEY, // DANGER! Never log
  token: jwtToken // DANGER! Never log
});
```

### 4. Structured Metadata

Use consistent, well-structured metadata:

```typescript
// ✅ GOOD: Consistent structure
logger.info('Order created', {
  orderId: order.id,
  userId: order.userId,
  itemCount: order.items.length,
  totalAmount: order.total,
  currency: 'USD',
  status: 'pending'
});

// ❌ BAD: Inconsistent/unclear metadata
logger.info('Order', {
  o_id: order.id,
  u: order.userId,
  n: order.items.length,
  amt: order.total
});
```

### 5. Use Request IDs for Tracing

Include unique IDs to trace related logs:

```typescript
import logger from '@helpers/logger';
import { v4 as uuid } from 'uuid';

app.use((req, res, next) => {
  // Generate or extract request ID
  const requestId = req.headers['x-request-id'] as string || uuid();
  req.id = requestId;

  // Include in all logs for this request
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path
  });

  next();
});

// In your service
async function processOrder(orderId: string, requestId: string) {
  logger.info('Processing order', { requestId, orderId });

  // ... processing ...

  logger.info('Order processed', { requestId, orderId, status: 'complete' });
}
```

This allows searching logs by `requestId` to see the entire request flow.

### 6. Log State Transitions

Track important state changes:

```typescript
import logger from '@helpers/logger';

async function processPayment(payment: Payment) {
  logger.info('Payment processing started', {
    paymentId: payment.id,
    amount: payment.amount,
    status: 'pending'
  });

  try {
    const result = await chargeCard(payment);

    logger.info('Payment charged', {
      paymentId: payment.id,
      status: 'completed', // ← State changed
      transactionId: result.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.warn('Payment failed, retrying', {
      paymentId: payment.id,
      status: 'retry', // ← State changed
      attempt: 2,
      nextRetry: '5 minutes'
    });
  }
}
```

---

## Production Configuration

### Recommended Production Setup

For production deployments, use these settings:

```bash
# Recommended: Show info+ messages in JSON format for aggregation
LOG_LEVEL=info LOG_FORMAT=json node server.js

# Alternative: Show warnings+ for stricter logging
LOG_LEVEL=warn LOG_FORMAT=json node server.js
```

### Docker Example

Set environment variables in your Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm install && npm run build

# Production logging configuration
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json
ENV NODE_ENV=production

EXPOSE 3000
CMD ["npm", "start"]
```

Or via docker-compose:

```yaml
services:
  api:
    build: .
    environment:
      LOG_LEVEL: info
      LOG_FORMAT: json
      NODE_ENV: production
    ports:
      - "3000:3000"
```

### Kubernetes Example

Set in your Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: expressive-tea-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: my-org/expressive-tea-api:latest
        env:
        - name: LOG_LEVEL
          value: "info"
        - name: LOG_FORMAT
          value: "json"
        - name: NODE_ENV
          value: "production"
```

### Log Aggregation Integration

#### ELK Stack (Elasticsearch, Logstash, Kibana)

Configure Logstash to parse Winston JSON logs:

```logstash
input {
  stdin {}
}

filter {
  json {
    source => "message"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "expressive-tea-%{+YYYY.MM.dd}"
  }
}
```

#### CloudWatch (AWS)

Install and configure CloudWatch agent:

```bash
npm install --save aws-lambda-log-cloudwatch-plugin
```

Configure in your app:

```typescript
import logger from '@helpers/logger';
import CloudwatchTransport from 'aws-lambda-log-cloudwatch-plugin';

// Add CloudWatch transport to existing logger
// (This example is illustrative; actual implementation depends on your setup)
```

#### Splunk

Send JSON logs to Splunk HTTP Event Collector:

```bash
# Pipe logs to Splunk
LOG_FORMAT=json npm start | curl -d @- https://your-splunk-instance.com/services/collector
```

### Performance Considerations

- **Log Level**: Set to `warn` or `info` in production to reduce I/O overhead
- **Format**: JSON is slightly slower than text but necessary for aggregation
- **Async Transport**: Consider adding file transport for high-volume logging
- **Sampling**: For very high-volume applications, implement log sampling
- **Rotation**: Implement log rotation if using file transport

### Monitoring Logs

Set up alerts for error patterns:

```bash
# Alert on error rate spike
# (Tool-specific syntax, example for ELK)
GET /logstash-*/_search
{
  "query": {
    "range": {
      "timestamp": { "gte": "now-5m" }
    }
  },
  "aggs": {
    "error_count": {
      "filter": { "term": { "level": "error" } }
    }
  }
}
```

---

## Troubleshooting

### Logs Not Appearing

**Problem**: No logs are visible when running the application.

**Solution**: Check that LOG_LEVEL is not set too high:

```bash
# Verify current log level
echo $LOG_LEVEL  # Should be empty or 'debug'

# Set explicitly to debug
LOG_LEVEL=debug npm run dev

# Check if logger is imported correctly
import logger from '@helpers/logger';
logger.info('Test message');
```

### All Logs Showing in Production

**Problem**: Debug logs are appearing in production JSON output.

**Solution**: Ensure LOG_LEVEL is set correctly:

```bash
# Check current environment
echo $LOG_LEVEL

# Explicitly set for production
LOG_LEVEL=info npm start

# Verify in logs (check timestamp field)
LOG_LEVEL=info LOG_FORMAT=json npm start | head -1
# Should show {"level":"info"...} not {"level":"debug"...}
```

### JSON Logs Not Parsed

**Problem**: JSON logs are not being parsed by your aggregation tool.

**Solution**: Verify JSON format is enabled and output is valid:

```bash
# Enable JSON format
LOG_FORMAT=json npm start 2>&1 | head -5

# Validate JSON (using jq)
LOG_FORMAT=json npm start 2>&1 | jq . | head -20

# Check for errors before JSON
LOG_FORMAT=json npm start 2>&1 | grep -v '^{' | head -10
```

### Special Characters in Logs

**Problem**: Metadata contains special characters breaking output.

**Solution**: Metadata is automatically escaped in JSON format:

```typescript
// This is handled automatically:
logger.info('User comment', {
  comment: 'He said "Hello" and I replied "Hi!"'
});

// Output (properly escaped):
// {"level":"info","message":"User comment","comment":"He said \"Hello\" and I replied \"Hi!\""}
```

### Performance Issues

**Problem**: Logging is slowing down the application.

**Solution**: Adjust log level and format:

```bash
# Reduce log volume
LOG_LEVEL=warn npm start

# Use text format (slightly faster than JSON)
LOG_FORMAT=text npm start

# Or both
LOG_LEVEL=warn LOG_FORMAT=text npm start
```

### Timestamps in Wrong Format

**Problem**: Timestamps are in unexpected format.

**Solution**: Timestamps are always ISO 8601 format by design:

```typescript
// Always ISO format:
// "2026-02-11T10:30:45.123Z"

// In text format:
// 2026-02-11T10:30:45.123Z [info]: message

// In JSON format:
// {"timestamp":"2026-02-11T10:30:45.123Z","level":"info",...}
```

To use Unix timestamps in custom setup, you would need to extend Winston.

### Metadata Not Appearing

**Problem**: Metadata passed to logger is not appearing in output.

**Solution**: Verify metadata format:

```typescript
// ✅ CORRECT: Object as second parameter
logger.info('Message', { userId: 123, action: 'login' });

// ❌ WRONG: String concatenation
logger.info('Message ' + JSON.stringify(metadata)); // Metadata is part of message

// ✅ CORRECT in JSON format:
// {"level":"info","message":"Message","userId":123,"action":"login"}
```

---

## Migration from console.*

Existing Expressive Tea applications are **automatically using Winston** for all internal logging. No migration is required.

### Optional: Replace console.* in Custom Code

If you're using `console.log()` in your application code, you can optionally migrate to Winston:

**Before**:
```typescript
console.log('User logged in:', userId);
console.error('Error:', error.message);
console.warn('Deprecation warning');
```

**After**:
```typescript
import logger from '@helpers/logger';

logger.info('User logged in', { userId });
logger.error('Error', { message: error.message });
logger.warn('Deprecation warning');
```

---

## Related Documentation

- [Configuration Files](./configuration-files.md) - Server configuration settings
- [Environment Variables](./env-decorator.md) - Load secrets from `.env` files
- [Winston Documentation](https://github.com/winstonjs/winston) - Official Winston library
- [Structured Logging Best Practices](https://cloud.google.com/logging/docs/structured-logging) - Industry standards

---

## Summary

- ✅ Winston v3.19.0 provides production-grade structured logging
- ✅ Configure via `LOG_LEVEL` (error, warn, info, debug) and `LOG_FORMAT` (text, json)
- ✅ Default: `LOG_LEVEL=debug`, `LOG_FORMAT=text` (backward compatible)
- ✅ Text format for development, JSON format for production log aggregation
- ✅ Pass metadata as second parameter to all log methods
- ✅ Never log sensitive data (passwords, tokens, PII)
- ✅ Use appropriate log levels for different message types
- ✅ Include sufficient context for debugging without code access
- ✅ 100% test coverage ensures reliability

**Quick Reference**:
```typescript
import logger from '@helpers/logger';

logger.debug('Detailed diagnostic info');           // Development only
logger.info('Important application event');          // General tracking
logger.warn('Unusual but recoverable condition');     // Attention needed
logger.error('Critical failure requiring action', {  // Production alerts
  errorCode: 'ERR_PAYMENT_FAILED',
  context: { orderId, customerId }
});
```

**Environment Configuration**:
```bash
# Development (default)
LOG_LEVEL=debug LOG_FORMAT=text npm run dev

# Production (recommended)
LOG_LEVEL=info LOG_FORMAT=json npm start

# Strict production
LOG_LEVEL=warn LOG_FORMAT=json npm start
```
