import * as $P from 'bluebird';
import * as express from 'express';
import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import { BootLoaderRequiredExceptions, BootLoaderSoftExceptions } from '../exceptions/BootLoaderExceptions';
import { BOOT_ORDER, BOOT_STAGES, BOOT_STAGES_KEY, REGISTERED_MODULE_KEY, STAGES_INIT } from '../libs/constants';

abstract class Boot {
  settings: any = {};
  private readonly server: any = express();

  constructor() {
    this.settings = new Settings();
    this.settings.set('application', this.server);
  }

  async start() {
    return new $P(async (resolver, rejector) => {
      try {
        for (const stage of BOOT_ORDER) {
          try {
            await bootloaderResolve(stage, this.server, this);
            if (stage === BOOT_STAGES.APPLICATION) {
              await resolveModules(this, this.server);
            }

          } catch (e) {
            if (e instanceof BootLoaderSoftExceptions) {
              console.info(e.message);
            } else if (e instanceof BootLoaderRequiredExceptions) {
              // Missing Plugin on Stage should stop application.
              throw e;
            } else {
              // Re Throwing Error to Get it a top level.
              throw e;
            }
          }
        }

        const server = this.server.listen(this.settings.get('port'),
          () => {
            console.log(`Running Server on [${this.settings.get('port')}]`);
            resolver({ application: this.server, server });
          });
      } catch (e) {
        return rejector(e);
      }
    });
  }
}

async function resolveModules(instance, server) {
  const registeredModules = MetaData.get(REGISTERED_MODULE_KEY, instance, 'start') || [];
  registeredModules.forEach(Module => {
    const moduleInstance = new Module();
    moduleInstance.__register(server);
  });
}

async function bootloaderResolve(STAGE, server, instance) {
  const bootLoader = MetaData.get(BOOT_STAGES_KEY, instance);
  for (const loader of bootLoader[STAGE]) {
    try {
      if (!loader) {
        continue;
      }
      console.info(`Loading [${loader.name}]`);
      await loader.method(server);
      console.info(`Loaded [${loader.name}]`);
    } catch (e) {
      const failMessage = `Failed [${loader.name}]: ${e.message}`;
      if (loader.required) {
        throw new BootLoaderRequiredExceptions(failMessage);
      }

      throw new BootLoaderSoftExceptions(`${failMessage} and will be not enabled`);
    }
  }
}

/**
 * Initialize Meta Keys.
 */
MetaData.set(BOOT_STAGES_KEY, STAGES_INIT, Boot);
export default Boot;
