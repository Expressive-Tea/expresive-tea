import {
  BadRequestException,
  GenericRequestException,
  UnauthorizedException } from '../../../exceptions/RequestExceptions';

describe('Bootloader Exceptions', () => {
  test('should instance required exception', () => {
    const exception = new GenericRequestException('Test Error');

    expect(exception.message).toEqual('Test Error');
    expect(exception.statusCode).toEqual(500);
    expect(exception).toBeInstanceOf(GenericRequestException);
  });

  test('should instance required exception', () => {
    const exception = new GenericRequestException('Generic Error', 404);

    expect(exception.message).toEqual('Generic Error');
    expect(exception.statusCode).toEqual(404);
    expect(exception).toBeInstanceOf(GenericRequestException);
  });

  test('should instance required exception', () => {
    const exception = new BadRequestException('Test Error');

    expect(exception.message).toEqual('Test Error');
    expect(exception.statusCode).toEqual(400);
    expect(exception).toBeInstanceOf(BadRequestException);
  });

  test('should instance required exception with default message', () => {
    const exception = new BadRequestException();

    expect(exception.message).toEqual('Bad Request');
    expect(exception.statusCode).toEqual(400);
    expect(exception).toBeInstanceOf(BadRequestException);
  });

  test('should instance required exception', () => {
    const exception = new UnauthorizedException('Test Error');

    expect(exception.message).toEqual('Test Error');
    expect(exception.statusCode).toEqual(401);
    expect(exception).toBeInstanceOf(UnauthorizedException);
  });

  test('should instance required exception with default message', () => {
    const exception = new UnauthorizedException();

    expect(exception.message).toEqual('Unauthorized Request');
    expect(exception.statusCode).toEqual(401);
    expect(exception).toBeInstanceOf(UnauthorizedException);
  });

});
