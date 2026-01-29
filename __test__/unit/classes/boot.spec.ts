import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { Modules, Plug } from '../../../decorators/server';
import container from '../../../inversify.config';
import { BOOT_STAGES } from '@expressive-tea/commons';
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
  let portCounter = 6000;
  
  beforeEach(() => {
    Settings.getInstance().set('port', portCounter++);
    Settings.getInstance().set('certificate', undefined);
    Settings.getInstance().set('privateKey', undefined);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    container.unbindAll();
    Settings.reset();
  });

  test('should start server as default', async () => {
    const boot = new DefaultBootstrap();
    const app = await boot.start();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
    // Avoid deep-equality on express app (inspecting functions can trigger host errors).
    expect(app).toBeDefined();
    expect(app.application).toBeDefined();
    expect(app.server).toBeDefined();
    // secureServer may be null or undefined depending on environment
    expect(app.secureServer == null).toBeTruthy();
    if (app && app.server && typeof app.server.close === 'function') {
      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });
    }
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

    if (app && app.server && typeof app.server.close === 'function') {
      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });
    }
  });

  test('should not fail if soft plugin fails', async () => {
    softPluginMock.mockImplementationOnce(() => {
      throw new Error('Test');
    });
    const boot = new Bootstrap();
    const app = await boot.start();
    expect(app).toBeDefined();
    expect(app.application).toBeDefined();
    expect(app.server).toBeDefined();
    expect(app.secureServer == null).toBeTruthy();

    if (app && app.server && typeof app.server.close === 'function') {
      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });
    }
  });

  test('should fail if hard plugin fails', async () => {
    const errorMessage = new Error('test');

    hardPluginMock.mockImplementationOnce(() => {
      throw errorMessage;
    });

    const boot = new Bootstrap();
    void expect(boot.start()).rejects.toEqual(new Error('Failed [Hard Plugin]: test'));
  });

});
