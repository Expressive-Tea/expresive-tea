import type { WebSocketServer } from 'ws';
import type * as http from 'http';
import * as https from 'https';

export default class WebsocketService {
  static instance: WebsocketService | undefined;

  private ws!: WebSocketServer;
  private wss!: WebSocketServer;
  httpServer!: http.Server;
  httpsServer!: https.Server;

  constructor(ws?: WebSocketServer, wss?: WebSocketServer) {
    if (WebsocketService.instance) {
      return WebsocketService.instance;
    }

    if (ws) this.ws = ws;
    if (wss) this.wss = wss;
    WebsocketService.instance = this;
  }

  getWebsocket(httpServer: http.Server | https.Server): WebSocketServer {
    const server = httpServer instanceof https.Server ? this.wss : this.ws;
    if (!server) {
      throw new Error(
        'WebSocket server not initialized. Ensure WebsocketEngine is properly initialized before calling getWebsocket()'
      );
    }
    return server;
  }

  setHttpServer(httpServer: http.Server | https.Server): void {
    if (httpServer instanceof https.Server) {
      this.httpsServer = httpServer;
    } else {
      this.httpServer = httpServer;
    }
  }

  setWebSocket(ws: WebSocketServer): void {
    this.ws = ws;
  }

  setSecureWebsocket(wss: WebSocketServer): void {
    this.wss = wss;
  }

  static getInstance(ws?: WebSocketServer, wss?: WebSocketServer): WebsocketService {
    if (!WebsocketService.instance) {
      WebsocketService.instance = new WebsocketService(ws, wss);
    }

    return WebsocketService.instance;
  }

  static init(ws?: WebSocketServer, wss?: WebSocketServer): void {
    if (!WebsocketService.instance) {
      WebsocketService.instance = new WebsocketService(ws, wss);
    }
  }

  static clear(): void {
    WebsocketService.instance = undefined;
  }
}
