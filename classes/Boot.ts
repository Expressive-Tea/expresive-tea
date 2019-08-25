import * as $P from 'bluebird';
import { Express } from 'express';
// tslint:disable-next-line:no-duplicate-imports
import * as express from 'express';
import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import { BootLoaderRequiredExceptions, BootLoaderSoftExceptions } from '../exceptions/BootLoaderExceptions';
import { BOOT_ORDER, BOOT_STAGES, BOOT_STAGES_KEY, REGISTERED_MODULE_KEY, STAGES_INIT } from '../libs/constants';
import { ExpressiveTeaApplication } from '../libs/interfaces';
import { Rejector, Resolver } from '../libs/types';

/**
 * @typedef {Object} ExpressiveTeaApplication
 * @property {Express} application Express Application Instance
 * @property {HTTPServer} server HTTP Server Object
 */

/**
 * Bootstrap Server Configuration Class
 *
 * @abstract
 * @class Boot
 */
abstract class Boot {
  /**
   * Contains a instance of Settings
   *
   * @type {Settings}
   * @memberof Boot
   */
  settings: Settings;

  /**
   * Express Application instance internal property.
   *
   * @private
   * @type {Express}
   * @memberof Boot
   */
  private readonly server: Express = express();

  constructor() {
    this.settings = new Settings();
    this.settings.set('application', this.server);
  }

  /**
   * Initialize and Bootstrap Server.
   *
   * @returns {Promise<ExpressiveTeaApplication>}
   * @memberof Boot
   */
  async start(): Promise<ExpressiveTeaApplication> {
    return new $P(async (resolver: Resolver<ExpressiveTeaApplication>, rejector: Rejector) => {
      try {
        for (const stage of BOOT_ORDER) {
          await resolveStage(stage, this, this.server);
        }

        const server = this.server.listen(this.settings.get('port'), () => {
          console.log(`Running Server on [${this.settings.get('port')}]`);
          resolver({ application: this.server, server });
        });
      } catch (e) {
        return rejector(e);
      }
    });
  }
}

async function resolveStage(stage: BOOT_STAGES, ctx: Boot, server: Express): Promise<void> {
  for (const stage of BOOT_ORDER) {
    try {
      await bootloaderResolve(stage, server, ctx);
      if (stage === BOOT_STAGES.APPLICATION) {
        await resolveModules(ctx, server);
      }
    } catch (e) {
      checkIfStageFails(e);
    }
  }
}

async function resolveModules(instance: typeof Boot | Boot, server: Express): Promise<void> {
  const registeredModules = MetaData.get(REGISTERED_MODULE_KEY, instance, 'start') || [];
  registeredModules.forEach(Module => {
    const moduleInstance = new Module();
    moduleInstance.__register(server);
  });
}

async function bootloaderResolve(STAGE: BOOT_STAGES, server: Express, instance: typeof Boot | Boot): Promise<void> {
  const bootLoader = MetaData.get(BOOT_STAGES_KEY, instance);
  for (const loader of bootLoader[STAGE]) {
    try {
      if (loader.isPlugin) {
        await loader.method(server, Settings.getInstance());
      } else {
        await loader.method(server);
      }
    } catch (e) {
      shouldFailIfRequire(e, loader);
    }
  }
}

function checkIfStageFails(e: BootLoaderRequiredExceptions | BootLoaderSoftExceptions | Error) {
  if (e instanceof BootLoaderSoftExceptions) {
    console.info(e.message);
  } else {
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

/**
 * Initialize Meta Keys.
 */
MetaData.set(BOOT_STAGES_KEY, STAGES_INIT, Boot);
export default Boot;
