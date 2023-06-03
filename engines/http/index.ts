import * as http from 'http';
import * as https from 'https';
import { injectable } from 'inversify';
import { resolveDirectives, resolveStage, resolveStatic, resolveProxy } from '../../helpers/boot-helper';
import { BOOT_ORDER, BOOT_STAGES, ROUTER_PROXIES_KEY } from '@expressive-tea/commons/constants';
import { getClass } from '@expressive-tea/commons/helpers/object-helper';
import Metadata from '@expressive-tea/commons/classes/Metadata';
import ExpressiveTeaEngine from '../../classes/Engine';

@injectable()
export default class HTTPEngine extends ExpressiveTeaEngine{

  private listen(server: http.Server | https.Server, port: number): Promise<http.Server | https.Server> {
    return new Promise((resolve, reject) => {
      server.listen(port);

      server.on('error', error => {
        reject(error);
      });

      server.on('listening', () => {
        console.log(`Running HTTP Server on [${port}]`);
        resolve(server);
      });
    });
  }

  async start(): Promise<(http.Server | https.Server)[]> {
    const listenerServers = [
      await this.listen(this.server, this.settings.get('port')),
      (this.serverSecure) ? await this.listen(this.serverSecure, this.settings.get('securePort')) as https.Server : null
    ];

    await this.resolveStages([BOOT_STAGES.START], ...listenerServers);
    return listenerServers;
  }

  async init(): Promise<void> {
    await resolveDirectives(this.context, this.context.getApplication());
    await resolveStatic(this.context, this.context.getApplication());
    // HTTP Engine Resolve Stages
    await this.resolveProxyContainers();
    await this.resolveStages(BOOT_ORDER);
    await this.resolveStages([BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES, BOOT_STAGES.ON_HTTP_CREATION], this.server, this.serverSecure);
  }

  async resolveStages(stages: BOOT_STAGES[], ...extraArgs) {
    return Promise.all(stages.map(s => resolveStage(s, this.context, this.context.getApplication(), ...extraArgs)));
  }

  async resolveProxyContainers() {
    const ProxyContainers = Metadata.get(ROUTER_PROXIES_KEY, getClass(this.context)) || [];
    for (const Container of ProxyContainers) {
      resolveProxy(Container, this.context.getApplication());
    }
  }
}
