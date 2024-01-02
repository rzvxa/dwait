import type Box from "./box";
import type DeferredPromise from "./deferredPromise";

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
  const task = Promise.resolve(promise);
  const result: Box<Promise<T>> = { value: undefined };
  const then = (callback?: (target: unknown) => Promise<T>): Promise<T> => {
    return task.then((target) => {
      result.value = target;
      if (callback) {
        return callback(target);
      } else {
        return target;
      }
    });
  };
  return new Proxy<object>(DeferredOperation, {
    get(_, symbol) {
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
          // @ts-expect-error this is just deferred actions of the user, and user has to make sure target property is a valid value
          then((target) => target[prop]),
          result
        );
      }
    },
    apply(_, thisArg, args) {
      return dwaitInternal(
        then((target) => {
          if (lhs?.value !== undefined) {
            // @ts-expect-error this is just deferred actions of the user, and user has to make sure target is a valid function
            return Reflect.apply(target, lhs.value, args);
          } else {
            // @ts-expect-error this is just deferred actions of the user, and user has to make sure target is a valid function
            return Reflect.apply(target, thisArg, args);
          }
        }),
        result
      );
    },
  }) as DeferredPromise<T>;
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

export default dwait;
