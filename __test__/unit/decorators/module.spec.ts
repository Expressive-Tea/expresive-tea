import { Module } from '../../../decorators/module';

describe('Module Decorator', () => {
  beforeEach(() => {
    @Module({
      controllers: [],
      providers: [],
      mountpoint: '/'
    })
    class TestModule {}

    this.TestClass = TestModule;
  });

  test('should instanciate correctly', () => {
    const testModule = new this.TestClass();

    expect(testModule.settings).not.toBeUndefined();
  });

  test('should register the module on express route correctly', () => {
    const testModule = new this.TestClass();
    const server = {
      use: jest.fn()
    };

    expect(testModule.settings).not.toBeUndefined();

    testModule.__register(server);

    expect(server.use.mock.calls[0][0]).toEqual('/');
  });
});
