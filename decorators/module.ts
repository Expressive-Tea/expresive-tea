import { Express, Router } from 'express';
import { each, map } from 'lodash';
import { ExpressiveTeaModuleProps } from '../libs/interfaces';
import DependencyInjection from '../services/DependencyInjection';

export function Module(options: ExpressiveTeaModuleProps) {

  return <T extends new(...args: any[]) => {}>(Module: T) => {

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
