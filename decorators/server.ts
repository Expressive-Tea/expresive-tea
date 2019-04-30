import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import { BOOT_STAGES, BOOT_STAGES_KEY } from '../libs/constants';

export function Plug(stage: BOOT_STAGES, name, method, required = false) {
  if (!name) {
    throw new Error('Unamed Plugin is not allowed.');
  }
  return target => {
    const stages = MetaData.get(BOOT_STAGES_KEY, target) || {};
    if (!stages[stage]) {
      stages[stage] = [];
    }
    stages[stage].push({ method, required, name });
    MetaData.set(BOOT_STAGES_KEY, stages, target);
  };
}

export function ServerSettings(options = {}) {
  return target => {
    Settings.getInstance().merge(options);
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
