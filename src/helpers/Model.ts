import Settings from '@config/Settings';
import MetaData from '@core/classes/MetaData';
import { REGISTERED_MODEL_KEY } from '@core/constants';
import { get } from 'lodash';

export function register(context) {
  const registeredModels = MetaData.get(REGISTERED_MODEL_KEY, Settings.getInstance()) || {};
  const Model = get(context, 'default', false);
  const ModelName = get(Model, 'modelName', false);
  if (Model && ModelName) {
    registeredModels[ModelName] = Model;
    MetaData.set(REGISTERED_MODEL_KEY, registeredModels, Settings.getInstance());
  }

}
