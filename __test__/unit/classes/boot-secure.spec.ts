import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import Boot from '../../../classes/Boot';
import Settings from '../../../classes/Settings';
import Module, { registerMock } from '../../test-classes/module';
import container from '../../../inversify.config';
import { Modules } from '../../../decorators/server';


const originalCreateServer = http.createServer;
const originalCreateSecureServer = https.createServer;
const originalFsReadFileSync = fs.readFileSync;
const cert = originalFsReadFileSync(path.resolve(__dirname, '../../certs/cert.pem'));
const key = originalFsReadFileSync(path.resolve(__dirname, '../../certs/key.pem'));
jest.mock('express', () => require('jest-express'));

describe('Boot Class Secure Server', () => {
  @Modules([Module])
  class Bootstrap extends Boot {}

  class DefaultBootstrap extends Boot {
  }

  beforeEach(() => {
    jest.clearAllMocks();
     
    jest.spyOn(http, 'createServer').mockImplementation((...args: any[]) => originalCreateServer(...args));
    jest.spyOn(https, 'createServer').mockImplementation((options: any, requestListener?: any) => {
      // Handle both signatures: (options) and (options, requestListener)
      if (requestListener && typeof requestListener === 'function') {
        return originalCreateSecureServer(options, requestListener);
      }
      // If requestListener is an Express app (has a handle method), wrap it
      if (requestListener && typeof requestListener.handle === 'function') {
        return originalCreateSecureServer(options, (req: any, res: any) => {
          requestListener.handle(req, res);
        });
      }
      // If no request listener provided (old buggy behavior), create a dummy server
      return originalCreateSecureServer(options, (_req, res) => {
        res.writeHead(404);
        res.end();
      });
    });
    jest.spyOn(fs, 'readFileSync').mockImplementation((fileName: fs.PathOrFileDescriptor) => fileName === 'certificate.pem' ? cert : key);
  });

  afterEach(() => {
    container.unbindAll();
    Settings.reset();
  });

  test('should create instance correctly', () => {
    const boot = new Bootstrap();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance(boot));
  });

  test('should start server as default', async () => {
    const boot = new DefaultBootstrap();
    Settings.getInstance(boot).set('certificate', 'certificate.pem');
    Settings.getInstance(boot).set('privateKey', 'privatekey.pem');
    const app = await boot.start();

    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance(boot));
    expect(app.server).toBeDefined();
    expect(app.secureServer).toBeDefined();
    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).toHaveBeenCalledWith(
      { cert: cert.toString('utf-8'), key: key.toString('utf-8') },
      expect.anything() // Express app instance
    );

    // Properly close servers
    await Promise.all([
      new Promise<void>((resolve) => app.server?.close(() => resolve())),
      new Promise<void>((resolve) => app.secureServer?.close(() => resolve()))
    ]);
  });

  test('should start an application', async () => {
    const boot = new Bootstrap();
    Settings.getInstance(boot).set('certificate', 'certificate.pem');
    Settings.getInstance(boot).set('privateKey', 'privatekey.pem');
    const app = await boot.start();

    expect(http.createServer).toHaveBeenCalled();
    expect(https.createServer).toHaveBeenCalledWith(
      { cert: cert.toString('utf-8'), key: key.toString('utf-8') },
      expect.anything() // Express app instance
    );
    expect(app.server).toBeDefined();
    expect(app.secureServer).toBeDefined();
    expect(boot.settings).toBeInstanceOf(Settings);
    expect(boot.settings).toEqual(Settings.getInstance(boot));
    expect(registerMock).toHaveBeenCalled();

    // Properly close servers
    await Promise.all([
      new Promise<void>((resolve) => app.server?.close(() => resolve())),
      new Promise<void>((resolve) => app.secureServer?.close(() => resolve()))
    ]);
  });

});
