import MetaData from '@expressive-tea/commons/classes/Metadata';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {  type ExpressiveTeaProxyOptions, type ExpressiveTeaProxyProperty, type MethodDecorator } from '@expressive-tea/commons/types';
import { isAsyncFunction } from '@expressive-tea/commons/helpers/object-helper';
import { GenericRequestException } from '../exceptions/RequestExceptions';

import { PROXY_SETTING_KEY } from '@expressive-tea/commons/constants';
import { type IExpressiveTeaProxySettings } from '@expressive-tea/commons/interfaces';
import { Proxify } from '../mixins/proxy';
import { ProxifyExpressiveTeaRoute } from '../types/core';

const NON_ASYNC_METHODS = new Set(['host']);

export function ProxyContainer(source: string, targetUrl: string) {

  return (ProxyContainerClass: any): ProxifyExpressiveTeaRoute<typeof ProxyContainerClass> => {
    const settings: IExpressiveTeaProxySettings = {
      source,
      targetUrl,
      name: ProxyContainerClass.name
    };

    MetaData.set(PROXY_SETTING_KEY, settings, ProxyContainerClass);
    return Proxify<typeof ProxyContainerClass>(ProxyContainerClass, source, targetUrl);
  };
}

export function ProxyOption(option: ExpressiveTeaProxyOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (NON_ASYNC_METHODS.has(option) && isAsyncFunction(descriptor.value)){
      throw new GenericRequestException(`${String(propertyKey)} must not be declared as Async Function.`);
    }

    MetaData.set(PROXY_SETTING_KEY, descriptor, target, option);
  };
}

export function ProxyProperty(option: ExpressiveTeaProxyProperty, value: any): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    MetaData.set(PROXY_SETTING_KEY, propertyKey, target, option);
    Object.defineProperty(target, propertyKey, {
      get: () => value,
    });
  };
}
