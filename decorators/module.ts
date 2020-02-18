import { Express, Router } from 'express';
import { ExpressiveTeaModuleClass } from 'libs/types';
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
 * Module Decorator
 * @decorator {ClassDecorator} Module - Module Class Register Decorator
 * @param {ExpressiveTeaModuleProps} options
 * @example
 * {REPLACE-AT}Module({
 *   controllers: [],
 *   providers: [],
 *   mountpoint: '/'
 * })
 * class Example {}
 */
export function Module(options: ExpressiveTeaModuleProps) {
  return target => generateModuleClass(target, options);
}

// tslint:disable-next-line:max-line-length
function generateModuleClass<T extends IExpressiveTeaModule>(baseClass: ExpressiveTeaModuleClass<T>, options: ExpressiveTeaModuleProps) {
  class ExpressiveTeaModule extends (baseClass as ExpressiveTeaModuleClass<IExpressiveTeaModule>) {
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
  }

  return ExpressiveTeaModule as ExpressiveTeaModuleClass<T & IExpressiveTeaModule>;
}
