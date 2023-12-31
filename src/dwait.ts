import type DeferredPromise from "./deferredPromise";

const DeferredPromiseSymbol = Symbol("dwait/DeferredPromise");
const asyncMethods = ["then", "catch", "finally"];
type Box<T> = { value: Awaited<T> | undefined };

/**
 * @async
 */
function dwait<T, Y>(promise: Promise<T>, lhs?: Box<Y>): DeferredPromise<T> {
  const task = Promise.resolve(promise);
  const result: Box<Promise<T>> = { value: undefined };
  return new Proxy<object>(function () {}, {
    get(_, symbol) {
      if (symbol === DeferredPromiseSymbol) {
        return task;
      }

      const prop = symbol as string;
      if (asyncMethods.includes(prop)) {
        // @ts-expect-error we are sure that this property exists and is callable.
        return (...args: unknown[]) => dwait(task[prop](...args));
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
        return dwait(
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
      return dwait(
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

export { dwait };
