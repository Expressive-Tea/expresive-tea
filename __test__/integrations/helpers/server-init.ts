import * as supertest from 'supertest';
import Boot from '../../../classes/Boot';
import { Modules } from '../../../decorators/server';
import RootModule from './modules/root/RootModule';
import { ExpressiveTeaApplication } from '../../../libs/interfaces';

@Modules([RootModule])
class Bootstrap extends Boot {
}

export default async function initServer() {
  const bootstrap = new Bootstrap();
  const app: ExpressiveTeaApplication = await bootstrap.start();

  return {
    app,
    request: supertest(app.application)
  };
}
