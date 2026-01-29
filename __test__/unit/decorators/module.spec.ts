import { Module } from '../../../decorators/module';

describe('Module Decorator', () => {
  let Controller;
  let mockMountController;
  let MockProvider;
  let TestClass;

  beforeEach(() => {
    mockMountController = jest.fn();
    Controller = jest.fn().mockImplementation(() => ({
      __mount: mockMountController
    }));

    MockProvider = class Provider {
    };

    @Module({
      controllers: [Controller],
      mountpoint: '/',
      providers: [MockProvider]
    })
    class TestModule {
    }

    TestClass = TestModule;
  });

  test('should instanciate correctly', () => {
    const testModule = new TestClass();

    expect(testModule.settings).not.toBeUndefined();
    expect(Controller).toHaveBeenCalled();
  });

  test('should register the module on express route correctly', () => {
    const testModule = new TestClass();
    const server = {
      use: jest.fn()
    };

    expect(testModule.settings).not.toBeUndefined();

    testModule.__register(server);

    expect(server.use.mock.calls[0][0]).toEqual('/');
    expect(mockMountController).toHaveBeenCalled();
  });
});
