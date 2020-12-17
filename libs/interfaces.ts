import { Express, Router } from 'express';
import * as http from 'http';
import * as https from 'https';
import { ExpressiveTeaMiddleware, ExpressMiddlewareHandler } from './types';

/**
 * Define the dynamic structure for an object and useful to provide a dynamic object type on the applications.
 * @typedef {Object} IDynamicObject
 * @summary Dynamic Object Definition
 */
export interface IDynamicObject {
  [key: string]: any;
}

/**
 * Expressive Tea Application interface is the response from an started application, contains the express application
 * and a node http server instance.
 * @typedef {Object} ExpressiveTeaApplication
 * @property {Express} application Express Application Instance
 * @property {HTTPServer} server HTTP Server Object
 * @summary Application Interface
 */
export interface ExpressiveTeaApplication {
  application: Express;
  server: http.Server;
  secureServer?: https.Server;
}

/**
 * Declare the properties which the server will save into settings, is a semi dynamic object since is allowed to save
 * any property but is contains only one defined property to keep the port of the server.
 * @typedef {Object} ExpressiveTeaServerProps
 * @property {number} [port] - Properties where server will be listen requests.
 * @summary Expressive Tea Server Properties
 */
export interface ExpressiveTeaServerProps {
  port?: number;

  [key: string]: any;
}

/**
 * Define the Main Plugins Properties.
 * @typedef {Object} ExpressiveTeaPluginProps
 * @property {string} name - Define a Plugin Name
 * @property {number} priority - Define a Plugin Priority.
 * @summary Plugin Properties
 */
export interface ExpressiveTeaPluginProps {
  name: string;
  priority: number;
}

export interface ExpressiveTeaPotSettings {
  serverKey: string;
  clientKey: string;
  port?: number;
}

export interface ExpressiveTeaCupSettings {
  address: string;
  clientKey: string;
  mountTo: string;
  serverUrl: string;
}

/**
 * Define Expressive Module Properties.
 * @typedef {Object} ExpressiveTeaModuleProps
 * @property {Object[]} controllers - Controllers Assigned to Module
 * @property {Object[]} providers -Dependency Injection Providers
 * @property {string} mountpoint - Endpoint part which Module it will use as root.
 * @summary
 */
export interface ExpressiveTeaModuleProps {
  controllers: any[];
  providers: any[];
  mountpoint: string;
}

export interface IExpressiveTeaModule {
  readonly settings: ExpressiveTeaModuleProps;
  readonly router: Router;
  readonly controllers: any[];

  __register(server: Express): void;
}

export interface IExpressiveTeaRoute {
  readonly router: Router;
  readonly mountpoint: string;

  __mount(parent: Router): any;

  [key: string]: any;
}

/**
 * @typedef {Object} ExpressiveTeaApplication
 * @property {Express} application Express Application Instance
 * @property {HTTPServer} server HTTP Server Object
 */
export interface ExpressiveTeaStaticFileServer {
  dotfiles?: 'allow' | 'deny' | 'ignore';
  etag?: boolean;
  extensions?: string[];
  index?: boolean;
  maxAge?: string;
  redirect?: boolean;

  setHeaders?(res, path, stat);
}

export interface ExpressiveTeaStatic {
  root: string;
  virtual: string | null;
  options: ExpressiveTeaStaticFileServer | never;
}

export interface ExprresiveTeaDirective {
  name: string;
  settings: any[];
}

export interface ExpressiveTeaHandlerOptions {
  verb: string;
  route: string;
  handler: ExpressiveTeaMiddleware & ExpressiveTeaMiddlewareExtends;
  target: unknown;
  propertyKey: string | symbol;
}

export interface ExpressiveTeaArgumentOptions {
  key: string | symbol;
  index: number;
  type: symbol;
  arguments?: string | string [];
}

export interface ExpressiveTeaAnnotations {
  type: string;
  arguments?: any[];
}

export interface ExpressiveTeaMiddlewareExtends {
  $middlewares?: ExpressMiddlewareHandler[];
}
