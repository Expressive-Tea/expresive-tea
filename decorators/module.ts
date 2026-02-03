import { type ExpressiveTeaModuleProps } from '@expressive-tea/commons';
 
import { type Constructor } from '../types/core';
import { Modulize, type ModulizedClass } from '@mixins/module';

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
 * 
 * @decorator {ClassDecorator} Module - Module Class Register Decorator
 * @template TBase - The base constructor type being decorated
 * @param {ExpressiveTeaModuleProps} options - Module configuration options
 * @returns {(target: TBase) => ModulizedClass<TBase>} Decorator function that returns a modulized class
 * @summary Module Decorator
 * 
 * @example
 * {REPLACE-AT}Module({
 *   controllers: [UserController],
 *   providers: [UserService],
 *   mountpoint: '/api'
 * })
 * class ApiModule {}
 * 
 * @since 1.0.0
 */
export function Module<TBase extends Constructor = Constructor>(
  options: ExpressiveTeaModuleProps
): (target: TBase) => ModulizedClass<TBase> {
  return (Module: TBase): ModulizedClass<TBase> => {
    return Modulize<TBase>(Module, options);
  };
}

