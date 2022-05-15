import MetaData from '../classes/MetaData';
import {  ExpressiveTeaProxyOptions, ExpressiveTeaProxyProperty, MethodDecorator } from '../libs/types';
import * as httpProxy from 'express-http-proxy';
import { Express, RequestHandler } from 'express';
import {
  PROXY_SETTING_KEY,
  PROXY_METHODS,
  PROXY_PROPERTIES
} from '../libs/constants';
import {
  IExpressiveTeaProxySettings,
  IExpressiveTeaProxy
} from '../libs/interfaces';
import { getClass, isAsyncFunction } from '../helpers/object-helper';
import { isUndefined } from 'lodash';
import { GenericRequestException } from '../exceptions/RequestExceptions';

const NON_ASYNC_METHODS = ['host'];

export function ProxyContainer(source: string, targetUrl: string) {

  return <T extends new (...args: any[]) => Record<string, unknown>>(ProxyContainerClass: T) => {

    class ExpressiveTeaProxy extends ProxyContainerClass implements IExpressiveTeaProxy {
      readonly source: string;
      readonly target: string;
      readonly proxyHandler: RequestHandler;

      constructor(...args: any[]) {
        super(...args);
        this.source = source;
        this.target = targetUrl;

        const options:httpProxy.ProxyOptions = {};
        const host:PropertyDescriptor = MetaData.get(PROXY_SETTING_KEY, this, PROXY_METHODS.HOST);

        for (const value of Object.values(PROXY_METHODS)) {
          if (value !== PROXY_METHODS.HOST) {
            options[value] = MetaData.get(PROXY_SETTING_KEY, this, value);
          }
        }

        for (const value of Object.values(PROXY_PROPERTIES)) {
          const key: string = MetaData.get(PROXY_SETTING_KEY, this, value);
          if (!isUndefined(key)) {
            // @ts-ignore:next-line
            options[value] = this[key];
            console.log(`${value}: ${key}, ${this[key]}`);
          }
        }

        this.proxyHandler = httpProxy(host ? host.value.bind(this) : this.target)
      }

      __register(server: Express): void {
        const proxyMetadata: IExpressiveTeaProxySettings  = MetaData.get(PROXY_SETTING_KEY, getClass(this));
        console.info(`[PROXY - ${proxyMetadata.name}] ${this.source} -> ${this.target}`);
        server.use(this.source, this.proxyHandler);
      }
    };

    const settings: IExpressiveTeaProxySettings = {
      source,
      targetUrl,
      name: ProxyContainerClass.name
    };

    MetaData.set(PROXY_SETTING_KEY, settings, ProxyContainerClass);
    return ExpressiveTeaProxy;
  };
}

export function ProxyOption(option: ExpressiveTeaProxyOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {

    if (NON_ASYNC_METHODS.includes(option) && isAsyncFunction(descriptor.value)){
      throw new GenericRequestException(`${String(propertyKey)} must not be declared as Async Function.`);
    }

    MetaData.set(PROXY_SETTING_KEY, descriptor, target, option);
  }
}

export function ProxyProperty(option: ExpressiveTeaProxyProperty, value: any): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    MetaData.set(PROXY_SETTING_KEY, propertyKey, target, option);
    let currentValue = target[propertyKey];

    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: () => {  currentValue = value}
    });
  }
}
