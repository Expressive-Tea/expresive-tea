import Settings from '@config/Settings';
import * as _ from 'lodash';

export function Model(Model: string | object) {
  if (_.isString(Model)) {
    Model = Settings.getModel(Model);
  }

  if (_.isNil(Model)) {
    throw  new Error('Model must be defined');
  }

  return (target, propertyName) => {
    Object.defineProperty(target, propertyName, {
      configurable: false,
      get: () => Model
    });
  };
}
