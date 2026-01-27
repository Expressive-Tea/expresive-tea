// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type Constructor, type ExpressiveTeaRoute } from '../types/core';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import type {
  ExpressiveTeaAnnotations,
  ExpressiveTeaArgumentOptions,
  ExpressiveTeaHandlerOptions,
} from '@expressive-tea/commons/interfaces';
import { type RequestHandler, Router } from 'express';
import MetaData from '@expressive-tea/commons/classes/Metadata';
import {
  ARGUMENTS_KEY,
  ROUTER_ANNOTATIONS_KEY,
  ROUTER_HANDLERS_KEY,
  ROUTER_MIDDLEWARES_KEY
} from '@expressive-tea/commons/constants';
import type { ExpressMiddlewareHandler } from '@expressive-tea/commons/types';
import { executeRequest } from '../helpers/server';

 
export function Routerize<TBase extends Constructor>(Route: TBase, mountpoint: string): any {
  return class ExpressiveTeaRoute extends Route {
    readonly router: Router;
    readonly mountpoint: string;

    constructor(...args) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args);
      const handlers: ExpressiveTeaHandlerOptions[] = MetaData.get(ROUTER_HANDLERS_KEY, this) ?? [];

      this.router = Router();
      this.mountpoint = mountpoint;

      for (const handler of handlers) {
        const middlewares = handler.handler.$middlewares ?? [];
        this.router[handler.verb](handler.route, ...middlewares, this.__registerHandler(handler));
      }
    }

    __mount(parent: Router): this {
      const rootMiddlewares: RequestHandler[] = MetaData.get(ROUTER_MIDDLEWARES_KEY, this) || [];
      parent.use(this.mountpoint, ...rootMiddlewares, this.router);
      return this;
    }

    __registerHandler(options: ExpressiveTeaHandlerOptions): ExpressMiddlewareHandler {
      const decoratedArguments: ExpressiveTeaArgumentOptions[] = MetaData.get(
        ARGUMENTS_KEY,
        options.target,
        options.propertyKey
      );
      const annotations: ExpressiveTeaAnnotations[] = MetaData.get(
        ROUTER_ANNOTATIONS_KEY,
        options.target,
        options.propertyKey
      );

      return executeRequest.bind({
        options,
        decoratedArguments,
        annotations,
        self: this
      });
    }
  };
}
