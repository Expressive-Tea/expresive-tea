import { Express } from 'express';
import { isNil, orderBy } from 'lodash';
import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import {
  BOOT_STAGES,
  BOOT_STAGES_KEY, BOOT_STAGES_LIST, EXPRESS_DIRECTIVES,
  PLUGINS_KEY, REGISTERED_DIRECTIVES_KEY,
  REGISTERED_MODULE_KEY,
  REGISTERED_STATIC_KEY
} from '../libs/constants';
import { ExpressiveTeaPluginProps, ExpressiveTeaServerProps, ExpressiveTeaStaticFileServer } from '../libs/interfaces';

/**
 * Define the Main Plugins Properties.
 * @typedef {Object} ExpressiveTeaPluginProps
 * @property {string} name - Define a Plugin Name
 * @property {number} priority - Define a Plugin Priority.
 * @summary Plugin Properties
 */

/**
 * Declare an annotation only usable at Class Level Declaration
 * @typedef {Function} ClassDecorator()
 * @summary Class Decorator
 * @example
 * {REPLACE-AT}Decorator
 * class Decorated {}
 */

/**
 * Declare an annotation only usable at Method Class Level Declaration
 * @typedef {Function} MethodDecorator
 * @summary Method Decorator
 * @example
 * class Decorated {
 *   {REPLACE-AT}MethodDecorator()
 *   decoratedMethod(){}
 * }
 *
 */

/**
 * Declare an annotation only usable at Property Class Level Declaration
 * @typedef {Function} PropertyDecorator
 * @summary Property Decorator
 * @example
 * class Decorated {
 *   {REPLACE-AT}PropertyDecorator()
 *   decoratedProperty:string = '';
 * }
 */

/**
 * Declare an annotation only usable at Property Class Level Declaration
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
  method: (server?: Express | never, ...extraArgs: unknown[]) => Promise<any> | any,
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
 * @param Plugin - A Plugin Class which extends @expressive-tea/plugin/Plugin Class.
 * @version 1.1.0
 * @link https://www.npmjs.com/package/@expressive-tea/plugin Expressive Tea Plugin
 */
export function Pour(Plugin) {
  return (target: any): void => {
    const stages = getStages(target);
    const instance = new Plugin();

    const plugins: ExpressiveTeaPluginProps[] = instance.register(
      Settings.getInstance().getOptions(),
      getRegisteredPlugins(target)
    );

    BOOT_STAGES_LIST.forEach(STAGE => {
      setStage(STAGE, (stages[STAGE] || []).concat(instance.getRegisteredStage(STAGE)), target);
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
 * @param {object} [port=3000] Select Port Number where the server should be listening.
 */
export function ServerSettings(options: ExpressiveTeaServerProps = {}) {
  return target => {
    Settings.getInstance().merge(options);
    // MetaData.set(BOOT_STAGES_KEY, STAGES_INIT, target);
    return target;
  };
}

/**
 * Create a new middleware function to serve files from within a given root directory. The file to serve will be
 * determined by combining req.url with the provided root directory. When a file is not found, instead of sending a 404
 * response, this module will instead call next() to move on to the next middleware, allowing for stacking
 * and fall-backs. Check it out {@link https://expressjs.com/en/4x/api.html#express.static Express Static} to more
 * information.
 * @summary Static File Server
 * @param {string} root - Root directory
 * @param {string} [virtual=null] - Virtual Path
 * @param {object} [options={}] - Static Server Options
 * @decorator {ClassDecorator} Static - Create an Static mount static file server  on root directory
 * with virtual path if defined.
 */
export function Static(root: string, virtual: string | null = null, options: ExpressiveTeaStaticFileServer = {}) {
  return target => {
    if (isNil(root)) {
      throw new Error('Root must be defined');
    }
    const registeredStatics = MetaData.get(REGISTERED_STATIC_KEY, target) || [];
    registeredStatics.unshift({ root, options, virtual });
    MetaData.set(REGISTERED_STATIC_KEY, registeredStatics, target);
  };
}

/**
 * Set or Update Express application settings, and allow to change the behavior of the server where is listed on the
 * next link {@link http://expressjs.com/en/4x/api.html#app.settings.table Express Settings} as this is using the same
 * principle of app.set you should understand that is only apply the special settings mentioned above.
 * @summary Express Setting Directive
 * @param {string} name - Express Directive Setting Name
 * @param {*} settings - Setting Arguments
 * @decorator {ClassDecorator} ExpressDirecive - Set a Express App Setting.
 */
export function ExpressDirecive(name: string, ...settings: any[]) {
  return target => {
    if (!EXPRESS_DIRECTIVES.includes(name)) {
      throw new Error(`Directive Name ${name} is not valid express behavior setting`);
    }
    const registeredDirectives = MetaData.get(REGISTERED_DIRECTIVES_KEY, target) || [];
    registeredDirectives.unshift({ name, settings });
    MetaData.set(REGISTERED_DIRECTIVES_KEY, registeredDirectives, target);
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
 * @summary <b>ONLY</b> Decorate Start Method, this register the Module Classes created by the user.
 * @param {Class} Module
 */
export function RegisterModule(Module) {
  return (target, property) => {
    if (property !== 'start') {
      throw new Error('Register Module needs to decorate ONLY start method');
    }

    const registeredModules = MetaData.get(REGISTERED_MODULE_KEY, target, property) || [];
    registeredModules.push(Module);
    MetaData.set(REGISTERED_MODULE_KEY, registeredModules, target, property);
  };
}
