import { Router } from 'express';
import { each } from 'lodash';
import MetaData from '../classes/MetaData';
import { ROUTER_HANDLERS_KEY, ROUTER_MIDDLEWARES_KEY } from '../libs/constants';
/**
 * @module Decorators/Route
 */

/**
 * Route Controller Decorator
 * @example @Route('/) class Example {}
 * @param {string} mountpoint Register the url part to mount the Controller.
 * @returns {Decorator}
 */
export function Route(mountpoint = '/') {
  return <T extends new (...args: any[]) => {}>(Route: T) => {
    const handlers = MetaData.get(ROUTER_HANDLERS_KEY, Route) || [];
    const rootMiddlewares = MetaData.get(ROUTER_MIDDLEWARES_KEY, Route) || [];

    return class ExpressiveTeaRoute extends Route {
      readonly router: Router;
      readonly mountpoint: string;

      constructor(...args: any[]) {
        super(...args);
        this.router = Router();
        this.mountpoint = mountpoint;
        each(handlers, h => {
          const middlewares = h.handler.$middlewares || [];
          this.router[h.verb](h.route, ...middlewares, h.handler.bind(this));
        });
      }

      __mount(parent: Router): ExpressiveTeaRoute {
        parent.use(this.mountpoint, ...rootMiddlewares, this.router);
        return this;
      }
    };
  };
}

function generateRoute(route, verb): (target, propertyKey, descriptor) => void {
  return (target, propertyKey, descriptor) => router(verb, route, target, descriptor.value);
}

/**
 * Get HTTP Verb Decorator
 * @param {string} route URL Part to mount create a handler.
 * @returns {Decorator}
 */
export function Get(route = '*') {
  return generateRoute(route, 'get');
}
/**
 * Post HTTP Verb Decorator
 * @param {string} route URL Part to mount create a handler.
 */
export function Post(route = '*') {
  return generateRoute(route, 'post');
}
/**
 * Put HTTP Verb Decorator
 * @param {string} route URL Part to mount create a handler.
 * @returns {Decorator}
 */
export function Put(route = '*') {
  return generateRoute(route, 'put');
}
/**
 * Patch HTTP Verb Decorator
 * @param {string} route URL Part to mount create a handler.
 * @returns {Decorator}
 */
export function Patch(route = '*') {
  return generateRoute(route, 'patch');
}
/**
 * Delete HTTP Verb Decorator
 * @param {string} route URL Part to mount create a handler.
 * @returns {Decorator}
 */
export function Delete(route = '*') {
  return generateRoute(route, 'delete');
}
/**
 * Param HTTP Verb Decorator
 * @param {string} route URL Part to mount create a handler.
 * @returns {Decorator}
 */
export function Param(route = '*') {
  return generateRoute(route, 'param');
}

/**
 * Route Controller Decorator
 * @example @Middleware((req, res) => ...) class Example {}
 *    class Example { @Get('/') @Middleware((req, res) => ...) print()  {}}
 *
 * @param {Function} middleware Register a middleware over routerr.
 * @returns {Decorator}
 */
export function Middleware(middleware) {
  return (target, property?, descriptor?) => {
    if (!property) {
      rootMiddleware(target, middleware);
    } else {
      routeMiddleware(target, descriptor, middleware);
    }
  };
}

function rootMiddleware(target: any, middleware: (...args: any[]) => any | Promise<any>): void {
  const existedRoutesHandlers = MetaData.get(ROUTER_MIDDLEWARES_KEY, target) || [];
  existedRoutesHandlers.push(middleware);
  MetaData.set(ROUTER_MIDDLEWARES_KEY, existedRoutesHandlers, target);
}

function routeMiddleware(target: any, descriptor: any, middleware: (...args: any[]) => any | Promise<any>) {
  descriptor.value.$middlewares = descriptor.value.$middlewares || [];
  descriptor.value.$middlewares.push(middleware);
}

function router(verb: string, route: string, target: any, handler: (...args: any[]) => void | any | Promise<any>) {
  const existedRoutesHandlers = MetaData.get(ROUTER_HANDLERS_KEY, target) || [];
  existedRoutesHandlers.push({ verb, route, handler, routerKey: target });
  MetaData.set(ROUTER_HANDLERS_KEY, existedRoutesHandlers, target);
}
