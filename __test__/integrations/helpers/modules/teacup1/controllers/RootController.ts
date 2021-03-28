import { Get, Middleware, Post, Route } from '../../../../../../decorators/router';
import { body } from '../../../../../../decorators/annotations';

@Route('/')
export default class RootController {
  @Get('/test')
  async index(): Promise<string> {
    return 'this is a teacup1';
  }

  @Post('/test')
  @Middleware((req, res, next) => {
    req.body = {test: 'pass teacup1'};
    next();
  })
  async indexBody(@body('test') test: unknown ): Promise<unknown> {
    return `<h1> Body Test ${test}</h1>`;
  }
}
