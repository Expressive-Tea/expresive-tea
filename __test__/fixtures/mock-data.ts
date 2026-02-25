/**
 * Test Fixtures & Mock Data
 * Reusable test data for expressive-tea unit and integration tests.
 */

// ─── Settings Fixtures ────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  port: 3000,
  securePort: 4443,
  hostname: 'localhost',
  environment: 'test',
  certificate: undefined as string | undefined,
  privateKey: undefined as string | undefined
};

export const SECURE_SETTINGS = {
  ...DEFAULT_SETTINGS,
  certificate: 'cert-content',
  privateKey: 'key-content'
};

// ─── Plugin Fixtures ──────────────────────────────────────────────────────────

export const PLUGIN_MOCK_DATA = {
  name: 'TestPlugin',
  priority: 100,
  stage: 'BOOT_DEPENDENCIES'
};

// ─── HTTP Request/Response Fixtures ───────────────────────────────────────────

export function createMockRequest(overrides: Record<string, any> = {}): any {
  return {
    method: 'GET',
    url: '/',
    headers: {},
    params: {},
    query: {},
    body: {},
    ...overrides
  };
}

export function createMockResponse(): any {
  const res: any = {
    headersSent: false,
    statusCode: 200,
    _headers: {} as Record<string, string>
  };

  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res._body = data;
    res.headersSent = true;
    return res;
  };
  res.send = (data: any) => {
    res._body = data;
    res.headersSent = true;
    return res;
  };
  res.setHeader = (key: string, value: string) => {
    res._headers[key] = value;
    return res;
  };
  res.end = () => {
    res.headersSent = true;
    return res;
  };

  return res;
}

export function createMockNext() {
  return vi.fn();
}

// ─── Engine Fixtures ──────────────────────────────────────────────────────────

export const ENGINE_MOCK_DATA = {
  httpEngine: {
    name: 'HTTPEngine',
    priority: 0
  },
  socketIoEngine: {
    name: 'SocketIOEngine',
    priority: 1
  },
  websocketEngine: {
    name: 'WebsocketEngine',
    priority: 2
  }
};

// ─── Module Fixtures ──────────────────────────────────────────────────────────

export const MODULE_MOCK_DATA = {
  mountpoint: '/api',
  controllers: [],
  providers: []
};

// ─── Error Fixtures ───────────────────────────────────────────────────────────

export const ERROR_MESSAGES = {
  hardPluginFail: (name: string, msg: string) => `Failed [${name}]: ${msg}`,
  invalidPort: 'Invalid port number',
  serverClosed: 'Server is not running',
  missingCertificate: 'Certificate and private key are required for HTTPS'
};

// ─── WebSocket Fixtures ───────────────────────────────────────────────────────

export const WS_MOCK_DATA = {
  defaultPath: '/ws',
  defaultPort: 8080,
  pingInterval: 30000,
  pongTimeout: 5000
};
