import Settings from '@config/Settings';
import MetaData from '@core/classes/MetaData';
import * as constants from '@core/constants';
import { BootLoaderRequiredExceptions, BootLoaderSoftExceptions } from '@core/exceptions/BootLoaderExceptions';
import * as $P from 'bluebird';
import * as express from 'express';

abstract class Boot {
  settings: any = {};
  private server: any = express();

  constructor() {
    this.settings = new Settings();
    this.settings.set('application', this.server);
  }

  async start() {
    return new $P(async (resolver, rejector) => {
      try {
        for (const stage in constants.BOOT_ORDER) {
          try {
            await bootloaderResolve(stage, this.server, this);
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

async function bootloaderResolve(STAGE, server, instance) {
  const bootLoader = MetaData.get('boot:stage-settings', instance);
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
MetaData.set('boot:stage-settings', constants.STAGES_INIT, Boot);
export default Boot;
