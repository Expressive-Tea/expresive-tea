import { get, set } from '@libs/utilities';
import { ExpressiveTeaServerProps, nameOfClass } from '@expressive-tea/commons';
import { injectable } from 'inversify';
import { type FileSettingsResult, fileSettings } from '@helpers/server';
import { getTransformedEnv } from '@decorators/env';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isolatedContext: Map<any, Settings> = new Map<any, Settings>();
  /**
   * Reset Singleton instance to the default values, all changes will be erased is not recommendable to use it
   * multiple times since all your options will be lost. Unless you have an option how to recover this is not
   * recommended to use often. Consider this is not DELETE initialization options, even if you deleted this is used
   * one time at the application starts.
   *
   * @static
   * @param {boolean} [resetIsolated=true] - If true, also reset all isolated contexts
   * @summary Reset Singleton instance
   * @memberof Settings
   */
  static reset(resetIsolated: boolean = true): void {
    Settings.instance = undefined;
    if (resetIsolated) {
      Settings.isolatedContext.clear();
    }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getInstance(ctx?: any): Settings {
    if (ctx) {
      const context = nameOfClass(ctx);
      if (!Settings.isolatedContext.has(context)) {
        Settings.isolatedContext.set(context, new Settings(undefined, true));
      }
      return Settings.isolatedContext.get(context) as Settings;
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
  private static instance: Settings | undefined;

  /**
   * Server configuration options.
   *
   * @private
   * @type {ExpressiveTeaServerProps}
   * @memberof Settings
   */
  private options: ExpressiveTeaServerProps = { port: 3000, securePort: 4443 };

  constructor(options: ExpressiveTeaServerProps = {}, isIsolated: boolean = false) {
    if (Settings.instance && !isIsolated) {
      return Settings.instance;
    }
    const settingsFile: FileSettingsResult = fileSettings();
    this.options = {
      ...this.options,
      ...settingsFile.config,
      ...options
    } as ExpressiveTeaServerProps;

    if (!isIsolated) {
      Settings.instance = this;
    }
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
    return get(this.options, settingName, null);
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
    set(this.options, settingName, value);
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

  /**
   * Get environment variables with optional type safety.
   *
   * Returns transformed environment variables if a transform function was provided
   * to the @Env decorator, otherwise returns process.env.
   *
   * Use this method for type-safe access to environment variables when using
   * the @Env decorator with a transform function (e.g., Zod validation).
   *
   * @template T - Type of environment variables (defaults to NodeJS.ProcessEnv)
   * @returns Typed environment variables
   * @since 2.0.1
   * @summary Get type-safe environment variables
   *
   * @example
   * // Basic usage (returns process.env)
   * const env = Settings.getInstance().getEnv();
   * console.log(env.NODE_ENV);
   *
   * @example
   * // With type-safe transform from @Env decorator
   * type Env = { PORT: number; DATABASE_URL: string };
   *
   * const env = Settings.getInstance().getEnv<Env>();
   * console.log(env.PORT); // Type: number (transformed)
   * console.log(env.DATABASE_URL); // Type: string (validated)
   */
  getEnv<T = Record<string, string>>(): T {
    const transformed: T | null = getTransformedEnv<T>();
    if (transformed !== null) {
      return transformed;
    }
    return process.env as T;
  }
}

export default Settings;
