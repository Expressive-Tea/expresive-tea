import { NextFunction, Request, Response } from 'express';

export type Resolvable<R> = R | PromiseLike<R>;
export type Resolver<R> = (thenableOrResult?: Resolvable<R>) => void;
export type Rejector = (error?: any) => void;
export type ExpressiveTeaModuleClass<T> = new (...args: any[]) => T;
export type ExpressiveTeaRouteClass<T> = new (...args: any[]) => T;
export type ExpressMiddlewareHandler = (request?: Request, response?: Response, next?: NextFunction) => void;
export type ExpressiveTeaMiddleware = (...args: unknown[]) => unknown | Promise<unknown>;

// tslint:disable:ban-types
export type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
export type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
export type MethodDecorator = (target: Object, propertyKey: string | symbol, descriptor:
  PropertyDescriptor) => PropertyDescriptor | void;

export type ParameterDecorator = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

export type ExpressiveTeaProxyOptions = 'proxyReqPathResolver' |'host' | 'filter'| 'userResDecorator' |
  'userResHeaderDecorator' | 'skipToNextHandlerFilter' | 'proxyErrorHandler' | 'proxyReqOptDecorator' |
  'proxyReqBodyDecorator';

export type ExpressiveTeaProxyProperty = 'limit' | 'memoizeHost' | 'https' | 'preserveHostHdr' | 'parseReqBody' |
  'reqAsBuffer' | 'reqBodyEncoding' | 'timeout';
