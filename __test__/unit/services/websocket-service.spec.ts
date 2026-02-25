import WebsocketService from '../../../services/WebsocketService';
import type * as http from 'http';
import type * as https from 'https';

vi.mock('ws', () => ({
  default: { Server: vi.fn() },
  Server: vi.fn()
}));

// Import after mock is hoisted
import * as WebSocket from 'ws';

describe('Websocket Service', () => {
  let serverMock: http.Server;
  let serverSecureMock: https.Server;
  let ws: any;
  let wss: any;

  beforeEach(() => {
    // Use minimal typed mocks to avoid real server creation
    serverMock = { close: vi.fn() } as http.Server;
    serverSecureMock = { close: vi.fn() } as https.Server;
    ws = new (WebSocket.Server as any)();
    wss = new (WebSocket.Server as any)();
  });

  afterEach(() => {
    WebsocketService.clear();
  });

  test('should initialize WebsocketService', () => {
    WebsocketService.init(ws, wss);

    expect(WebsocketService.instance).toBeDefined();
  });

  test('should create an instance WebsocketService', () => {
    expect(WebsocketService.instance).not.toBeDefined();
    WebsocketService.getInstance(ws, wss);

    expect(WebsocketService.instance).toBeDefined();
  });

  test('should be the same instance of WebsocketService', () => {
    const wsService = new WebsocketService(ws, wss);
    const wsServiceSecond = new WebsocketService(ws);

    expect(WebsocketService.instance).toEqual(wsService);
    expect(WebsocketService.instance).toEqual(wsServiceSecond);
  });

  test('should create WebsocketService singleton', () => {
    WebsocketService.init(ws, wss);

    expect(WebsocketService.instance).toEqual(WebsocketService.getInstance());
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

    expect(WebsocketService.instance).toEqual(WebsocketService.getInstance());
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
    expect(WebsocketService.instance).toEqual(WebsocketService.getInstance());
  });
});
