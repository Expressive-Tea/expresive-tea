import * as _ from 'lodash';
import MetaData from '../classes/MetaData';
import { REGISTERED_MODEL_KEY } from '../libs/constants';
import { ExpressiveTeaServerProps } from '../libs/interfaces';

/**
 * Singleton Class to store and get settings and configurations
 *
 * @class Settings
 * @param {ExpressiveTeaServerProps} [options={ port: 3000 }]
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

  static getModel(modelName: object | string): any {
    const registeredModels = MetaData.get(REGISTERED_MODEL_KEY, Settings.getInstance()) || {};
    return _.get(registeredModels, modelName);
  }

  /**
   * Singleton Instance only for internal porpouses.
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
   * Get the Server Options.
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
