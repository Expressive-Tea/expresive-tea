export class BadRequestException extends Error {
  statusCode: number = 400;
  message: string = 'Bad Request';
}

export class UnauthorizedException extends Error {
  statusCode: number = 401;
  message: string = 'Unauthorized Request';

  constructor(message) {
    super();
    this.message = message;
  }
}

export class GenericRequestException extends Error {
  statusCode: number = 500;
  message: string = 'Server Error';

  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}
