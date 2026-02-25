import { ServiceIdentifier as InversifyServiceIdentifier } from 'inversify';

// Inversify type definitions - any is required to mirror Inversify's API
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ServiceIdentifier<T = any> = InversifyServiceIdentifier<T> | (abstract new (...args: any[]) => T);
export type LazyInversifyDecorator<T = any> = (
  serviceIdentifier: ServiceIdentifier<T>
) => (proto: any, key: string) => void;
export type LazyInversifyNamedDecorator<T = any> = (
  serviceIdentifier: ServiceIdentifier<T>,
  named: string
) => (proto: any, key: string) => void;
export type LazyInversifyTaggedDecorator<T = any> = (
  serviceIdentifier: ServiceIdentifier<T>,
  key: string,
  value: any
) => (proto: any, propertyName: string) => void;
/* eslint-enable @typescript-eslint/no-explicit-any */
