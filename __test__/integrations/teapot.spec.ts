import { type ExpressiveTeaApplication } from '@expressive-tea/commons';
import initTeapot from './helpers/teapot-init';
import container from '../../inversify.config';
import { createHttpTerminator } from 'http-terminator';
import { delay } from '../../helpers/promise-helper';

describe('Teapot/Teacup integration', () => {
  let appTeapot: ExpressiveTeaApplication;
  let appTeacup: ExpressiveTeaApplication;
  let extraTeacups: ExpressiveTeaApplication[];
  let teapotInstance;
  let teacupInstances;

  let request;

  beforeAll(async () => {
    const testInit = await initTeapot();
    appTeapot = testInit.appTeapot;
    appTeacup = testInit.appTeacup;
    extraTeacups = testInit.extraTeacups;
    teapotInstance = testInit.teapotInstance;
    teacupInstances = testInit.teacupInstances;

    request = testInit.request;
  });

  afterAll(async () => {
    // Step 1: Stop all Boot instances to trigger engine cleanup (Socket.IO disconnect)
    // This must happen BEFORE server.close() to allow graceful Socket.IO shutdown

    // Stop all Teacup instances first (they are clients)
    if (teacupInstances) {
      for (const teacupInstance of teacupInstances) {
        try {
          await teacupInstance.stop();
        } catch (e) {
          console.error('Error stopping teacup instance:', e);
        }
      }
    }

    // Small delay to allow Socket.IO disconnections to propagate
    await delay(500);

    // Stop Teapot instance (the server)
    if (teapotInstance) {
      try {
        await teapotInstance.stop();
      } catch (e) {
        console.error('Error stopping teapot instance:', e);
      }
    }

    // Step 2: Gracefully close HTTP servers with timeout
    const closeServerWithTimeout = async (server, name: string, timeoutMs = 5000) => {
      if (!server) return;

      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn(`${name} graceful close timeout - forcing termination`);
          const terminator = createHttpTerminator({ server });
          terminator
            .terminate()
            .then(() => resolve())
            .catch(() => resolve());
        }, timeoutMs);

        server.close(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    };

    // Close Teapot server
    if (appTeapot?.server) {
      await closeServerWithTimeout(appTeapot.server, 'Teapot server');
    }

    // Close Teacup server
    if (appTeacup?.server) {
      await closeServerWithTimeout(appTeacup.server, 'Teacup server');
    }

    // Close extra Teacup servers
    if (extraTeacups) {
      for (let i = 0; i < extraTeacups.length; i++) {
        const teacup = extraTeacups[i];
        if (teacup?.server) {
          await closeServerWithTimeout(teacup.server, `Extra teacup ${i + 1} server`);
        }
      }
    }

    // Step 3: Unbind DI container
    container.unbindAll();
  });

  test('should initialize Teapot Service', async () => {
    const res = await request.get('/test').expect('Content-Type', /html/).expect(200);

    expect(res.text).toEqual('this is a test');
  });

  test('should get first teacup microservice group', async () => {
    const res = await request.get('/teacup-1/test').expect('Content-Type', /html/).expect(200);

    expect(res.text).toEqual('this is a teacup1');
  });

  test('should get second teacup microservice group', async () => {
    const res = await request.get('/teacup-2/test').expect('Content-Type', /html/).expect(200);

    expect(res.text).toEqual('this is a teacup2');
  });

  test('should get teacup post response from first microservice group', async () => {
    const res = await request.post('/teacup-1/test').expect('Content-Type', /html/).expect(200);

    expect(res.text).toEqual('<h1> Body Test pass teacup1</h1>');
  });

  test('should get teacup post response from first microservice group', async () => {
    const res = await request.post('/teacup-2/test').expect('Content-Type', /html/).expect(200);

    expect(res.text).toEqual('<h1> Body Test pass teacup2</h1>');
  });

  test('should get 404 when call a unverified teacup', async () => {
    await request.post('/teacup-3/test').expect('Content-Type', /html/).expect(404);
  });

  test('should remove a teacup from teapot gateway', async () => {
    const serverTerminator = createHttpTerminator({ server: extraTeacups[0].server });
    await serverTerminator.terminate();
    await delay(1500);
    await request.get('/teacup-2/test').expect('Content-Type', /html/).expect(404);
  });
});
