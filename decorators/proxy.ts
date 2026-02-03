import { Metadata } from '@expressive-tea/commons';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
import {  type ExpressiveTeaProxyOptions, type ExpressiveTeaProxyProperty, type MethodDecorator } from '@expressive-tea/commons';
import { isAsyncFunction } from '@expressive-tea/commons';
import { GenericRequestException } from '@exceptions/RequestExceptions';

import { PROXY_SETTING_KEY } from '@expressive-tea/commons';
import { type IExpressiveTeaProxySettings } from '@expressive-tea/commons';
import { Proxify, type ProxifiedClass } from '@mixins/proxy';
import { type Constructor } from '../types/core';

const NON_ASYNC_METHODS = new Set(['host']);

/**
 * ProxyContainer decorator - Creates an HTTP proxy for a microservice
 * 
 * Transforms a class into an HTTP proxy that forwards requests from a source path
 * to a target URL. Supports custom request/response transformations and options.
 * 
 * @template TBase - The base constructor type being decorated
 * @param {string} source - The source path to proxy from (e.g., '/api')
 * @param {string} targetUrl - The target URL to proxy to (e.g., 'http://api.example.com')
 * @returns {(target: TBase) => ProxifiedClass<TBase>} Decorator function that returns a proxified class
 * 
 * @example
 * {REPLACE-AT}ProxyContainer('/api', 'http://api.example.com')
 * class ApiProxy {
 *   {REPLACE-AT}ProxyOption('host')
 *   getHost() {
 *     return 'http://api.example.com';
 *   }
 * }
 * 
 * @since 1.0.0
 */
export function ProxyContainer<TBase extends Constructor = Constructor>(source: string, targetUrl: string) {

  return (ProxyContainerClass: TBase): ProxifiedClass<TBase> => {
    const settings: IExpressiveTeaProxySettings = {
      source,
      targetUrl,
      name: ProxyContainerClass.name
    };

    Metadata.set(PROXY_SETTING_KEY, settings, ProxyContainerClass);
    return Proxify<TBase>(ProxyContainerClass, source, targetUrl);
  };
}

export function ProxyOption(option: ExpressiveTeaProxyOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {

     
    if (NON_ASYNC_METHODS.has(option) && isAsyncFunction(descriptor.value)){
      throw new GenericRequestException(`${String(propertyKey)} must not be declared as Async Function.`);
    }

    Metadata.set(PROXY_SETTING_KEY, descriptor, target, option);
  };
}

export function ProxyProperty(option: ExpressiveTeaProxyProperty, value: any): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Metadata.set(PROXY_SETTING_KEY, propertyKey, target, option);
    Object.defineProperty(target, propertyKey, {
      get: () => value,
    });
  };
}
