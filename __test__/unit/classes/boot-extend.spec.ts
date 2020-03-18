import * as express from 'express';
import Boot from '../../../classes/Boot';
import { ExpressDirecive, Static } from '../../../decorators/server';

const serverMock = {
  listen: jest.fn().mockImplementation((port, cb) => {
    setTimeout(() => cb(), 200);
    return { port };
  }),
  set: jest.fn(),
  use: jest.fn()
};

jest.mock('express');
// @ts-ignore
express.mockImplementation(() => serverMock);

describe('Boot Class Extends', () => {

  beforeEach(() => {
    serverMock.use.mockReset();
    serverMock.set.mockReset();
    // @ts-ignore
    express.static.mockReset();
  });

  test('should register a new static', async () => {
    @Static('/public')
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    await this.instance.start();

    expect(serverMock.use).toHaveBeenCalledWith(undefined);
    expect(express.static).toHaveBeenCalledWith('/public', {});
  });

  test('should register a new static with virtual', async () => {
    @Static('/public', '/virtual')
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    await this.instance.start();

    expect(serverMock.use).toHaveBeenCalledWith('/virtual', undefined);
    expect(express.static).toHaveBeenCalledWith('/public', {});
  });

  test('should register a new static with virtual and change options', async () => {
    @Static('/public', '/virtual', { etag: false })
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    await this.instance.start();

    expect(serverMock.use).toHaveBeenCalledWith('/virtual', undefined);
    expect(express.static).toHaveBeenCalledWith('/public', { etag: false });
  });

  test('should set a new directive setting value', async () => {
    @ExpressDirecive('etag', true)
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    await this.instance.start();

    expect(serverMock.set).toHaveBeenCalledWith('etag', true);
  });

  test('should set a new directive setting value and pass multiple arguments', async () => {
    @ExpressDirecive('trust proxy', 'loopback', '123.123.123.123')
    class Bootstrap extends Boot {
    }

    this.instance = new Bootstrap();

    await this.instance.start();

    expect(serverMock.set).toHaveBeenCalledWith('trust proxy', 'loopback', '123.123.123.123');
  });
});
