/**
 * Error Handling Integration Tests
 *
 * Tests error propagation through the controller layer:
 * - Unhandled exceptions → 500
 * - RequestException subclasses → correct HTTP status codes
 * - next() forwarding errors to Express error handler
 * - Error response format
 *
 * @since 2.0.0
 */
import supertest from 'supertest';
import Boot from '../../classes/Boot';
import Settings from '../../classes/Settings';
import { ServerSettings, Modules } from '../../decorators/server';
import { Module } from '../../decorators/module';
import { Route, Get, Post } from '../../decorators/router';
import { next as nextParam } from '../../decorators/annotations';
import {
  GenericRequestException,
  BadRequestException,
  UnauthorizedException
} from '../../exceptions/RequestExceptions';
import container from '../../inversify.config';

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

@Route('/errors')
class ErrorController {
  @Get('/throw-generic')
  throwGeneric(): string {
    throw new Error('something broke');
  }

  @Get('/throw-bad-request')
  throwBadRequest(): string {
    throw new BadRequestException('bad input');
  }

  @Get('/throw-unauthorized')
  throwUnauthorized(): string {
    throw new UnauthorizedException('not authenticated');
  }

  @Get('/throw-forbidden')
  throwForbidden(): string {
    throw new GenericRequestException('access denied', 403);
  }

  @Get('/throw-not-found')
  throwNotFound(): string {
    throw new GenericRequestException('resource not found', 404);
  }

  @Get('/next-error')
  nextError(@nextParam nextFn: Function): string {
    nextFn(new Error('forwarded error'));
    return 'ok';
  }

  @Get('/next-bad-request')
  nextBadRequest(@nextParam nextFn: Function): string {
    nextFn(new BadRequestException('forwarded bad request'));
    return 'ok';
  }

  @Get('/success')
  success(): string {
    return 'all good';
  }

  @Post('/throw-on-post')
  throwOnPost(): string {
    throw new Error('post error');
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  controllers: [ErrorController],
  mountpoint: '/'
})
class ErrorModule {}

// ---------------------------------------------------------------------------
// Port management
// ---------------------------------------------------------------------------

let portCounter = 7200;

// ---------------------------------------------------------------------------
// Shared boot
// ---------------------------------------------------------------------------

let sharedApp: Awaited<ReturnType<Boot['start']>>;
let sharedBoot: Boot;
let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  const port = portCounter++;

  @ServerSettings({ port })
  @Modules([ErrorModule])
  class ErrorBoot extends Boot {}

  sharedBoot = new ErrorBoot();
  sharedApp = await sharedBoot.start();
  request = supertest(sharedApp.application);
});

afterAll(async () => {
  await sharedBoot.stop();
  container.unbindAll();
  Settings.reset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Error Handling Integration', () => {
  describe('Unhandled exceptions', () => {
    test('should respond 500 when controller throws a generic Error', async () => {
      const res = await request.get('/errors/throw-generic');
      expect(res.status).toBe(500);
    });

    test('should include error text in 500 response body', async () => {
      const res = await request.get('/errors/throw-generic');
      expect(res.text).toContain('something broke');
    });

    test('should respond 500 for POST that throws', async () => {
      const res = await request.post('/errors/throw-on-post');
      expect(res.status).toBe(500);
    });
  });

  describe('RequestException subclasses', () => {
    test('should respond 400 for BadRequestException', async () => {
      const res = await request.get('/errors/throw-bad-request');
      expect(res.status).toBe(400);
    });

    test('should include BadRequestException message in response', async () => {
      const res = await request.get('/errors/throw-bad-request');
      expect(res.text).toContain('bad input');
    });

    test('should respond 401 for UnauthorizedException', async () => {
      const res = await request.get('/errors/throw-unauthorized');
      expect(res.status).toBe(401);
    });

    test('should respond 403 for ForbiddenException', async () => {
      const res = await request.get('/errors/throw-forbidden');
      expect(res.status).toBe(403);
    });

    test('should respond 404 for NotFoundException', async () => {
      const res = await request.get('/errors/throw-not-found');
      expect(res.status).toBe(404);
    });
  });

  describe('Error forwarding via next()', () => {
    test('should forward generic Error to Express error handler', async () => {
      const res = await request.get('/errors/next-error');
      expect(res.status).toBe(500);
      expect(res.text).toContain('forwarded error');
    });

    test('should forward BadRequestException via next() as 400', async () => {
      const res = await request.get('/errors/next-bad-request');
      expect(res.status).toBe(400);
    });
  });

  describe('Success baseline', () => {
    test('should respond 200 for successful routes between error routes', async () => {
      const res = await request.get('/errors/success');
      expect(res.status).toBe(200);
    });
  });

  describe('Unknown routes', () => {
    test('should respond 404 for unregistered paths', async () => {
      const res = await request.get('/errors/does-not-exist-at-all');
      expect(res.status).toBe(404);
    });
  });
});
