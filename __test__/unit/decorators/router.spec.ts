import { Route, Get, Post, Put, Param, Patch, Delete, Middleware } from '../../../decorators/router';
import Metadata from '../../../classes/MetaData';
import { ROUTER_HANDLERS_KEY } from '../../../libs/constants';

const metadataMock = jest.spyOn(Metadata, 'set');

describe('Route Decorator', () => {
  beforeEach(() => {
    @Route('/test')
    class TestController {}

    this.TestClass = TestController;
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
});

describe('Middleware Decorator', () => {
  beforeEach(() => {
    @Middleware(() => null)
    class TestController {
      @Middleware(() => null)
      test() {}
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
      test() {}
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'get', route: '/getTest' }));
  });
});

describe('Post Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();
    @Route('/')
    class TestController {
      @Post('/post')
      test() {}
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'post', route: '/post' }));
  });
});

describe('Put Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();
    @Route('/')
    class TestController {
      @Put('/put')
      test() {}
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'put', route: '/put' }));
  });
});

describe('Patch Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();
    @Route('/')
    class TestController {
      @Patch('/patch')
      test() {}
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'patch', route: '/patch' }));
  });
});

describe('Param Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();
    @Route('/')
    class TestController {
      @Param('/param')
      test() {}
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'param', route: '/param' }));
  });
});

describe('Delete Decorator', () => {
  beforeEach(() => {
    metadataMock.mockReset();
    @Route('/')
    class TestController {
      @Delete('/delete')
      test() {}
    }

    this.Controller = TestController;
  });

  test('should call correctly the decorator', () => {
    this.controller = new this.Controller();
    expect(metadataMock).toHaveBeenCalled();
    expect(metadataMock.mock.calls[0][0]).toEqual(ROUTER_HANDLERS_KEY);
    expect(metadataMock.mock.calls[0][1][0]).toEqual(expect.objectContaining({ verb: 'delete', route: '/delete' }));
  });
});
