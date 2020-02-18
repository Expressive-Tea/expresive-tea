import { IExpressiveTeaRoute } from './interfaces';

export type Resolvable<R> = R | PromiseLike<R>;
export type Resolver<R> = (thenableOrResult?: Resolvable<R>) => void;
export type Rejector= (error?: any) => void;
export type ExpressiveTeaModuleClass<T> = new (...args: any[]) => T;
export type ExpressiveTeaRouteClass<T> = new (...args: any[]) => T;
