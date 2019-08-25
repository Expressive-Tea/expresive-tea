import * as express from 'express';
import Boot from '../../../classes/Boot';
import Metadata from '../../../classes/MetaData';
import Settings from '../../../classes/Settings';
import { Plug, RegisterModule } from '../../../decorators/server';
import { BOOT_STAGES } from '../../../libs/constants';
import Module, { registerMock } from '../../test-clases/module';

const serverMock = {
  listen: jest.fn().mockImplementation((port, cb) => {
    setTimeout(() => cb(), 200);
    return { port };
  })
};
const softPluginMock = jest.fn();
const hardPluginMock = jest.fn();
jest.mock('express', () => jest.fn().mockImplementation(() => serverMock));

describe('Boot Class', () => {
  @Plug(BOOT_STAGES.APPLICATION, 'Soft Plugin', softPluginMock)
  @Plug(BOOT_STAGES.APPLICATION, 'Hard Plugin', hardPluginMock, true)
  class Bootstrap extends Boot {
    @RegisterModule(Module)
    async start() {
      return super.start();
    }
  }

  class DefaultBootstrap extends Boot {}

  test('should start server as default', async () => {
    const boot = new DefaultBootstrap();
    await boot.start();

    expect(express).toHaveBeenCalled();
    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
    expect(serverMock.listen).toHaveBeenCalled();
    expect(registerMock).not.toHaveBeenCalled();
  });

  test('should create instance correctly', () => {
    const boot = new Bootstrap();

    expect(express).toHaveBeenCalled();
    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
  });

  test('should start an application', async () => {
    const boot = new Bootstrap();

    await boot.start();

    expect(express).toHaveBeenCalled();
    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
    expect(serverMock.listen).toHaveBeenCalled();
    expect(registerMock).toHaveBeenCalled();
  });

  test('should not fail if soft plugin fails', async () => {
    softPluginMock.mockImplementationOnce(() => {
      throw new Error('Test');
    });
    const boot = new Bootstrap();

    expect(boot.start()).resolves.toEqual({ application: expect.anything(), server: expect.anything() });
  });

  test('should not fail if soft plugin fails', async () => {
    hardPluginMock.mockImplementationOnce(() => {
      throw new Error('Test');
    });
    const boot = new Bootstrap();

    expect(boot.start()).rejects.toEqual(expect.anything());
  });

});
