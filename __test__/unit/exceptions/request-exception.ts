import { BadRequestException, GenericRequestException, UnauthorizedException } from '../../../exceptions/RequestExceptions';

describe('Bootloader Exceptions', () => {
  test('should instance required exception', () => {
    const exception = new GenericRequestException('Test Error');

    expect(exception.message).toEqual('Test Error');
    expect(exception.statusCode).toEqual(500);
    expect(exception).toBeInstanceOf(GenericRequestException);
  });

  test('should instance required exception', () => {
    const exception = new GenericRequestException('Generic Error', 404);

    expect(exception.message).toEqual('Test Error');
    expect(exception.statusCode).toEqual(404);
    expect(exception).toBeInstanceOf(GenericRequestException);
  });

  test('should instance required exception', () => {
    const exception = new BadRequestException('Test Error');

    expect(exception.message).toEqual('Test Error');
    expect(exception.statusCode).toEqual(400);
    expect(exception).toBeInstanceOf(BadRequestException);
  });

  test('should instance required exception', () => {
    const exception = new UnauthorizedException('Test Error');

    expect(exception.message).toEqual('Test Error');
    expect(exception.statusCode).toEqual(403);
    expect(exception).toBeInstanceOf(UnauthorizedException);
  });

});
