import Boot from '../../../classes/Boot';
import Metadata from '../../../classes/MetaData';
import ExpressiveTeaPlugin from '../../../classes/Plugin';
import Settings from '../../../classes/Settings';
import { Plug, Pour, RegisterModule, ServerSettings, Setting } from '../../../decorators/server';
import { BOOT_STAGES, BOOT_STAGES_KEY, REGISTERED_MODULE_KEY } from '../../../libs/constants';

describe('ServerSettings Decorator', () => {
  test('should modify server settings', () => {
    @ServerSettings({
      port: 8080
    })
    class Test {
    }

    this.testClass = new Test();
    expect(Settings.getInstance().getOptions()).toEqual({ port: 8080 });
  });

  test('should modify server settings as default options', () => {
    Settings.reset();

    @ServerSettings()
    class Test {
    }

    this.testClass = new Test();
    expect(Settings.getInstance().getOptions()).toEqual({ port: 3000 });
  });
});

describe('Plug Decorator', () => {
  beforeAll(() => {
    this.spyMetadataSet = jest.spyOn(Metadata, 'set');

    @Plug(BOOT_STAGES.APPLICATION, 'test', () => {
    })
    @Plug(BOOT_STAGES.APPLICATION, '', () => {
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

describe('Pour Decorator', () => {
  beforeAll(() => {
    this.spyMetadataSet = jest.spyOn(Metadata, 'set');

    class TestPlugin extends ExpressiveTeaPlugin {
      readonly name = 'Test';
      readonly stage = BOOT_STAGES.INITIALIZE_MIDDLEWARES;

      async register(server, settings) {
      }
    }

    class TestFailPlugin extends ExpressiveTeaPlugin {
      readonly name = 'Test';
      readonly stage = BOOT_STAGES.INITIALIZE_MIDDLEWARES;
      readonly required = true;
    }

    @Pour(TestPlugin)
    class Test {
    }

    @Pour(TestFailPlugin)
    class TestFail extends Boot {
    }

    this.TestClass = Test;
    this.TestFailClass = TestFail;
  });

  afterAll(() => {
    this.spyMetadataSet.mockRestore();
  });

  test('should attach plug to respective level', () => {
    this.testInstance = new this.TestClass();
    const args = this.spyMetadataSet.mock.calls[0];

    expect(args[0]).toEqual(BOOT_STAGES_KEY);
    expect(args[1]['1'][0]).toEqual(
      expect.objectContaining({
        isPlugin: true,
        name: 'Test',
        required: false
      })
    );
    expect(args[2]).toEqual(this.TestClass);
  });

  test('should attach plug to respective level', () => {
    this.testInstance = new this.TestFailClass();
    expect(this.testInstance.start()).rejects.toEqual(expect.anything());
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
