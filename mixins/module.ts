// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Constructor, ExpressiveTeaModule } from '../types/core';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import type { ExpressiveTeaModuleProps } from '@expressive-tea/commons/interfaces';
import { type Express, Router } from 'express';
import DependencyInjection from '../services/DependencyInjection';
import { Newable } from 'inversify';

 
export function Modulize<TBase extends Constructor>(Base: TBase, options: ExpressiveTeaModuleProps): any {
  return class ExpressiveTeaModule extends Base {
    readonly settings: ExpressiveTeaModuleProps = options;
    readonly router: Router = Router();
    readonly controllers: any[] = options.controllers.map(C => new C());

    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args);
      for (const Provider of options.providers ?? []) {
        DependencyInjection.setProvider(Provider as Newable<any>);
      }
    }

    __register(server: Express) {
      for ( const controller of this.controllers) {
        controller.__mount(this.router);
      }
      server.use(this.settings.mountpoint, this.router);
    }
  };
}
