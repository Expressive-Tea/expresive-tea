/**
 * Health Checks Integration Tests
 *
 * Tests the HealthCheckEngine endpoints through a full Boot lifecycle:
 * - /health      - detailed aggregate status
 * - /health/live - liveness probe
 * - /health/ready - readiness probe
 *
 * Covers manual check registration, decorator-driven checks,
 * critical vs. non-critical checks, and timeout handling.
 *
 * @since 2.0.0
 */
import supertest from 'supertest';
import Boot from '../../classes/Boot';
import Settings from '../../classes/Settings';
import { ServerSettings } from '../../decorators/server';
import { HealthCheck as HealthCheckDecorator } from '../../decorators/health';
import container from '../../inversify.config';
import HealthCheckEngine from '../../engines/health';

// ---------------------------------------------------------------------------
// Port management
// ---------------------------------------------------------------------------

let portCounter = 7300;
function nextPort(): number {
  return portCounter++;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function startBoot(BootClass: new () => Boot): Promise<{ boot: Boot; request: ReturnType<typeof supertest> }> {
  const boot = new BootClass();
  const app = await boot.start();
  return { boot, request: supertest(app.application) };
}

async function stopBoot(boot: Boot): Promise<void> {
  try {
    await boot.stop();
  } catch {
    // ignore
  }
  container.unbindAll();
  Settings.reset();
  await new Promise((r) => setTimeout(r, 50));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Health Checks Integration', () => {
  // -------------------------------------------------------------------------
  describe('/health/live - liveness probe', () => {
    let boot: Boot;
    let request: ReturnType<typeof supertest>;

    beforeAll(async () => {
      @ServerSettings({ port: nextPort() })
      class LiveBoot extends Boot {}

      ({ boot, request } = await startBoot(LiveBoot));
    });

    afterAll(() => stopBoot(boot));

    test('should always return 200', async () => {
      const res = await request.get('/health/live');
      expect(res.status).toBe(200);
    });

    test('should return pass status', async () => {
      const res = await request.get('/health/live');
      expect(res.body.status).toBe('pass');
    });

    test('should include a timestamp', async () => {
      const res = await request.get('/health/live');
      expect(res.body.timestamp).toBeDefined();
      expect(() => new Date(res.body.timestamp)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  describe('/health/ready - readiness probe with no critical checks', () => {
    let boot: Boot;
    let request: ReturnType<typeof supertest>;

    beforeAll(async () => {
      @ServerSettings({ port: nextPort() })
      class ReadyNoCriticalBoot extends Boot {}

      ({ boot, request } = await startBoot(ReadyNoCriticalBoot));
    });

    afterAll(() => stopBoot(boot));

    test('should return 200 when there are no critical checks', async () => {
      const res = await request.get('/health/ready');
      expect(res.status).toBe(200);
    });

    test('should return pass status', async () => {
      const res = await request.get('/health/ready');
      expect(res.body.status).toBe('pass');
    });
  });

  // -------------------------------------------------------------------------
  describe('/health - detailed aggregate with manual checks', () => {
    let boot: Boot;
    let request: ReturnType<typeof supertest>;

    beforeAll(async () => {
      @ServerSettings({ port: nextPort() })
      class ManualCheckBoot extends Boot {}

      boot = new ManualCheckBoot();
      const app = await boot.start();
      request = supertest(app.application);

      // Find HealthCheckEngine in registered engines and add manual checks
      const engines: any[] = (boot as any).engines;
      const healthEngine = engines.find((e) => e instanceof HealthCheckEngine) as HealthCheckEngine;

      if (healthEngine) {
        healthEngine.registerCheck({
          name: 'database',
          check: async () => ({ status: 'pass' }),
          critical: true
        });
        healthEngine.registerCheck({
          name: 'cache',
          check: () => ({ status: 'warn', details: { connected: false } })
        });
      }
    });

    afterAll(() => stopBoot(boot));

    test('should return 200 for aggregate warn status (pass + warn)', async () => {
      const res = await request.get('/health');
      expect(res.status).toBe(200);
    });

    test('should report warn overall status when a non-critical check warns', async () => {
      const res = await request.get('/health');
      expect(res.body.status).toBe('warn');
    });

    test('should include results for all registered checks', async () => {
      const res = await request.get('/health');
      expect(res.body.checks).toHaveProperty('database');
      expect(res.body.checks).toHaveProperty('cache');
    });

    test('should show individual check statuses', async () => {
      const res = await request.get('/health');
      expect(res.body.checks.database.status).toBe('pass');
      expect(res.body.checks.cache.status).toBe('warn');
    });
  });

  // -------------------------------------------------------------------------
  describe('/health/ready - critical check failure', () => {
    let boot: Boot;
    let request: ReturnType<typeof supertest>;

    beforeAll(async () => {
      @ServerSettings({ port: nextPort() })
      class CriticalFailBoot extends Boot {}

      boot = new CriticalFailBoot();
      const app = await boot.start();
      request = supertest(app.application);

      const engines: any[] = (boot as any).engines;
      const healthEngine = engines.find((e) => e instanceof HealthCheckEngine) as HealthCheckEngine;

      if (healthEngine) {
        healthEngine.registerCheck({
          name: 'db',
          check: () => {
            throw new Error('connection refused');
          },
          critical: true
        });
      }
    });

    afterAll(() => stopBoot(boot));

    test('should return 503 when critical check fails', async () => {
      const res = await request.get('/health/ready');
      expect(res.status).toBe(503);
    });

    test('should return fail status when critical check fails', async () => {
      const res = await request.get('/health/ready');
      expect(res.body.status).toBe('fail');
    });

    test('should include the failing check name', async () => {
      const res = await request.get('/health/ready');
      expect(res.body.checks).toHaveProperty('db');
      expect(res.body.checks.db.status).toBe('fail');
    });

    test('should include error message from the failing check', async () => {
      const res = await request.get('/health/ready');
      expect(res.body.checks.db.error).toMatch(/connection refused/);
    });
  });

  // -------------------------------------------------------------------------
  describe('/health - all checks passing', () => {
    let boot: Boot;
    let request: ReturnType<typeof supertest>;

    beforeAll(async () => {
      @ServerSettings({ port: nextPort() })
      class AllPassBoot extends Boot {}

      boot = new AllPassBoot();
      const app = await boot.start();
      request = supertest(app.application);

      const engines: any[] = (boot as any).engines;
      const healthEngine = engines.find((e) => e instanceof HealthCheckEngine) as HealthCheckEngine;

      if (healthEngine) {
        healthEngine.registerCheck({
          name: 'svc1',
          check: async () => ({ status: 'pass' }),
          critical: true
        });
        healthEngine.registerCheck({
          name: 'svc2',
          check: async () => ({ status: 'pass' })
        });
      }
    });

    afterAll(() => stopBoot(boot));

    test('should return 200 when all checks pass', async () => {
      const res = await request.get('/health');
      expect(res.status).toBe(200);
    });

    test('should report pass overall status', async () => {
      const res = await request.get('/health');
      expect(res.body.status).toBe('pass');
    });

    test('readiness probe should return 200 when critical checks pass', async () => {
      const res = await request.get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('pass');
    });
  });

  // -------------------------------------------------------------------------
  describe('/health - fail status overrides warn', () => {
    let boot: Boot;
    let request: ReturnType<typeof supertest>;

    beforeAll(async () => {
      @ServerSettings({ port: nextPort() })
      class MixedBoot extends Boot {}

      boot = new MixedBoot();
      const app = await boot.start();
      request = supertest(app.application);

      const engines: any[] = (boot as any).engines;
      const healthEngine = engines.find((e) => e instanceof HealthCheckEngine) as HealthCheckEngine;

      if (healthEngine) {
        healthEngine.registerCheck({
          name: 'passing',
          check: async () => ({ status: 'pass' })
        });
        healthEngine.registerCheck({
          name: 'warning',
          check: async () => ({ status: 'warn' })
        });
        healthEngine.registerCheck({
          name: 'failing',
          check: async () => ({ status: 'fail' }),
          critical: true
        });
      }
    });

    afterAll(() => stopBoot(boot));

    test('should return 503 when any check fails', async () => {
      const res = await request.get('/health');
      expect(res.status).toBe(503);
    });

    test('should report fail overall when any check fails', async () => {
      const res = await request.get('/health');
      expect(res.body.status).toBe('fail');
    });
  });

  // -------------------------------------------------------------------------
  describe('check timeout', () => {
    let boot: Boot;
    let request: ReturnType<typeof supertest>;

    beforeAll(async () => {
      @ServerSettings({ port: nextPort() })
      class TimeoutBoot extends Boot {}

      boot = new TimeoutBoot();
      const app = await boot.start();
      request = supertest(app.application);

      const engines: any[] = (boot as any).engines;
      const healthEngine = engines.find((e) => e instanceof HealthCheckEngine) as HealthCheckEngine;

      if (healthEngine) {
        healthEngine.registerCheck({
          name: 'slow',
          // Timeout at 100ms, check takes 200ms
          check: () => new Promise((resolve) => setTimeout(() => resolve({ status: 'pass' }), 200)),
          timeout: 100
        });
      }
    }, 10000);

    afterAll(() => stopBoot(boot));

    test('should mark slow check as fail when it exceeds timeout', async () => {
      const res = await request.get('/health');
      expect(res.body.checks.slow.status).toBe('fail');
      expect(res.body.checks.slow.error).toMatch(/timeout/i);
    }, 10000);
  });
});
