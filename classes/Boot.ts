import 'reflect-metadata';
import container from '../inversify.config';
import * as express from 'express';
import { type Express } from 'express';
import { type ExpressiveTeaApplication } from '@expressive-tea/commons/interfaces';
import HTTPEngine from '../engines/http';
import WebsocketEngine from '../engines/websocket';
import TeapotEngine from '../engines/teapot/index';
import TeacupEngine from '../engines/teacup';
import ExpressiveTeaEngine from '../classes/Engine';
import Settings from '../classes/Settings';
import SocketIOEngine from '../engines/socketio/index';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import { Container } from 'inversify';
import { TYPES } from '../types/injection-types';

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


    // Initialize Engines
    const availableEngines: typeof ExpressiveTeaEngine[] = [
      HTTPEngine,
      SocketIOEngine,
      WebsocketEngine,
      TeapotEngine,
      TeacupEngine
    ];

    const registeredEngines: typeof ExpressiveTeaEngine[] = availableEngines.filter(Engine => Engine.canRegister(this, this.settings));

    this.initializeEngines(registeredEngines);

    // Resolve Engines
    const readyEngines: ExpressiveTeaEngine[] = registeredEngines.map(Engine => {
      const instance = this.containerDI.get<ExpressiveTeaEngine>(Engine);
      return instance;
    });

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
          })
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
