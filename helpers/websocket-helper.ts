import WebsocketService from '@services/WebsocketService';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as WebSocket from 'ws';
import Settings from '@classes/Settings';
import type * as http from 'http';
import type * as https from 'https';

export function initWebsocket(server: http.Server, secureServer: https.Server) {
  const settings = Settings.getInstance();
  const isDetached = settings.get('detachWebsocket');

  if (settings.get('startWebsocket')) {

    WebsocketService.init();
    WebsocketService.getInstance().setWebSocket(new WebSocket.Server(isDetached ? {noServer: true} : {server}));

    if (secureServer) {
      WebsocketService.getInstance().setSecureWebsocket(new WebSocket.Server(isDetached ? {noServer: true} : {server: secureServer}));
    }


    WebsocketService.getInstance().setHttpServer(server);
    WebsocketService.getInstance().setHttpServer(secureServer);
  }
}
