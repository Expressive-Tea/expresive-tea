import * as path from 'path';
import Boot from '../../classes/Boot';
import { ServerSettings } from '../../decorators/server';
import { ExpressiveTeaApplication } from '../../libs/interfaces';
import container from '../../inversify.config';


describe('Websocket integration', () => {
  let app: ExpressiveTeaApplication;

  afterEach(() => {
    container.unbindAll();
    app.server.close();
    app.secureServer?.close();
  });
 test('should initialize websockets', async () => {

   @ServerSettings({
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
