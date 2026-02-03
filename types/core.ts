import {
  type IExpressiveTeaModule,
  IExpressiveTeaProxy,
  type IExpressiveTeaRoute
} from '@expressive-tea/commons';

// Generic utility types - any is required for maximum flexibility
/* eslint-disable @typescript-eslint/no-explicit-any */
export type TFunction<T = any> = (...args: any[]) => T;
export type Constructor<T = Record<string, any>> = new (...args: any[]) => T;
export type MixinConstructor<T = Record<string, any>> = Constructor<T>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ExpressiveTeaModule = MixinConstructor<IExpressiveTeaModule>;
export type ExpressiveTeaRoute = MixinConstructor<IExpressiveTeaRoute>;
export type ExpressiveTeaProxy = MixinConstructor<IExpressiveTeaProxy>;

/**
 * Legacy type aliases - kept for backward compatibility
 * @deprecated Use the typed versions from mixins instead
 */
export type ModulizedExpressiveTeaModule<TBase> = IExpressiveTeaModule & TBase;
export type RouterizedExpressiveTeaRoute<TBase> = IExpressiveTeaRoute & TBase;
export type ProxifyExpressiveTeaRoute<TBase> = IExpressiveTeaProxy & TBase;

