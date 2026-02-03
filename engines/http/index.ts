import * as http from 'node:http';
import * as https from 'node:https';
import { injectable, injectFromBase } from 'inversify';
import { resolveDirectives, resolveStage, resolveStatic, resolveProxy } from '@helpers/boot-helper';
import { BOOT_ORDER, BOOT_STAGES, ROUTER_PROXIES_KEY } from '@expressive-tea/commons';
import { getClass } from '@expressive-tea/commons';
import { Metadata } from '@expressive-tea/commons';
import ExpressiveTeaEngine from '@classes/Engine';

@injectable()
@injectFromBase({ extendConstructorArguments: true })
export default class HTTPEngine extends ExpressiveTeaEngine{

  private async listen(server: http.Server | https.Server, port: number): Promise<http.Server | https.Server> {
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
    const servers: (http.Server | https.Server | null)[] = [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await this.listen(this.server, this.settings.get('port')),
      (this.serverSecure) ? await this.listen(this.serverSecure, this.settings.get('securePort') as number) as https.Server : null
    ];
    
    const listenerServers = servers.filter((server): server is http.Server | https.Server => server !== null);

    await this.resolveStages([BOOT_STAGES.START], ...listenerServers);
    return listenerServers;
  }

  async init(): Promise<void> {
    resolveDirectives(this.context, this.context.getApplication());
    resolveStatic(this.context, this.context.getApplication());
    // HTTP Engine Resolve Stages
    this.resolveProxyContainers();
    await this.resolveStages(BOOT_ORDER);
    await this.resolveStages([BOOT_STAGES.AFTER_APPLICATION_MIDDLEWARES, BOOT_STAGES.ON_HTTP_CREATION], this.server, this.serverSecure);
  }

  async resolveStages(stages: BOOT_STAGES[], ...extraArgs: unknown[]): Promise<unknown[]> {
    return Promise.all(stages.map(async s => resolveStage(s, this.context, this.context.getApplication(), ...extraArgs)));
  }

  resolveProxyContainers(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const ProxyContainers = Metadata.get(ROUTER_PROXIES_KEY, getClass(this.context)) || [];
     
    for (const Container of ProxyContainers) {
      resolveProxy(Container, this.context.getApplication());
    }
  }

  static canRegister(): boolean {
    return true;
  }
}
