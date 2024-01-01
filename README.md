# dwait

![GitHub License](https://img.shields.io/github/license/rzvxa/dwait)
[![Test](https://github.com/rzvxa/dwait/actions/workflows/test.yml/badge.svg)](https://github.com/rzvxa/dwait/actions/workflows/test.yml)
![Coveralls branch](https://img.shields.io/coverallsCoverage/github/rzvxa/dwait)
[![Documentation](https://img.shields.io/badge/visit-docs-brightgreen)](https://rzvxa.github.io/dwait/)

Deffered async operation made easy in Javascript

# What is it?
`dwait` is an alternative way of handling async tasks. The name stands for `Deferred Await` and it basically lets you defer multiple `await` operations to the end of the function chain, So you can stop writing things like this:

```js
  const resp = await getUserAsync();
  const json = await resp.body.toJson();
  const username = json.username.trim();
```

And instead, write more readable(in my opinion) code like this:

```js
  const username = await dwait(getUserAsync())
    .body
    .toJson()
    .username
    .trim()
    .await; // or .toPromise();
```

Or you can pass the function itself to the `dwait` function and get a deferred function you can use directly!

```js
  const getUserDeferred = dwait(getUserAsync);
  const username = await getUserDeferred()
    .body
    .toJson()
    .username
    .trim()
    .await; // or .toPromise();
```

# Why?
If you have ever seen any async code from `Rust` language you can immediately see the source of inspiration for the `dwait` library.
Most languages have opted-in for writing the `await` keyword before the expression, This way it will read more naturally. For example something like this:
```js
await asyncTask();
```
It will read as `await async task` which is nice, But whenever you get knee-deep into the `async/await` pattern, this style of awaiting can get a little bit annoying in even some trivial cases. Take this code as an example:
```js
const fileNames = (await (await getFilesRepository()).getFileNames()).map((f) => f.trim().split("."));
```
Well to be honest nobody writes code like this, So let's break it into multiple lines to make it readbly.
```js
const fileRepo = await getFilesRepository();
const files = await fileRepo.getFileNames();
const fileNames = files.map((fullname) => fullname.trim().split("."));
```
Now that's much better, But wouldn't it be nice if we could get rid of extra variables and just chain our operations? Well, that is exactly what the right-hand side awaiting solves, Just imagine if we could write code with await as a function on the `Promise` instead of a keyword, Or even better what if we could just write `.await` at the end of an awaitable expression and it would just get awaited? Unfortunately, that's not possible without language-level support (either via typescript/babel or ECMAScript specification).
So what's the next best thing? If we want to get the result from a `Promise` we have to either use `then` callback or `await` the expression. So what if we could wrap the promise inside an object and use it to dispatch the subsequent function calls and/or property accesses inside a new `Promise`? This way we can defer the await keyword to the last expression and we can just `await` that last promise to get the result of whole function chain.
So let's rewrite the code above using `dwait`.
```js
const fileNames = await dwait(getFilesRepository())
  .getFileNames()
  .map((fullname) => fullname.trim().split("."))
  .await;
```
Much cleaner, isn't it?
# How does it work?
So as mentioned earlier `dwait` works in the user space and doesn't need any new language feature to provide an appropriately typed solution for this situation. But how does it work?
Whenever you want to defer awaiting a chain of async operation you have to wrap the first `Promise<T>` inside a `DeferredPromise<T>`, It can be done by passing the promise into the `dwait` function.
```js
const deferredPromise = dwait(promise);
```
`DeferredPromise` extends the javascript underlying `Promise` type, It has anything existing on the type `T` in `DeferredPromise<T>`, But it will return another `DeferredPromise` for the result instead of the actual return type.
```ts
const r1: string = getStringSync().trim();
const r2: DeferredPromise<string> = dwait(getStringAsync()).trim();
```
As you can see, calling `trim` on a `DeferredPromise<string` will result in a `DeferreedPromise<string>` instead of the `string` result. This way we can start to chain these `DeferredAsync` operations and at the end, we either call the `toPromise` function or read the value of the `await` field.
```js
const result = await dwait(getStringAsync()).trim().slice(3).split(" ").toPromise();
// or
const result = await dwait(getStringAsync()).trim().slice(3).split(" ").await;
```
Both `toPromise` and `await` will return a native `Promise` object which can be used to `await` the final result of the operation chain.
