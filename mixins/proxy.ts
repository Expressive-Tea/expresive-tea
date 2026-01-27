// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Constructor, ExpressiveTeaProxy } from '../types/core';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import type { IExpressiveTeaProxySettings } from '@expressive-tea/commons/interfaces';
import type { Express, RequestHandler } from 'express';
import * as httpProxy from 'express-http-proxy';
import MetaData from '@expressive-tea/commons/classes/Metadata';
import { PROXY_METHODS, PROXY_PROPERTIES, PROXY_SETTING_KEY } from '@expressive-tea/commons/constants';
import { isUndefined } from 'lodash';
import { getClass } from '@expressive-tea/commons/helpers/object-helper';

 
export function Proxify<TBase extends Constructor>(Base: TBase, source: string, targetUrl: string): any {
  return class ExpressiveTeaProxy extends Base {
    readonly source: string;
    readonly target: string;
    readonly proxyHandler: RequestHandler;

    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
          // @ts-expect-error:next-line
          options[value] = this[key];
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.proxyHandler = httpProxy(host ? host.value.bind(this) : this.target) as unknown as RequestHandler;
    }

    __register(server: Express): void {
      const proxyMetadata: IExpressiveTeaProxySettings  = MetaData.get(PROXY_SETTING_KEY, getClass(this));
      console.info(`[PROXY - ${proxyMetadata.name}] ${this.source} -> ${this.target}`);
      server.use(this.source, this.proxyHandler);
    }
  };
}
