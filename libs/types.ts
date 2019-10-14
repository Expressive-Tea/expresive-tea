export type Resolvable<R> = R | PromiseLike<R>;
export type Resolver<R> = (thenableOrResult?: Resolvable<R>) => void;
export type Rejector= (error?: any) => void;
