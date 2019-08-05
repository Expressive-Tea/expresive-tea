import * as express from 'express';
import Metadata from '../../../classes/MetaData';
import { Delete, Get, Middleware, Param, Patch, Post, Put, Route } from '../../../decorators/router';
import { ROUTER_HANDLERS_KEY } from '../../../libs/constants';

const metadataMock = jest.spyOn(Metadata, 'set');
jest.mock('express', () => ({
  Router: () => ({
    get: jest.fn(),
    use: jest.fn()
  })
}));

describe('Route Decorator', () => {
  beforeEach(() => {
    @Route('/test')
    class TestController {
      @Get('/start')
      start() {
      }
    }

    @Route()
    class TestDefaultController {
    }

    this.TestClass = TestController;
    this.TestDefault = TestDefaultController;
  });

  test('should instanciate correctly', () => {
    const test = new this.TestClass();

    expect(test.__mount).not.toBeUndefined();
  });

  test('should register the module on express route correctly', () => {
    const test = new this.TestClass();
    const router = {
      use: jest.fn()
    };

    expect(test.__mount).not.toBeUndefined();

    test.__mount(router);

    expect(router.use.mock.calls[0][0]).toEqual('/test');
  });

  test('should assign handlers', () => {

    const test = new this.TestClass();
    const router = express.Router();

    test.__mount(router);

    expect(test.router.get).toHaveBeenCalledWith('/start', expect.anything());
    expect(router.use).toHaveBeenCalledWith('/test', expect.anything());

  });

  test('should default route', () => {
    const test = new this.TestDefault();
    const router = express.Router();

    test.__mount(router);
    expect(router.use).toHaveBeenCalledWith('/', expect.anything());
  });
});

describe('Middleware Decorator', () => {
  beforeEach(() => {
    @Middleware(() => null)
    class TestController {
      @Middleware(() => null)
      test() {
      }
    }

    this.TestClass = TestController;
  });

  test('should call middleware root correctly', () => {
    expect(metadataMock).toBeCalled();
  });

  test('should register endpoint middleware correctly', () => {
    const test = new this.TestClass();

    expect(test.test.$middlewares).not.toBeUndefined();
    expect(test.test.$middlewares.length).toEqual(1);
  });
});

describe('Get Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();

    @Route('/')
    class TestController {
      @Get('/getTest')
      test() {
      }
      @Get()
      default() {
      }
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'get', route: '/getTest' }));
    expect(metadataMock.mock.calls[1][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[1][1][0]).toEqual(expect.objectContaining({ verb: 'get', route: '*' }));
  });
});

describe('Post Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();

    @Route('/')
    class TestController {
      @Post('/post')
      test() {
      }
      @Post()
      default() {
      }
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'post', route: '/post' }));
    expect(metadataMock.mock.calls[1][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[1][1][0]).toEqual(expect.objectContaining({ verb: 'post', route: '*' }));
  });
});

describe('Put Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();

    @Route('/')
    class TestController {
      @Put('/put')
      test() {
      }
      @Put()
      default() {
      }
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'put', route: '/put' }));
    expect(metadataMock.mock.calls[1][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[1][1][0]).toEqual(expect.objectContaining({ verb: 'put', route: '*' }));
  });
});

describe('Patch Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();

    @Route('/')
    class TestController {
      @Patch('/patch')
      test() {
      }
      @Patch()
      default() {
      }
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'patch', route: '/patch' }));
    expect(metadataMock.mock.calls[1][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[1][1][0]).toEqual(expect.objectContaining({ verb: 'patch', route: '*' }));
  });
});

describe('Param Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();

    @Route('/')
    class TestController {
      @Param('/param')
      test() {
      }
      @Param()
      default() {
      }
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'param', route: '/param' }));
    expect(metadataMock.mock.calls[1][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[1][1][0]).toEqual(expect.objectContaining({ verb: 'param', route: '*' }));
  });
});

describe('Delete Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();

    @Route('/')
    class TestController {
      @Delete('/delete')
      test() {
      }
      @Delete()
      default() {
      }
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'delete', route: '/delete' }));
    expect(metadataMock.mock.calls[1][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[1][1][0]).toEqual(expect.objectContaining({ verb: 'delete', route: '*' }));
  });
});
