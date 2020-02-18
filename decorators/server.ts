import { Express } from 'express';
import { orderBy } from 'lodash';
import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import { BOOT_ORDER, BOOT_STAGES, BOOT_STAGES_KEY, PLUGINS_KEY, REGISTERED_MODULE_KEY } from '../libs/constants';
import { ExpressiveTeaPluginProps, ExpressiveTeaServerProps } from '../libs/interfaces';

/**
 * @module Decorators/Server
 */

function getStages(target) {
  return MetaData.get(BOOT_STAGES_KEY, target) || {};
}

function getRegisteredPlugins(target) {
  return MetaData.get(PLUGINS_KEY, target) || [];
}

function getStage(stage, target) {
  const stages = getStages(target);
  if (!stages[stage]) {
    stages[stage] = [];
  }

  return stages[stage];
}

function setStage(stage, value, target) {
  const stages = getStages(target);
  stages[stage] = value;
  MetaData.set(BOOT_STAGES_KEY, stages, target);
}

function setPlugins(plugins: ExpressiveTeaPluginProps[], target) {
  MetaData.set(PLUGINS_KEY, plugins, target);
}
/**
 * Plug Class Decorator create a simple plugin to execute in one of the public stages defined on BOOT_STAGES, might
 * be useful to attach a simple Express Server configuration.
 *
 * @decorator {ClassDecorator} Plug - Simple Plugin Decorator.
 * @summary This Decorators is add plugin initialization to one of the selected stages.
 * @param {ExpressiveTeaModuleProps} options
 * @param {BOOT_STAGES} stage   Boot Stage where the plugin should run or initialize.
 * @param {string} name         Plugin Name (recommended short names)
 * @param {Function} method     A Function to  initialize the plugin, it will get a express application as argument.
 * @param {boolean} required    A Flag to let know if this is a hard requirement.
 * @example
 * {REPLACE-AT}Plug(BOOT_STAGES.BOOT_DEPENDENCIES, 'test', s => console.log, true)
 * class Example extends Boot {}
 */
export function Plug(
  stage: BOOT_STAGES,
  name: string,
  method: (server: Express | never) => Promise<any> | any,
  required: boolean = false
) {
  return (target: any): void => {
    const selectedStage = getStage(stage, target);
    selectedStage.unshift({ method, required, name });
    setStage(stage, selectedStage, target);
  };
}

/**
 * Since version 1.1.0 Expressive Tea allow to use external plugins using the node
 * package @expressive-tea/plugin. This plugin engine allows to create more complex plugin configuration and provision
 * since is allowing multi Boot Stage configuration and check other plugin dependencies.
 *
 * @decorator {ClassDecorator} Pour - Use Expressive Tea plugin definition instance.
 * @summary Attach an Expressive Tea Definition Instance.
 * @param plugin Plugin - A Plugin instance which extends @expressive-tea/plugin/Plugin Class.
 * @version 1.1
 * @see https://www.npmjs.com/package/@expressive-tea/plugin
 */
export function Pour(plugin) {
  return (target: any): void => {
    const stages = getStages(target);
    const plugins: ExpressiveTeaPluginProps[] = plugin.register(
      Settings.getInstance().getOptions(),
      getRegisteredPlugins(target)
    );

    BOOT_ORDER.forEach(STAGE => {
      setStage(STAGE, (stages[STAGE] || []).concat(plugin.getRegisteredStage(STAGE)), target);
    });

    setPlugins(orderBy(plugins, ['priority'], ['asc']), target);
  };
}

/**
 * Server Settings Singleton Class Decorator this Provide the Configuration to the server or another component on
 * the projects,is working as a container to store user and library settings.
 * @decorator {ClassDecorator} ServerSettings - Declares Server Settings.
 * @summary Declare Server Properties.
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
 * Setting Property Decorator Automatically assign a settings declared on Settings Service into the decorated property.
 * All properties will contains the settings value or undefined if current settings is not founded.
 * @decorator {PropertyDecorator} Setting - Assign Server Settings to Property as default value.
 * @summary Automatically assign a settings declared on the Server Settings decorator to a class property.
 * @param {string} settingName The Setting name tha
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
 * Register Module Method Decorator this Method Decorator is used at bootstrap level and should decorate the start
 * method with a Module Class.
 * @decorator {MethodDecorator} RegisterModule - Register a Expressive Tea module to application.
 * @summary ONLY Decorate Start Method, this register the Module Classes created by the user.
 * @param {class} Module
 */
export function RegisterModule(Module) {
  return (target, property) => {
    if (property !== 'start') { throw new Error('Register Module needs to decorate ONLY start method'); }

    const registeredModules = MetaData.get(REGISTERED_MODULE_KEY, target, property) || [];
    registeredModules.push(Module);
    MetaData.set(REGISTERED_MODULE_KEY, registeredModules, target, property);
  };
}
