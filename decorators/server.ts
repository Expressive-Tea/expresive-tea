import { Express } from 'express';
import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import { BOOT_STAGES, BOOT_STAGES_KEY, REGISTERED_MODULE_KEY } from '../libs/constants';
import { ExpressiveTeaServerProps } from '../libs/interfaces';

/**
 * @module Decorators/Server
 */
/**
 * Plug Class Decorator
 *
 * This Decorators is add plugin initialization to one of the selected stages.
 * @example @Plug(BOOT_STAGES.BOOT_DEPENDENCIES, 'test', s => console.log, true) class Example {}
 * @param {ExpressiveTeaModuleProps} options
 * @param {BOOT_STAGES} stage   Boot Stage where the plugin should run or initialize.
 * @param {string} name         Plugin Name (recommended short names)
 * @param {Function} method     A Function to  initialize the plugin, it will get a express application as argument.
 * @param {boolean} required    A Flag to let know if this is a hard requirement.
 */
export function Plug(
  stage: BOOT_STAGES,
  name: string,
  method: (server: Express | never) => Promise<any> | any,
  required: boolean = false
) {
  return (target: any): void => {
    const stages = MetaData.get(BOOT_STAGES_KEY, target) || {};
    if (!stages[stage]) {
      stages[stage] = [];
    }
    stages[stage].unshift({ method, required, name });
    MetaData.set(BOOT_STAGES_KEY, stages, target);
  };
}

/**
 * Server Settings Class Decorator
 *
 * This Provide the Configuration to the server or another component on the projects, is working as a container
 * to store user and library settings.
 * @param {ExpressiveTeaModuleProps} options
 * @param {number} [port=3000] Select Port Number where the server should be listening.
 */
export function ServerSettings(options: ExpressiveTeaServerProps = {}) {
  return target => {
    Settings.getInstance().merge(options);
    return target;
  };
}

/**
 * Setting Property Decorator
 *
 * Automatically assign a settings declared on Settings Service into the decorated property.
 * @param {string | undefined} settingName The Setting name tha
 */
export function Setting(settingName: string): (target: any, propertyName: string) => any {
  return (target, propertyName) => {
    Object.defineProperty(target, propertyName, {
      configurable: false,
      get: () => Settings.getInstance().get(propertyName)
    });
  };
}

/**
 * Register Module Method Decorator.
 *
 * This Method Decorator is used at bootstrap level and should decorate the start method
 * with a Module Class.
 * @param {class} Module
 */
export function RegisterModule(Module) {
  return (target, property) => {
    const registeredModules = MetaData.get(REGISTERED_MODULE_KEY, target, property) || [];
    registeredModules.push(Module);
    MetaData.set(REGISTERED_MODULE_KEY, registeredModules, target, property);
  };
}
