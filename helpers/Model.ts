import MetaData from '@expressive-tea/classes/MetaData';
import Settings from '@expressive-tea/classes/Settings';
import { REGISTERED_MODEL_KEY } from '@expressive-tea/libs/constants';
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
