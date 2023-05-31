import 'reflect-metadata';
import '../inversify.config';
// tslint:disable-next-line:no-duplicate-imports
import * as express from 'express';
// tslint:disable-next-line:no-duplicate-imports
import { Express } from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import Settings from '../classes/Settings';
import { ASSIGN_TEACUP_KEY, ASSIGN_TEAPOT_KEY, BOOT_ORDER, BOOT_STAGES } from '@expressive-tea/commons/constants';
import { ExpressiveTeaApplication } from '@expressive-tea/commons/interfaces';
import { Rejector, Resolver } from '@expressive-tea/commons/types';
import HTTPEngine from '../engines/http/index';
import WebsocketEngine from '../engines/websocket/index';
import TeapotEngine from '../engines/teapot/index';
import TeacupEngine from '../engines/teacup';
// tslint:disable-next-line:no-duplicate-imports
import container from '../inversify.config';
import Metadata from '@expressive-tea/commons/classes/Metadata';
import { getClass } from '@expressive-tea/commons/helpers/object-helper';
import ExpressiveTeaEngine from './Engine';


/**
 * Expressive Tea Application interface is the response from an started application, contains the express application
 * and a node http server instance.
 * @typedef {Object} ExpressiveTeaApplication
 * @property {Express} application - Express Application Instance
 * @property {HTTPServer} server - HTTP Server Object
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
    return new Promise(async (resolver: Resolver<ExpressiveTeaApplication>, reject: Rejector) => {
      try {
        const localContainer = container.createChild();
        const privateKey = this.settings.get('privateKey');
        const certificate = this.settings.get('certificate');
        const server: http.Server = http.createServer(this.server);
        const secureServer: https.Server = privateKey && certificate && https.createServer({
          cert: fs.readFileSync(certificate).toString('utf-8'),
          key: fs.readFileSync(privateKey).toString('utf-8')
        }, this.server);


        // Injectables
        localContainer.bind<http.Server>('server').toConstantValue(server);
        localContainer.bind<https.Server>('secureServer').toConstantValue(secureServer || undefined);
        localContainer.bind<Boot>('context').toConstantValue(this);
        localContainer.bind<Settings>('settings').toConstantValue(this.settings);

        // Activation
        const isActiveTeapot = Metadata.get(ASSIGN_TEAPOT_KEY, getClass(this), 'isTeapotActive');
        const isActiveTeacup = Metadata.get(ASSIGN_TEACUP_KEY, getClass(this), 'isTeacupActive');
        const isActiveWebsockets = this.settings.get('startWebsocket');

        // Engines
        const availableEngines: ExpressiveTeaEngine[] = [
          ...isActiveWebsockets ? [localContainer.resolve(WebsocketEngine)] : [],
          ...isActiveTeapot ? [localContainer.resolve(TeapotEngine)] : [],
          ...isActiveTeacup ? [localContainer.resolve(TeacupEngine)] : [],
        ];

        // Resolve Engines
        const httpEngine = localContainer.resolve(HTTPEngine);

        // Initialize Engines
        await Promise.all(availableEngines.map(engine => engine.init()));
        await httpEngine.init();

        // HTTP Engine Resolve Stages
        await httpEngine.resolveProxyContainers();
        await httpEngine.resolveStages(BOOT_ORDER);
        await httpEngine.resolveStages([BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES, BOOT_STAGES.ON_HTTP_CREATION], server, secureServer);

        const listenerServers: (http.Server | https.Server)[] = await httpEngine.start();
        await httpEngine.resolveStages([BOOT_STAGES.START], ...listenerServers);

        await Promise.all(availableEngines.map(engine => engine.start()));

        resolver({ application: this.server, server, secureServer });

      } catch (e) {
        return reject(e);
      }
    });
  }
}

export default Boot;
