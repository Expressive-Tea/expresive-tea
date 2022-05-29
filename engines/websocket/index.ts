import * as http from 'http';
import * as https from 'https';
import WebsocketService from '../../services/WebsocketService';
import * as WebSocket from 'ws';
import { inject, injectable, optional } from 'inversify';
import Settings from '../../classes/Settings';

@injectable()
export default class WebsocketEngine {
  private readonly settings: Settings;
  private readonly server: http.Server;
  private readonly serverSecure?: https.Server;

  canStart: boolean = false;
  isDetached: boolean = false;

  constructor(
    @inject('server') server,
    @inject( 'secureServer') @optional() serverSecure,
    @inject( 'settings') settings
  ) {
    this.settings = settings;
    this.server = server;
    this.serverSecure = serverSecure;
    this.canStart = this.settings.get('startWebsocket');
    this.isDetached = this.settings.get('detachWebsocket');
  }

  async init(): Promise<void> {
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
}
