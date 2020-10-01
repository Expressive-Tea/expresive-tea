import * as supertest from 'supertest';
import Boot from '../../../classes/Boot';
import { RegisterModule} from '../../../decorators/server';
import RootModule from './modules/root/RootModule';
import { ExpressiveTeaApplication } from '../../../libs/interfaces';

class Bootstrap extends Boot {
  @RegisterModule(RootModule)
  async start(): Promise<ExpressiveTeaApplication> {
    return super.start();
  }
}

export default async function initServer() {
  const bootstrap = new Bootstrap();
  const app: ExpressiveTeaApplication = await bootstrap.start();

  return {
    app,
    request: supertest(app.application)
  }
}
