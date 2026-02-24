import * as express from 'express';
import * as supertest from 'supertest';
import HealthCheckEngine, { type HealthCheckResult } from '../../../engines/health';
import { HealthCheck } from '../../../decorators/health';

@HealthCheck({
  checks: [
    {
      name: 'database',
      check: async () => ({ status: 'pass' }),
      critical: true,
    },
  ],
})
class DecoratedBootClass {
  private readonly app;
  constructor(app: express.Express) {
    this.app = app;
  }
  getApplication() {
    return this.app;
  }
}

describe('HealthCheckEngine', () => {
  test('exposes /health and /health/live endpoints and aggregates check results', async () => {
    const app = express();

    const mockContext: any = {
      getApplication: () => app
    };

    // HealthCheckEngine is constructed by the DI container in production.
    // For tests create an instance and inject a mock context manually.
    const engine = new HealthCheckEngine();
    (engine as any).context = mockContext;

    engine.registerCheck({
      name: 'db',
      check: async (): Promise<HealthCheckResult> => ({ status: 'pass' }),
      critical: true
    });

    engine.registerCheck({
      name: 'cache',
      check: (): HealthCheckResult => ({ status: 'warn', details: { connected: false } })
    });

    await engine.init();

    // liveness probe always returns pass
    await supertest(app)
      .get('/health/live')
      .expect(200)
      .then((res) => {
        expect(res.body).toBeDefined();
        expect(res.body.status).toBe('pass');
      });

    // detailed health should aggregate: pass + warn => warn (200)
    await supertest(app)
      .get('/health')
      .expect(200)
      .then((res) => {
        expect(res.body).toHaveProperty('status', 'warn');
        expect(res.body).toHaveProperty('checks');
        expect(res.body.checks).toHaveProperty('db');
        expect(res.body.checks).toHaveProperty('cache');
        expect(res.body.checks.db.status).toBe('pass');
        expect(res.body.checks.cache.status).toBe('warn');
      });
    // ensure any timers used by executeCheck timeouts are cleared
    await engine.stop();
  });

  test('readiness probe returns 503 when a critical check fails', async () => {
    const app = express();
    const mockContext: any = { getApplication: () => app };

    const engine = new HealthCheckEngine();
    (engine as any).context = mockContext;

    engine.registerCheck({
      name: 'db',
      check: (): HealthCheckResult => {
        throw new Error('connection refused');
      },
      critical: true
    });

    await engine.init();

    await supertest(app)
      .get('/health/ready')
      .expect(503)
      .then((res) => {
        expect(res.body).toHaveProperty('status', 'fail');
        expect(res.body).toHaveProperty('checks');
        expect(res.body.checks.db.status).toBe('fail');
        expect(res.body.checks.db.error).toMatch(/connection refused/);
      });
    await engine.stop();
  });

  test('auto-registers health checks from @HealthCheck decorator', async () => {
    const app = express();

    // Use Object.create so mockContext.constructor === DecoratedBootClass,
    // which allows the engine to read decorator metadata from the class.
    const mockContext = Object.create(DecoratedBootClass.prototype);
    mockContext.getApplication = () => app;

    const engine = new HealthCheckEngine();
    (engine as any).context = mockContext;

    await engine.init();

    // Verify the decorator-defined checks were registered
    await supertest(app)
      .get('/health')
      .expect(200)
      .then((res) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('checks');
        expect(res.body.checks).toHaveProperty('database');
        expect(res.body.checks.database.status).toBe('pass');
      });

    await engine.stop();
  });
});
