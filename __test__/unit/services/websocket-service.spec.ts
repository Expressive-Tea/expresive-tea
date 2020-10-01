import WebsocketService from '../../../services/WebsocketService';
import * as WebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';

jest.mock('ws', () => ({
  Server: jest.fn()
}));

describe('Websocket Service', () => {
  // tslint:disable-next-line:one-variable-per-declaration
  let serverMock, serverSecureMock, ws, wss;

  beforeEach(() => {
    serverMock = http.createServer();
    serverSecureMock = https.createServer();
    ws = new WebSocket.Server();
    wss = new WebSocket.Server();
  });

  afterEach( () => {
    WebsocketService.clear();
  })

  test('should initialize WebsocketService', () => {
    WebsocketService.init(ws, wss);

    expect(WebsocketService.instance).toBeDefined()
  });

  test('should create an instance WebsocketService', () => {
    expect(WebsocketService.instance).not.toBeDefined()
    WebsocketService.getInstance(ws, wss);

    expect(WebsocketService.instance).toBeDefined()
  });

  test('should be the same instance of WebsocketService', () => {
    const wsService = new WebsocketService(ws, wss);
    const wsServiceSecond = new WebsocketService(ws);

    expect(WebsocketService.instance).toEqual(wsService);
    expect(WebsocketService.instance).toEqual(wsServiceSecond);
  });

  test('should create WebsocketService singleton', () => {
    WebsocketService.init(ws, wss);

    expect(WebsocketService.instance).toEqual(WebsocketService.getInstance())
  });

  test('should be the same instance of WebsocketService', () => {
    const wsService = new WebsocketService(ws, wss);
    const wsServiceSecond = new WebsocketService(ws);

    expect(WebsocketService.instance).toEqual(wsService);
    expect(WebsocketService.instance).toEqual(wsServiceSecond);
  });

  test('should setup http server correctly', () => {
    const wsService = new WebsocketService(ws, wss);

    wsService.setHttpServer(serverMock);
    wsService.setHttpServer(serverSecureMock);

    expect(WebsocketService.instance).toEqual(WebsocketService.getInstance())
  });

  test('should get websocket according to the server setting', () => {
    const wsService = new WebsocketService(ws, wss);

    wsService.setHttpServer(serverMock);
    wsService.setHttpServer(serverSecureMock);

    expect(wsService.getWebsocket(serverMock)).toEqual(ws);
    expect(wsService.getWebsocket(serverSecureMock)).toEqual(ws);
  });

  test('should reinitialize multiple times with same result', () => {
    WebsocketService.init(ws, wss);
    WebsocketService.init(ws, wss);
    WebsocketService.init(ws, wss);
    WebsocketService.init(ws, wss);
    expect(WebsocketService.instance).toEqual(WebsocketService.getInstance())
  });
});
