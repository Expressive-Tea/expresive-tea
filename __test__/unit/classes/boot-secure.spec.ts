import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import Module, { registerMock } from '../../test-classes/module';
import container from '../../../inversify.config';
import { RegisterModule } from '../../../decorators/server';


const originalCreateServer = http.createServer;
const originalCreateSecureServer = https.createServer;
const originalFsReadFileSync = fs.readFileSync;
const cert = originalFsReadFileSync(path.resolve(__dirname, '../../certs/cert.pem'));
const key = originalFsReadFileSync(path.resolve(__dirname, '../../certs/key.pem'));
jest.mock('express', () => require('jest-express'));

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    jest.spyOn(http, 'createServer').mockImplementation((...args: any[]) => originalCreateServer(...args));
    jest.spyOn(https, 'createServer').mockImplementation((...args: any[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return originalCreateSecureServer(...args);
    });
    jest.spyOn(fs, 'readFileSync').mockImplementation((fileName: string) => fileName === 'certificate.pem' ? cert : key);
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
    expect(app.server).toBeDefined();
    expect(app.secureServer).toBeDefined();
    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).toHaveBeenLastCalledWith(
      { cert: cert.toString('utf-8'), key: key.toString('utf-8') }
    );

    app.server.close();
    app.secureServer.close();
  });

  test('should start an application', async () => {
    const boot = new Bootstrap();
    Settings.getInstance(boot).set('certificate', 'certificate.pem');
    Settings.getInstance(boot).set('privateKey', 'privatekey.pem');
    const app = await boot.start();

    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).toHaveBeenLastCalledWith(
      { cert: cert.toString('utf-8'), key: key.toString('utf-8') }
    );
    expect(app.server).toBeDefined();
    expect(app.secureServer).toBeDefined();
    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance());
    expect(registerMock).toHaveBeenCalled();

    app.server.close();
    app.secureServer.close();
  });

});
