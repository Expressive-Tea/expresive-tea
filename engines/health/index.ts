import { injectable, injectFromBase } from 'inversify';
import { type Request, type Response } from 'express';
import ExpressiveTeaEngine from '@classes/Engine';

/**
 * Health check status
 * @since 2.0.0
 */
export type HealthStatus = 'pass' | 'fail' | 'warn';

/**
 * Individual health check result
 * @since 2.0.0
 */
export interface HealthCheckResult {
  /** Check status */
  status: HealthStatus;
  /** Optional details about the check */
  details?: Record<string, any>;
  /** Optional error message if failed */
  error?: string;
}

/**
 * Health check function
 * @since 2.0.0
 */
export type HealthCheckFunction = () => Promise<HealthCheckResult> | HealthCheckResult;

/**
 * Health check definition
 * @since 2.0.0
 */
export interface HealthCheck {
  /** Unique name for this health check */
  name: string;
  /** The check function to execute */
  check: HealthCheckFunction;
  /** Whether this check is critical for readiness */
  critical?: boolean;
  /** Optional timeout in milliseconds */
  timeout?: number;
}

/**
 * Health Check Engine
 *
 * Provides standardized health check endpoints for monitoring and orchestration:
 * - `/health` - Detailed health status with all checks
 * - `/health/live` - Liveness probe (always 200 if server is running)
 * - `/health/ready` - Readiness probe (200 only if all critical checks pass)
 *
 * Automatically registers health checks from @HealthCheck decorator on Boot class.
 * Checks can also be registered manually via registerCheck() for dynamic registration.
 *
 * Compatible with Kubernetes liveness and readiness probes.
 *
 * @class HealthCheckEngine
 * @extends ExpressiveTeaEngine
 * @since 2.0.0
 * @summary Standardized health check endpoints for monitoring
 *
 * @example
 * // Enable health checks with custom checks
 * @HealthCheck({
 *   checks: [
 *     {
 *       name: 'database',
 *       check: async () => {
 *         const isConnected = await db.ping();
 *         return { status: isConnected ? 'pass' : 'fail' };
 *       },
 *       critical: true,
 *       timeout: 5000
 *     },
 *     {
 *       name: 'cache',
 *       check: async () => {
 *         const isReady = await redis.ping();
 *         return {
 *           status: isReady ? 'pass' : 'warn',
 *           details: { connected: isReady }
 *         };
 *       }
 *     }
 *   ]
 * })
 * class MyApp extends Boot {}
 */
@injectable()
@injectFromBase({ extendConstructorArguments: true })
export default class HealthCheckEngine extends ExpressiveTeaEngine {
  private checks: HealthCheck[] = [];

  /**
   * Register a health check
   * @param check - Health check configuration
   * @since 2.0.0
   */
  registerCheck(check: HealthCheck): void {
    this.checks.push(check);
  }

  /**
   * Execute a single health check with timeout
   * @param check - Health check to execute
   * @returns Check result
   * @private
   */
  private async executeCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const timeout = check.timeout || 5000;

    try {
      const result = await Promise.race([
        Promise.resolve(check.check()),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        )
      ]);

      return result;
    } catch (error) {
      return {
        status: 'fail',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Initialize health check routes
   * @since 2.0.0
   */
  async init(): Promise<void> {
    const app = this.context.getApplication();

    // Detailed health endpoint
    app.get('/health', async (_req: Request, res: Response) => {
      const results: Record<string, HealthCheckResult> = {};
      let overallStatus: HealthStatus = 'pass';

      // Execute all checks in parallel
      await Promise.all(
        this.checks.map(async (check) => {
          const result = await this.executeCheck(check);
          results[check.name] = result;

          // Update overall status
          if (result.status === 'fail') {
            overallStatus = 'fail';
          } else if (result.status === 'warn' && overallStatus === 'pass') {
            overallStatus = 'warn';
          }
        })
      );

      const statusCode = overallStatus === 'pass' ? 200 : overallStatus === 'warn' ? 200 : 503;

      res.status(statusCode).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks: results
      });
    });

    // Liveness probe - always returns 200 if server is running
    app.get('/health/live', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'pass',
        timestamp: new Date().toISOString()
      });
    });

    // Readiness probe - returns 200 only if all critical checks pass
    app.get('/health/ready', async (_req: Request, res: Response) => {
      const criticalChecks = this.checks.filter((c) => c.critical);

      if (criticalChecks.length === 0) {
        // No critical checks, always ready
        res.status(200).json({
          status: 'pass',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const results: Record<string, HealthCheckResult> = {};
      let isReady = true;

      // Execute only critical checks
      await Promise.all(
        criticalChecks.map(async (check) => {
          const result = await this.executeCheck(check);
          results[check.name] = result;

          if (result.status === 'fail') {
            isReady = false;
          }
        })
      );

      res.status(isReady ? 200 : 503).json({
        status: isReady ? 'pass' : 'fail',
        timestamp: new Date().toISOString(),
        checks: results
      });
    });
  }

  /**
   * Start the health check engine
   * @since 2.0.0
   */
  async start(): Promise<void> {
    // Nothing to start - routes are already registered
  }

  /**
   * Stop the health check engine
   * @since 2.0.0
   */
  async stop(): Promise<void> {
    // Clear checks on shutdown
    this.checks = [];
  }

  /**
   * Determine if this engine should be registered
   *
   * Health checks are enabled by default for all applications.
   * To disable, set `enableHealthChecks: false` in ServerSettings.
   *
   * @returns true if health checks should be enabled
   * @since 2.0.0
   */
  static canRegister(): boolean {
    return true;
  }
}
