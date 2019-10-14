import { last } from 'lodash';
import Boot from '../../../classes/Boot';
import Metadata from '../../../classes/MetaData';
import Settings from '../../../classes/Settings';
import { Plug, Pour, RegisterModule, ServerSettings, Setting } from '../../../decorators/server';
import { BOOT_STAGES, BOOT_STAGES_KEY, PLUGINS_KEY, REGISTERED_MODULE_KEY } from '../../../libs/constants';
import Plugin, { mockRegister } from '../../__mocks__/plugin';

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
  beforeEach(() => {
    this.spyMetadataSet = jest.spyOn(Metadata, 'set');
  });

  afterEach(() => {
    this.spyMetadataSet.mockRestore();
  });

  test('should attach plug to respective level', () => {
    class TestPlugin extends Plugin {
    }

    @Pour(new TestPlugin())
    class Test {
    }

    this.testInstance = new Test();
    const args = last(this.spyMetadataSet.mock.calls) || [];

    expect(args).toBeDefined();
    expect(args[0]).toEqual(PLUGINS_KEY);
    expect(args[1][0]).toEqual(
      expect.objectContaining({
        name: 'Mocked',
        priority: 999
      })
    );
    expect(args[2]).toEqual(Test);
  });

  test.skip('should attach plug to respective level', () => {
    mockRegister.mockImplementation(() => {
      throw new Error();
      return;
    });

    class TestFailPlugin extends Plugin {
    }

    @Pour(new TestFailPlugin())
    class TestFail extends Boot {
    }

    this.testInstance = new TestFail();
    expect(this.testInstance.start()).toThrow();
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
