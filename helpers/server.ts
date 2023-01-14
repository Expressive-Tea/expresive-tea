import { NextFunction, Request, Response } from 'express';
import { chain, find, get, has, isNumber, pick, size } from 'lodash';
import MetaData from '@expressive-tea/commons/classes/Metadata';
import { ARGUMENT_TYPES, ROUTER_HANDLERS_KEY } from '@expressive-tea/commons/constants';
import {
  ExpressiveTeaAnnotations,
  ExpressiveTeaArgumentOptions,
  ExpressiveTeaHandlerOptions
} from '@expressive-tea/commons/interfaces';
import { GenericRequestException } from '../exceptions/RequestExceptions';
import { getOwnArgumentNames } from '@expressive-tea/commons/helpers/object-helper';
import * as fs from 'fs';

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

export async function executeRequest(request: Request, response: Response, next: NextFunction) {
  try {
    let isNextUsed = false;
    const nextWrapper = () => (error: unknown) => {
      next(error);
      isNextUsed = true;
    };

    const result = await this.options.handler.apply(this.self, mapArguments(
      this.decoratedArguments,
      request,
      response,
      nextWrapper(),
      getOwnArgumentNames(this.options.handler)));


    if (!response.headersSent && !isNextUsed) {
      autoResponse(request, response, this.annotations, result);
    }
  } catch (e) {
    if (e instanceof GenericRequestException) {
      return next(e);
    }
    next(new GenericRequestException(e.message || 'System Error'));
  }
}

export function mapArguments(
  decoratedArguments: ExpressiveTeaArgumentOptions[],
  request: Request, response: Response, next: NextFunction,
  introspectedArgs: string[] = []
) {
  return chain(decoratedArguments)
    .sortBy('index')
    .map((argument: ExpressiveTeaArgumentOptions) => {
      const argumentKey = get(introspectedArgs, argument.index);

      switch (argument.type) {
        case ARGUMENT_TYPES.REQUEST:
          return request;
        case ARGUMENT_TYPES.RESPONSE:
          return response;
        case ARGUMENT_TYPES.NEXT:
          return next;
        case ARGUMENT_TYPES.QUERY:
          return extractParameters(request.query, argument.arguments, argumentKey);
        case ARGUMENT_TYPES.BODY:
          return extractParameters(request.body, argument.arguments, argumentKey);
        case ARGUMENT_TYPES.GET_PARAM:
          return extractParameters(request.params, argument.arguments, argumentKey);
        default:
          return;
      }
    })
    .thru((args: unknown[]) => size(args) ? args : [request, response, next])
    .value();
}

export function extractParameters(target: unknown, args?: string | string[], propertyName?: string | symbol) {
  if (!args && !target) {
    return;
  }

  if (size(args)) {

    if (Array.isArray(args)) {
      return pick(target, args);
    }

    return get(target, args as string);
  }

  if (has(target, propertyName as string)) {
    return get(target, propertyName);
  }

  return target;
}

export function generateRoute(route: string, verb: string, ...settings: any): (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor) => void {
  return (target, propertyKey, descriptor) => router(verb, route, target, descriptor.value, propertyKey, settings);
}

export function router(
  verb: string,
  route: string,
  target: any,
  handler: (...args: any[]) => void | any | Promise<any>,
  propertyKey: string | symbol,
  settings?: any
) {
  const existedRoutesHandlers: ExpressiveTeaHandlerOptions[] = MetaData.get(ROUTER_HANDLERS_KEY, target) || [];
  existedRoutesHandlers.unshift({ verb, route, handler, target, propertyKey, settings });
  MetaData.set(ROUTER_HANDLERS_KEY, existedRoutesHandlers, target);
}

export function fileSettings() {
  try {
    if (fs.existsSync('.expressive-tea')) {
      const configString = fs.readFileSync('.expressive-tea');
      return JSON.parse(configString.toString());
    }
  } catch (e) {
    return {};
  }
}
