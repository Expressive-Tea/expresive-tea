import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { Modules, Plug } from '../../../decorators/server';
import container from '../../../inversify.config';
import { BOOT_STAGES } from '@expressive-tea/commons/constants';
import Module from '../../test-classes/module';

const softPluginMock = jest.fn();
const hardPluginMock = jest.fn();


@Plug(BOOT_STAGES.APPLICATION, 'Soft Plugin', softPluginMock)
@Plug(BOOT_STAGES.BOOT_DEPENDENCIES, 'Hard Plugin', hardPluginMock, true)
@Modules([Module])
class Bootstrap extends Boot {
}

class DefaultBootstrap extends Boot {
}

describe('Boot Class', () => {
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
    expect(app).toEqual({
      application: expect.anything(),
      secureServer: null,
      server: expect.anything()
    });
    await app.server.close();
  });

  test('should create instance correctly', () => {
    const boot = new Bootstrap();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
  });

  test('should start an application', async () => {
    const boot = new Bootstrap();
    const app = await boot.start();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());

    await app.server.close();
  });

  test('should not fail if soft plugin fails', async () => {
    softPluginMock.mockImplementationOnce(() => {
      throw new Error('Test');
    });
    const boot = new Bootstrap();
    const app = await boot.start();
    expect(app).toEqual({
      application: expect.anything(),
      secureServer: null,
      server: expect.anything()
    });

    await app.server.close();
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
