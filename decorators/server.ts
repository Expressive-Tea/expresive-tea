import { Express } from 'express';
import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import { BOOT_STAGES, BOOT_STAGES_KEY, REGISTERED_MODULE_KEY } from '../libs/constants';
import { ExpressiveTeaServerProps } from '../libs/interfaces';

export function Plug(
  stage: BOOT_STAGES,
  name: string,
  method: (server: Express | never) => Promise<any> | any,
  required: boolean = false) {
  if (!name) {
    throw new Error('Unamed Plugin is not allowed.');
  }
  return (target: any): void => {
    const stages = MetaData.get(BOOT_STAGES_KEY, target) || {};
    if (!stages[stage]) {
      stages[stage] = [];
    }
    stages[stage].unshift({ method, required, name });
    MetaData.set(BOOT_STAGES_KEY, stages, target);
  };
}

export function ServerSettings(options: ExpressiveTeaServerProps = {}) {
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

export function RegisterModule(Module) {
  return (target, property) => {
    const registeredModules = MetaData.get(REGISTERED_MODULE_KEY, target, property) || [];
    registeredModules.push(Module);
    MetaData.set(REGISTERED_MODULE_KEY, registeredModules, target, property);
  };
}
