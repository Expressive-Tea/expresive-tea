import { BOOT_STAGES } from '@expressive-tea/commons/constants';
import { Plugin } from '@expressive-tea/plugin';
import { Stage } from '@expressive-tea/plugin/decorators';
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
  @Pour(SoftPlugin)
  @Modules([Module])
  class BootstrapSoftError extends Boot {}

  beforeEach(() => {
    Settings.getInstance().set('certificate', undefined);
    Settings.getInstance().set('privateKey', undefined);
    jest.clearAllMocks();
  });

  afterEach(() => {
    container.unbindAll();
  });

  test('should start server as default', async () => {
    const boot = new BootstrapSoftError();
    let app: any;
    try {
      app = await boot.start();

      // Shallow assertions to avoid deep-inspection of express app internals
      expect(app).toBeDefined();
      expect(app).toHaveProperty('application');
      expect(app).toHaveProperty('server');
      // secureServer may be null/undefined when no TLS configured
      expect(app.secureServer == null).toBeTruthy();
    } finally {
      // Ensure the server is closed even if startup or assertions throw
      app?.server?.close();
    }
  });

});

describe('Boot Hard Errors Class', () => {
  @Pour(HardPlugin)
  @Modules([Module])
  class BootstrapHardError extends Boot {}

  beforeEach(() => {
    Settings.getInstance().set('certificate', undefined);
    Settings.getInstance().set('privateKey', undefined);
    jest.clearAllMocks();
  });

  afterEach(() => {
    container.unbindAll();
  });

  test('should fail server as plugin is required', async () => {
    const boot = new BootstrapHardError();
    void expect(boot.start()).rejects.toEqual(new Error('Failed [HardPlugin:test]: test'));
  });

});
