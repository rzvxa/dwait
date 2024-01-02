import dwait, { isDeferredPromise } from "../src/dwait";

const OK = "OK";
const ERROR = "ERROR";
const NUMBER = 12345;
const OBJECT = {};
const OKA = `${OK}A`;
const OKB = `${OK}B`;
const MATCH_OK = /^OK/g;

class TestClass {
  _baz: TestClass;
  _bar: number;
  foo: string;

  constructor(foo: string, bar: number, classType: string) {
    this.foo = foo + classType;
    this._bar = bar;
    this._baz = this;
  }

  get getFoo(): string {
    return this.foo;
  }

  bar(): number {
    return this._bar;
  }

  baz(): TestClass {
    return this._baz;
  }

  ping<T>(value: T): T {
    return value;
  }

  async addBar(): Promise<number> {
    this._bar += 1;
    return this._bar;
  }

  get [Symbol.toStringTag]() {
    return "Test Class";
  }
}

describe("dwait Tests", () => {
  const classA = jest.mocked(new TestClass(OK, NUMBER, "A"));
  const classB = jest.mocked(new TestClass(OK, NUMBER, "B"));
  classA._baz = classB;
  classB._baz = classA;

  const resolveClass: () => Promise<TestClass> = jest
    .fn()
    .mockResolvedValue(classA);

  const resolveMock: () => Promise<string> = jest.fn().mockResolvedValue(OK);
  const rejectMock: () => Promise<string> = jest.fn().mockRejectedValue(ERROR);

  test("should return a DeferredPromise which has a toPromise function containing the native promise of the operation chain", async () => {
    const dwaitPromise = dwait(resolveClass()).baz().bar();
    await expect(dwaitPromise.toPromise()).resolves.toEqual(NUMBER);
  });

  test("should return a DeferredPromise which has a await property containing the native promise of the operation chain", async () => {
    const dwaitPromise = dwait(resolveClass()).baz().foo;
    await expect(dwaitPromise.await).resolves.toEqual(OKB);
  });

  test("should return throw on awaiting rejected promises", async () => {
    const dwaitPromise = dwait(rejectMock());
    await expect(dwaitPromise).rejects.toEqual(ERROR);
  });

  test("should return a DeferredPromise<string> which contains split function acting like the native string", async () => {
    const dwaitPromise = dwait(resolveClass()).foo;
    await expect(dwaitPromise.split("K").await).resolves.toEqual(
      OKA.split("K")
    );
  });

  test("should return a DeferredPromise<string> which contains match function acting like the native string", async () => {
    const dwaitPromise = dwait(resolveClass()).foo;
    await expect(dwaitPromise.match(OK)?.await).resolves.toEqual(OKA.match(OK));
  });

  test("should return a DeferredPromise<string> which contains matchAll function acting like the native string", async () => {
    const matchResult = await dwait(resolveClass()).foo.matchAll(MATCH_OK)
      ?.await;
    expect(Array.from(matchResult)).toEqual(Array.from(OKA.matchAll(MATCH_OK)));
  });

  test("should return a DeferredPromise<string> which contains replace function acting like the native string", async () => {
    const dwaitPromise = dwait(resolveClass()).foo;
    await expect(
      dwaitPromise.replace(OK, NUMBER.toString())?.await
    ).resolves.toEqual(OKA.replace(OK, NUMBER.toString()));
  });

  test("should return a DeferredPromise<string> which contains search function acting like the native string", async () => {
    const dwaitPromise = dwait(resolveClass()).foo;
    await expect(dwaitPromise.search("K").await).resolves.toEqual(
      OKA.search("K")
    );
  });

  test("should return a DeferredPromise<object> which contains toString function acting like the native object", async () => {
    const dwaitPromise = dwait(resolveClass()).baz();
    await expect(dwaitPromise.toString()).resolves.toEqual(classA.toString());
  });

  test("should return a DeferredPromise which isn't callable", async () => {
    const dwaitPromise = dwait(resolveClass());
    // @ts-expect-error it isn't callabe
    await expect(dwaitPromise()).rejects.toThrow();
  });

  test("should provide a promise with the exact same result as native version", async () => {
    const dwaitPromise = dwait(resolveMock()).toPromise();
    await expect(dwaitPromise).resolves.toBe(OK);
  });

  test("should be able to wrap a constructor successfully", async () => {
    const dwaitPromise = dwait(new TestClass(OK, NUMBER, OK));
    await expect(dwaitPromise.await).resolves.toEqual(
      expect.objectContaining({ foo: OK + OK })
    );
  });

  test("should be able to wrap functions with returning promises", async () => {
    const dwaitPromise = dwait(new TestClass(OK, NUMBER, OK)).addBar();
    await expect(dwaitPromise.await).resolves.toEqual(NUMBER + 1);
  });

  test("should be able to wrap a function and use it as a deferred function", async () => {
    const dwaitFunc = dwait(resolveMock);
    await expect(dwaitFunc().await).resolves.toEqual(OK);
  });

  test("should be able to wrap cycling dependencies", async () => {
    let dwaitPromise = dwait(resolveClass());
    for (let i = 0, len = 999; i < len; ++i) {
      dwaitPromise = dwaitPromise.baz();
    }
    await expect(dwaitPromise.foo.await).resolves.toEqual(OKB);
  });

  test("shouldn't defer an already deferred promise", async () => {
    const dwaitPromise1 = dwait(resolveClass());
    const dwaitPromise2 = dwait(dwaitPromise1);
    expect(dwaitPromise1).toBe(dwaitPromise2);
  });

  test("should return the same DeferredPromise as long as a reference of that DeferredPromise exists on the heap", async () => {
    const dwaitPromise1 = dwait(resolveClass());
    const dwaitPromise2 = dwait(resolveClass());
    expect(dwaitPromise1).toBe(dwaitPromise1);
  });
});

describe("isDeferredPromise Tests", () => {
  const resolveMock: () => Promise<string> = jest.fn().mockResolvedValue(OK);

  test("should return false on normal promises", async () => {
    const target = resolveMock();
    expect(isDeferredPromise(target)).toBe(false);
  });

  test("should return false on normal objects", async () => {
    const target = OBJECT;
    expect(isDeferredPromise(target)).toBe(false);
  });

  test("should return false on normal numbers", async () => {
    const target = NUMBER;
    expect(isDeferredPromise(target)).toBe(false);
  });

  test("should return false on normal strings", async () => {
    const target = OK;
    expect(isDeferredPromise(target)).toBe(false);
  });

  test("should return false on normal null values", async () => {
    const target = null;
    expect(isDeferredPromise(target)).toBe(false);
  });

  test("should return false on normal undefined values", async () => {
    const target = undefined;
    expect(isDeferredPromise(target)).toBe(false);
  });

  test("should return true on deferred promises", async () => {
    const target = dwait(resolveMock());
    expect(isDeferredPromise(target)).toBe(true);
  });

  test("should return true on deferred objects", async () => {
    const target = dwait(OBJECT);
    expect(isDeferredPromise(target)).toBe(true);
  });

  test("should return true on deferred numbers", async () => {
    const target = dwait(NUMBER);
    expect(isDeferredPromise(target)).toBe(true);
  });

  test("should return true on deferred strings", async () => {
    const target = dwait(OK);
    expect(isDeferredPromise(target)).toBe(true);
  });

  test("should return true on deferred null values", async () => {
    const target = dwait(null);
    expect(isDeferredPromise(target)).toBe(true);
  });

  test("should return true on deferred undefined values", async () => {
    const target = dwait(undefined);
    expect(isDeferredPromise(target)).toBe(true);
  });
});
