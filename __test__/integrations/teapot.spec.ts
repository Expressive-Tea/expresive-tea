import { ExpressiveTeaApplication } from '../../libs/interfaces';
import initTeapot from './helpers/teapot-init';
import container from '../../inversify.config';
import * as $P from 'bluebird';
import { createHttpTerminator } from 'http-terminator';

describe('Teapot/Teacup integration', () => {
  let appTeapot: ExpressiveTeaApplication;
  let appTeacup: ExpressiveTeaApplication;
  let extraTeacups: ExpressiveTeaApplication[];

  let request;

  beforeAll(async () => {
    const testInit = await initTeapot();
    appTeapot = testInit.appTeapot;
    appTeacup = testInit.appTeacup;
    extraTeacups = testInit.extraTeacups;

    request = testInit.request;
  });

  afterAll(() => {
    container.unbindAll();
    appTeapot.server.close();
    appTeacup.server.close();
    extraTeacups.forEach(a => a.server.close());
  });

  test('should initialize Teapot Service', async () => {
    const res = await request.get('/test')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('this is a test');
  });

  test('should get first teacup microservice group', async () => {
    const res = await request.get('/teacup-1/test')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('this is a teacup1');
  });

  test('should get second teacup microservice group', async () => {
    const res = await request.get('/teacup-2/test')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('this is a teacup2');
  });

  test('should get teacup post response from first microservice group', async () => {
    const res = await request.post('/teacup-1/test')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('<h1> Body Test pass teacup1</h1>');
  });

  test('should get teacup post response from first microservice group', async () => {
    const res = await request.post('/teacup-2/test')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('<h1> Body Test pass teacup2</h1>');
  });

  test('should remove a teacup from teapot gateway', async () => {
    const serverTerminator = createHttpTerminator({ server: extraTeacups[0].server});
    await serverTerminator.terminate();
    await $P.delay(1500);
    const res = await request.get('/teacup-2/test')
      .expect('Content-Type', /html/)
      .expect(404);
  });
});
