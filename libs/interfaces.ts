import { Express, Router } from 'express';
import { Server } from 'http';

export interface IDynamicObject {
  [key: string]: any;
}

/**
 * @typedef {Object} ExpressiveTeaApplication
 * @property {Express} application Express Application Instance
 * @property {HTTPServer} server HTTP Server Object
 */
export interface ExpressiveTeaApplication {
  application: Express;
  server: Server;
}

export interface ExpressiveTeaServerProps {
  port?: number;
  [key: string]: any;
}

export interface ExpressiveTeaPluginProps {
  name: string;
  priority: number;
}

/**
 * @typedef {Object} ExpressiveTeaServerProps
 * @property {Object[]} controllers Controllers Assigned to Module
 * @property {Object[]} providers Dependency Injection Providers
 * @property {string} mountpoint Endpoint part which Module it will use as root.
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
