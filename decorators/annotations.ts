import MetaData from '../classes/MetaData';
import { ARGUMENT_TYPES, ARGUMENTS_KEY } from '../libs/constants';
import { ExpressiveTeaArgumentOptions } from '../libs/interfaces';
import { ParameterDecorator } from '../libs/types';

/**
 * @module Decorators/Annotations
 */

function addToArguments(
  target: object,
  propertyKey: string | symbol,
  parameterIndex: number,
  type: symbol,
  args?: string | string[]) {
  const decoratedParameters: ExpressiveTeaArgumentOptions[] = MetaData.get(ARGUMENTS_KEY, target, propertyKey) || [];
  decoratedParameters.unshift({
    arguments: args,
    index: parameterIndex,
    key: propertyKey,
    type
  });
  MetaData.set(ARGUMENTS_KEY, decoratedParameters, target, propertyKey);
}

/**
 * Is passing directly to the decorated argument described <a href="http://expressjs.com/en/4x/api.html#req">here</a>.
 * @decorator {ParameterDecorator} request - Assign express Request instance to parameter.
 * @summary Assign Express Request Instance.
 * @example
 * class GenericController {
 *   {REPLACE-AT}Get('/') // This Response to all GET Requests for controller route.
 *   methodError({REPLACE-AT}request req) {}
 * }
 *
 */
export function request(target: object, propertyKey: string | symbol, parameterIndex: number) {
  addToArguments(target, propertyKey, parameterIndex, ARGUMENT_TYPES.REQUEST);
}

/**
 * Is passing directly to the decorated argument described <a href="http://expressjs.com/en/4x/api.html#res">here</a>.
 * @decorator {ParameterDecorator} response - Assign express Response instance to parameter.
 * @summary Assign Express Response Instance.
 * @example
 * class GenericController {
 *   {REPLACE-AT}Get('/') // This Response to all GET Requests for controller route.
 *   methodError({REPLACE-AT}response res) {}
 * }
 *
 */
export function response(target: object, propertyKey: string | symbol, parameterIndex: number) {
  addToArguments(target, propertyKey, parameterIndex, ARGUMENT_TYPES.RESPONSE);
}

/**
 * Is passing directly to the decorated argument and you can check how is working following the next guide
 * <a href="http://expressjs.com/en/guide/using-middleware.html">here</a>.
 * @decorator {ParameterDecorator} next - Assign express Next Callback function to parameter.
 * @summary Assign Express Next Callback function.
 * @example
 * class GenericController {
 *   {REPLACE-AT}Get('/') // This Response to all GET Requests for controller route.
 *   methodError({REPLACE-AT}next next) {}
 * }
 *
 */
export function next(target: object, propertyKey: string | symbol, parameterIndex: number) {
  addToArguments(target, propertyKey, parameterIndex, ARGUMENT_TYPES.NEXT);
}

/**
 * It will pass a get query parameters which it must be defined on the query parameters string unless it will get a
 * undefined result. This decorator provides the way to return query parameters in one of the next ways: <br>
 * <b>whole</b> query object when no parameters is passing to the decorator. <br>
 * <b>partial</b> query object when a list of parameters name is passing to the decorator. <br>
 * <b>single</b> query parameter when pass a field name directly to the decorator.
 * @decorator {ParameterDecorator} query - Assign a single, partial or whole url query parameters.
 * @summary Get URL Query Parameters.
 * @param {string | string[] | undefined } parameter - Name or parameter's list name.
 * @example
 * class GenericController {
 *   {REPLACE-AT}Get('/') // This Response to all GET Requests for controller route.
 *   method({REPLACE-AT}query() req) {}
 *   method2({REPLACE-AT}query('username') username) {}
 *   method3({REPLACE-AT}query(['username', 'password']) credentials) {}
 * }
 *
 */
export function query(parameter?: string | string[]): ParameterDecorator {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    addToArguments(target, propertyKey, parameterIndex, ARGUMENT_TYPES.QUERY, parameter);
  };
}

/**
 * It will pass a get body parameters which it must be defined on the request body, unless it will get a
 * undefined result. This decorator provides the way to return body parameters in one of the next ways: <br>
 * <b>whole</b> body object when no parameters is passing to the decorator. <br>
 * <b>partial</b> body object when a list of parameters name is passing to the decorator. <br>
 * <b>single</b> body parameter when pass a field name directly to the decorator.
 * @decorator {ParameterDecorator} body - Assign a single, partial or whole request body parameters.
 * @summary Assign parameter(s) from body request object.
 * @param {string | string[] | undefined } bodyParam - Name or parameter's list name.
 * @example
 * class GenericController {
 *   {REPLACE-AT}Get('/') // This Response to all GET Requests for controller route.
 *   method({REPLACE-AT}body() req) {}
 *   method2({REPLACE-AT}body('username') username) {}
 *   method3({REPLACE-AT}body(['username', 'password']) credentials) {}
 * }
 *
 */
export function body(bodyParam?: string | string[]): ParameterDecorator {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    addToArguments(target, propertyKey, parameterIndex, ARGUMENT_TYPES.BODY, bodyParam);
  };
}

/**
 * It will return the value defined on the url path for the current method or a global middleware, this only works
 * for single parameter, and also might be side affected if there is an any <b>param</b> decorator is declared for the
 * the selected parameter it will transformed first and passed the value.
 * @decorator {ParameterDecorator} param - Assign url parameter.
 * @summary Get a parameter value defined on the url by path.
 * @param {string} parameter id name.
 * @example
 * class GenericController {
 *   {REPLACE-AT}Get('/:userId') // This Response to all GET Requests for controller route.
 *   method({REPLACE-AT}param('userId') username) {}
 * }
 *
 */
export function param(parameter: string): ParameterDecorator {
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    addToArguments(target, propertyKey, parameterIndex, ARGUMENT_TYPES.GET_PARAM, parameter);
  };
}
