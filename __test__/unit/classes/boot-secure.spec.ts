import * as express from 'express';
import * as http from 'http';
import * as https from 'https';
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import Module, { registerMock } from '../../test-classes/module';
import container from '../../../inversify.config';
import { RegisterModule } from '../../../decorators/server';

jest.mock('express', () => require('jest-express'));
jest.mock('http');
jest.mock('https');
jest.mock('fs');

describe('Boot Class Secure Server', () => {
  class Bootstrap extends Boot {
    @RegisterModule(Module)
    async start() {
      return super.start();
    }
  }

  class DefaultBootstrap extends Boot {
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    container.unbindAll();
  });

  test('should create instance correctly', () => {
    const boot = new Bootstrap();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
  });

  test('should start server as default', async () => {
    const boot = new DefaultBootstrap();
    Settings.getInstance(boot).set('certificate', 'certificate.pem');
    Settings.getInstance(boot).set('privateKey', 'privatekey.pem');
    const app = await boot.start();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).toHaveBeenCalled();
    expect(app.server.listen).toHaveBeenCalled();
    expect(app.secureServer!.listen).toHaveBeenCalled();
    expect(registerMock).not.toHaveBeenCalled();
  });

  test('should start an application', async () => {
    const boot = new Bootstrap();
    Settings.getInstance(boot).set('certificate', 'certificate.pem');
    Settings.getInstance(boot).set('privateKey', 'privatekey.pem');
    const app = await boot.start();

    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).toHaveBeenLastCalledWith(
      { cert: 'certificate.pem', key: 'privatekey.pem' },
      expect.anything()
    );
    expect(app.server.listen).toHaveBeenCalled();
    expect(app.secureServer!.listen).toHaveBeenCalled();
    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
    expect(registerMock).toHaveBeenCalled();
  });

});
