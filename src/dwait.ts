import type Box from "./box";
import type DeferredPromise from "./deferredPromise";

/**
 * List of async methods to let pass through {@link DeferredPromise}
 */
const asyncMethods = ["then", "catch", "finally"];

/**
 * It is just an empty function to point at
 */
// istanbul ignore next no op code
function noop() {}

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
  promise: Promise<T>,
  lhs?: Box<Y>
): DeferredPromise<T> {
  const task = Promise.resolve(promise);
  const result: Box<Promise<T>> = { value: undefined };
  return new Proxy<object>(noop, {
    get(_, symbol) {
      const prop = symbol as string;
      if (asyncMethods.includes(prop)) {
        // @ts-expect-error we are sure that this property exists and is callable.
        return (...args: unknown[]) => dwaitInternal(task[prop](...args));
      } else if (prop === "await") {
        return task.then((target) => {
          result.value = target;
          return target;
        });
      } else if (prop === "toPromise") {
        return () =>
          task.then((target) => {
            result.value = target;
            return target;
          });
      } else {
        return dwaitInternal(
          task.then((target) => {
            result.value = target;
            // @ts-expect-error this is just deferred actions of the user, and user has to make sure target property is a valid value
            return target[prop];
          }),
          result
        );
      }
    },
    apply(_, thisArg, args) {
      return dwaitInternal(
        task.then((target) => {
          if (lhs?.value !== undefined) {
            // @ts-expect-error this is just deferred actions of the user, and user has to make sure target is a valid function
            return Reflect.apply(target, lhs.value, args);
          } else {
            // @ts-expect-error this is just deferred actions of the user, and user has to make sure target is a valid function
            return Reflect.apply(target, thisArg, args);
          }
        })
      );
    },
  }) as DeferredPromise<T & { await: () => Promise<T> }>;
}

/**
 * This function will take a `Promise` and will wrap it as a {@link DeferredPromise}
 *
 * @param promise - The target promise to make deferred.
 *
 * @returns A {@link DeferredPromise} pointing to the target `Promise`
 */
function dwait<T>(promise: Promise<T>): DeferredPromise<T> {
  return dwaitInternal(promise);
}

export { dwait };
