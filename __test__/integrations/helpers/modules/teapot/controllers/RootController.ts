import { Get, Middleware, Post, Route } from '../../../../../../decorators/router';
import { body } from '../../../../../../decorators/annotations';

@Route('/')
export default class RootController {
  @Get('/test')
  async index(): Promise<string> {
    return 'this is a test';
  }

  @Post('/with-body')
  @Middleware((req, res, next) => {
    req.body = {test: 'pass'};
    next();
  })
  async indexBody(@body('test') test: unknown ): Promise<unknown> {
    return `<h1> Body Test ${test}</h1>`;
  }
}
