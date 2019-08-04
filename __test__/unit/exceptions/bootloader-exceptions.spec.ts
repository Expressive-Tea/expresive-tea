import { BootLoaderRequiredExceptions, BootLoaderSoftExceptions } from '../../../exceptions/BootLoaderExceptions';

describe('Bootloader Exceptions', () => {
  test('should instance required exception', () => {
    const exception = new BootLoaderRequiredExceptions('Test Error');

    expect(exception.message).toEqual('Test Error');
    expect(exception).toBeInstanceOf(BootLoaderRequiredExceptions);
  });

  test('should instance soft required exception', () => {
    const exception = new BootLoaderSoftExceptions('Test Error');

    expect(exception.message).toEqual('Test Error');
    expect(exception).toBeInstanceOf(BootLoaderSoftExceptions);
  });
});
