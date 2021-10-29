import * as express from 'express';
import * as http from 'http';
import Boot from '../../../classes/Boot';
import { ExpressDirective, Static } from '../../../decorators/server';
import container from '../../../inversify.config';
import Settings from '../../../classes/Settings';

jest.mock('express', () => require('jest-express'));
jest.mock('http');

describe('Boot Class Extends', () => {

  beforeEach(() => {
    Settings.getInstance().set('certificate', undefined);
    Settings.getInstance().set('privateKey', undefined);
    jest.clearAllMocks();
  });

  afterEach(() => {
    container.unbindAll();
  });

  test('should register a new static', async () => {
    @Static('/public')
    class Bootstrap extends Boot {
    }

    const instance = new Bootstrap();

    const app = await instance.start();

    expect(app.application.use).toHaveBeenCalledWith(undefined);
    expect(express.static).toHaveBeenCalledWith('/public', {});
  });

  test('should register a new static with virtual', async () => {
    @Static('/public', '/virtual')
    class Bootstrap extends Boot {
    }

    const instance = new Bootstrap();

    const app = await instance.start();

    expect(app.application.use).toHaveBeenCalledWith('/virtual', undefined);
    expect(express.static).toHaveBeenCalledWith('/public', {});
  });

  test('should register a new static with virtual and change options', async () => {
    @Static('/public', '/virtual', { etag: false })
    class Bootstrap extends Boot {
    }

    const instance = new Bootstrap();

    const app = await instance.start();

    expect(app.application.use).toHaveBeenCalledWith('/virtual', undefined);
    expect(express.static).toHaveBeenCalledWith('/public', { etag: false });
  });

  test('should set a new directive setting value', async () => {
    @ExpressDirective('etag', true)
    class Bootstrap extends Boot {
    }

    const instance = new Bootstrap();

    const app = await instance.start();

    expect(app.application.set).toHaveBeenCalledWith('etag', true);
  });

  test('should set a new directive setting value and pass multiple arguments', async () => {
    @ExpressDirective('trust proxy', 'loopback', '123.123.123.123')
    class Bootstrap extends Boot {
    }

    const instance = new Bootstrap();

    const app = await instance.start();

    expect(app.application.set).toHaveBeenCalledWith('trust proxy', 'loopback', '123.123.123.123');
  });
});
