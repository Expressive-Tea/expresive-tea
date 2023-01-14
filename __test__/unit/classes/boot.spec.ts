import * as express from 'express';
import * as http from 'http';
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { Plug, RegisterModule } from '../../../decorators/server';
import Module, { registerMock } from '../../test-classes/module';
import container from '../../../inversify.config';
import { BOOT_STAGES } from '@expressive-tea/commons/constants';

const softPluginMock = jest.fn();
const hardPluginMock = jest.fn();

jest.mock('express', () => require('jest-express'));
jest.mock('http');

describe('Boot Class', () => {
  @Plug(BOOT_STAGES.APPLICATION, 'Soft Plugin', softPluginMock)
  @Plug(BOOT_STAGES.BOOT_DEPENDENCIES, 'Hard Plugin', hardPluginMock, true)
  class Bootstrap extends Boot {
    @RegisterModule(Module)
    async start() {
      return super.start();
    }
  }

  class DefaultBootstrap extends Boot {
  }

  beforeEach(() => {
    Settings.getInstance().set('certificate', undefined);
    Settings.getInstance().set('privateKey', undefined);
    jest.clearAllMocks();
  });

  afterEach(() => {
    container.unbindAll();
  });

  test('should start server as default', async () => {
    const boot = new DefaultBootstrap();
    const app = await boot.start();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
    expect(http.createServer).toHaveBeenCalled();
    expect(app.server.listen).toHaveBeenCalled();
    expect(registerMock).not.toHaveBeenCalled();
  });

  test('should create instance correctly', () => {
    const boot = new Bootstrap();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
  });

  test('should start an application', async () => {
    const boot = new Bootstrap();

    const app = await boot.start();

    expect(http.createServer).toHaveBeenCalled();
    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
    expect(app.server.listen).toHaveBeenCalled();
    expect(registerMock).toHaveBeenCalled();
  });

  test('should not fail if soft plugin fails', () => {
    softPluginMock.mockImplementationOnce(() => {
      throw new Error('Test');
    });
    const boot = new Bootstrap();

    expect(boot.start()).resolves.toEqual({
      application: expect.anything(),
      secureServer: null,
      server: expect.anything()
    });
  });

  test('should fail if hard plugin fails', async () => {
    const errorMessage = new Error('test');
    hardPluginMock.mockImplementationOnce(() => {
      throw errorMessage;
    });
    const boot = new Bootstrap();
    expect(boot.start()).rejects.toEqual(new Error('Failed [Hard Plugin]: test'));
  });

});
