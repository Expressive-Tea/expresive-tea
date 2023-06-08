import { BOOT_STAGES } from '@expressive-tea/commons/constants';
import { Plugin } from '@expressive-tea/plugin';
import { Stage } from '@expressive-tea/plugin/decorators';
import * as express from 'express';
import * as http from 'http';
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import { Pour, RegisterModule } from '../../../decorators/server';
import Module, { registerMock } from '../../test-classes/module';
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
  class BootstrapSoftError extends Boot {
    @RegisterModule(Module)
    async start() {
      return super.start();
    }
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
    const boot = new BootstrapSoftError();
    const app = await boot.start();
    expect(app).toEqual({
      application: expect.anything(),
      secureServer: null,
      server: expect.anything()
    });
    await app.server.close();
  });

});

describe('Boot Hard Errors Class', () => {
  @Pour(HardPlugin)
  class BootstrapHardError extends Boot {
    @RegisterModule(Module)
    async start() {
      return super.start();
    }
  }

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
    expect(boot.start()).rejects.toEqual(new Error('Failed [HardPlugin:test]: test'));
  });

});
