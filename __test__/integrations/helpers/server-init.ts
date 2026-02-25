import supertest from 'supertest';
import Boot from '../../../classes/Boot';
import { Modules } from '../../../decorators/server';
import RootModule from './modules/root/RootModule';
import { ExpressiveTeaApplication } from '@expressive-tea/commons';

@Modules([RootModule])
class Bootstrap extends Boot {}

export default async function initServer(port?: number) {
  const bootstrap = new Bootstrap();
  if (port !== undefined) {
    // Set port on the isolated Settings instance for this Bootstrap class.
    bootstrap.settings.set('port', port);
  }
  const app: ExpressiveTeaApplication = await bootstrap.start();

  return {
    app,
    request: supertest(app.application)
  };
}
