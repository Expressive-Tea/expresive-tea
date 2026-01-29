import * as path from 'path';
import Boot from '@classes/Boot';
import { ServerSettings } from '@decorators/server';
import { ExpressiveTeaApplication } from '@expressive-tea/commons/interfaces';
import container from '../../inversify.config';
import Settings from '@classes/Settings';


describe('Websocket integration', () => {
  let app: ExpressiveTeaApplication;

  afterEach(() => {
    container.unbindAll();
    Settings.reset();
    app?.server?.close();
    app?.secureServer?.close();
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
