/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import type { Constructor } from '../types/core';
import type { ExpressiveTeaModuleProps } from '@expressive-tea/commons/interfaces';
import { type Express, Router } from 'express';
import DependencyInjection, { getInstanceOf } from '../services/DependencyInjection';
import { injectable, injectFromBase, Newable } from 'inversify';


export function Modulize<TBase extends Constructor>(Base: TBase, options: ExpressiveTeaModuleProps): any {
  @injectable('Singleton')
  @injectFromBase({ extendConstructorArguments: true })
  class ExpressiveTeaModule extends Base {
    readonly settings: ExpressiveTeaModuleProps = options;
    readonly router: Router = Router();
    readonly controllers: any[];

    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args);
      for (const Provider of options.providers ?? []) {
        DependencyInjection.setProvider(Provider as Newable<any>);
      }

      this.controllers = options.controllers.map((C: Newable<any>) => getInstanceOf<typeof C>(C));
    }

    __register(server: Express) {
      for ( const controller of this.controllers) {
        controller.__mount(this.router);
      }
      server.use(this.settings.mountpoint, this.router);
    }
  }

  return ExpressiveTeaModule;
}
