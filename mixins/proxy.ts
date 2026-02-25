/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Constructor } from '../types/core';
import type { IExpressiveTeaProxySettings } from '@expressive-tea/commons';
import type { Express, RequestHandler } from 'express';
import * as httpProxy from 'express-http-proxy';
import { Metadata } from '@expressive-tea/commons';
import { PROXY_METHODS, PROXY_PROPERTIES, PROXY_SETTING_KEY } from '@expressive-tea/commons';
import { isUndefined } from '@libs/utilities';
import { getClass } from '@expressive-tea/commons';
import { injectable, injectFromBase } from 'inversify';
import DependencyInjection from '@services/DependencyInjection';
import logger from '@helpers/logger';

/**
 * Type definition for a proxified class
 * Represents a class that has been enhanced with Expressive Tea proxy capabilities
 * @template TBase - The base constructor type being extended
 * @since 2.0.0
 */
export type ProxifiedClass<TBase extends Constructor> = TBase &
  (new (...args: any[]) => {
    /** Source path to proxy from */
    readonly source: string;
    /** Target URL to proxy to */
    readonly target: string;
    /** Express HTTP proxy request handler */
    readonly proxyHandler: RequestHandler;
    /** Register proxy route with the Express application */
    __register(server: Express): void;
  });

/**
 * Proxify mixin - Adds Expressive Tea HTTP proxy capabilities to a class
 *
 * Transforms a regular class into an Expressive Tea proxy with:
 * - HTTP proxy configuration
 * - Request/response transformation
 * - Custom headers and options
 * - Automatic proxy registration
 *
 * @template TBase - The base constructor type to extend
 * @param {TBase} Base - The base class to extend
 * @param {string} source - The source path to proxy from (e.g., '/api')
 * @param {string} targetUrl - The target URL to proxy to (e.g., 'http://api.example.com')
 * @returns {ProxifiedClass<TBase>} The enhanced class with proxy capabilities
 *
 * @example
 * ```typescript
 * @Proxy('/api', 'http://api.example.com')
 * class ApiProxy {
 *   @ProxyHost()
 *   getHost() {
 *     return 'http://api.example.com';
 *   }
 * }
 * ```
 * @since 2.0.0
 */
export function Proxify<TBase extends Constructor>(
  Base: TBase,
  source: string,
  targetUrl: string
): ProxifiedClass<TBase> {
  @injectable('Singleton')
  @injectFromBase({ extendConstructorArguments: true })
  class ExpressiveTeaProxy extends Base {
    readonly source: string;
    readonly target: string;
    readonly proxyHandler: RequestHandler;

    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args);
      this.source = source;
      this.target = targetUrl;

      const options: httpProxy.ProxyOptions = {};
      const host: PropertyDescriptor = Metadata.get(PROXY_SETTING_KEY, this, PROXY_METHODS.HOST);

      for (const value of Object.values(PROXY_METHODS)) {
        if (value !== PROXY_METHODS.HOST) {
          options[value] = Metadata.get(PROXY_SETTING_KEY, this, value);
        }
      }

      for (const value of Object.values(PROXY_PROPERTIES)) {
        const key: string = Metadata.get(PROXY_SETTING_KEY, this, value);
        if (!isUndefined(key)) {
          (options as any)[value] = (this as any)[key];
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.proxyHandler = httpProxy(host ? host.value.bind(this) : this.target) as unknown as RequestHandler;
    }

    __register(server: Express): void {
      const proxyMetadata: IExpressiveTeaProxySettings = Metadata.get(PROXY_SETTING_KEY, getClass(this));
      logger.info(`[PROXY - ${proxyMetadata.name}] ${this.source} -> ${this.target}`);
      server.use(this.source, this.proxyHandler);
    }
  }

  // Bind the original class to the wrapped class in the DI container
  // This ensures that when the application requests the original proxy class,
  // it receives an instance of the wrapped ExpressiveTeaProxy class instead
  try {
    if (DependencyInjection.Container.isBound(Base)) {
      DependencyInjection.Container.unbind(Base);
    }
    DependencyInjection.Container.bind<any>(Base).to(ExpressiveTeaProxy);
  } catch {
    // Binding may fail in some contexts, but that's okay - the class is still usable
  }

  return ExpressiveTeaProxy as ProxifiedClass<TBase>;
}
