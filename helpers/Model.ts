import { get } from 'lodash';
import MetaData from '../classes/MetaData';
import Settings from '../classes/Settings';
import { REGISTERED_MODEL_KEY } from '../libs/constants';

export function register(context) {
  const registeredModels = MetaData.get(REGISTERED_MODEL_KEY, Settings.getInstance()) || {};
  const Model = get(context, 'default', false);
  const ModelName = get(Model, 'modelName', false);
  if (Model && ModelName) {
    registeredModels[ModelName] = Model;
    MetaData.set(REGISTERED_MODEL_KEY, registeredModels, Settings.getInstance());
  }

}
