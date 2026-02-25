/**
 * Winston Logger Helper for Expressive Tea
 *
 * Provides a centralized, configurable logging solution that replaces
 * direct console.* calls throughout the framework.
 *
 * **Environment Variables:**
 * - `LOG_LEVEL` - Set the minimum log level: 'error' | 'warn' | 'info' | 'debug' (default: 'debug')
 * - `LOG_FORMAT` - Set the output format: 'json' | 'text' (default: 'text')
 *
 * @module helpers/logger
 * @since 2.0.0
 */
import * as winston from 'winston';

const { combine, timestamp, printf, json: jsonFormat } = winston.format;

/**
 * Custom text format that produces human-readable console output.
 * Matches the style of the original console.* calls for backward compatibility.
 */
const textFormat = combine(
  timestamp(),
  printf(({ timestamp: ts, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${String(ts)} [${level}]: ${String(message)}${metaStr}`;
  })
);

/**
 * Structured JSON format for production/log aggregation scenarios.
 */
const structuredFormat = combine(timestamp(), jsonFormat());

/**
 * The framework-wide Winston logger instance.
 *
 * Defaults to `debug` level and `text` format so that all existing console
 * output continues to appear without any configuration (backward compatible).
 *
 * @example
 * ```typescript
 * import logger from '@helpers/logger';
 *
 * logger.info('Server started on port 3000');
 * logger.warn('Deprecation notice', { feature: 'oldApi' });
 * logger.error('Unhandled error', { err: error.message });
 * logger.debug('Loaded config file');
 * ```
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: process.env.LOG_FORMAT === 'json' ? structuredFormat : textFormat,
  transports: [new winston.transports.Console()]
});

export default logger;
