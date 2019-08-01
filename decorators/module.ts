import { Express, Router } from 'express';
import { each, map } from 'lodash';
import { ExpressiveTeaModuleProps } from '../libs/interfaces';
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
 * @example @Module({ controllers: [], providers: [], mountpoint: '/'}) class Example {}
 * @param {ExpressiveTeaModuleProps} options
 */
export function Module(options: ExpressiveTeaModuleProps) {
  return <T extends new (...args: any[]) => {}>(Module: T) => {
    return class extends Module {
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
