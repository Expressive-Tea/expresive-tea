import { NextFunction, Request, Response } from 'express';
import { chain, find, get, has, isNumber, pick, size } from 'lodash';
import MetaData from '../classes/MetaData';
import { ARGUMENT_TYPES, ROUTER_HANDLERS_KEY } from '../libs/constants';
import {
  ExpressiveTeaAnnotations,
  ExpressiveTeaArgumentOptions,
  ExpressiveTeaHandlerOptions, IDynamicObject
} from '../libs/interfaces';

export function autoResponse(
  request: Request,
  response: Response,
  annotations: ExpressiveTeaAnnotations[],
  responseResult?: any
) {
  const view = find(annotations, { type: 'view' });
  if (view) {
    return response.render(view!.arguments![0], responseResult);
  }

  response.send(isNumber(responseResult) ? responseResult.toString() : responseResult);
}

export function mapArguments(
  decoratedArguments: ExpressiveTeaArgumentOptions[],
  request: Request, response: Response, next: NextFunction
) {
  return chain(decoratedArguments)
    .sortBy('index')
    .map((argument: ExpressiveTeaArgumentOptions) => {
      switch (argument.type) {
        case ARGUMENT_TYPES.REQUEST:
          return request;
        case ARGUMENT_TYPES.RESPONSE:
          return response;
        case ARGUMENT_TYPES.NEXT:
          return next;
        case ARGUMENT_TYPES.QUERY:
          return extractParameters(request.query, argument.arguments, argument.key);
        case ARGUMENT_TYPES.BODY:
          return extractParameters(request.body, argument.arguments, argument.key);
        case ARGUMENT_TYPES.GET_PARAM:
          return extractParameters(request.params, argument.arguments, argument.key);
        default:
          return;
      }
    })
    .thru((args: unknown[]) => size(args) ? args : [request, response, next])
    .value();
}

export function extractParameters(target: unknown, args?: string | string[], propertyName? : string | symbol) {
  if (!args && !target) {
    return;
  }

  if (!args && !has(target, propertyName as string)) {
    return target;
  }

  if (Array.isArray(args)) {
    return pick(target, args);
  }

  return get(target, args as string, get(target, propertyName));
}

export function generateRoute(route: string, verb: string): (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor) => void {
  return (target, propertyKey, descriptor) => router(verb, route, target, descriptor.value, propertyKey);
}

export function router(
  verb: string,
  route: string,
  target: any,
  handler: (...args: any[]) => void | any | Promise<any>,
  propertyKey: string | symbol
) {
  const existedRoutesHandlers: ExpressiveTeaHandlerOptions[] = MetaData.get(ROUTER_HANDLERS_KEY, target) || [];
  existedRoutesHandlers.unshift({ verb, route, handler, target, propertyKey });
  MetaData.set(ROUTER_HANDLERS_KEY, existedRoutesHandlers, target);
}
