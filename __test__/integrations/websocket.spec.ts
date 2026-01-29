import * as path from 'path';
import Boot from '../../classes/Boot';
import { ServerSettings } from '../../decorators/server';
import { ExpressiveTeaApplication } from '@expressive-tea/commons';
import container from '../../inversify.config';
import Settings from '../../classes/Settings';


describe('Websocket integration', () => {
  let app: ExpressiveTeaApplication;

  afterEach(async () => {
    container.unbindAll();
    Settings.reset();
    
    // Properly close servers with promises
    if (app?.server) {
      await new Promise<void>((resolve) => {
        app.server.close(() => resolve());
      });
    }
    
    if (app?.secureServer) {
      await new Promise<void>((resolve) => {
        app.secureServer.close(() => resolve());
      });
    }
  });
 test('should initialize websockets', async () => {

   @ServerSettings({
     port: 3100,
     startWebsocket: true
   })
   class Bootstrap extends Boot {
   }

   const instance = new Bootstrap();

   app = await instance.start();

   expect(instance).toBeDefined();
 });

  test('should initialize websockets as secure protocol', async () => {
    @ServerSettings({
      port: 3101,
      securePort: 4501,
      startWebsocket: true,
      privateKey: path.resolve(__dirname, '../certs/key.pem'),
      certificate: path.resolve(__dirname, '../certs/cert.pem')
    })
    class Bootstrap extends Boot {
    }

    const instance = new Bootstrap();

    app = await instance.start();

    expect(instance).toBeDefined();
  });

  test('should detach Websocket from http server', async () => {
    @ServerSettings({
      port: 3102,
      securePort: 4502,
      startWebsocket: true,
      detachWebsocket: true,
      privateKey: path.resolve(__dirname, '../certs/key.pem'),
      certificate: path.resolve(__dirname, '../certs/cert.pem')
    })
    class Bootstrap extends Boot {
    }

    const instance = new Bootstrap();

    app = await instance.start();

    expect(instance).toBeDefined();
  });
});
