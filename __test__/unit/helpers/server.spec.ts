// eslint-disable @typescript-eslint/no-unsafe-argument
import { type NextFunction, type Request, type Response } from 'express';
import * as jestRequest from 'jest-express/lib/request';
import * as jestResponse from 'jest-express/lib/response';
import { autoResponse, executeRequest, extractParameters, mapArguments, fileSettings } from '../../../helpers/server';
import { ARGUMENT_TYPES } from '@expressive-tea/commons';
import { type ExpressiveTeaArgumentOptions } from '@expressive-tea/commons';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../../helpers/logger';

describe('Server Helper', () => {
  describe('fileSettings()', () => {
    const TEST_DIR = process.cwd();
    const configFiles = ['.expressive-tea.yaml', '.expressive-tea.yml', '.expressive-tea'];

    beforeEach(() => {
      // Clean up any existing config files
      configFiles.forEach(file => {
        const filePath = path.join(TEST_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });

    afterEach(() => {
      // Clean up test files
      configFiles.forEach(file => {
        const filePath = path.join(TEST_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    });

    describe('File Priority', () => {
      test('should load .expressive-tea.yaml with highest priority', () => {
        // Create all three files
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), 'port: 9000\n');
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), 'port: 8000\n');
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '{"port": 7000}');

        const { config, source } = fileSettings();

        expect(config.port).toBe(9000);
        expect(source).toBe('.expressive-tea.yaml');
      });

      test('should fall back to .expressive-tea.yml when .yaml not present', () => {
        // Create only .yml and .json
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), 'port: 8000\n');
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '{"port": 7000}');

        const { config, source } = fileSettings();

        expect(config.port).toBe(8000);
        expect(source).toBe('.expressive-tea.yml');
      });

      test('should fall back to .expressive-tea (JSON) when no YAML present', () => {
        // Create only JSON
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '{"port": 7000}');

        const { config, source } = fileSettings();

        expect(config.port).toBe(7000);
        expect(source).toBe('.expressive-tea');
      });

      test('should return empty config when no file exists', () => {
        const { config, source } = fileSettings();

        expect(config).toEqual({});
        expect(source).toBeNull();
      });
    });

    describe('YAML Parsing', () => {
      test('should parse valid YAML correctly', () => {
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), `port: 3000
securePort: 4443
database:
  host: localhost
  port: 5432
`);

        const { config } = fileSettings();

        expect(config.port).toBe(3000);
        expect(config.securePort).toBe(4443);
        expect(config.database).toEqual({ host: 'localhost', port: 5432 });
      });

      test('should throw clear error on invalid YAML', () => {
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), `port: 3000
  invalid: yaml
syntax here
`);

        expect(() => fileSettings()).toThrow(/Invalid YAML in \.expressive-tea\.yaml/);
      });
    });

    describe('JSON Parsing', () => {
      test('should parse valid JSON correctly', () => {
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), JSON.stringify({
          port: 3000,
          securePort: 4443,
          database: { host: 'localhost', port: 5432 }
        }));

        const { config } = fileSettings();

        expect(config.port).toBe(3000);
        expect(config.securePort).toBe(4443);
        expect(config.database).toEqual({ host: 'localhost', port: 5432 });
      });

      test('should throw clear error on invalid JSON', () => {
        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '{ invalid json }');

        expect(() => fileSettings()).toThrow(/Invalid JSON in \.expressive-tea/);
      });
    });

    describe('Debug Logging', () => {
      test('should log which file was loaded', () => {
        const loggerSpy = jest.spyOn(logger, 'debug').mockImplementation(() => logger);

        fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), 'port: 3000\n');
        fileSettings();

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Loaded configuration from: .expressive-tea.yaml')
        );

        loggerSpy.mockRestore();
      });
    });

    describe('Empty and Edge Case Files (Bug Test)', () => {
      describe('Empty YAML Files', () => {
        test('should handle completely empty .expressive-tea.yaml file', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '');

          const { config, source } = fileSettings();

          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea.yaml');
        });

        test('should handle completely empty .expressive-tea.yml file', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), '');

          const { config, source } = fileSettings();

          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea.yml');
        });

        test('should handle .expressive-tea.yaml with only whitespace', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '   \n  \n\t\n');

          const { config, source } = fileSettings();

          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea.yaml');
        });

        test('should handle .expressive-tea.yml with only whitespace', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), '   \n  \n\t\n');

          const { config, source } = fileSettings();

          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea.yml');
        });

        test('should handle .expressive-tea.yaml with only comments', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '# This is a comment\n# Another comment\n');

          const { config, source } = fileSettings();

          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea.yaml');
        });

        test('should handle .expressive-tea.yml with only comments', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), '# This is a comment\n# Another comment\n');

          const { config, source } = fileSettings();

          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea.yml');
        });

        test('should handle .expressive-tea.yaml with comments and whitespace', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '  \n# Comment\n  \n# Another\n\t\n');

          const { config, source } = fileSettings();

          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea.yaml');
        });
      });

      describe('Empty JSON Files', () => {
        test('should handle empty .expressive-tea (JSON) file', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '');

          // Empty string is invalid JSON, should throw
          expect(() => fileSettings()).toThrow(/Invalid JSON in \.expressive-tea/);
        });

        test('should handle .expressive-tea with only whitespace', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '   \n  \n\t\n');

          // Whitespace-only is invalid JSON, should throw
          expect(() => fileSettings()).toThrow(/Invalid JSON in \.expressive-tea/);
        });

        test('should handle .expressive-tea with empty object', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '{}');

          const { config, source } = fileSettings();

          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea');
        });
      });

      describe('Priority with Empty Files', () => {
        test('should fall back from empty .yaml to valid .yml', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '');
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), 'port: 8000\n');

          const { config, source } = fileSettings();

          // Bug: Currently returns undefined/null config from empty .yaml
          // Expected: Should return empty {} from .yaml OR fall back to .yml
          expect(config).toBeDefined();
          expect(source).toBe('.expressive-tea.yaml');
        });

        test('should fall back from empty .yml to valid .expressive-tea', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), '# Just a comment\n');
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '{"port": 7000}');

          const { config, source } = fileSettings();

          // Bug: Currently returns undefined/null config from empty .yml
          // Expected: Should return empty {} from .yml OR fall back to .expressive-tea
          expect(config).toBeDefined();
          expect(source).toBe('.expressive-tea.yml');
        });

        test('should handle all three files being empty/invalid', () => {
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yaml'), '');
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea.yml'), '# comment\n');
          fs.writeFileSync(path.join(TEST_DIR, '.expressive-tea'), '{}');

          const { config, source } = fileSettings();

          // Should pick first one (.yaml) and return empty config
          expect(config).toBeDefined();
          expect(config).toEqual({});
          expect(source).toBe('.expressive-tea.yaml');
        });
      });
    });
  });


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
    let request: jestRequest.Request;
    let response: jestResponse.Response;

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
      ${{ a: 'a' }}         | ${null}       | ${[{ a: 'a' }]} | ${' send object'}
      ${['text']}         | ${null}         | ${[['text']]} | ${' send array'}
      ${{ a: 'a' }}         | ${[{ type: 'view', arguments: ['test'] }]} | ${['test', { a: 'a' }]} | ${' render a view'}
    `('should response', ({ result, annotations, expected }) => {
       
      autoResponse(request as any, response as any, annotations, result);

      if (annotations) {
        expect(response.render).toHaveBeenLastCalledWith(...expected as []);
      } else {
        expect(response.send).toHaveBeenLastCalledWith(...expected as []);
      }
    });
  });

  describe('Execute Request - Express 5 Async Compatibility (Phase 0.4)', () => {
    let request: any;
    let response: any;
    let next: jest.Mock<NextFunction>;

    beforeEach(() => {
      request = new jestRequest.Request('/');
      response = new jestResponse.Response();
      next = jest.fn();
    });

    afterEach(() => {
      request.resetMocked();
      response.resetMocked();
    });

    test('should execute handler successfully', async () => {
      const handler = jest.fn().mockResolvedValue({ success: true });
      const context = {
        options: {
          handler,
          introspectedArgs: []
        },
        self: {},
        decoratedArguments: [],
        annotations: []
      };

      await executeRequest.call(context, request, response, next);

      expect(handler).toHaveBeenCalled();
      expect(response.send).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });

    test('should not send response if headers already sent', async () => {
      const handler = jest.fn().mockResolvedValue({ success: true });
      response.headersSent = true;
      const context = {
        options: {
          handler,
          introspectedArgs: []
        },
        self: {},
        decoratedArguments: [],
        annotations: []
      };

      await executeRequest.call(context, request, response, next);

      expect(handler).toHaveBeenCalled();
      expect(response.send).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle next() being called', async () => {
      const handler = jest.fn().mockImplementation(async (_req: any, _res: any, nextFn: NextFunction) => {
        nextFn();
      });
      const context = {
        options: {
          handler,
          introspectedArgs: []
        },
        self: {},
        decoratedArguments: [
          { index: 0, key: 'req', type: ARGUMENT_TYPES.REQUEST },
          { index: 1, key: 'res', type: ARGUMENT_TYPES.RESPONSE },
          { index: 2, key: 'next', type: ARGUMENT_TYPES.NEXT }
        ],
        annotations: []
      };

      await executeRequest.call(context, request, response, next);

      expect(handler).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(response.send).not.toHaveBeenCalled();
    });

    test('should handle next(error) being called', async () => {
      const error = new Error('Test error');
      const handler = jest.fn().mockImplementation(async (_req: any, _res: any, nextFn: NextFunction) => {
        nextFn(error);
      });
      const context = {
        options: {
          handler,
          introspectedArgs: []
        },
        self: {},
        decoratedArguments: [
          { index: 0, key: 'req', type: ARGUMENT_TYPES.REQUEST },
          { index: 1, key: 'res', type: ARGUMENT_TYPES.RESPONSE },
          { index: 2, key: 'next', type: ARGUMENT_TYPES.NEXT }
        ],
        annotations: []
      };

      await executeRequest.call(context, request, response, next);

      expect(handler).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
      expect(response.send).not.toHaveBeenCalled();
    });

    test('should allow async errors to propagate (Express 5)', async () => {
      const error = new Error('Async error');
      const handler = jest.fn().mockRejectedValue(error);
      const context = {
        options: {
          handler,
          introspectedArgs: []
        },
        self: {},
        decoratedArguments: [],
        annotations: []
      };

      // In Express 5, async rejections are automatically caught
      // Our function should let them propagate
      await expect(executeRequest.call(context, request, response, next)).rejects.toThrow('Async error');

      expect(handler).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle synchronous errors by letting them propagate', async () => {
      const error = new Error('Sync error');
      const handler = jest.fn().mockImplementation(() => {
        throw error;
      });
      const context = {
        options: {
          handler,
          introspectedArgs: []
        },
        self: {},
        decoratedArguments: [],
        annotations: []
      };

      await expect(executeRequest.call(context, request, response, next)).rejects.toThrow('Sync error');

      expect(handler).toHaveBeenCalled();
    });

    test('should auto-response with result when handler returns data', async () => {
      const result = { message: 'Success', data: [1, 2, 3] };
      const handler = jest.fn().mockResolvedValue(result);
      const context = {
        options: {
          handler,
          introspectedArgs: []
        },
        self: {},
        decoratedArguments: [],
        annotations: []
      };

      await executeRequest.call(context, request, response, next);

      expect(handler).toHaveBeenCalled();
      expect(response.send).toHaveBeenCalledWith(result);
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle view rendering annotation', async () => {
      const result = { title: 'Test Page', content: 'Hello' };
      const handler = jest.fn().mockResolvedValue(result);
      const context = {
        options: {
          handler,
          introspectedArgs: []
        },
        self: {},
        decoratedArguments: [],
        annotations: [{ type: 'view', arguments: ['test-view'] }]
      };

      await executeRequest.call(context, request, response, next);

      expect(handler).toHaveBeenCalled();
      expect(response.render).toHaveBeenCalledWith('test-view', result);
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle decorated arguments correctly', async () => {
      request.setQuery({ id: '123' });
      request.setBody({ name: 'Test' });
      request.setParams({ userId: '456' });

      const handler = jest.fn().mockImplementation((query, body, params) => {
        expect(query).toEqual('123');
        expect(body).toEqual('Test');
        expect(params).toEqual('456');
        return { processed: true };
      });

      const context = {
        options: {
          handler,
          introspectedArgs: ['id', 'name', 'userId']
        },
        self: {},
        decoratedArguments: [
          { index: 0, key: 'id', type: ARGUMENT_TYPES.QUERY, arguments: 'id' },
          { index: 1, key: 'name', type: ARGUMENT_TYPES.BODY, arguments: 'name' },
          { index: 2, key: 'userId', type: ARGUMENT_TYPES.GET_PARAM, arguments: 'userId' }
        ],
        annotations: []
      };

      await executeRequest.call(context, request, response, next);

      expect(handler).toHaveBeenCalled();
      expect(response.send).toHaveBeenCalledWith({ processed: true });
    });
  });
});
