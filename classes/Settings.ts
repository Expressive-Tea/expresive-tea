import * as _ from 'lodash';
import MetaData from '../classes/MetaData';
import { REGISTERED_MODEL_KEY } from '../libs/constants';
import { ExpressiveTeaServerProps } from '../libs/interfaces';

class Settings {
  static getInstance(): Settings {
    return Settings.instance || new Settings();
  }

  static getModel(modelName: object | string): any {
    const registeredModels = MetaData.get(REGISTERED_MODEL_KEY, Settings.getInstance()) || {};
    return _.get(registeredModels, modelName);
  }

  private static instance: Settings;
  private options: ExpressiveTeaServerProps;

  constructor(options: ExpressiveTeaServerProps = { port: 3000 }) {
    if (Settings.instance) {
      return Settings.instance;
    }

    this.options = Object.assign({}, options);
    Settings.instance = this;
  }

  getOptions(): ExpressiveTeaServerProps {
    return this.options;
  }

  get(settingName: string): any {
    return _.get(this.options, settingName, null);
  }

  set(settingName: string, value: any): void {
    _.set(this.options, settingName, value);
  }

  merge(options: ExpressiveTeaServerProps = { port: 3000 }) {
    this.options = Object.assign(this.options, options);
  }
}

export default Settings;
