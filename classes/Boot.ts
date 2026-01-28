import 'reflect-metadata';
import container from '../inversify.config';
import * as express from 'express';
import { type Express } from 'express';
import { type ExpressiveTeaApplication } from '@expressive-tea/commons/interfaces';
import ExpressiveTeaEngine from '../classes/Engine';
import Settings from '../classes/Settings';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import { Container, type Newable, type ServiceIdentifier } from 'inversify';
import { TYPES } from '../types/injection-types';
import EngineRegistry from './EngineRegistry';

/**
 * Expressive Tea Application interface is the response from an started application, contains the express application
 * and a node http server instance.
 * @typedef {Object} ExpressiveTeaApplication
 * @property {Express} application - Express Application Instance
 * @property { HTTPServer } server - HTTP Server Object
 * @summary Application Interface
 */

/**
 * <b>Bootstrap Server Engine Class</b> is an abstract class to provide the Expressive Tea engine and bootstraps tools.
 * This is containing the logic and full functionality of Expressive Tea and only can be extended.
 *
 * @abstract
 * @class Boot
 * @summary Bootstrap Engine Class
 */
abstract class Boot {
  /**
   * Maintain a reference to Singleton instance of Settings, if settings still does not initialized it will created
   * automatically when extended class create a new instance.
   *
   * @type {Settings}
   * @public
   * @summary Server Settings instance reference
   */
  settings: Settings;

  /**
   * Automatically create an Express application instance which will be user to configure over all the boot stages.
   * @type {Express}
   * @private
   * @readonly
   * @summary Express Application instance internal property.
   */
  private readonly server: Express = express();

  private readonly containerDI: Container = new Container({ parent: container});

  /**
   * Engine instances for cleanup during shutdown
   * @type {ExpressiveTeaEngine[]}
   * @private
   * @since 2.0.0
   */
  private engines: ExpressiveTeaEngine[] = [];

  constructor() {
    this.settings = Settings.getInstance(this);
  }

  /**
   * Get Express Application
   * @returns Express
   */
  getApplication(): Express {
    return this.server;
  }

  /**
   * Get the Dependency Injection container for this application instance.
   * This container is scoped to the application and inherits from the global container.
   *
   * @returns {Container} The application's DI container
   * @since 2.0.0
   * @summary Get application DI container
   *
   * @example
   * class MyApp extends Boot {
   *   async start() {
   *     const container = this.getContainer();
   *     container.bind(MyService).toSelf();
   *     return super.start();
   *   }
   * }
   */
  getContainer(): Container {
    return this.containerDI;
  }

  /**
   * Register a provider in the application's DI container.
   * Providers registered here are available to all modules and engines in this application.
   *
   * @template T
   * @param {ServiceIdentifier<T>} identifier - The service identifier (class or token)
   * @param {Newable<T>} provider - The provider class to bind
   * @returns {void}
   * @since 2.0.0
   * @summary Register a DI provider
   *
   * @example
   * class MyApp extends Boot {
   *   constructor() {
   *     super();
   *     this.registerProvider(DatabaseService, DatabaseService);
   *     this.registerProvider('API_KEY', ApiKeyProvider);
   *   }
   * }
   */
  registerProvider<T>(identifier: ServiceIdentifier<T>, provider: Newable<T>): void {
    if (!this.containerDI.isBound(identifier)) {
      this.containerDI.bind<T>(identifier).to(provider);
    }
  }

  /**
   * Register a constant value in the application's DI container.
   *
   * @template T
   * @param {ServiceIdentifier<T>} identifier - The service identifier (usually a string or symbol)
   * @param {T} value - The constant value to bind
   * @returns {void}
   * @since 2.0.0
   * @summary Register a constant value
   *
   * @example
   * class MyApp extends Boot {
   *   constructor() {
   *     super();
   *     this.registerConstant('DATABASE_URL', process.env.DATABASE_URL);
   *     this.registerConstant('MAX_CONNECTIONS', 100);
   *   }
   * }
   */
  registerConstant<T>(identifier: ServiceIdentifier<T>, value: T): void {
    if (!this.containerDI.isBound(identifier)) {
      this.containerDI.bind<T>(identifier).toConstantValue(value);
    }
  }

