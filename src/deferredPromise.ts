export type DeferredFunction<T, Y = Promise<T>> = T extends (
    ...args: infer U
) => infer S
    ? (...args: U) => S extends BuiltinPromise<unknown> ? S : DeferredPromise<S>
    : Y;

export type DeferredSync<T> = DeferredFunction<
    T,
    {
        [P in keyof T]: T[P] extends BuiltinPromise<unknown> ? T[P] : DeferredPromise<T[P]>;
    }
> &
    Promise<T>;

type BuiltinPromise<T> = Promise<T>;

type Dwaited<T> = {
    toPromise: () => BuiltinPromise<T>;
    await:  BuiltinPromise<T>;
};

type DeferredPromise<T> = DeferredSync<
    (T extends Promise<infer Y> ? Y : T) & Dwaited<T>
>;

export default DeferredPromise;
