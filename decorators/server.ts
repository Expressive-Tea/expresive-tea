/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { type Express } from 'express';
import { isNil, orderBy } from '@libs/utilities';
import { Metadata } from '@expressive-tea/commons';
import Settings from '@classes/Settings';
import {
  ASSIGN_TEACUP_KEY,
  ASSIGN_TEAPOT_KEY, type BOOT_STAGES,
  BOOT_STAGES_KEY, BOOT_STAGES_LIST, EXPRESS_DIRECTIVES,
  PLUGINS_KEY, REGISTERED_DIRECTIVES_KEY,
  REGISTERED_MODULE_KEY,
  REGISTERED_STATIC_KEY,
  ROUTER_PROXIES_KEY
} from '@expressive-tea/commons';
import {
  type ExpressiveTeaPotSettings,
  type ExpressiveTeaPluginProps,
  type ExpressiveTeaServerProps,
  type ExpressiveTeaStaticFileServer, type ExpressiveTeaCupSettings
} from '@expressive-tea/commons';
import {Newable } from 'inversify';
import DependencyInjection from '@services/DependencyInjection';

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

 
function getStages(target: any) {
  return Metadata.get(BOOT_STAGES_KEY, target) || {};
}

 
function getRegisteredPlugins(target: any) {
  return Metadata.get(PLUGINS_KEY, target) || [];
}

 
function getStage(stage: BOOT_STAGES, target: any) {
  const stages = getStages(target);
  if (!stages[stage]) {
    stages[stage] = [];
  }

  return stages[stage];
}

 
function setStage(stage: BOOT_STAGES, value: any, target: any) {
  const stages = getStages(target);
  stages[stage] = value;
  Metadata.set(BOOT_STAGES_KEY, stages, target);
}

 
function setPlugins(plugins: ExpressiveTeaPluginProps[], target: any) {
  Metadata.set(PLUGINS_KEY, plugins, target);
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
  method: (server?: Express, ...extraArgs: unknown[]) => Promise<void> | void,
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
 * @param pluginArgs any[] - Arguments passed directly to the Plugin constructor.
 * @version 1.1.0
 * @link https://www.npmjs.com/package/@expressive-tea/plugin Expressive Tea Plugin
 */
export function Pour(Plugin: Newable<any>, ...pluginArgs: any[]) {
  return (target: any): void => {
    const stages = getStages(target);
    DependencyInjection.Container.bind<typeof Plugin>(Plugin)
      .toDynamicValue(() => new Plugin(...pluginArgs))
      .inSingletonScope();
    const instance = DependencyInjection.Container.get<any>(Plugin);

    const plugins: ExpressiveTeaPluginProps[] = instance.register(
      Settings.getInstance(target).getOptions(),
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
 */
export function ServerSettings(options: ExpressiveTeaServerProps = {}) {
   
  return (target: any) => {
    Settings.getInstance(target).merge(options);
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
   
  return (target: any) => {
    if (isNil(root)) {
      throw new Error('Root must be defined');
    }
    const registeredStatics = Metadata.get(REGISTERED_STATIC_KEY, target) || [];
    registeredStatics.unshift({ root, options, virtual });
    Metadata.set(REGISTERED_STATIC_KEY, registeredStatics, target);
  };
}

/**
 * Set or Update Express application settings, and allow to change the behavior of the server where is listed on the
 * next link {@link http://expressjs.com/en/4x/api.html#app.settings.table Express Settings} as this is using the same
 * principle of app.set you should understand that is only apply the special settings mentioned above.
 * @summary Express Setting Directive
 * @param {string} name - Express Directive Setting Name
 * @param {*} settings - Setting Arguments
 * @decorator {ClassDecorator} ExpressDirective - Set a Express App Setting.
 */
 
export function ExpressDirective(name: string, ...settings: any[]) {
   
  return (target: any) => {
    if (!EXPRESS_DIRECTIVES.includes(name)) {
      throw new Error(`Directive Name ${name} is not valid express behavior setting`);
    }
    const registeredDirectives = Metadata.get(REGISTERED_DIRECTIVES_KEY, target) || [];
    registeredDirectives.unshift({ name, settings });
    Metadata.set(REGISTERED_DIRECTIVES_KEY, registeredDirectives, target);
  };
}

/**
 * Setting Property Decorator Automatically assign a settings declared on Settings Service into the decorated property.
 * All properties will contains the settings value or undefined if current settings is not founded.
 * @decorator {PropertyDecorator} Setting - Assign Server Settings to Property as default value.
 * @summary Automatically assign a settings declared on the Server Settings decorator to a class property.
 */
export function Setting(): (target: any, propertyName: string) => any {
  return (target, propertyName) => {
    Object.defineProperty(target, propertyName, {
      configurable: false,
      get: () => Settings.getInstance(target).get(propertyName)
    });
  };
}

/**
 * Register Modules Method Decorator this Method Decorator is used at bootstrap level and should decorate bootstrap class
 * and register modules.
 * @decorator {MethodDecorator} RegisterModule - Register a Expressive Tea module to application.
 * @summary This register the Module Classes created by the user.
 * @param Modules
 */
 
export function Modules(Modules: any[]) {

  return (target: any) => {
    for (const Module of Modules) {
      const registeredModules = Metadata.get(REGISTERED_MODULE_KEY, target, 'start') || [];
      registeredModules.unshift(Module);
      Metadata.set(REGISTERED_MODULE_KEY, registeredModules, target, 'start');
    }
  };
}

 
export function Proxies(proxyContainers: any[]) {
   
  return (target: any) => {

    for (const proxyContainer of proxyContainers) {
      const registeredProxyContainers = Metadata.get(ROUTER_PROXIES_KEY, target) || [];
      registeredProxyContainers.unshift(proxyContainer);
      Metadata.set(ROUTER_PROXIES_KEY, registeredProxyContainers, target);
    }

  };
}

/**
 * Register Module Method Decorator this Method Decorator is used at bootstrap level and should decorate the start
 * method with a Module Class.
 * @decorator {MethodDecorator} RegisterModule - Register a Expressive Tea module to application.
 * @summary <b>ONLY</b> Decorate Start Method, this register the Module Classes created by the user.
 * @param {Class} Module
 * @deprecated Use the new decorator Modules that allow add modules into registered modules.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RegisterModule(Module: any) {

   
  return (_: any, __: any) => {
    throw new Error('RegisterModule is deprecated, use the new decorator Modules that allow add modules into registered modules.');
  };
}

export function Teapot(teapotSettings: ExpressiveTeaPotSettings) {
  return (target: object) => {
    Metadata.set(ASSIGN_TEAPOT_KEY, true, target, 'isTeapotActive');
    Metadata.set(ASSIGN_TEAPOT_KEY, teapotSettings, target);
  };
}

export function Teacup(teacupSettings: ExpressiveTeaCupSettings) {
  return (target: object) => {
    Metadata.set(ASSIGN_TEACUP_KEY, true, target, 'isTeacupActive');
    Metadata.set(ASSIGN_TEACUP_KEY, teacupSettings, target);
  };
}
