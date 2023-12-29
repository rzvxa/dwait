import type DeferredPromise from "./deferredPromise";

const DeferredPromiseSymbol = Symbol("dwait/DeferredPromise");
const asyncMethods = ["then", "catch", "finally"];
type Box<T> = { value: Awaited<T> | undefined };

/**
 * @async
 */
function dwait<T, P = Promise<T>>(promise: P, rhs?: Box<unknown>): Promise<T> {
  const task = Promise.resolve(promise);
  const result: Box<P> = { value: undefined };
  return new Proxy<object>(function () {}, {
    get(_, symbol) {
      if (symbol === DeferredPromiseSymbol) {
        return task;
      }

      const prop = symbol as string;
      if (asyncMethods.includes(prop as string)) {
        // @ts-expect-error we are sure that this property exists and is callable.
        return (...args: unknown[]) => dwait(task[prop](...args));
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
          console.log(target, thisArg, args, rhs);
          if (rhs?.value !== undefined) {
            // @ts-expect-error this is just deferred actions of the user, and user has to make sure target is a valid function
            return Reflect.apply(target, rhs.value, args);
          } else {
            // @ts-expect-error this is just deferred actions of the user, and user has to make sure target is a valid function
            return Reflect.apply(target, thisArg, args);
          }
        })
      );
    },
  }) as DeferredPromise<T> & Promise<T>;
}

export { dwait };
