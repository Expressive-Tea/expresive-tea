import * as _ from 'lodash';
import { ExpressiveTeaServerProps } from '../libs/interfaces';

/**
 * Settings Singleton Class to allow store server, application and plugins settings during design mode. Can be used on
 * run stage except by the port setting or any other in-design properties everything can be changed and reflected
 * immediatly, the fact that some of the properties will be ignored after design stage is because is used only one time
 * to provide initial settings or some initialization parameters.
 *
 * @class Settings
 * @param {ExpressiveTeaServerProps} [options={ port: 3000 }]
 * @summary Singleton Class to Store Server Settings
 */
class Settings {
  /**
   * Reset Singleton
   *
   * @static
   * @memberof Settings
   */
  static reset() {
    delete Settings.instance;
  }

  /**
   * Get Current Singleton Instance or Created if not exists.
   *
   * @static
   * @returns {Settings}
   * @memberof Settings
   */
  static getInstance(): Settings {
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

  constructor(options: ExpressiveTeaServerProps = { port: 3000 }) {
    if (Settings.instance) {
      return Settings.instance;
    }

    this.options = Object.assign({}, { port: 3000 }, options);
    Settings.instance = this;
  }

  /**
   * Get all registered options by design and run.
   *
   * @returns {ExpressiveTeaServerProps}
   * @memberof Settings
   */
  getOptions(): ExpressiveTeaServerProps {
    return this.options;
  }

  /**
   * Get the setting on <setting Name> or return undefined.
   *
   * @param {string} settingName
   * @returns {*}
   * @memberof Settings
   */
  get(settingName: string): any {
    return _.get(this.options, settingName, null);
  }

  /**
   * Set or edit a setting.
   *
   * @param {string} settingName
   * @param {*} value
   * @memberof Settings
   */
  set(settingName: string, value: any): void {
    _.set(this.options, settingName, value);
  }

  /**
   * Merge Server Settings.
   *
   * @param {ExpressiveTeaServerProps} [options={ port: 3000 }]
   * @memberof Settings
   */
  merge(options: ExpressiveTeaServerProps = { port: 3000 }) {
    this.options = Object.assign(this.options, options);
  }
}

export default Settings;
