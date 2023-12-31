import { dwait } from "../src/dwait";

const OK = "OK";
const ERROR = "ERROR";
const NUMBER = 12345;

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
    const dwaitPromise = dwait<TestClass, unknown>(resolveClass()).baz().bar();
    await expect(dwaitPromise.toPromise()).resolves.toEqual(NUMBER);
  });
  test("should return a DeferredPromise which has a await property containing the native promise of the operation chain", async () => {
    const dwaitPromise = dwait<TestClass, unknown>(resolveClass()).baz().bar();
    await expect(dwaitPromise.toPromise()).resolves.toEqual(NUMBER);
  });
  test("should provide a promise with the exact same result as native version", async () => {
    const dwaitPromise = dwait(resolveMock()).toPromise();
    await expect(dwaitPromise).resolves.toBe(OK);
  });
});
