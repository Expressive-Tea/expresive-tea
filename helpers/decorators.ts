import MetaData from '../classes/MetaData';
import { ROUTER_ANNOTATIONS_KEY } from '../libs/constants';
import { ExpressiveTeaAnnotations } from '../libs/interfaces';

export function addAnnotation(type: string, target: object, propertyKey: string | symbol, ...args) {
  const annotations: ExpressiveTeaAnnotations[] = MetaData.get(ROUTER_ANNOTATIONS_KEY, target, propertyKey) || [];
  annotations.unshift({
    arguments: args,
    type
  });
  MetaData.set(ROUTER_ANNOTATIONS_KEY, annotations, target, propertyKey);
}