  /**
   * Bootstrap and verify that all the required plugins are correctly configured and proceed to attach all the
   * registered modules. <b>Remember</b> this is the unique method that must be decorated for the Register Module
   * decorator.
   * @summary Initialize and Bootstrap Server.
   * @returns {Promise<ExpressiveTeaApplication>}
   */
  async start(): Promise<ExpressiveTeaApplication> {
    // Initialize Server
    const [server, secureServer] = this.initializeHttp();

    // Injectables
    this.initializeContainer(server, secureServer);

    // Lazy load engines to avoid circular dependency
    // This ensures engines are only loaded when needed
    if (EngineRegistry.getAllEngines().length === 0) {
      await import('../engines');
    }

    // Get registered engines from EngineRegistry (automatically filtered and sorted by dependencies)
    const registeredEngines = EngineRegistry.getRegisteredEngines(this, this.settings);

    this.initializeEngines(registeredEngines);

    // Resolve Engines
    const readyEngines: ExpressiveTeaEngine[] = registeredEngines.map(Engine => {
      const instance = this.containerDI.get<ExpressiveTeaEngine>(Engine);
      return instance;
    });

    // Store engine instances for cleanup
    this.engines = readyEngines;

    // Initialize Engines
    try {
      await ExpressiveTeaEngine.exec(readyEngines.reverse(), 'init');
      await ExpressiveTeaEngine.exec(readyEngines, 'start');

      return ({ application: this.server, server, secureServer });
    } catch (e) {
      // If anything failed during engine initialization or start, ensure servers are closed to avoid leaking
      server?.close();
      secureServer?.close();
      throw e;
    }
  }

  /**
   * Gracefully stop the application and all engines
   * 
   * Calls the stop() lifecycle method on all registered engines in reverse order
   * (opposite of initialization order) to ensure proper cleanup.
   * 
   * @returns {Promise<void>} Promise that resolves when all engines have stopped
   * @since 2.0.0
   * @summary Graceful shutdown
   * 
   * @example
   * ```typescript
   * const app = new MyApp();
   * await app.start();
   * 
   * // Later, during shutdown
   * await app.stop();
   * ```
   */
  async stop(): Promise<void> {
    if (this.engines.length === 0) {
      return;
    }

    // Stop engines in reverse order (opposite of initialization)
    await ExpressiveTeaEngine.exec([...this.engines].reverse(), 'stop');
    
    // Clear engine references
    this.engines = [];
  }

  private initializeEngines(registeredEngines: typeof ExpressiveTeaEngine[]): void {
    for (const Engine of registeredEngines) {
      this.containerDI.bind<ExpressiveTeaEngine>(Engine).to(Engine);
    }
  }

  private initializeHttp(): [http.Server, https.Server | undefined] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const privateKey: fs.PathOrFileDescriptor = this.settings.get('privateKey');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const certificate: fs.PathOrFileDescriptor = this.settings.get('certificate');
    const server: http.Server = http.createServer(this.server);
    const secureServer: https.Server | undefined =
      privateKey &&
      certificate
        ? https.createServer({
            cert: fs.readFileSync(certificate).toString('utf-8'),
            key: fs.readFileSync(privateKey).toString('utf-8')
          }, this.server)
        : undefined;

    return [server, secureServer];
  }

  private initializeContainer(server: http.Server, secureServer?: https.Server): void {
    this.containerDI.bind<http.Server>(TYPES.Server).toConstantValue(server);
    if (secureServer) {
      this.containerDI.bind<https.Server>(TYPES.SecureServer).toConstantValue(secureServer);
    }
    this.containerDI.bind<Boot>(TYPES.Context).toConstantValue(this);
    this.containerDI.bind<Settings>(TYPES.Settings).toConstantValue(this.settings);
  }
}

export default Boot;
