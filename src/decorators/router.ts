import MetaData from '@core/classes/MetaData';
import { Router } from 'express';
import { each, map } from 'lodash';

export function Route(mountpoint = '/') {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const handlers = MetaData.get('app:routes:handlers', constructor) || [];
    const rootMiddlewares = MetaData.get('app:routes:middlewares', constructor) || [];

    return class extends constructor {
      readonly router: any;
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

      __mount(parent: Router) {
        parent.use(this.mountpoint, ...rootMiddlewares, this.router);
        return this;
      }
    };
  };
}

export function Get(route: string = '*') {
  return (target, propertyKey, descriptor) => {
    router('get', route, target, descriptor.value);
  };
}

export function Post(route: string = '*') {
  return (target, propertyKey, descriptor) => {
    router('post', route, target, descriptor.value);
  };
}

export function Put(route: string = '*') {
  return (target, propertyKey, descriptor) => {
    router('put', route, target, descriptor.value);
  };
}

export function Patch(route: string = '*') {
  return (target, propertyKey, descriptor) => {
    router('patch', route, target, descriptor.value);
  };
}

export function Delete(route: string = '*') {
  return (target, propertyKey, descriptor) => {
    router('delete', route, target, descriptor.value);
  };
}

export function Param(route: string = '*') {
  return (target, propertyKey, descriptor) => {
    router('param', route, target, descriptor.value);
  };
}

export function Middleware(middleware: () => void) {
  return (target, property?, descriptor?) => {
    if (!property) {
      rootMiddleware(target, middleware);
    } else {
      routeMiddleware(target, descriptor, middleware);
    }

  };
}

function rootMiddleware(target, middleware) {
  const existedRoutesHandlers = MetaData.get('app:routes:middlewares', target) || [];
  existedRoutesHandlers.push(middleware);
  MetaData.set('app:routes:middlewares', existedRoutesHandlers, target);
}

function routeMiddleware(target, descriptor, middleware) {
  descriptor.value.$middlewares = descriptor.value.$middlewares || [];
  descriptor.value.$middlewares.push(middleware);
}

function router(verb, route, target, handler) {
  const existedRoutesHandlers = MetaData.get('app:routes:handlers', target) || [];
  existedRoutesHandlers.push({ verb, route, handler, routerKey: target });
  MetaData.set('app:routes:handlers', existedRoutesHandlers, target);
}
