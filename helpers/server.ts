import { type NextFunction, type Request, type Response } from 'express';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { chain, find, get, has, isNumber, pick, size } from '@libs/utilities';
import { Metadata } from '@expressive-tea/commons';
import { ARGUMENT_TYPES, ROUTER_HANDLERS_KEY } from '@expressive-tea/commons';
import {
  type ExpressiveTeaAnnotations,
  type ExpressiveTeaArgumentOptions
} from '@expressive-tea/commons';
import { getOwnArgumentNames } from '@expressive-tea/commons';
import * as fs from 'node:fs';
import * as yaml from 'js-yaml';
import * as path from 'node:path';
import logger from '@helpers/logger';
import {
  type ExpressiveTeaHandlerOptionsWithInstrospectedArgs
} from '@interfaces';
import { TFunction } from '../types/core';
import { type ExpressiveTeaServerProps } from '@expressive-tea/commons';

interface ExecuteRequestContext {
  options: ExpressiveTeaHandlerOptionsWithInstrospectedArgs;
  decoratedArguments: ExpressiveTeaArgumentOptions[];
  annotations: ExpressiveTeaAnnotations[];
  self: any;
}

export interface FileSettingsResult {
  config: ExpressiveTeaServerProps;
  source: string | null;
}

export function autoResponse(
  _: any,
  response: Response,
  annotations: ExpressiveTeaAnnotations[],
  responseResult?: any
): void {
  const view = find(annotations, { type: 'view' });
  if (view && view.arguments) {
    response.render(view.arguments[0] as string, responseResult as object);
    return;
  }

  response.send(isNumber(responseResult) ? responseResult.toString() : responseResult);
}

export async function executeRequest(this: ExecuteRequestContext, request: Request, response: Response, next: NextFunction): Promise<void> {
  let isNextUsed = false;
  const nextWrapper = (error?: unknown) => {
    if (error) {
      isNextUsed = true;
      return next(error);
    }
    isNextUsed = true;
    next();
  };

  const result = await this.options.handler.apply(
    this.self,
    mapArguments(
      this.decoratedArguments,
      request,
      response,
      nextWrapper,
      this.options.introspectedArgs
    )
  );

  if (!response.headersSent && !isNextUsed) {
    autoResponse(request, response, this.annotations, result as object);
  }
  // Express 5 handles async rejections automatically
}

export function mapArguments(
  decoratedArguments: ExpressiveTeaArgumentOptions[],
  request: Request, response: Response, next: NextFunction,
  introspectedArgs: string[] = []
): any[] {
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
          return extractParameters(request.query, argument.arguments, get(introspectedArgs, argument.index));
        case ARGUMENT_TYPES.BODY:
          return extractParameters(request.body, argument.arguments, get(introspectedArgs, argument.index));
        case ARGUMENT_TYPES.GET_PARAM:
          return extractParameters(request.params, argument.arguments, get(introspectedArgs, argument.index));
        default:
          return undefined;
      }
    })
    .thru((args: unknown[]) => size(args) ? args : [request, response, next])
    .value();
}

export function extractParameters(target: unknown, args?: string | string[], propertyName?: string): any {
  if (!args && !target) {
    return;
  }

  if (args && size(args)) {

    if (Array.isArray(args)) {
      return pick(target, args);
    }

    return get(target, args);
  }

  if (propertyName && has(target, propertyName)) {
    return get(target, propertyName);
  }

  return target;
}

export function generateRoute(route: string, verb: string, ...settings: any): (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor) => void {
  return (target, propertyKey, descriptor) => {
    router(verb, route, target, descriptor.value as (...args: any[]) => any, propertyKey, settings);
  };
}

export function router(
  verb: string,
  route: string,
  target: any,
  handler: TFunction,
  propertyKey: string | symbol,
  settings?: any
) {
  const introspectedArgs = getOwnArgumentNames(handler);
  const existedRoutesHandlers: ExpressiveTeaHandlerOptionsWithInstrospectedArgs[] = Metadata.get(ROUTER_HANDLERS_KEY, target) || [];
  existedRoutesHandlers.unshift({ verb, route, handler, target, propertyKey, settings, introspectedArgs });
  Metadata.set(ROUTER_HANDLERS_KEY, existedRoutesHandlers, target);
}

/**
 * Load configuration from .expressive-tea files.
 *
 * Supports YAML (.yaml, .yml) and JSON formats with priority order:
 * 1. .expressive-tea.yaml (highest)
 * 2. .expressive-tea.yml
 * 3. .expressive-tea (JSON, lowest)
 *
 * @returns Configuration object and source file path
 * @throws {Error} If config file is invalid (JSON/YAML parse error)
 * @since 2.0.1
 */
export function fileSettings(): FileSettingsResult {
  const cwd = process.cwd();

  // Priority order: YAML > YML > JSON
  const configFiles = [
    { path: '.expressive-tea.yaml', type: 'yaml' as const },
    { path: '.expressive-tea.yml', type: 'yaml' as const },
    { path: '.expressive-tea', type: 'json' as const }
  ];

  for (const file of configFiles) {
    const filePath = path.join(cwd, file.path);

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');

        let config: ExpressiveTeaServerProps;
        if (file.type === 'yaml') {
          const parsed = yaml.load(content);
          // yaml.load returns undefined for empty strings and null for whitespace/comments
          // Treat empty YAML files as empty configuration objects
          config = (parsed ?? {}) as ExpressiveTeaServerProps;
        } else {
          config = JSON.parse(content);
        }

        // Debug log which file was loaded
        logger.debug(`[Expressive Tea] Loaded configuration from: ${file.path}`);

        return { config, source: file.path };
      } catch (error: any) {
        const errorMsg = file.type === 'yaml'
          ? `Invalid YAML in ${file.path}: ${error.message}`
          : `Invalid JSON in ${file.path}: ${error.message}`;

        throw new Error(errorMsg);
      }
    }
  }

  // No config file found
  return { config: {}, source: null };
}
