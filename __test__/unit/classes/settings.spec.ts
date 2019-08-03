import Settings from '../../../classes/Settings';

describe('Settings Class', () => {
  beforeEach(() => Settings.reset());
  test('should be existed', () => {
    expect(Settings).not.toBeUndefined();
  });

  test.each`
    options                   | expected
    ${undefined}              | ${{ port: 3000 }}
    ${{ port: 8080 }}         | ${{ port: 8080 }}
    ${{ port: 8080, a: 'b' }} | ${{ port: 8080, a: 'b' }}
    ${{ c: 'd' }}             | ${{ port: 3000, c: 'd' }}
  `('should create a new instance with $options and return value correctly', ({ options, expected }) => {
    const settings = new Settings(options);
    expect(settings.getOptions()).toStrictEqual(expected);
  });

  test.each`
    options                   | expected
    ${undefined}              | ${{ port: 3000 }}
    ${{ port: 8080 }}         | ${{ port: 8080 }}
    ${{ port: 8080, a: 'b' }} | ${{ port: 8080, a: 'b' }}
    ${{ c: 'd' }}             | ${{ port: 3000, c: 'd' }}
  `('should merge $options with the existed values', ({ options, expected }) => {
    const settings = new Settings();
    settings.merge(options);
    expect(settings.getOptions()).toStrictEqual(expected);
  });

  test('should get the same instance as singleton', () => {
    const settings = new Settings({ a: 'test' });
    const anotherSettings = new Settings();

    expect(settings).toStrictEqual(anotherSettings);
    expect(settings.getOptions()).toEqual(anotherSettings.getOptions());
  });

  test('should get the same instance as singleton', () => {
    const settings = Settings.getInstance();
    const anotherSettings = new Settings();

    expect(settings).toStrictEqual(anotherSettings);
    expect(settings.getOptions()).toEqual(anotherSettings.getOptions());
  });

  test('should be able to assign and get new setting value', () => {
    const settings = new Settings({ a: 'test' });

    expect(settings.get('a')).toEqual('test');

    settings.set('a', 400);
    expect(settings.get('a')).toEqual(400);
  });
});
