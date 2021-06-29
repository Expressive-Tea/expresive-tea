import { Express, Router } from 'express';
import { each, map } from 'lodash';
import { ExpressiveTeaModuleProps, IExpressiveTeaModule } from '../libs/interfaces';
import DependencyInjection from '../services/DependencyInjection';
/**
 * @typedef {Object} ExpressiveTeaModuleProps
 * @property {Object[]} controllers Controllers Assigned to Module
 * @property {Object[]} providers Dependency Injection Providers
 * @property {string} mountpoint Endpoint part which Module it will use as root.
 */

/**
 * @module Decorators/Module
 */

/**
 * Module Decorator is a Class Decorator which is help to register a Module into Expressive Tea. A module is a
 * placeholder over a mountpoint. We can considerate a module like a container which provide isolation and modularity
 * for our project. This module can be mounted in different applications and will move all the controller routes too.
 * @decorator {ClassDecorator} Module - Module Class Register Decorator
 * @param {ExpressiveTeaModuleProps} options
 * @summary Module Decorator
 * @example
 * {REPLACE-AT}Module({
 *   controllers: [],
 *   providers: [],
 *   mountpoint: '/'
 * })
 * class Example {}
 */
export function Module(options: ExpressiveTeaModuleProps) {
  return <T extends new (...args: any[]) => {}>(Module: T) => {
    return class ExpressiveTeaModule extends Module implements IExpressiveTeaModule{
      readonly settings: ExpressiveTeaModuleProps;
      readonly router: Router = Router();
      readonly controllers: any[];

      constructor(...args: any[]) {
        super(...args);
        this.settings = options;
        each(this.settings.providers, P => DependencyInjection.setProvider(P));
        this.controllers = map(this.settings.controllers, C => new C());
      }

      __register(server: Express) {
        each(this.controllers, c => c.__mount(this.router));
        server.use(this.settings.mountpoint, this.router);
      }
    };
  };
}
