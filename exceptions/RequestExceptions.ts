export class GenericRequestException extends Error {
  statusCode: number = 500;
  message: string = 'Server Error';

  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

export class BadRequestException extends GenericRequestException {
  constructor(message: string | never = 'Bad Request') {
    super(message, 400);
  }

}

export class UnauthorizedException extends GenericRequestException {
  constructor(message: string | never = 'Unauthorized Request') {
    super(message, 401);
  }
}
