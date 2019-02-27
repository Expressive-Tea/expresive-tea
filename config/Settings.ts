import DEFAULT from '@config/envs/app.default';
import * as _ from 'lodash';

class Settings {
  static getInstance() {
    return Settings.instance;
  }

  private static instance: Settings;
  private readonly options;

  constructor(options = {}) {
    if (Settings.instance) {
      return Settings.instance;
    }

    this.options = Object.assign({}, DEFAULT, options);
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
}

export default Settings;
