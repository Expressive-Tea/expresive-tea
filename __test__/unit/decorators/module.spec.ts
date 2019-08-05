import { Module } from '../../../decorators/module';

describe('Module Decorator', () => {
  beforeEach(() => {
    this.mockMountControler = jest.fn();
    this.Controller = jest.fn().mockImplementation(() => ({
      __mount: this.mockMountControler
    }));

    this.Provider = class Provider {
    };

    @Module({
      controllers: [this.Controller],
      mountpoint: '/',
      providers: [this.Provider]
    })
    class TestModule {
    }

    this.TestClass = TestModule;
  });

  test('should instanciate correctly', () => {
    const testModule = new this.TestClass();

    expect(testModule.settings).not.toBeUndefined();
    expect(this.Controller).toHaveBeenCalled();
  });

  test('should register the module on express route correctly', () => {
    const testModule = new this.TestClass();
    const server = {
      use: jest.fn()
    };

    expect(testModule.settings).not.toBeUndefined();

    testModule.__register(server);

    expect(server.use.mock.calls[0][0]).toEqual('/');
    expect(this.mockMountControler).toHaveBeenCalled();
  });
});
