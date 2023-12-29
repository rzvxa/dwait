export type DeferredFunction<T, Y = Promise<T>> = T extends (
    ...args: infer U
) => infer S
    ? (...args: U) => DeferredPromise<S>
    : Y;

export type DeferredSync<T> = DeferredFunction<
    T,
    {
        [P in keyof T]: DeferredPromise<T[P]>;
    }
> &
    Promise<T>;

type DeferredPromise<T> = DeferredSync<T extends Promise<infer Y> ? Y : T>;

export default DeferredPromise;
