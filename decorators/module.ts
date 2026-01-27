import { type ExpressiveTeaModuleProps } from '@expressive-tea/commons/interfaces';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ModulizedExpressiveTeaModule } from '../types/core';
import { Modulize } from '../mixins/module';

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
  return (Module: any): ModulizedExpressiveTeaModule<typeof Module> => {
    return Modulize<typeof Module>(Module, options);
  };
}

