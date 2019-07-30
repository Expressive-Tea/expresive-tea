import { Model } from '@expressive-tea/decorators/model';
import { IDynamicObject } from '@expressive-tea/libs/interfaces';
import * as _ from 'lodash';
import MetaData from '../classes/MetaData';
import { REGISTERED_MODEL_KEY } from '../libs/constants';

class Settings {
  static getInstance(): Settings {
    return Settings.instance || new Settings();
  }

  static getModel(modelName: string): any {
    const registeredModels = MetaData.get(REGISTERED_MODEL_KEY, Settings.getInstance()) || {};
    return _.get(registeredModels, modelName);
  }

  private static instance: Settings;
  private options: IDynamicObject;

  constructor(options: IDynamicObject = {}) {
    if (Settings.instance) {
      return Settings.instance;
    }

    this.options = Object.assign({}, {}, options);
    Settings.instance = this;
  }

  getOptions(): IDynamicObject {
    return this.options;
  }

  get(settingName: string): any {
    return _.get(this.options, settingName, null);
  }

  set(settingName: string, value: any): void {
    _.set(this.options, settingName, value);
  }

  merge(options: IDynamicObject) {
    this.options = Object.assign(this.options, options);
  }
}

export default Settings;
