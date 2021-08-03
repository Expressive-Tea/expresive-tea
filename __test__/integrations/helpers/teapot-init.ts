import * as supertest from 'supertest';
import Boot from '../../../classes/Boot';
import { RegisterModule, ServerSettings, Teacup, Teapot } from '../../../decorators/server';
import TeapotModule from './modules/teapot/RootModule';
import TeacupModule1 from './modules/teacup1/RootModule';
import TeacupModule2 from './modules/teacup2/RootModule';
import { ExpressiveTeaApplication } from '../../../libs/interfaces';
import * as $P from 'bluebird';

const teapotPort = 8080;

@ServerSettings({
  port: teapotPort
})
@Teapot({
  serverKey: 'test',
  clientKey: 'testKey'
})
class TeapotTest extends Boot {
  @RegisterModule(TeapotModule)
  async start(): Promise<ExpressiveTeaApplication> {
    return super.start();
  }
}

@ServerSettings({
  port: 8081
})
@Teacup({
  clientKey: 'testKey',
  serverUrl: `teapot://127.0.0.1:${teapotPort}/teapot`,
  address: 'http://127.0.0.1:8081',
  mountTo: '/teacup-1'
})
class TeacupTest extends Boot {
  @RegisterModule(TeacupModule1)
  async start(): Promise<ExpressiveTeaApplication> {
    return super.start();
  }
}

@ServerSettings({
  port: 8082
})
@Teacup({
  clientKey: 'testKey',
  serverUrl: `teapot://127.0.0.1:${teapotPort}/teapot`,
  address: 'http://127.0.0.1:8082',
  mountTo: '/teacup-2'
})
class TeacupTest2 extends Boot {
  @RegisterModule(TeacupModule2)
  async start(): Promise<ExpressiveTeaApplication> {
    return super.start();
  }
}

@ServerSettings({
  port: 8083
})
@Teacup({
  clientKey: 'testKey',
  serverUrl: `teapot://127.0.0.1:${teapotPort}/teapot`,
  address: 'http://127.0.0.1:8083',
  mountTo: '/teacup-1'
})
class TeacupTest3 extends Boot {
  @RegisterModule(TeacupModule1)
  async start(): Promise<ExpressiveTeaApplication> {
    return super.start();
  }
}

export default async function initTeapot() {
  const teapot = new TeapotTest();
  const teacup1 = new TeacupTest();
  const teacup2 = new TeacupTest2();
  const teacup3 = new TeacupTest3();

  const appTeapot = await teapot.start();
  const request = supertest(appTeapot.application);
  const appTeacup = await teacup1.start();
  const extraTeacups = await $P.all([
    teacup2.start(),
    teacup3.start()
  ]);

  await $P.delay(5000);

  return {
    appTeapot, appTeacup, extraTeacups, request
  };
}

