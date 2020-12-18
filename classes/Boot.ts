import * as $P from 'bluebird';
// tslint:disable-next-line:no-duplicate-imports
import * as express from 'express';
// tslint:disable-next-line:no-duplicate-imports
import {Express} from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import Settings from '../classes/Settings';
import { BOOT_ORDER, BOOT_STAGES} from '../libs/constants';
import {ExpressiveTeaApplication, ExpressiveTeaStatic, ExprresiveTeaDirective} from '../libs/interfaces';
import {Rejector, Resolver} from '../libs/types';
import * as WebSocket from 'ws';
import WebsocketService from '../services/WebsocketService';
import {teacupInitialize, teapotInitialize} from '../helpers/teapot-helper';
import {resolveDirectives, resolveStage, resolveStatic} from '../helpers/boot-helper';
import {initWebsocket} from '../helpers/websocket-helper';


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
  settings: Settings = new Settings();

  /**
   * Automatically create an Express application instance which will be user to configure over all the boot stages.
   * @type {Express}
   * @private
   * @readonly
   * @summary Express Application instance internal property.
   */
  private readonly server: Express = express();

  constructor() {
    this.settings.set('application', this.server);
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
    return new $P(async (resolver: Resolver<ExpressiveTeaApplication>, rejector: Rejector) => {
      try {
        const privateKey = this.settings.get('privateKey');
        const certificate = this.settings.get('certificate');
        const isTeapot = this.settings.get('isTeapot');
        const isTeacup = this.settings.get('isTeacup');
        const serverConfigQueue: Promise<http.Server | https.Server>[] = [];
        const server: http.Server = http.createServer(this.server);
        const secureServer: https.Server = privateKey && certificate && https.createServer({
          cert: fs.readFileSync(certificate).toString('utf-8'),
          key: fs.readFileSync(privateKey).toString('utf-8')
        }, this.server);

        await initWebsocket(server, secureServer);
        await resolveDirectives(this, this.server);
        await resolveStatic(this, this.server);

        for (const stage of BOOT_ORDER) {
          await resolveStage(stage, this, this.server);
        }

        await $P.all([
          resolveStage(BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES, this, this.server),
          resolveStage(BOOT_STAGES.ON_HTTP_CREATION, this, this.server, server, secureServer)
        ])

        serverConfigQueue.push( new $P(resolve => {
          const httpServer: http.Server = server.listen(this.settings.get('port'), () => {
            console.log(`Running HTTP Server on [${this.settings.get('port')}]`);
          });

          resolve(httpServer);
        }));

        if (secureServer) {
          serverConfigQueue.push(new $P(resolve => {
            const httpsServer: https.Server = secureServer.listen(this.settings.get('securePort'), () => {
              console.log(`Running HTTP Server on [${this.settings.get('securePort')}]`);
            });
            resolve(httpsServer);
          }));
        }


        const listenerServers: (http.Server | https.Server)[] = await $P.all(serverConfigQueue);
        await resolveStage.call(this, BOOT_STAGES.START, this, this.server, ...listenerServers);

        if (isTeapot) {
          teapotInitialize.call(this, this, ...listenerServers);
        }

        if (isTeacup) {
          teacupInitialize(this);
        }

        resolver({ application: this.server, server, secureServer })

      } catch (e) {
        return rejector(e);
      }
    });
  }
}

export default Boot;
