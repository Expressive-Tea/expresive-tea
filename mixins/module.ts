/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import type { Constructor } from '../types/core';
import type { ExpressiveTeaModuleProps } from '@expressive-tea/commons';
import { type Express, Router } from 'express';
import DependencyInjection, { getInstanceOf } from '@services/DependencyInjection';
import { injectable, injectFromBase, Newable } from 'inversify';

/**
 * Type definition for a modulized class
 * Represents a class that has been enhanced with Expressive Tea module capabilities
 * @template TBase - The base constructor type being extended
 * @since 2.0.0
 */
export type ModulizedClass<TBase extends Constructor> = TBase & (new (...args: any[]) => {
  /** Module configuration and metadata */
  readonly settings: ExpressiveTeaModuleProps;
  /** Express router for this module */
  readonly router: Router;
  /** Instantiated controllers for this module */
  readonly controllers: any[];
  /** Register module routes with the Express application */
  __register(server: Express): void;
});

/**
 * Modulize mixin - Adds Expressive Tea module capabilities to a class
 * 
 * Transforms a regular class into an Expressive Tea module with:
 * - Dependency injection support
 * - Express router management
 * - Controller instantiation and registration
 * - Module mounting capabilities
 * 
 * @template TBase - The base constructor type to extend
 * @param {TBase} Base - The base class to extend
 * @param {ExpressiveTeaModuleProps} options - Module configuration options
 * @returns {ModulizedClass<TBase>} The enhanced class with module capabilities
 * 
 * @example
 * ```typescript
 * class MyModule {}
 * const ModulizedMyModule = Modulize(MyModule, {
 *   mountpoint: '/api',
 *   controllers: [UserController],
 *   providers: [UserService]
 * });
 * ```
 * @since 2.0.0
 */
export function Modulize<TBase extends Constructor>(Base: TBase, options: ExpressiveTeaModuleProps): ModulizedClass<TBase> {
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

  // Bind the original class to the wrapped class in the DI container
  // This ensures that when the application requests the original module class,
  // it receives an instance of the wrapped ExpressiveTeaModule class instead
  try {
    if (DependencyInjection.Container.isBound(Base)) {
      DependencyInjection.Container.unbind(Base);
    }
    DependencyInjection.Container.bind<any>(Base).to(ExpressiveTeaModule);
  } catch {
    // Binding may fail in some contexts, but that's okay - the class is still usable
  }

  return ExpressiveTeaModule as ModulizedClass<TBase>;
}
