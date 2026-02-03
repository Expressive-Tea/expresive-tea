import { Metadata } from '@expressive-tea/commons';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ROUTER_ANNOTATIONS_KEY } from '@expressive-tea/commons';
import { type ExpressiveTeaAnnotations } from '@expressive-tea/commons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function addAnnotation(type: string, target: object, propertyKey: string | symbol, ...args: any[]) {
  const annotations: ExpressiveTeaAnnotations[] = Metadata.get(ROUTER_ANNOTATIONS_KEY, target, propertyKey) || [];
  annotations.unshift({
    arguments: args,
    type
  });
  Metadata.set(ROUTER_ANNOTATIONS_KEY, annotations, target, propertyKey);
}
