
import { inject, injectable, optional } from 'inversify';
import Settings from './Settings';
import Boot from './Boot';
import {Server as HttpServer} from 'node:http';
import {Server as HttpsServer} from 'node:https';
import { TYPES } from '../types/injection-types';

@injectable()
export default class ExpressiveTeaEngine {

  constructor(
    @inject(TYPES.Context) protected readonly  context: Boot,
    @inject(TYPES.Server) protected readonly  server: HttpServer,
    @inject(TYPES.SecureServer) @optional() protected readonly serverSecure: HttpsServer,
    @inject(TYPES.Settings) protected readonly settings: Settings
  ) {}

  static exec(availableEngines: ExpressiveTeaEngine[], method: string): Promise<unknown[]> {
    return Promise.all(availableEngines
      .filter(engine => typeof (engine as unknown as Record<string, unknown>)[method] === 'function')
      .map(engine => ((engine as unknown as Record<string, () => unknown>)[method])())
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static canRegister(ctx?: Boot, settings?: Settings): boolean {
    return false;
  }
}

