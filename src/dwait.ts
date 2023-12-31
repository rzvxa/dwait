import type DeferredPromise from "./deferredPromise";

const DeferredPromiseSymbol = Symbol("dwait/DeferredPromise");
const asyncMethods = ["then", "catch", "finally"];
type Box<T> = { value: Awaited<T> | undefined };
// type DeferredPromise<T> = T & { await: () => Promise<T> };

/**
 * @async
 */
function dwait<T, Y>(
  promise: Promise<T>,
  rhs?: Box<Y>
): DeferredPromise<T> {
  const task = Promise.resolve(promise);
  const result: Box<Promise<T>> = { value: undefined };
  return new Proxy<object>(function () {}, {
    get(_, symbol) {
      if (symbol === DeferredPromiseSymbol) {
        return task;
      }

      const prop = symbol as string;
      console.log("here", prop);
      if (asyncMethods.includes(prop)) {
        // @ts-expect-error we are sure that this property exists and is callable.
        return (...args: unknown[]) => dwait(task[prop](...args));
      } else if (prop === "await") {
        console.log("elseif", prop);
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
        console.log("else");
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
      console.log("apply", thisArg, args, task);
      return dwait(
        task.then((target) => {
          console.log("gg", target, thisArg, args, rhs);
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
  }) as DeferredPromise<T & { await: () => Promise<T> }>;
}
type AddSymbolToPrimitive<T> = T extends { [Symbol.toPrimitive]: infer V }
  ? { [Symbol.toPrimitive]: V }
  : NonNullable<unknown>;

export type Wrapped<T> = {
  [P in keyof T]: T[P];
} &
  AddSymbolToPrimitive<T>;
async function test() {
  const g = {} as Wrapped<string>;
  const _a = g.split("ew");
  // "string".toPrimitive();
  const _b = await dwait(
    (async (): Promise<string> => "OK")()
  ).split(" ").await;
  const _c = await dwait<string, string>((async (): Promise<string> => "OK")())
    .trim()
    .toPromise();
}

export { dwait };
