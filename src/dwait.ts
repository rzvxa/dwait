import type Box from "./box";
import type DeferredPromise from "./deferredPromise";
import DeferredPromiseSymbol from "./deferredPromiseSymbol";

/**
 * List of async methods to let pass through {@link DeferredPromise}
 */
const ASYNC_METHODS = ["then", "catch", "finally"];

/**
 * It is just an empty function to point at
 */
// istanbul ignore next no op code
function DeferredOperation() {}

/**
 * Checks the input to see if it is a {@link DeferredPromise} or not.
 *
 * @param promise - The input to test.
 *
 * @returns True if `promise` is a {@link DeferredPromise} otherwise will return false.
 */
function isDeferredPromise(promise: unknown): boolean {
  if (promise === null || promise === undefined) {
    return false;
  } else {
    // @ts-expect-error we are sure that this property exists and is callable.
    return promise[DeferredPromiseSymbol] ? true : false;
  }
}

/**
 * This function will take a `Promise` and will wrap it as a {@link DeferredPromise}
 *
 * @remarks
 * This function is used as the underlying function within {@link dwait}, And
 * it is meant to be used only for internal use.
 *
 * @param promise - The target promise to make deferred.
 * @param lhs - The {@link Box}ed value of expression on the `Left hand side` of {@link DeferredPromise}
 *
 * @returns A {@link DeferredPromise} pointing to the target `Promise`
 *
 * @async
 * @internal
 */
function dwaitInternal<T, Y>(
  promise: Promise<T> | T,
  lhs?: Box<Y>
): DeferredPromise<T> {
  if (isDeferredPromise(promise)) {
    return promise as DeferredPromise<T>;
  }
  const task = Promise.resolve(promise);
  const result: Box<Promise<T>> = { value: undefined };
  const then = (callback?: (target: unknown) => Awaited<T>): Promise<T> => {
    return task.then((t) => {
      const value = callback ? callback(t) : t;
      result.value = t;
      return value;
    });
  };
  const proxy = new Proxy<object>(DeferredOperation, {
    get(_, symbol) {
      if (symbol === DeferredPromiseSymbol) {
        return true;
      }
      const prop = symbol as string;
      if (ASYNC_METHODS.includes(prop)) {
        // @ts-expect-error we are sure that this property exists and is callable.
        return (...args: unknown[]) => dwaitInternal(task[prop](...args));
      } else if (prop === "await") {
        return then();
      } else if (prop === "toPromise") {
        return () => then();
      } else {
        return dwaitInternal(
          then((target) => {
            if (target === undefined || target === null) {
              throw new RangeError(
                `Property ${prop.toString()} does not exists on ${target}.`
              );
            } else {
              // @ts-expect-error this is just deferred actions of the user, and user has to make sure target property is a valid value
              return target[prop];
            }
          }),
          result
        );
      }
    },
    apply(_, thisArg, args) {
      return dwaitInternal(
        then((target) => {
          if (typeof target !== "function") {
            throw new TypeError(
              `${target} is not a function, unexpected call to ${target} passing (${
                args.join(", ") || "nothing"
              }) as arguments.`
            );
          } else if (lhs?.value !== undefined) {
            return Reflect.apply(target, lhs.value, args);
          } else {
            return Reflect.apply(target, thisArg, args);
          }
        }),
        result
      );
    },
  }) as DeferredPromise<T>;

  return proxy;
}

/**
 * This function will take a `Promise` and will wrap it as a {@link DeferredPromise}
 *
 * @param promise - The target promise to make deferred.
 *
 * @returns A {@link DeferredPromise} pointing to the target `Promise`
 */
function dwait<T>(promise: Promise<T> | T): DeferredPromise<T> {
  return dwaitInternal(promise);
}

export { isDeferredPromise };
export default dwait;
