/**
 * Type representation of supported String Symbols.
 */
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

/**
 * Type representation of all supported Symbols.
 */
type DeferredSymbols<T> = StringSymbols<T>;

/**
 * Type of any underlying deferred operation.
 */
type DeferredFunction<T, Y = Promise<T>> = T extends (
    ...args: infer U
) => infer S
    ? (...args: U) => S extends BuiltinPromise<unknown> ? S : DeferredPromise<S>
    : Y;

/**
 * Wrapper type for any deferred promise which will remap return values to `DeferredPromise<U>` instead of `<U>`.
 * It also adds any additional {@link DeferredSymbols} missing in the {@link DeferredFunction} type.
 */
type DeferredSync<T> = DeferredFunction<
    T,
    {
        [P in keyof T]: T[P] extends BuiltinPromise<unknown>
            ? T[P]
            : DeferredPromise<T[P]>;
    }
> &
    DeferredSymbols<T>;

/**
 * A specific named version of native Promise used to infer the return type of `await` and `toPromise`.
 */
type BuiltinPromise<T> = Promise<T>;

/**
 * Additional methods of {@link DeferredPromise}.
 */
type Dwaited<T> = {
    /**
     * It will evaluate the deferred `async` chain operation and will return a {@link BuiltinPromise} to get awaited.
     *
     * @returns A `Promise` containing the end result of deferred `async` chain operation.
     */
    toPromise: () => BuiltinPromise<T>;

    /**
     * The underlying native `Promise` used for awaiting the deferred `async` chain operation.
     */
    await: BuiltinPromise<T>;
};

/**
 * A deferred `Promise` which can be used to chain multiple `async` operations together.
 */
type DeferredPromise<T> = DeferredSync<
    (T extends Promise<infer Y> ? Y : T) & Dwaited<T>
> &
    Promise<T>;

export default DeferredPromise;
