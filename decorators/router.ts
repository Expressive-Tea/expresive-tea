import { Router } from 'express';
import { each } from 'lodash';
import MetaData from '../classes/MetaData';
import { ROUTER_HANDLERS_KEY, ROUTER_MIDDLEWARES_KEY } from '../libs/constants';

/**
 * @module Decorators/Router
 */
/**
 * Route Controller Decorator assign a router point into the module mount-point placeholder and is used just to create
 * a bucket to contains all the endpoints defined by method of the Controller.  If mount-point is not defined automati-
 * cally this must considerate mounted on root, but is mandatory define the Controller with this decorator in order
 * to allow Expressive Tea Setting up the Controller as part of a Module.
 *
 * @decorator {ClassDecorator} Route - Assign a route to controller endpoints.
 * @summary Generate a Placeholder endpoint root for controller routes.
 * @param {string} mountpoint Register the url part to mount the Controller.
 * @example
 * {REPLACE-AT}Route('/)
 * class Example {}
 */
export function Route(mountpoint = '/') {
  return <T extends new (...args: any[]) => {}>(Route: T) => {

    return class ExpressiveTeaRoute extends Route {
      readonly router: Router;
      readonly mountpoint: string;

      constructor(...args: any[]) {
        super(...args);
        const handlers = MetaData.get(ROUTER_HANDLERS_KEY, this) || [];

        this.router = Router();
        this.mountpoint = mountpoint;

        each(handlers, h => {
          const middlewares = h.handler.$middlewares || [];
          this.router[h.verb](h.route, ...middlewares, h.handler.bind(this));
        });
      }

      __mount(parent: Router): ExpressiveTeaRoute {
        const rootMiddlewares = MetaData.get(ROUTER_MIDDLEWARES_KEY, this) || [];
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
 * Define a GET Endpoint response over the controller router and can define in which route should be responds and
 * by default this is responding to everything on the controller root path.
 * @decorator {MethodDecorator} Get - Create an GET Response over the designed route.
 * @summary Define a GET Controller Endpoint on Controller.
 * @param {string} route URL Part to mount create a handler.
 * @example
 * {REPLACE-AT}Route('/')
 * class GenericController {
 *   {REPLACE-AT}Get() // This Response to all GET Requests for controller route.
 *   methodError() {}
 *
 *   {REPLACE-AT}Get('/data') // This Response to "/data" GET Requests for controller route.
 *   methodData() {}
 * }
 *
 */
export function Get(route = '*') {
  return generateRoute(route, 'get');
}

/**
 * Define a POST Endpoint response over the controller router and can define in which route should be responds and
 * by default this is responding to everything on the controller root path.
 * @decorator {MethodDecorator} POST - Create an POST Response over the designed route.
 * @summary Define a POST Controller Endpoint on Controller.
 * @param {string} route URL Part to mount create a handler.
 * @example
 * {REPLACE-AT}Route('/')
 * class GenericController {
 *   {REPLACE-AT}Post() // This Response to all GET Requests for controller route.
 *   methodError() {}
 *
 *   {REPLACE-AT}Post('/data') // This Response to "/data" GET Requests for controller route.
 *   methodData() {}
 * }
 *
 */
export function Post(route = '*') {
  return generateRoute(route, 'post');
}

/**
 * Define a PUT Endpoint response over the controller router and can define in which route should be responds and
 * by default this is responding to everything on the controller root path.
 * @decorator {MethodDecorator} Put - Create an PUT Response over the designed route.
 * @summary Define a PUT Controller Endpoint on Controller.
 * @param {string} route URL Part to mount create a handler.
 * @example
 * {REPLACE-AT}Route('/')
 * class GenericController {
 *   {REPLACE-AT}Put() // This Response to all PUT Requests for controller route.
 *   methodError() {}
 *
 *   {REPLACE-AT}Put('/data') // This Response to "/data" PUT Requests for controller route.
 *   methodData() {}
 * }
 *
 */
export function Put(route = '*') {
  return generateRoute(route, 'put');
}

/**
 * Define a PATCH Endpoint response over the controller router and can define in which route should be responds and
 * by default this is responding to everything on the controller root path.
 * @decorator {MethodDecorator} Patch - Create an PATCH Response over the designed route.
 * @summary Define a PATCH Controller Endpoint on Controller.
 * @param {string} route URL Part to mount create a handler.
 * @example
 * {REPLACE-AT}Route('/')
 * class GenericController {
 *   {REPLACE-AT}Patch() // This Response to all PATCH Requests for controller route.
 *   methodError() {}
 *
 *   {REPLACE-AT}Patch('/data') // This Response to "/data" PATCH Requests for controller route.
 *   methodData() {}
 * }
 *
 */
export function Patch(route = '*') {
  return generateRoute(route, 'patch');
}

/**
 * Define a DELETE Endpoint response over the controller router and can define in which route should be responds and
 * by default this is responding to everything on the controller root path.
 * @decorator {MethodDecorator} Delete - Create an DELETE Response over the designed route.
 * @summary Define a DELETE Controller Endpoint on Controller.
 * @param {string} route URL Part to mount create a handler.
 * @example
 * {REPLACE-AT}Route('/')
 * class GenericController {
 *   {REPLACE-AT}Delete() // This Response to all DELETE Requests for controller route.
 *   methodError() {}
 *
 *   {REPLACE-AT}Delete('/data') // This Response to "/data" DELETE Requests for controller route.
 *   methodData() {}
 * }
 *
 */
export function Delete(route = '*') {
  return generateRoute(route, 'delete');
}

/**
 * Define a Route path parameter transformation method as mentioned on Express this is just call by controller endpoints
 * route paths and it helps to define logic on each route path parameters. Example, you can require transform userId
 * parameter and added to request object.
 *
 * The method to response this must follow the Express callback notation (Request, Response, Next, paramValue) which
 * also must be use Next method to allow continue the process flow from Express.
 * @decorator {MethodDecorator} Param - Create a transformation middleware for router parameters.
 * @summary Define a Parameter transformation on router path..
 * @param {string} route URL Part to mount create a handler.
 * @example
 * {REPLACE-AT}Route('/')
 * class GenericController {
 *   {REPLACE-AT}Param('userId') // This Response to all GET Requests for controller route.
 *   async methodError(req, res, next, param, id) {
 *     const user = await User.find(id)
 *     try {
 *       if(!user) throw new Error('User not Found');
 *
 *       req.user = user;
 *       next();
 *     } catch(e) {
 *       next(e);
 *     }
 *   }
 *
 *   {REPLACE-AT}Get('/:userId') // This Response to "/:userId" GET Requests for controller route.
 *   methodData(req, res) {
 *    res.json(req.user);
 *   }
 * }
 *
 */
export function Param(route = '*') {
  return generateRoute(route, 'param');
}

/**
 * Middleware Decorator is following the middleware functionality inheritance from Express framework itself and follow
 * the same rules, that execute any code before response the request and can change the current request or response
 * object, and requires use next callback to pass control to next middleware.
 *
 * This define the middlewares at Controller and Controller methods level, for application levels please see the
 * Plug Decorator which can be useful to declare at that level..
 * @decorator {MethodDecorator|ClassDecorator} Middleware - Attach a middleware definition on the root route or endpoint
 * routes.
 * @summary Assign a middleware to the Controller or Method route path flow.
 * @example
 * {REPLACE-AT}Middleware((req, res, next) {
 *     req.controllerName = 'Example';
 *     next();
 *  })
 * class ExampleController {
 *   {REPLACE-AT}Get('/someResponse')
 *   {REPLACE-AT}Middleware((req, res, next) {
 *     req.methodName = 'someResponse';
 *     next();
 *   })
 *   someRespone(req, res) {
 *     res.send(`${req.controllerName}:${req.methodName}`);
 *   }
 * }
 *
 * @param {Function} middleware Register a middleware over routerr.
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
  existedRoutesHandlers.unshift(middleware);
  MetaData.set(ROUTER_MIDDLEWARES_KEY, existedRoutesHandlers, target);
}

function routeMiddleware(target: any, descriptor: any, middleware: (...args: any[]) => any | Promise<any>) {
  descriptor.value.$middlewares = descriptor.value.$middlewares || [];
  descriptor.value.$middlewares.unshift(middleware);
}

function router(verb: string, route: string, target: any, handler: (...args: any[]) => void | any | Promise<any>) {
  const existedRoutesHandlers = MetaData.get(ROUTER_HANDLERS_KEY, target) || [];
  existedRoutesHandlers.unshift({ verb, route, handler, routerKey: target });
  MetaData.set(ROUTER_HANDLERS_KEY, existedRoutesHandlers, target);
}
