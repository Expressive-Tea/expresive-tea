import { NextFunction, Request, Response } from 'express';
import * as jestRequest from 'jest-express/lib/request';
import * as jestResponse from 'jest-express/lib/response';
import { autoResponse, extractParameters, mapArguments } from '../../../helpers/server';
import { ARGUMENT_TYPES } from '@expressive-tea/commons/constants';
import { ExpressiveTeaArgumentOptions } from '@expressive-tea/commons/interfaces';

describe('Server Helper', () => {

  describe('Extract Parameters', () => {
    let currentTarget;

    beforeEach(() => {
      currentTarget = {
        data: {
          favoriteColor: 'black'
        },
        password: 'b',
        user: 'a'
      };
    });

    test('should return empty if target and args are undefined', async () => {
      const result = extractParameters(undefined, undefined);
      expect(result).toBeUndefined();
    });

    test('should return whole object if arguments are undefined', async () => {
      const result = extractParameters(currentTarget, undefined);
      expect(result).toEqual(currentTarget);
    });

    test('should return value of the selected parameter', async () => {
      const result = extractParameters(currentTarget, 'password');
      expect(result).toEqual('b');
    });

    test('should return partial object from current target object', async () => {
      const result = extractParameters(currentTarget, ['user', 'password']);
      expect(result).toEqual({ user: 'a', password: 'b' });
    });

  });

  describe('Map Arguments', () => {
    let request: any;
    let response: any;
    let next: NextFunction;

    beforeEach(() => {
      request = new jestRequest.Request('/');
      response = new jestResponse.Response();
      next = () => {
      };
    });

    afterEach(() => {
      request.resetMocked();
      response.resetMocked();
    });

    test('should get the normal express arguments', async () => {
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [];

      const result = mapArguments(
        decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([request, response, next]);
    });

    test('should get normal express arguments if type does not exits', async () => {
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          index: 0,
          key: 'test',
          type: Symbol('test')
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([undefined]);
    });

    test('should get the request object', async () => {
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.REQUEST
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([request]);
    });

    test('should get the response object', async () => {
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.RESPONSE
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([response]);
    });

    test('should get the next object', async () => {
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.NEXT
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([next]);
    });

    test('should get one parameter from query object', async () => {
      request.setQuery({
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          arguments: 'queryParam',
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.QUERY
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual(['queryParam']);
    });

    test('should get multiple parameters from query object', async () => {
      request.setQuery({
        firstParam: 'firstParam',
        queryParam: 'queryParam',
        thirdQuery: 'thirdQuery'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          arguments: ['queryParam', 'thirdQuery'],
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.QUERY
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([{
        queryParam: 'queryParam',
        thirdQuery: 'thirdQuery'
      }]);
    });

    test('should get all query object', async () => {
      request.setQuery({
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.QUERY
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([{
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      }]);
    });

    test('should get one parameter from body object', async () => {
      request.setBody({
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          arguments: 'queryParam',
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.BODY
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual(['queryParam']);
    });

    test('should get multiple parameters from body object', async () => {
      request.setBody({
        firstParam: 'firstParam',
        queryParam: 'queryParam',
        thirdQuery: 'thirdQuery'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          arguments: ['queryParam', 'thirdQuery'],
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.BODY
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([{
        queryParam: 'queryParam',
        thirdQuery: 'thirdQuery'
      }]);
    });

    test('should get all body object', async () => {
      request.setBody({
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.BODY
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([{
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      }]);
    });

    test('should get one parameter from params object', async () => {
      request.setParams({
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          arguments: 'queryParam',
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.GET_PARAM
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual(['queryParam']);
    });

    test('should get multiple parameters from params object', async () => {
      request.setParams({
        firstParam: 'firstParam',
        queryParam: 'queryParam',
        thirdQuery: 'thirdQuery'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          arguments: ['queryParam', 'thirdQuery'],
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.GET_PARAM
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([{
        queryParam: 'queryParam',
        thirdQuery: 'thirdQuery'
      }]);
    });

    test('should get all query params', async () => {
      request.setParams({
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      });
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = [
        {
          index: 0,
          key: 'test',
          type: ARGUMENT_TYPES.GET_PARAM
        }
      ];

      const result = mapArguments(decoratedArguments,
        request as Request,
        response as Response,
        next);

      expect(result).toEqual([{
        firstParam: 'firstParam',
        queryParam: 'queryParam'
      }]);
    });

  });

  describe('Auto Response', () => {
    let request: any;
    let response: any;

    beforeEach(() => {
      request = new jestRequest.Request('/');
      response = new jestResponse.Response();
    });

    afterEach(() => {
      request.resetMocked();
      response.resetMocked();
    });

    test.each`
      result              | annotations     | expected     | title
      ${'text'}           | ${null}         | ${['text']}  | ${' send text'}
      ${'<h1>Title</h1>'} | ${null}         | ${['<h1>Title</h1>']} | ${' send html'}
      ${{ a: 'a' }}         | ${null}         | ${[{ a: 'a' }]} | ${' send object'}
      ${['text']}         | ${null}         | ${[['text']]} | ${' send array'}
      ${{ a: 'a' }}         | ${[{ type: 'view', arguments: ['test'] }]} | ${['test', { a: 'a' }]} | ${' render a view'}
    `('should response', ({ result, annotations, expected }) => {
      autoResponse(request, response, annotations, result);

      if (annotations) {
        expect(response.render).toHaveBeenLastCalledWith(...expected);
      } else {
        expect(response.send).toHaveBeenLastCalledWith(...expected);
      }
    });
  });
});
