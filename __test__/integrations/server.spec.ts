import { ExpressiveTeaApplication } from '../../libs/interfaces';
import initServer from './helpers/server-init';

describe('Webserver integration', () => {
  let app: ExpressiveTeaApplication;
  let request;

  beforeEach(async () => {
    const testInit = await initServer();
    app = testInit.app;
    request = testInit.request;
  });

  afterEach(() => {
    app.server.close();
  });

  test('should initialize websockets', async () => {
    const res = await request.get('/test')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('this is a test');
  });

  test('should go next as result of 404', async () => {
    const res = await request.get('/next')
      .expect('Content-Type', /html/)
      .expect(404);

    expect(res.text).toContain('Cannot GET /next');
  });

  test('should go next middleware and fail', async () => {
    const res = await request.get('/next-error')
      .expect('Content-Type', /html/)
      .expect(500);

    expect(res.text).toContain('Error: this is an error');
  });

  test('should initialize websockets', async () => {
    const res = await request.get('/error')
      .expect('Content-Type', /html/)
      .expect(500);

    expect(res.text).toContain('Error: not pass');
  });

  test('should test request and response annotations', async () => {
    const res = await request.get('/request')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.req).toEqual(true);
    expect(res.body.res).toEqual(true);
  });

  test('should test params annotations', async () => {
    const res = await request.get('/with-params/test-user')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('<h1> Data Test test-user</h1>');
  });

  test('should test query annotations', async () => {
    const res = await request.get('/with-query?test=user-test')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('<h1> Query Test user-test</h1>');
  });

  test('should test body annotations', async () => {
    const res = await request.post('/with-body')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(res.text).toEqual('<h1> Body Test pass</h1>');
  });
});
