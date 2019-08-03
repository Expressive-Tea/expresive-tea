import { ServerSettings, Plug, Setting, RegisterModule } from '../../../decorators/server';
import Metadata from '../../../classes/MetaData';
import Settings from '../../../classes/Settings';
import { BOOT_STAGES, BOOT_STAGES_KEY } from '../../../libs/constants';

describe('ServerSettings Decorator', () => {
  @ServerSettings({
    port: 8080
  })
  class Test {}

  test('should modify server settings', () => {
    const test = new Test();
    expect(Settings.getInstance().getOptions()).toEqual({ port: 8080 });
  });
});

describe('Plug Decorator', () => {
  beforeAll(() => {
    this.spyMetadataSet = jest.spyOn(Metadata, 'set');

    @Plug(BOOT_STAGES.APPLICATION, 'test', () => {})
    class Test {}

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

/*
describe('Setting Decorator', () => {
  @ServerSettings({
    port: 8080
  })
  class Test {}

  beforeAll(() => {
    this.spyMetadataSet = spyOn(Metadata, 'set');
  });

  afterAll(() => {
    this.spyMetadataSet.mockRestore();
  });
});

describe('RegisterModule Decorator', () => {
  @ServerSettings({
    port: 8080
  })
  class Test {}

  beforeAll(() => {
    this.spyMetadataSet = spyOn(Metadata, 'set');
  });

  afterAll(() => {
    this.spyMetadataSet.mockRestore();
  });
});
*/
