import MetaData from '@expressive-tea/commons/classes/Metadata';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ROUTER_ANNOTATIONS_KEY } from '@expressive-tea/commons/constants';
import { type ExpressiveTeaAnnotations } from '@expressive-tea/commons/interfaces';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addAnnotation(type: string, target: object, propertyKey: string | symbol, ...args: any[]) {
  const annotations: ExpressiveTeaAnnotations[] = MetaData.get(ROUTER_ANNOTATIONS_KEY, target, propertyKey) || [];
  annotations.unshift({
    arguments: args,
    type
  });
  MetaData.set(ROUTER_ANNOTATIONS_KEY, annotations, target, propertyKey);
}
