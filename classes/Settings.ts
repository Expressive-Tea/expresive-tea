import * as _ from 'lodash';
import { ExpressiveTeaServerProps } from '@expressive-tea/commons/interfaces';
import { injectable } from 'inversify';
import { nameOfClass } from '@expressive-tea/commons/helpers/object-helper';
import { fileSettings } from '../helpers/server';


/**
 * Declare the properties which the server will save into settings, is a semi dynamic object since is allowed to save
 * any property but is contains only one defined property to keep the port of the server.
 * @typedef {Object} ExpressiveTeaServerProps
 * @property {number} [port] - Properties where server will be listen requests.
 * @summary Expressive Tea Server Properties
 */

/**
 * Settings Singleton Class to allow store server, application and plugins settings during design mode. Can be used on
 * run stage except by the port setting or any other in-design properties everything can be changed and reflected
 * immediatly, the fact that some of the properties will be ignored after design stage is because is used only one time
 * to provide initial settings or some initialization parameters.
 *
 * @class Settings
 * @param {ExpressiveTeaServerProps} [options={ port: 3000 }]
 * @param {boolean} [isIsolated=false]
 * @summary Singleton Class to Store Server Settings
 */
@injectable()
class Settings {

  static isolatedContext:Map<any, Settings> = new Map<any, Settings>();
  /**
   * Reset Singleton instance to the default values, all changes will be erased is not recommendable to use it
   * multiple times since all your options will be lost. Unless you have an option how to recover this is not
   * recommended to use often. Consider this is not DELETE initialization options, even if you deleted this is used
   * one time at the application starts.
   *
   * @static
   * @summary Reset Singleton instance
   * @memberof Settings
   */
  static reset() {
    delete Settings.instance;
  }

  /**
   * Get Current Singleton Instance or Created if not exists. If a new instance is created it will created with default
   * options.
   *
   * @static
   * @returns {Settings}
   * @memberof Settings
   * @summary Get Singleton Instance.
   */
  static getInstance(ctx?: any): Settings {
    if (ctx) {
      const context = nameOfClass(ctx);
      if (!Settings.isolatedContext.has(context)) {
        Settings.isolatedContext.set(context, new Settings(null, true));
      }
      return Settings.isolatedContext.get(context);
    }

    return Settings.instance || new Settings();
  }

  /**
   * Singleton Instance only for internal.
   *
   * @private
   * @static
   * @type {Settings}
   * @memberof Settings
   */
  private static instance: Settings;

  /**
   * Server configuration options.
   *
   * @private
   * @type {ExpressiveTeaServerProps}
   * @memberof Settings
   */
  private options: ExpressiveTeaServerProps;

  constructor(options: ExpressiveTeaServerProps = { port: 3000, securePort: 4443 }, isIsolated: boolean = false) {
    if (Settings.instance && !isIsolated) {
      return Settings.instance;
    }
    const settingsFile = fileSettings();
    this.options = Object.assign({}, { port: 3000, securePort: 4443 }, settingsFile, options);
    Settings.instance = this;
  }

  /**
   * It will return the latest snapshot options registered at the time that this method is called, as Expressive Tea
   * is designed as async methods some time options should not be available.
   *
   * @returns {ExpressiveTeaServerProps}
   * @memberof Settings
   * @summary Retrieve all registered options.
   */
  getOptions(): ExpressiveTeaServerProps {
    return this.options;
  }

  /**
   * Retrieve the option as is designated on <settingName> parameter, if does not exist it will return null instead of
   * undefined to give them a value and data consistency.
   *
   * @param {string} settingName
   * @returns {*}
   * @memberof Settings
   * @summary Retrieve an option
   */
  get(settingName: string): any {
    return _.get(this.options, settingName, null);
  }

  /**
   * Initialize or Edit a application options, this is only for in run options, as explained above initialization
   * options it won't affect any functionality as the application already started.
   *
   * @param {string} settingName
   * @param {*} value
   * @memberof Settings
   * @summary Initialize an option.
   */
  set(settingName: string, value: any): void {
    _.set(this.options, settingName, value);
  }

  /**
   * This Merge multiple options at the same time, this can edit or create the options.
   *
   * @param {ExpressiveTeaServerProps} [options={ port: 3000 }]
   * @memberof Settings
   * @summary Merge Options
   */
  merge(options: ExpressiveTeaServerProps = { port: 3000, securePort: 4443 }) {
    this.options = Object.assign(this.options, options);
  }
}

export default Settings;
