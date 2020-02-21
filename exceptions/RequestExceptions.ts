/**
 * @namespace Exceptions
 */
/**
 * HTTP Generic Exception Use this Exception to easily return a HTTP Error on the endpoints handlers.
 * @export
 * @class GenericRequestException
 * @extends {Error}
 * @param {string} message='Server Error' Provide the Error message.
 * @param {number} [statusCode=500] HTTP Response Code
 * @summary HTTP Exception Helper
 * @example
 * {REPLACE-AT}Router('/')
 * class ExceptionExampleController {
 *   {REPLACE-AT}@Get('/exception')
 *   exceptionMethod(req, res, next) {
 *     try {
 *       throw new GenericRequestException('Page not found', 404);
 *     } catch (e) {
 *       res.status(e.code).send(e.message);
 *     }
 *   }
 * }
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
 * Shortcut Exception for 400 HTTP Errors (Bad Request).
 * @export
 * @class BadRequestException
 * @extends {GenericRequestException}
 * @param {string} [message='Bad Request'] Provide the Error message.
 * @summary 400 Exception
 * @example
 * {REPLACE-AT}Router('/')
 * class ExceptionExampleController {
 *   {REPLACE-AT}@Get('/exception')
 *   exceptionMethod(req, res, next) {
 *     try {
 *       throw new BadRequestException();
 *     } catch (e) {
 *       res.status(e.code).send(e.message);
 *     }
 *   }
 * }
 */
export class BadRequestException extends GenericRequestException {
  constructor(message: string | never = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * Shortcut Exception for 401 HTTP Errors (Unauthorized Request).
 * @export
 * @class UnauthorizedException
 * @extends {GenericRequestException}
 * @param {string} [message='Unauthorized Request'] Provide the Error message.
 * @summary 401 Exception
 * @example
 * {REPLACE-AT}Router('/')
 * class ExceptionExampleController {
 *   {REPLACE-AT}@Get('/exception')
 *   exceptionMethod(req, res, next) {
 *     try {
 *       throw new UnauthorizedException();
 *     } catch (e) {
 *       res.status(e.code).send(e.message);
 *     }
 *   }
 * }
 */
export class UnauthorizedException extends GenericRequestException {
  constructor(message: string | never = 'Unauthorized Request') {
    super(message, 401);
  }
}
