import * as _ from 'lodash';

export function Model(Model) {
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
