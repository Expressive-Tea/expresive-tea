/**
 * Unit tests for decorators/annotations.ts
 *
 * Tests the parameter decorators that inject Express request data
 * (@request, @response, @next, @query, @body, @param) into controller methods.
 */
import 'reflect-metadata';
import { Metadata } from '@expressive-tea/commons';
import { ARGUMENT_TYPES, ARGUMENTS_KEY } from '@expressive-tea/commons';
import { request, response, next, query, body, param } from '../../../decorators/annotations';

describe('Annotations - Parameter Decorators', () => {
  let spyMetadataGet: ReturnType<typeof vi.spyOn>;
  let spyMetadataSet: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    spyMetadataGet = vi.spyOn(Metadata, 'get').mockReturnValue([]);
    spyMetadataSet = vi.spyOn(Metadata, 'set');
  });

  afterEach(() => {
    spyMetadataSet.mockRestore();
    spyMetadataGet.mockRestore();
  });

  describe('@request decorator', () => {
    test('should register REQUEST argument type in metadata', () => {
      class TestController {
        getUser(@request req: any) {
          return req;
        }
      }

      // Apply decorator manually to simulate TypeScript decorator application
      request(TestController.prototype, 'getUser', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[0]).toBe(ARGUMENTS_KEY);
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.REQUEST,
        index: 0,
        key: 'getUser'
      });
    });

    test('should not include extra arguments in metadata for @request', () => {
      const target = {};
      request(target, 'method', 0);

      const setCall = spyMetadataSet.mock.calls[0];
      expect(setCall[1][0].arguments).toBeUndefined();
    });
  });

  describe('@response decorator', () => {
    test('should register RESPONSE argument type in metadata', () => {
      const target = {};
      response(target, 'method', 1);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[0]).toBe(ARGUMENTS_KEY);
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.RESPONSE,
        index: 1,
        key: 'method'
      });
    });

    test('should unshift into existing arguments array', () => {
      const existingArgs = [{ type: ARGUMENT_TYPES.REQUEST, index: 0, key: 'method' }];
      spyMetadataGet.mockReturnValue(existingArgs);

      const target = {};
      response(target, 'method', 1);

      const setCall = spyMetadataSet.mock.calls[0];
      expect(setCall[1]).toHaveLength(2);
      expect(setCall[1][0].type).toBe(ARGUMENT_TYPES.RESPONSE); // unshifted
    });
  });

  describe('@next decorator', () => {
    test('should register NEXT argument type in metadata', () => {
      const target = {};
      next(target, 'method', 2);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[0]).toBe(ARGUMENTS_KEY);
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.NEXT,
        index: 2,
        key: 'method'
      });
    });
  });

  describe('@query decorator', () => {
    test('should register QUERY argument type without parameter', () => {
      const target = {};
      query()(target, 'method', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[0]).toBe(ARGUMENTS_KEY);
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.QUERY,
        index: 0,
        key: 'method',
        arguments: undefined
      });
    });

    test('should register QUERY with a single string parameter', () => {
      const target = {};
      query('username')(target, 'method', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.QUERY,
        arguments: 'username'
      });
    });

    test('should register QUERY with an array of parameters', () => {
      const target = {};
      query(['username', 'password'])(target, 'method', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.QUERY,
        arguments: ['username', 'password']
      });
    });

    test('should return a ParameterDecorator function', () => {
      const decorator = query('test');
      expect(typeof decorator).toBe('function');
    });
  });

  describe('@body decorator', () => {
    test('should register BODY argument type without parameter', () => {
      const target = {};
      body()(target, 'method', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[0]).toBe(ARGUMENTS_KEY);
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.BODY,
        index: 0,
        arguments: undefined
      });
    });

    test('should register BODY with a single field name', () => {
      const target = {};
      body('email')(target, 'method', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.BODY,
        arguments: 'email'
      });
    });

    test('should register BODY with multiple field names', () => {
      const target = {};
      body(['email', 'password'])(target, 'method', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.BODY,
        arguments: ['email', 'password']
      });
    });
  });

  describe('@param decorator', () => {
    test('should register GET_PARAM argument type with parameter name', () => {
      const target = {};
      param('id')(target, 'method', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[0]).toBe(ARGUMENTS_KEY);
      expect(args[1][0]).toMatchObject({
        type: ARGUMENT_TYPES.GET_PARAM,
        index: 0,
        arguments: 'id'
      });
    });

    test('should return a ParameterDecorator function', () => {
      const decorator = param('userId');
      expect(typeof decorator).toBe('function');
    });

    test('should store the parameter name in arguments', () => {
      const target = {};
      param('userId')(target, 'getUser', 0);

      const args = spyMetadataSet.mock.calls[0];
      expect(args[1][0].arguments).toBe('userId');
    });
  });

  describe('Multiple decorators on same method', () => {
    test('should accumulate decorators in the correct order', () => {
      const existingArgs = [
        { type: ARGUMENT_TYPES.REQUEST, index: 0, key: 'method', arguments: undefined }
      ];
      spyMetadataGet.mockReturnValue(existingArgs);

      const target = {};
      // Add response decorator at index 1 (should be unshifted before request)
      response(target, 'method', 1);

      const setCall = spyMetadataSet.mock.calls[0];
      expect(setCall[1]).toHaveLength(2);
      // response was unshifted, so it appears first in the array
      expect(setCall[1][0].type).toBe(ARGUMENT_TYPES.RESPONSE);
      expect(setCall[1][0].index).toBe(1);
    });

    test('should use correct method key as metadata property key', () => {
      const target = {};
      request(target, 'createUser', 0);

      const setCall = spyMetadataSet.mock.calls[0];
      // 4th argument to Metadata.set is the property key
      expect(setCall[3]).toBe('createUser');
    });
  });
});
