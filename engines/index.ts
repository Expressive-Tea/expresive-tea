/**
 * Core Engine Registration
 * 
 * Automatically registers all core Expressive Tea engines with the EngineRegistry.
 * Import this file to enable all core engines with proper dependency order.
 * 
 * Engine Priority Order:
 * - 0: HTTPEngine (base engine, no dependencies)
 * - 5: HealthCheckEngine (health endpoints, depends on http)
 * - 10: SocketIOEngine, WebsocketEngine (depend on http)
 * - 20: TeapotEngine, TeacupEngine (depend on http, socketio)
 * 
 * @example
 * ```typescript
 * import '@expressive-tea/core/engines'; // Registers all core engines
 * import Boot from '@expressive-tea/core';
 * 
 * class MyApp extends Boot {}
 * ```
 * 
 * @module engines
 * @since 2.0.0
 */

import EngineRegistry from '../classes/EngineRegistry';
import HTTPEngine from './http';
import HealthCheckEngine from './health';
import SocketIOEngine from './socketio';
import WebsocketEngine from './websocket';
import TeapotEngine from './teapot';
import TeacupEngine from './teacup';

/**
 * Register HTTP Engine
 * Priority: 0 (runs first)
 * Dependencies: none
 */
EngineRegistry.register({
  engine: HTTPEngine,
  name: 'http',
  version: '2.0.0',
  priority: 0,
  dependencies: []
});

/**
 * Register Health Check Engine
 * Priority: 5
 * Dependencies: http (needs HTTP server for endpoints)
 */
EngineRegistry.register({
  engine: HealthCheckEngine,
  name: 'health',
  version: '2.0.0',
  priority: 5,
  dependencies: ['http']
});

/**
 * Register SocketIO Engine
 * Priority: 10
 * Dependencies: http (needs HTTP server to attach to)
 */
EngineRegistry.register({
  engine: SocketIOEngine,
  name: 'socketio',
  version: '2.0.0',
  priority: 10,
  dependencies: ['http']
});

/**
 * Register Websocket Engine
 * Priority: 10
 * Dependencies: http (needs HTTP server to attach to)
 */
EngineRegistry.register({
  engine: WebsocketEngine,
  name: 'websocket',
  version: '2.0.0',
  priority: 10,
  dependencies: ['http']
});

/**
 * Register Teapot Engine (Microservice Gateway Server)
 * Priority: 20
 * Dependencies: http, socketio
 */
EngineRegistry.register({
  engine: TeapotEngine,
  name: 'teapot',
  version: '2.0.0',
  priority: 20,
  dependencies: ['http', 'socketio']
});

/**
 * Register Teacup Engine (Microservice Gateway Client)
 * Priority: 20
 * Dependencies: http, socketio
 */
EngineRegistry.register({
  engine: TeacupEngine,
  name: 'teacup',
  version: '2.0.0',
  priority: 20,
  dependencies: ['http', 'socketio']
});

// Export engines for direct imports if needed
export {
  HTTPEngine,
  HealthCheckEngine,
  SocketIOEngine,
  WebsocketEngine,
  TeapotEngine,
  TeacupEngine
};

export default EngineRegistry;
