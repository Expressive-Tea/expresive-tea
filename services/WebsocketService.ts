import WebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';

export default class WebsocketService {
  static instance: WebsocketService;

  private  ws: WebSocket.Server;
  private  wss: WebSocket.Server;
  httpServer: http.Server;
  httpsServer: https.Server;

  constructor(ws?: WebSocket.Server | never, wss?: WebSocket.Server | never) {
    if (WebsocketService.instance) {
      return WebsocketService.instance;
    }

    this.ws = ws;
    this.wss = wss;
    WebsocketService.instance = this;
  }

  getWebsocket(httpServer: http.Server | https.Server): WebSocket.Server {
    return (httpServer instanceof https.Server) ? this.wss : this.ws;
  }

  setHttpServer(httpServer: http.Server | https.Server) {
    if (httpServer instanceof https.Server) {
      this.httpsServer = httpServer;
    } else {
      this.httpServer = httpServer;
    }
  }

  setWebSocket(ws: WebSocket.Server) {
    this.ws = ws;
  }

  setSecureWebsocket(wss: WebSocket.Server) {
    this.wss = wss;
  }

  static getInstance(ws?: WebSocket.Server, wss?: WebSocket.Server): WebsocketService {
    if (!WebsocketService.instance) {
      WebsocketService.instance = new WebsocketService(ws, wss);
    }

    return WebsocketService.instance;
  }

  static init(ws?: WebSocket.Server, wss?: WebSocket.Server):void {
    if (!WebsocketService.instance) {
      WebsocketService.instance = new WebsocketService(ws, wss);
    }
  }

  static clear() {
    delete WebsocketService.instance;
  }
}
