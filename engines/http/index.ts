import * as http from 'http';
import * as https from 'https';
import * as $P from 'bluebird';
import { inject, injectable } from 'inversify';
import Settings from '../../classes/Settings';
import Boot from '../../classes/Boot';
import { resolveDirectives, resolveStage, resolveStatic } from '../../helpers/boot-helper';
import { BOOT_STAGES } from '../../libs/constants';

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
      resolveStage(s, this.context, this.context.getApplication(), ...extraArgs);
    })
  }
}
