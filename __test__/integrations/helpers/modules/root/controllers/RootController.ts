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
  async next(@next nextFunction): Promise<string> {
    nextFunction();
    return 'this is a test';
  }

  @Get('/next-error')
  async nextError(@next nextFunction): Promise<string> {
    nextFunction(new Error('this is an error'));
    return 'this is a test';
  }

  @Get('/error')
  async withError(): Promise<string> {
    throw new Error('not pass');
  }

  @Get('/error-generic')
  async withErrorGeneric(): Promise<string> {
    throw new BadRequestException('not pass');
  }

  @Get('/request')
  async requestResponse(@request req: Request, @response res: Response): Promise<unknown> {
    return { req: Boolean(req), res: Boolean(res) };
  }

  @Get('/with-params/:userId')
  async withParams(@param('userId') userId: string): Promise<string> {
    return `<h1> Data Test ${userId}</h1>`;
  }

  @Get('/with-query')
  async indexQuery(@query('test') test: string): Promise<string> {
    return `<h1> Query Test ${test}</h1>`;
  }

  @Post('/with-body')
  @Middleware((req, res, next) => {
    req.body = { test: 'pass' };
    next();
  })
  async indexBody(@body('test') test: string): Promise<string> {
    return `<h1> Body Test ${test}</h1>`;
  }

  @Get('/with-number')
  async withNumber(): Promise<number> {
    return 300;
  }
}
