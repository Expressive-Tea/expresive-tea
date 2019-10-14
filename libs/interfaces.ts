import { Express } from 'express';
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
