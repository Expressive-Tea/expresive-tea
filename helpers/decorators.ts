import MetaData from '@expressive-tea/commons/classes/Metadata';
import { ROUTER_ANNOTATIONS_KEY } from '@expressive-tea/commons/constants';
import { ExpressiveTeaAnnotations } from '@expressive-tea/commons/interfaces';

export function addAnnotation(type: string, target: object, propertyKey: string | symbol, ...args) {
  const annotations: ExpressiveTeaAnnotations[] = MetaData.get(ROUTER_ANNOTATIONS_KEY, target, propertyKey) || [];
  annotations.unshift({
    arguments: args,
    type
  });
  MetaData.set(ROUTER_ANNOTATIONS_KEY, annotations, target, propertyKey);
}
