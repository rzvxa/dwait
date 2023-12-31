type StringSymbols<T> = T extends string
    ? {
          split: (
              separator: string | RegExp,
              limit?: number
          ) => DeferredPromise<string[]>;
          match: (
              regexp: string | RegExp
          ) => DeferredPromise<RegExpMatchArray | null>;
          matchAll: (
              regexp: RegExp
          ) => DeferredPromise<IterableIterator<RegExpMatchArray>>;
          replace: (
              searchValue: string | RegExp,
              replaceValue: string
          ) => DeferredPromise<string>;
          search: (regexp: string | RegExp) => DeferredPromise<number>;
      }
    : NonNullable<unknown>;

type DeferredSymbols<T> = StringSymbols<T>;

export type DeferredFunction<T, Y = Promise<T>> = T extends (
    ...args: infer U
) => infer S
    ? (...args: U) => S extends BuiltinPromise<unknown> ? S : DeferredPromise<S>
    : Y;

export type DeferredSync<T> = DeferredFunction<
    T,
    {
        [P in keyof T]: T[P] extends BuiltinPromise<unknown>
            ? T[P]
            : DeferredPromise<T[P]>;
    }
> &
    DeferredSymbols<T>;

type BuiltinPromise<T> = Promise<T>;

type Dwaited<T> = {
    toPromise: () => BuiltinPromise<T>;
    await: BuiltinPromise<T>;
};

type DeferredPromise<T> = DeferredSync<
    (T extends Promise<infer Y> ? Y : T) & Dwaited<T>
> &
    Promise<T>;

export default DeferredPromise;
