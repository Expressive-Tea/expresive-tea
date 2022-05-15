import * as http from 'http';
import * as https from 'https';
import * as $P from 'bluebird';
import { inject, injectable } from 'inversify';
import Settings from '../../classes/Settings';
import Boot from '../../classes/Boot';
import { resolveDirectives, resolveStage, resolveStatic, resolveProxy } from '../../helpers/boot-helper';
import { BOOT_STAGES, ROUTER_PROXIES_KEY } from '../../libs/constants';
import { getClass } from '../../helpers/object-helper';
import Metadata from '../../classes/MetaData';

@injectable()
export default class HTTPEngine {

  private readonly settings: Settings;
  private readonly context: Boot;
  private readonly server: http.Server;
  private readonly serverSecure?: https.Server;

  constructor(
    @inject('context') ctx,
    @inject('server') server,
    @inject( 'secureServer') serverSecure,
    @inject( 'settings') settings
  ) {
    this.context = ctx;
    this.server = server;
    this.serverSecure = serverSecure;
    this.settings = settings;
  }

  private listen(server: http.Server | https.Server, port: number): $P<http.Server | https.Server> {
    return new $P((resolve, reject) => {
      server.listen(port);

      server.on('error', error => {
        reject(error);
      });

      server.on('listening', () => {
        console.log(`Running HTTP Server on [${port}]`);
        resolve(server)
      });
    });
  }

  async start(): Promise<(http.Server | https.Server)[]> {
    return [
      await this.listen(this.server, this.settings.get('port')),
      (this.serverSecure) ? await this.listen(this.serverSecure, this.settings.get('securePort')) as https.Server : null
    ];
  }

  async init(): Promise<void> {
    await resolveDirectives(this.context, this.context.getApplication());
    await resolveStatic(this.context, this.context.getApplication());
  }

  async resolveStages(stages: BOOT_STAGES[], ...extraArgs) {
    return $P.map(stages,s => {
      return resolveStage(s, this.context, this.context.getApplication(), ...extraArgs);
    })
  }

  async resolveProxyContainers() {
    const ProxyContainers = Metadata.get(ROUTER_PROXIES_KEY, getClass(this.context)) || [];
    for (const Container of ProxyContainers) {
      resolveProxy(Container, this.context.getApplication());
    }
  }
}
