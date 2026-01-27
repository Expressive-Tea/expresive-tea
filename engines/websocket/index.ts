import WebsocketService from '../../services/WebsocketService';
import * as WebSocket from 'ws';
import { injectable, injectFromBase } from 'inversify';
import ExpressiveTeaEngine from '../../classes/Engine';
import Boot from '../../classes/Boot';
import Settings from '../../classes/Settings';

@injectable()
@injectFromBase({ extendConstructorArguments: true })
export default class WebsocketEngine extends ExpressiveTeaEngine {

  canStart: boolean = false;
  isDetached: boolean = false;

  init(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.canStart = this.settings.get('startWebsocket');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.isDetached = this.settings.get('detachWebsocket');
    if(this.canStart) {
      WebsocketService.init();
      WebsocketService.getInstance().setWebSocket(new WebSocket.Server(this.isDetached ? {noServer: true} : {server: this.server}));

      if (this.serverSecure) {
        WebsocketService.getInstance().setSecureWebsocket(new WebSocket.Server(this.isDetached ? {noServer: true} : {server: this.serverSecure}));
      }


      WebsocketService.getInstance().setHttpServer(this.server);
      WebsocketService.getInstance().setHttpServer(this.serverSecure);
    }
  }

  static canRegister(ctx?: Boot, settings?: Settings): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return settings.get('startWebsocket');
  }
}
