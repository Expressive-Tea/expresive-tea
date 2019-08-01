/**
 * HTTP Exception
 *
 * Use this Exception to easily return a HTTP Error on the endpoints handlers.
 * @export
 * @class GenericRequestException
 * @extends {Error}
 * @param {string} message='Server Error' Provide the Error message.
 * @param {number} [statusCode=500] HTTP Response Code
 */
export class GenericRequestException extends Error {
  statusCode: number = 500;
  message: string = 'Server Error';

  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

/**
 * HTTP 400 Exception
 *
 * Shortcut Exception for 400 HTTP Errors (Bad Request).
 * @export
 * @class GenericRequestException
 * @extends {Error}
 * @param {string} message='Bad Request' Provide the Error message.
 */
export class BadRequestException extends GenericRequestException {
  constructor(message: string | never = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * HTTP 401 Exception
 *
 * Shortcut Exception for 401 HTTP Errors (Unauthorized Request).
 * @export
 * @class GenericRequestException
 * @extends {Error}
 * @param {string} message='Bad Request' Provide the Error message.
 */
export class UnauthorizedException extends GenericRequestException {
  constructor(message: string | never = 'Unauthorized Request') {
    super(message, 401);
  }
}
