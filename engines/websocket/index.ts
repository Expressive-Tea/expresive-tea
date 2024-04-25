import WebsocketService from '../../services/WebsocketService';
import * as WebSocket from 'ws';
import { injectable } from 'inversify';
import ExpressiveTeaEngine from '../../classes/Engine';
import Boot from '../../classes/Boot';
import Settings from '../../classes/Settings';

@injectable()
export default class WebsocketEngine extends ExpressiveTeaEngine {

  canStart: boolean = false;
  isDetached: boolean = false;

  async init(): Promise<void> {
    this.canStart = this.settings.get('startWebsocket');
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
    return settings.get('startWebsocket');
  }
}
