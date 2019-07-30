import { Router } from 'express';
import { each, map } from 'lodash';
import MetaData from '../classes/MetaData';
import { ROUTER_HANDLERS_KEY, ROUTER_MIDDLEWARES_KEY } from '../libs/constants';

export function Route(mountpoint = '/') {
  return <T extends new(...args: any[]) => {}>(Route: T) => {
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

function generateRoute(verb): (route: string) =>
  (verb: string, route: string, target: any, descriptor: any) => void {
  return (route: string = '*') => (target, propertyKey, descriptor) => router(verb, route, target, descriptor.value);
}

export const Get = generateRoute('get');
export const Post = generateRoute('post');
export const Put = generateRoute('put');
export const Patch = generateRoute('patch');
export const Delete = generateRoute('delete');
export const Param = generateRoute('param');

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
