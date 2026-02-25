import * as express from 'express';
import Boot from '../../../classes/Boot';
import { ExpressDirective, Static } from '../../../decorators/server';
import container from '../../../inversify.config';
import Settings from '../../../classes/Settings';

// Provide a proper Vitest mock for express that works without jest-express.
// The mock factory must NOT use require('jest-express') because jest-express
// uses jest.fn() internally and jest is not available when mock factories run
// (before vitest.setup.ts sets globalThis.jest = vi).
vi.mock('express', () => {
  const staticFn = vi.fn().mockReturnValue(vi.fn());
  const mockApp = () => ({
    use: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    listen: vi.fn(),
    disable: vi.fn(),
    enable: vi.fn(),
    engine: vi.fn(),
  });
  const express = Object.assign(vi.fn(mockApp), {
    static: staticFn,
    Router: vi.fn(() => ({ get: vi.fn(), post: vi.fn(), use: vi.fn() })),
    json: vi.fn(),
    urlencoded: vi.fn(),
  });
  return { default: express, static: staticFn, Router: express.Router };
});

describe('Boot Class Extends', () => {
  let portCounter = 4000;
  let appInstances: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    appInstances = [];
    Settings.getInstance().set('port', portCounter++);
    Settings.getInstance().set('certificate', undefined);
    Settings.getInstance().set('privateKey', undefined);
  });

  afterEach(async () => {
    for (const app of appInstances) {
      if (app?.server) {
        await new Promise<void>((resolve) => {
          app.server.close(() => resolve());
        });
      }
      if (app?.secureServer) {
        await new Promise<void>((resolve) => {
          app.secureServer.close(() => resolve());
        });
      }
    }
    appInstances = [];
    container.unbindAll();
    Settings.reset();
    // Wait a moment for OS to fully release the ports
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  test('should register a new static', async () => {
    @Static('/public')
    class Bootstrap extends Boot {}

    const instance = new Bootstrap();

    const app = await instance.start();
    appInstances.push(app);

    expect(app.application.use).toHaveBeenCalledWith(undefined);
    expect(express.static).toHaveBeenCalledWith('/public', {});
  });

  test('should register a new static with virtual', async () => {
    @Static('/public', '/virtual')
    class Bootstrap extends Boot {}

    const instance = new Bootstrap();

    const app = await instance.start();
    appInstances.push(app);

    expect(app.application.use).toHaveBeenCalledWith('/virtual', undefined);
    expect(express.static).toHaveBeenCalledWith('/public', {});
  });

  test('should register a new static with virtual and change options', async () => {
    @Static('/public', '/virtual', { etag: false })
    class Bootstrap extends Boot {}

    const instance = new Bootstrap();

    const app = await instance.start();
    appInstances.push(app);

    expect(app.application.use).toHaveBeenCalledWith('/virtual', undefined);
    expect(express.static).toHaveBeenCalledWith('/public', { etag: false });
  });

  test('should set a new directive setting value', async () => {
    @ExpressDirective('etag', true)
    class Bootstrap extends Boot {}

    const instance = new Bootstrap();

    const app = await instance.start();
    appInstances.push(app);

    expect(app.application.set).toHaveBeenCalledWith('etag', true);
  });

  test('should set a new directive setting value and pass multiple arguments', async () => {
    @ExpressDirective('trust proxy', 'loopback', '123.123.123.123')
    class Bootstrap extends Boot {}

    const instance = new Bootstrap();

    const app = await instance.start();
    appInstances.push(app);

    expect(app.application.set).toHaveBeenCalledWith('trust proxy', 'loopback', '123.123.123.123');
  });
});
