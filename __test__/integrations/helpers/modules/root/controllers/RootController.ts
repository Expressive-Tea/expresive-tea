import { Get, Middleware, Post, Route } from '../../../../../../decorators/router';
import { body, next, request, response, param, query } from '../../../../../../decorators/annotations';
import { Response, Request } from 'express';
import { BadRequestException } from '../../../../../../exceptions/RequestExceptions';

@Route('/')
export default class RootController {
  @Get('/test')
  async index(): Promise<string> {
    return 'this is a test';
  }

  @Get('/test-number')
  async indexNumber(): Promise<number> {
    return 20;
  }

  @Get('/next')
  async next(@next next): Promise<string> {
    next();
    return 'this is a test';
  }

  @Get('/next-error')
  async nextError(@next next): Promise<string> {
    next(new Error('this is an error'));
    return 'this is a test';
  }

  @Get('/error')
  async withError(): Promise<string> {
    throw new Error('not pass');
    return 'this is a test';
  }

  @Get('/error-generic')
  async withErrorGeneric(): Promise<string> {
    throw new BadRequestException('not pass');
    return 'this is a test';
  }

  @Get('/request')
  async requestResponse(@request req: Request, @response res: Response): Promise<unknown> {
    return { req: Boolean(req), res: Boolean(res) };
  }

  @Get('/with-params/:userId')
  async withParams(@param('userId') userId: unknown): Promise<unknown> {
    return `<h1> Data Test ${userId}</h1>`;
  }

  @Get('/with-query')
  async indexQuery(@query('test') test: unknown): Promise<unknown> {
    return `<h1> Query Test ${test}</h1>`;
  }

  @Post('/with-body')
  @Middleware((req, res, next) => {
    req.body = { test: 'pass' };
    next();
  })
  async indexBody(@body('test') test: unknown): Promise<unknown> {
    return `<h1> Body Test ${test}</h1>`;
  }

  @Get('/with-number')
  async withNumber(): Promise<number> {
    return 300;
  }
}
