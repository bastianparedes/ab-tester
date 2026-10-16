type Simplify<T> = { [K in keyof T]: T[K] } & {};
type StrictEqual<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;
export type AssertEqual<T, U> = StrictEqual<Simplify<T>, Simplify<U>> extends true ? Simplify<T> : never;
export type FlattenObject<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K][keyof T[K]];
}[keyof T];
