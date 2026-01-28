import Metadata from '@expressive-tea/commons/classes/Metadata';
import type { HealthCheck as HealthCheckConfig } from '../engines/health';

/**
 * Health check decorator metadata key
 * @private
 */
const HEALTH_CHECKS_KEY = 'expressive-tea:health-checks';

/**
 * Health check decorator options
 * @since 2.0.0
 */
export interface HealthCheckOptions {
  /** Array of health checks to register */
  checks: HealthCheckConfig[];
}

/**
 * Class decorator to register health checks for monitoring and orchestration.
 * 
 * Adds standardized health check endpoints:
 * - `/health` - Detailed health status with all checks
 * - `/health/live` - Liveness probe (Kubernetes compatible)
 * - `/health/ready` - Readiness probe (only passes if all critical checks pass)
 * 
 * Health checks are executed asynchronously and can be marked as critical for readiness.
 * Non-critical checks only affect the detailed `/health` endpoint.
 * 
 * @decorator {ClassDecorator} HealthCheck - Register health checks
 * @param options - Health check configuration
 * @returns Class decorator function
 * @since 2.0.0
 * @summary Register application health checks for monitoring
 * 
 * @example
 * // Basic health check
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
 *     }
 *   ]
 * })
 * class MyApp extends Boot {}
 * 
 * @example
 * // Multiple health checks with different priorities
 * @HealthCheck({
 *   checks: [
 *     {
 *       name: 'database',
 *       check: async () => {
 *         const connected = await db.ping();
 *         return {
 *           status: connected ? 'pass' : 'fail',
 *           details: { connections: db.poolSize }
 *         };
 *       },
 *       critical: true  // Required for readiness
 *     },
 *     {
 *       name: 'cache',
 *       check: async () => {
 *         const ready = await redis.ping();
 *         return {
 *           status: ready ? 'pass' : 'warn',  // Warn but don't fail
 *           details: { cached_items: await redis.dbsize() }
 *         };
 *       },
 *       critical: false  // Optional, won't block readiness
 *     },
 *     {
 *       name: 'external_api',
 *       check: async () => {
 *         try {
 *           const response = await fetch('https://api.example.com/status');
 *           return { status: response.ok ? 'pass' : 'warn' };
 *         } catch (error) {
 *           return {
 *             status: 'warn',
 *             error: error.message
 *           };
 *         }
 *       },
 *       timeout: 3000
 *     }
 *   ]
 * })
 * class MyApp extends Boot {}
 * 
 * @example
 * // Kubernetes deployment.yaml example
 * // spec:
 * //   containers:
 * //   - name: my-app
 * //     livenessProbe:
 * //       httpGet:
 * //         path: /health/live
 * //         port: 3000
 * //       initialDelaySeconds: 30
 * //       periodSeconds: 10
 * //     readinessProbe:
 * //       httpGet:
 * //         path: /health/ready
 * //         port: 3000
 * //       initialDelaySeconds: 5
 * //       periodSeconds: 5
 */
export function HealthCheck(options: HealthCheckOptions): ClassDecorator {
  return (target: any) => {
    // Store health checks in metadata
    Metadata.set(HEALTH_CHECKS_KEY, options.checks, target);
    return target;
  };
}

/**
 * Get health checks from a class
 * @param target - Target class
 * @returns Array of health checks
 * @since 2.0.0
 * @internal
 */
export function getHealthChecks(target: any): HealthCheckConfig[] {
  return Metadata.get(HEALTH_CHECKS_KEY, target) || [];
}
