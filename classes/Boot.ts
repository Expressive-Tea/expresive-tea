import * as $P from 'bluebird';
// tslint:disable-next-line:no-duplicate-imports
import * as express from 'express';
// tslint:disable-next-line:no-duplicate-imports
import { Express } from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import { BootLoaderRequiredExceptions, BootLoaderSoftExceptions } from '../exceptions/BootLoaderExceptions';
import { getClass } from '../helpers/object-helper';
import {
  BOOT_ORDER,
  BOOT_STAGES,
  BOOT_STAGES_KEY,
  REGISTERED_DIRECTIVES_KEY,
  REGISTERED_MODULE_KEY,
  REGISTERED_STATIC_KEY,
  ROUTER_PROXIES_KEY,
  STAGES_INIT
} from '../libs/constants';
import { ExpressiveTeaApplication, ExpressiveTeaStatic, ExprresiveTeaDirective } from '../libs/interfaces';
import { Rejector, Resolver } from '../libs/types';
import * as WebSocket from 'ws';
import WebsocketService from '../services/WebsocketService';


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
        const startWebsocket = this.settings.get('startWebsocket');
        const detachWebsocket = this.settings.get('detachWebsocket');
        const serverConfigQueue: Promise<void>[] = [];

        // tslint:disable-next-line:one-variable-per-declaration
        let ws, wss;

        const server:http.Server = http.createServer(this.server);
        const secureServer:https.Server = privateKey && certificate && https.createServer({
          cert: fs.readFileSync(certificate).toString('utf-8'),
          key: fs.readFileSync(privateKey).toString('utf-8')
        }, this.server);

        if (startWebsocket) {

          ws = new WebSocket.Server(detachWebsocket ?{ noServer: true} : {server});

          if (secureServer) {
            wss = new WebSocket.Server(detachWebsocket? {noServer: true} : {server: secureServer});
          }

          WebsocketService.init(ws, wss);
          WebsocketService.getInstance().setHttpServer(server);
          WebsocketService.getInstance().setHttpServer(secureServer);
        }

        await resolveProxyContainers(this);
        await resolveDirectives(this, this.server);
        await resolveStatic(this, this.server);
        for (const stage of BOOT_ORDER) {
          await resolveStage(stage, this, this.server);
        }

        await resolveStage(BOOT_STAGES.APPLICATION, this, this.server);

        serverConfigQueue.push(new $P(resolve => server.listen(this.settings.get('port'), () => {
          console.log(`Running HTTP Server on [${this.settings.get('port')}]`);
          resolve();
        })));

        if (secureServer) {
          serverConfigQueue.push(new $P(resolve => secureServer.listen(this.settings.get('securePort'), () => {
            console.log(`Running Secure HTTP Server on [${this.settings.get('securePort')}]`);
            resolve();
          })));
        }

        await $P.all([
          resolveStage(BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES, this, this.server),
          resolveStage(BOOT_STAGES.ON_HTTP_CREATION, this, this.server, server, secureServer)
        ])

        $P.all(serverConfigQueue)
          .then(() => {
            return resolveStage(BOOT_STAGES.START, this, this.server, server, secureServer);
          })
          .then(() => resolver({ application: this.server, server, secureServer }));
      } catch (e) {
        return rejector(e);
      }
    });
  }
}

async function resolveStage(stage: BOOT_STAGES, ctx: Boot, server: Express, ...extraArgs: unknown[]): Promise<void> {
  try {
    await bootloaderResolve(stage, server, ctx, ...extraArgs);
    if (stage === BOOT_STAGES.APPLICATION) {
      await resolveModules(ctx, server);
    }
  } catch (e) {
    checkIfStageFails(e);
  }
}

async function resolveDirectives(instance: typeof Boot | Boot, server: Express): Promise<void> {
  const registeredDirectives = MetaData.get(REGISTERED_DIRECTIVES_KEY, getClass(instance)) || [];
  registeredDirectives.forEach((options: ExprresiveTeaDirective) => {
    server.set.call(server, options.name, ...options.settings);
  });
}

async function resolveStatic(instance: typeof Boot | Boot, server: Express): Promise<void> {
  const registeredStatic = MetaData.get(REGISTERED_STATIC_KEY, getClass(instance)) || [];
  registeredStatic.forEach((staticOptions: ExpressiveTeaStatic) => {
    if (staticOptions.virtual) {
      server.use(staticOptions.virtual, express.static(staticOptions.root, staticOptions.options));
    } else {
      server.use(express.static(staticOptions.root, staticOptions.options));
    }

  });
}

async function resolveModules(instance: typeof Boot | Boot, server: Express): Promise<void> {
  const registeredModules = MetaData.get(REGISTERED_MODULE_KEY, instance, 'start') || [];
  registeredModules.forEach(Module => {
    const moduleInstance = new Module();
    moduleInstance.__register(server);
  });
}

async function bootloaderResolve(
  STAGE: BOOT_STAGES,
  server: Express,
  instance: typeof Boot | Boot,
  ...args: unknown[]): Promise<void> {

  const bootLoader = MetaData.get(BOOT_STAGES_KEY, getClass(instance)) || STAGES_INIT;
  for (const loader of bootLoader[STAGE] || []) {
    try {
      await selectLoaderType(loader, server, ...args);
    } catch (e) {
      shouldFailIfRequire(e, loader);
    }
  }
}

async function resolveProxyContainers(context) {
  const ProxyContainers = MetaData.get(ROUTER_PROXIES_KEY, getClass(context)) || [];
  for (const Container of ProxyContainers) {
    resolveProxy(Container, context.server);
  }
}

export async function resolveProxy(ProxyContainer: any, server: Express): Promise<void> {
  const proxyContainer = new ProxyContainer();
  proxyContainer.__register(server);
}

async function selectLoaderType(loader, server: Express, ...args: unknown[]) {
  return loader.method(server, ...args);
}

function checkIfStageFails(e: BootLoaderRequiredExceptions | BootLoaderSoftExceptions | Error) {
  if (e instanceof BootLoaderSoftExceptions) {
    console.info(e.message);
  } else {
    console.error(e.message);
    // Re Throwing Error to Get it a top level.
    throw e;
  }
}

function shouldFailIfRequire(e: BootLoaderRequiredExceptions | BootLoaderSoftExceptions | Error, loader) {
  const failMessage = `Failed [${loader.name}]: ${e.message}`;
  if (!loader || loader.required) {
    throw new BootLoaderRequiredExceptions(failMessage);
  }

  throw new BootLoaderSoftExceptions(`${failMessage} and will be not enabled`);
}


export default Boot;
