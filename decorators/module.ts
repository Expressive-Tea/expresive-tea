import DependencyInjection from '@expressive-tea/services/DependencyInjection';
import { Router } from 'express';
import { each, map } from 'lodash';

const dependcyInjection = DependencyInjection.getInstance();
const DomainContainer = dependcyInjection.getContainer();

export function Module(options = {}) {

  return <T extends { new(...args: any[]): {} }>(constructor: T) => {

    return class extends constructor {
      readonly settings: any = {};
      readonly router: Router = Router();
      readonly controllers: any[];

      constructor(...args: any[]) {
        super(...args);
        this.settings = Object.assign(this.settings, this.settings, options);
        each(this.settings.providers, P => {
          DomainContainer.bind(P.name).to(P);
        });
        this.controllers = map(this.settings.controllers, C => new C());
      }

      __register(server) {
        each(this.controllers, c => c.__mount(this.router));
        server.use(this.settings.mountpoint, this.router);
      }
    };
  };
}
