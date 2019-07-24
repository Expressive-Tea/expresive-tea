
import * as _ from 'lodash';
import MetaData from '../classes/MetaData';
import { REGISTERED_MODEL_KEY } from '../libs/constants';

class Settings {
  static getInstance() {
    return Settings.instance || new Settings();
  }

  static getModel(modelName: any) {
    const registeredModels = MetaData.get(REGISTERED_MODEL_KEY, Settings.getInstance()) || {};
    return _.get(registeredModels, modelName);
  }

  private static instance: Settings;
  private options;

  constructor(options = {}) {
    if (Settings.instance) {
      return Settings.instance;
    }

    this.options = Object.assign({}, {}, options);
    Settings.instance = this;
  }

  getOptions() {
    return this.options;
  }

  get(settingName) {
    return _.get(this.options, settingName, null);
  }

  set(settingName, value) {
    _.set(this.options, settingName, value);
  }

  merge(options) {
    this.options = Object.assign(this.options, options);
  }
}

export default Settings;
