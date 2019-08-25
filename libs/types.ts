import ExpressiveTeaPlugin from '../classes/Plugin';

export type Resolvable<R> = R | PromiseLike<R>;
export type Resolver<R> = (thenableOrResult?: Resolvable<R>) => void;
export type Rejector= (error?: any) => void;
export type Constructor<T> = new(...args: any[]) => T;
export type PluginConstructor<T extends ExpressiveTeaPlugin> = new (...args: any[]) => T;
