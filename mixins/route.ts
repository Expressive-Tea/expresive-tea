/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

import { type Constructor } from '../types/core';
import type {
  ExpressiveTeaAnnotations,
  ExpressiveTeaArgumentOptions,
  ExpressiveTeaHandlerOptions,
} from '@expressive-tea/commons';
import type { ExpressiveTeaHandlerOptionsWithInstrospectedArgs } from '@interfaces';
import { type RequestHandler, Router } from 'express';
import { Metadata } from '@expressive-tea/commons';
import {
  ARGUMENTS_KEY,
  ROUTER_ANNOTATIONS_KEY,
  ROUTER_HANDLERS_KEY,
  ROUTER_MIDDLEWARES_KEY
} from '@expressive-tea/commons';
import type { ExpressMiddlewareHandler } from '@expressive-tea/commons';
import { executeRequest } from '../helpers/server';
import { injectable, injectFromBase } from 'inversify';
import DependencyInjection from '@services/DependencyInjection';

/**
 * Type definition for a routerized class
 * Represents a class that has been enhanced with Expressive Tea route capabilities
 * @template TBase - The base constructor type being extended
 * @since 2.0.0
 */
export type RouterizedClass<TBase extends Constructor> = TBase & (new (...args: any[]) => {
  /** Express router for this route controller */
  readonly router: Router;
  /** Mountpoint path for this controller */
  readonly mountpoint: string;
  /** Mount this controller's router on a parent router */
  __mount(parent: Router): any;
  /** Register a route handler with proper middleware and argument injection */
  __registerHandler(options: ExpressiveTeaHandlerOptions): ExpressMiddlewareHandler;
});

/**
 * Routerize mixin - Adds Expressive Tea route capabilities to a controller class
 * 
 * Transforms a regular class into an Expressive Tea route controller with:
 * - Express router management
 * - Route handler registration
 * - Middleware support
 * - Automatic argument injection from decorators
 * - Annotation processing
 * 
 * @template TBase - The base constructor type to extend
 * @param {TBase} Route - The base controller class to extend
 * @param {string} mountpoint - The path where this controller should be mounted
 * @returns {RouterizedClass<TBase>} The enhanced class with route capabilities
 * 
 * @example
 * ```typescript
 * @Route('/users')
 * class UserController {
 *   @Get('/')
 *   getUsers() {
 *     return ['user1', 'user2'];
 *   }
 * }
 * ```
 * @since 2.0.0
 */
export function Routerize<TBase extends Constructor>(Route: TBase, mountpoint: string): RouterizedClass<TBase> {
  @injectable('Singleton')
  @injectFromBase({ extendConstructorArguments: true })
  class ExpressiveTeaRoute extends Route {
    readonly router: Router;
    readonly mountpoint: string;


    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args)
      // Metadata is stored on the original class prototype by decorators
      // Route is the base class, so Route.prototype is where metadata is stored
      const handlers: ExpressiveTeaHandlerOptions[] = Metadata.get(ROUTER_HANDLERS_KEY, Route.prototype) ?? [];

      this.router = Router();
      this.mountpoint = mountpoint;

      for (const handler of handlers) {
        const middlewares: RequestHandler[] = (handler.handler as any).$middlewares ?? [];
        const verb = handler.verb as keyof Router;
        const routeMethod = this.router[verb];
        if (typeof routeMethod === 'function') {
          const allHandlers: RequestHandler[] = [...middlewares, this.__registerHandler(handler)];
          (routeMethod as any).apply(this.router, [handler.route, ...allHandlers]);
        }
      }
    }

    __mount(parent: Router): this {
      // Metadata is stored on the original class prototype by decorators
      const rootMiddlewares: RequestHandler[] = Metadata.get(ROUTER_MIDDLEWARES_KEY, Route.prototype) || [];
      parent.use(this.mountpoint, ...rootMiddlewares, this.router);
      return this;
    }

    __registerHandler(options: ExpressiveTeaHandlerOptions): ExpressMiddlewareHandler {
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = Metadata.get(
        ARGUMENTS_KEY,
        options.target,
        options.propertyKey
      );
      const annotations: ExpressiveTeaAnnotations[] = Metadata.get(
        ROUTER_ANNOTATIONS_KEY,
        options.target,
        options.propertyKey
      );

      const optionsWithArgs: ExpressiveTeaHandlerOptionsWithInstrospectedArgs = options as ExpressiveTeaHandlerOptionsWithInstrospectedArgs;

      return executeRequest.bind({
        options: optionsWithArgs,
        decoratedArguments,
        annotations,
        self: this
      }) as ExpressMiddlewareHandler;
    }
  }

  // Bind the original class to the wrapped class in the DI container
  // This ensures that when modules request the original class via getInstanceOf(),
  // they receive an instance of the wrapped ExpressiveTeaRoute class instead
  try {
    if (DependencyInjection.Container.isBound(Route)) {
      DependencyInjection.Container.unbind(Route);
    }
    DependencyInjection.Container.bind<any>(Route).to(ExpressiveTeaRoute);
  } catch {
    // Binding may fail in some contexts, but that's okay - the class is still usable
  }

  return ExpressiveTeaRoute as RouterizedClass<TBase>;
}
