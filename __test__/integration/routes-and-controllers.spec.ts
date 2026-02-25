/**
 * Routes and Controllers Integration Tests
 *
 * Tests full request/response flow with real Express controllers using supertest.
 * Covers GET, POST, PUT, DELETE methods, URL params, query strings, request body,
 * middleware chaining, and response types.
 *
 * @since 2.0.0
 */
import supertest from 'supertest';
import Boot from '../../classes/Boot';
import Settings from '../../classes/Settings';
import { ServerSettings, Modules } from '../../decorators/server';
import { Module } from '../../decorators/module';
import { Route, Get, Post, Put, Delete, Middleware } from '../../decorators/router';
import { body, param, query, request as requestAnnotation, response as responseAnnotation } from '../../decorators/annotations';
import { Request, Response } from 'express';
import container from '../../inversify.config';

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

@Route('/items')
class ItemController {
  @Get('/')
  list(): object {
    return [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }];
  }

  @Get('/:id')
  getOne(@param('id') id: string): object {
    return { id, name: `Item-${id}` };
  }

  @Post('/')
  @Middleware((_req, _res, next) => {
    next();
  })
  create(@body() payload: unknown): object {
    return { created: true, payload };
  }

  @Put('/:id')
  @Middleware((_req, _res, next) => {
    next();
  })
  update(@param('id') id: string, @body() payload: unknown): object {
    return { updated: true, id, payload };
  }

  @Delete('/:id')
  remove(@param('id') id: string): object {
    return { deleted: true, id };
  }
}

@Route('/reflect')
class ReflectController {
  @Get('/req-res')
  reflectReqRes(@requestAnnotation req: Request, @responseAnnotation res: Response): unknown {
    return { hasReq: Boolean(req), hasRes: Boolean(res) };
  }

  @Get('/query')
  reflectQuery(@query('foo') foo: string, @query('bar') bar: string): object {
    return { foo, bar };
  }

  @Get('/param/:userId')
  reflectParam(@param('userId') userId: string): object {
    return { userId };
  }
}

@Route('/chain')
class MiddlewareChainController {
  @Get('/before')
  @Middleware((_req, _res, next) => {
    (_req as any).middlewareRan = true;
    next();
  })
  withMiddleware(@requestAnnotation req: Request): object {
    return { middlewareRan: (req as any).middlewareRan === true };
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  controllers: [ItemController, ReflectController, MiddlewareChainController],
  mountpoint: '/api'
})
class TestModule {}

// ---------------------------------------------------------------------------
// Port management
// ---------------------------------------------------------------------------

let portCounter = 7100;

// ---------------------------------------------------------------------------
// Shared boot
// ---------------------------------------------------------------------------

let sharedApp: Awaited<ReturnType<Boot['start']>>;
let sharedBoot: Boot;
let api: ReturnType<typeof supertest>;

beforeAll(async () => {
  const port = portCounter++;

  @ServerSettings({ port })
  @Modules([TestModule])
  class SharedBoot extends Boot {}

  sharedBoot = new SharedBoot();
  sharedApp = await sharedBoot.start();
  api = supertest(sharedApp.application);
});

afterAll(async () => {
  await sharedBoot.stop();
  container.unbindAll();
  Settings.reset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Routes and Controllers Integration', () => {
  describe('GET requests', () => {
    test('should handle basic GET returning JSON array', async () => {
      const res = await api.get('/api/items/');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    test('should resolve URL param from GET path', async () => {
      const res = await api.get('/api/items/42');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', '42');
    });

    test('should resolve query string from GET request', async () => {
      const res = await api.get('/api/reflect/query?foo=hello&bar=world');
      expect(res.status).toBe(200);
      expect(res.body.foo).toBe('hello');
      expect(res.body.bar).toBe('world');
    });

    test('should expose Request and Response objects via decorators', async () => {
      const res = await api.get('/api/reflect/req-res');
      expect(res.status).toBe(200);
      expect(res.body.hasReq).toBe(true);
      expect(res.body.hasRes).toBe(true);
    });

    test('should resolve @param decorator from URL segment', async () => {
      const res = await api.get('/api/reflect/param/user-abc');
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe('user-abc');
    });
  });

  describe('POST requests', () => {
    test('should accept POST and return created response', async () => {
      const res = await api
        .post('/api/items/')
        .send({ name: 'New Item' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.created).toBe(true);
    });
  });

  describe('PUT requests', () => {
    test('should accept PUT with id param and body', async () => {
      const res = await api
        .put('/api/items/99')
        .send({ name: 'Updated' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(true);
      expect(res.body.id).toBe('99');
    });
  });

  describe('DELETE requests', () => {
    test('should accept DELETE with id param', async () => {
      const res = await api.delete('/api/items/55');
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
      expect(res.body.id).toBe('55');
    });
  });

  describe('Middleware', () => {
    test('should execute middleware before controller handler', async () => {
      const res = await api.get('/api/chain/before');
      expect(res.status).toBe(200);
      expect(res.body.middlewareRan).toBe(true);
    });
  });

  describe('404 routes', () => {
    test('should return 404 for unregistered routes', async () => {
      const res = await api.get('/api/nonexistent-route-xyz');
      expect(res.status).toBe(404);
    });
  });

  describe('Response types', () => {
    test('should return JSON for object responses', async () => {
      const res = await api.get('/api/items/1');
      expect(res.headers['content-type']).toMatch(/json/);
    });

    test('should return JSON array for list responses', async () => {
      const res = await api.get('/api/items/');
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });
});
