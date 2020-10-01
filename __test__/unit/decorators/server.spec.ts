import { last } from 'lodash';
import Boot from '../../../classes/Boot';
import Metadata from '../../../classes/MetaData';
import Settings from '../../../classes/Settings';
import {
  ExpressDirecive,
  Plug,
  Pour,
  RegisterModule,
  ServerSettings,
  Setting,
  Static
} from '../../../decorators/server';
import {
  BOOT_STAGES,
  BOOT_STAGES_KEY,
  PLUGINS_KEY, REGISTERED_DIRECTIVES_KEY,
  REGISTERED_MODULE_KEY,
  REGISTERED_STATIC_KEY
} from '../../../libs/constants';
import Plugin from '../../__mocks__/plugin';

describe('ServerSettings Decorator', () => {
  let testClass;
  test('should modify server settings', () => {
    @ServerSettings({
      port: 8080
    })
    class Test {
    }

    testClass = new Test();
    expect(Settings.getInstance().getOptions()).toEqual({ port: 8080, securePort: 4443 });
  });

  test('should modify server settings as default options', () => {
    Settings.reset();

    @ServerSettings()
    class Test {
    }

    testClass = new Test();
    expect(Settings.getInstance().getOptions()).toEqual({ port: 3000, securePort: 4443 });
  });
});

describe('Plug Decorator', () => {
  let TestClass;
  let spyMetadataSet;

  beforeAll(() => {
    spyMetadataSet = jest.spyOn(Metadata, 'set');

    @Plug(BOOT_STAGES.APPLICATION, 'test', () => {
    })
    @Plug(BOOT_STAGES.APPLICATION, '', () => {
    })
    class Test {
    }

    TestClass = Test;
  });

  afterAll(() => {
    spyMetadataSet.mockRestore();
  });

  test('should attach plug to respective level', () => {
    const testInstance = new TestClass();
    const args = spyMetadataSet.mock.calls[0];

    expect(args[0]).toEqual(BOOT_STAGES_KEY);
    expect(args[1]['2'][0]).toEqual(
      expect.objectContaining({
        name: 'test',
        required: false
      })
    );
    expect(args[2]).toEqual(TestClass);
  });
});

describe('Pour Decorator', () => {
  let spyMetadataSet;
  beforeEach(() => {
    spyMetadataSet = jest.spyOn(Metadata, 'set');
  });

  afterEach(() => {
    spyMetadataSet.mockRestore();
  });

  test('should attach plug to respective level', () => {
    @Pour(Plugin)
    class Test {
    }

    const testInstance = new Test();
    const args: any[] = last(spyMetadataSet.mock.calls) || [];

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
});

describe('Setting Decorator', () => {
  let TestClass;

  beforeEach(() => {
    @ServerSettings({
      test: 'this is a test string'
    })
    class Test {
      @Setting('test')
      test: string;
    }

    TestClass = Test;
  });

  afterEach(() => Settings.reset());

  test('should get setting test on instances', () => {
    const instance = new TestClass();
    expect(instance.test).toEqual('this is a test string');
  });
});

describe('RegisterModule Decorator', () => {
  let spyMetadataSet;

  beforeEach(() => {
    spyMetadataSet = jest.spyOn(Metadata, 'set');
  });

  afterEach(() => {
    spyMetadataSet.mockRestore();
  });

  test('should register a module', () => {
    class Module {
    }

    class Test {
      @RegisterModule(Module)
      async start() {
      }
    }

    const testInstance = new Test();
    const args = spyMetadataSet.mock.calls[0];

    expect(args[0]).toEqual(REGISTERED_MODULE_KEY);
    expect(args[1]).toEqual([Module]);
  });

  test('should fail if use different method to register a module', () => {
    expect(() => {
      class Module {
      }

      class Test {
        @RegisterModule(Module)
        async init() {
        }
      }
    }).toThrow();
  });
});

describe('Static Decorator', () => {
  let spyMetadataSet;

  beforeEach(() => {
    spyMetadataSet = jest.spyOn(Metadata, 'set');
  });

  afterEach(() => {
    spyMetadataSet.mockRestore();
  });

  test('should register a static server', () => {
    @Static('/public')
    class Test {
    }

    const instance = new Test();

    const args = spyMetadataSet.mock.calls[0];

    expect(args[0]).toEqual(REGISTERED_STATIC_KEY);
    expect(args[1]).toEqual([{
      options: {},
      root: '/public',
      virtual: null
    }]);
  });

  test('should register a static server with virtual', () => {
    @Static('/public', '/virtual')
    class Test {
    }

    const instance = new Test();

    const args = spyMetadataSet.mock.calls[0];

    expect(args[0]).toEqual(REGISTERED_STATIC_KEY);
    expect(args[1]).toEqual([{
      options: {},
      root: '/public',
      virtual: '/virtual'
    }]);
  });

  test('should fail if not root folder is present', () => {
    expect(() => {
      // @ts-ignore
      @Static()
      class Test {
      }
    }).toThrow();
  });
});

describe('Express Directive Decorator', () => {
  let spyMetadataSet;
  beforeEach(() => {
    spyMetadataSet = jest.spyOn(Metadata, 'set');
  });

  afterEach(() => {
    spyMetadataSet.mockRestore();
  });

  test('should allow to modify etag', () => {
    @ExpressDirecive('etag', true)
    class Test {
    }

    const instance = new Test();

    const args = spyMetadataSet.mock.calls[0];

    expect(args[0]).toEqual(REGISTERED_DIRECTIVES_KEY);
    expect(args[1]).toEqual([{
      name: 'etag',
      settings: [true]
    }]);
  });

  test('should fail if directive is named as invalid ', () => {
    expect(() => {
      // @ts-ignore
      @ExpressDirecive('invalid', false)
      class Test {
      }
    }).toThrow();
  });

  test('should fail if directive is not named ', () => {
    expect(() => {
      // @ts-ignore
      @ExpressDirecive()
      class Test {
      }
    }).toThrow();
  });
});
