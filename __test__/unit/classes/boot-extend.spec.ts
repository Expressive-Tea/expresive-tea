import * as express from 'express';
import * as http from 'http';
import Boot from '../../../classes/Boot';
import { ExpressDirecive, Static } from '../../../decorators/server';

jest.mock('express', () => require('jest-express'));
jest.mock('http');

describe('Boot Class Extends', () => {

  test('should register a new static', async () => {
    @Static('/public')
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    const app = await this.instance.start();

    expect(app.application.use).toHaveBeenCalledWith(undefined);
    expect(express.static).toHaveBeenCalledWith('/public', {});
  });

  test('should register a new static with virtual', async () => {
    @Static('/public', '/virtual')
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    const app = await this.instance.start();

    expect(app.application.use).toHaveBeenCalledWith('/virtual', undefined);
    expect(express.static).toHaveBeenCalledWith('/public', {});
  });

  test('should register a new static with virtual and change options', async () => {
    @Static('/public', '/virtual', { etag: false })
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    const app = await this.instance.start();

    expect(app.application.use).toHaveBeenCalledWith('/virtual', undefined);
    expect(express.static).toHaveBeenCalledWith('/public', { etag: false });
  });

  test('should set a new directive setting value', async () => {
    @ExpressDirecive('etag', true)
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    const app = await this.instance.start();

    expect(app.application.set).toHaveBeenCalledWith('etag', true);
  });

  test('should set a new directive setting value and pass multiple arguments', async () => {
    @ExpressDirecive('trust proxy', 'loopback', '123.123.123.123')
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    const app = await this.instance.start();

    expect(app.application.set).toHaveBeenCalledWith('trust proxy', 'loopback', '123.123.123.123');
  });
});
