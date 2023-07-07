import { inject, injectable, optional } from 'inversify';
import Settings from './Settings';
import Boot from './Boot';
import http from 'http';
import https from 'https';

@injectable()
export default class ExpressiveTeaEngine {
  protected readonly settings: Settings;
  protected readonly context: Boot;
  protected readonly server: http.Server;
  protected readonly serverSecure?: https.Server;

  constructor(
    @inject('context') ctx,
    @inject('server') server,
    @inject('secureServer') @optional() serverSecure,
    @inject('settings') settings
  ) {
    this.settings = settings;
    this.context = ctx;
    this.server = server;
    this.serverSecure = serverSecure;
  }

  static exec(availableEngines: ExpressiveTeaEngine[], method: string): any {
    return Promise.all(availableEngines
      // tslint:disable-next-line:no-string-literal
      .filter(engine => typeof engine[method] === 'function')
      // tslint:disable-next-line:no-string-literal
      .map(engine => engine[method]())
    );
  }
}
