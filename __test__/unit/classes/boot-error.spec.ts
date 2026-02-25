import { BOOT_STAGES } from '@expressive-tea/commons';
import { Plugin } from '@expressive-tea/plugin';
import { Stage } from '@expressive-tea/plugin';
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { Modules, Pour } from '../../../decorators/server';
import Module from '../../test-classes/module';
import container from '../../../inversify.config';

class SoftPlugin extends Plugin {
  protected name: string = 'Plugin Test';
  protected priority: number = 100;
  protected dependencies: string[] = [];

  @Stage(BOOT_STAGES.BOOT_DEPENDENCIES)
  test() {
    throw new Error('test');
  }
}

class HardPlugin extends Plugin {
  protected name: string = 'Plugin Test';
  protected priority: number = 100;
  protected dependencies: string[] = [];

  @Stage(BOOT_STAGES.BOOT_DEPENDENCIES, true)
  test() {
    throw new Error('test');
  }
}

describe('Boot Soft Errors Class', () => {
  let portCounter = 7000;
  let appInstance: any = null;

  @Pour(SoftPlugin)
  @Modules([Module])
  class BootstrapSoftError extends Boot {}

  beforeEach(() => {
    jest.clearAllMocks();
    appInstance = null;
    Settings.getInstance().set('port', portCounter++);
    Settings.getInstance().set('certificate', undefined);
    Settings.getInstance().set('privateKey', undefined);
  });

  afterEach(async () => {
    if (appInstance?.server) {
      await new Promise<void>((resolve) => {
        appInstance.server.close(() => resolve());
      });
    }
    container.unbindAll();
    Settings.reset();
    // Wait a moment for OS to fully release the port
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  test('should start server as default', async () => {
    const boot = new BootstrapSoftError();
    appInstance = await boot.start();

    // Shallow assertions to avoid deep-inspection of express app internals
    expect(appInstance).toBeDefined();
    expect(appInstance).toHaveProperty('application');
    expect(appInstance).toHaveProperty('server');
    // secureServer may be null/undefined when no TLS configured
    expect(appInstance.secureServer == null).toBeTruthy();
  });
});

describe('Boot Hard Errors Class', () => {
  let portCounter = 7100;
  let appInstance: any = null;

  @Pour(HardPlugin)
  @Modules([Module])
  class BootstrapHardError extends Boot {}

  beforeEach(() => {
    jest.clearAllMocks();
    appInstance = null;
    Settings.getInstance().set('port', portCounter++);
    Settings.getInstance().set('certificate', undefined);
    Settings.getInstance().set('privateKey', undefined);
  });

  afterEach(async () => {
    if (appInstance?.server) {
      await new Promise<void>((resolve) => {
        appInstance.server.close(() => resolve());
      });
    }
    container.unbindAll();
    Settings.reset();
  });

  test('should fail server as plugin is required', async () => {
    const boot = new BootstrapHardError();
    void expect(boot.start()).rejects.toEqual(new Error('Failed [HardPlugin:test]: test'));
  });
});
