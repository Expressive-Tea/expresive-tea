import Settings from '@config/Settings';
import MetaData from '@core/classes/MetaData';
import { BOOT_STAGES } from '@core/constants';

export function Plug(stage: BOOT_STAGES, name, method, required = false) {
  if (!name) {
    throw new Error('Unamed Plugin is not allowed.');
  }
  return target => {
    const stages = MetaData.get('boot:stage-settings', target) || {};
    if (!stages[stage]) {
      stages[stage] = [];
    }
    stages[stage].push({ method, required, name });
    MetaData.set('boot:stage-settings', stages, target);
  };
}

export function ServerSettings(options = {}) {
  return target => {
    target.settings = new Settings(options);
    return target;
  };
}

export function Setting(settingName) {
  if (!settingName) {
    throw new Error('Setting Name must be defined');
  }

  return (target, propertyName) => {
    Object.defineProperty(target, propertyName, {
      configurable: false,
      get: () => target.settings[propertyName]
    });
  };
}
