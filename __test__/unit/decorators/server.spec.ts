import Metadata from '../../../classes/MetaData';
import Settings from '../../../classes/Settings';
import { Plug, RegisterModule, ServerSettings, Setting } from '../../../decorators/server';
import { BOOT_STAGES, BOOT_STAGES_KEY, REGISTERED_MODULE_KEY } from '../../../libs/constants';

describe('ServerSettings Decorator', () => {
  @ServerSettings({
    port: 8080
  })
  class Test {
  }

  test('should modify server settings', () => {
    const test = new Test();
    expect(Settings.getInstance().getOptions()).toEqual({ port: 8080 });
  });
});

describe('Plug Decorator', () => {
  beforeAll(() => {
    this.spyMetadataSet = jest.spyOn(Metadata, 'set');

    @Plug(BOOT_STAGES.APPLICATION, 'test', () => {
    })
    class Test {
    }

    this.TestClass = Test;
  });

  afterAll(() => {
    this.spyMetadataSet.mockRestore();
  });

  test('should attach plug to respective level', () => {
    this.testInstance = new this.TestClass();
    const args = this.spyMetadataSet.mock.calls[0];

    expect(args[0]).toEqual(BOOT_STAGES_KEY);
    expect(args[1]['2'][0]).toEqual(
      expect.objectContaining({
        name: 'test',
        required: false
      })
    );
    expect(args[2]).toEqual(this.TestClass);
  });
});

describe('Setting Decorator', () => {
  beforeEach(() => {
    @ServerSettings({
      test: 'this is a test string'
    })
    class Test {
      @Setting('test')
      test: string;
    }

    this.TestClass = Test;
  });

  afterEach(() => Settings.reset());

  test('should get setting test on instances', () => {
    const instance = new this.TestClass();
    expect(instance.test).toEqual('this is a test string');
  });
});

describe('RegisterModule Decorator', () => {
  beforeAll(() => {
    this.spyMetadataSet = jest.spyOn(Metadata, 'set');

    class Module {
    }

    class Test {
      @RegisterModule(Module)
      async start() {
      }
    }

    this.ModuleClass = Module;
    this.TestClass = Test;
  });

  afterAll(() => {
    this.spyMetadataSet.mockRestore();
  });

  test('should register a module', () => {
    this.testInstance = new this.TestClass();
    const args = this.spyMetadataSet.mock.calls[0];

    expect(args[0]).toEqual(REGISTERED_MODULE_KEY);
    expect(args[1]).toEqual([this.ModuleClass]);
  });
});
