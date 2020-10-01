import WebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';

export default class WebsocketService {
  static instance: WebsocketService;

  private readonly ws: WebSocket.Server;
  private readonly wss: WebSocket.Server;
  httpServer: http.Server;
  httpsServer: https.Server;

  isDetached: boolean = false;

  constructor(ws: WebSocket.Server | never, wss?: WebSocket.Server | never) {
    if (WebsocketService.instance) {
      return WebsocketService.instance;
    }

    this.ws = ws;
    this.wss = wss;
    WebsocketService.instance = this;
  }

  getWebsocket(serverKind: http.Server | https.Server): WebSocket.Server {
    return (serverKind instanceof https.Server) ? this.wss : this.ws;
  }

  setHttpServer(server: http.Server | https.Server) {
    if (server instanceof https.Server) {
      this.httpsServer = server;
    } else {
      this.httpServer = server;
    }
  }

  static getInstance(ws?: WebSocket.Server, wss?: WebSocket.Server): WebsocketService {
    if (!WebsocketService.instance) {
      WebsocketService.instance = new WebsocketService(ws, wss);
    }

    return WebsocketService.instance;
  }

  static init(ws: WebSocket.Server, wss?: WebSocket.Server):void {
    if (!WebsocketService.instance) {
      WebsocketService.instance = new WebsocketService(ws, wss);
    }
  }

  static clear() {
    delete WebsocketService.instance;
  }
}
