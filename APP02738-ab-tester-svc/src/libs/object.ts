export const isObject = (object: unknown): object is Record<string, unknown> => {
  return Object.prototype.toString.call(object) === '[object Object]';
};

type NestedObject<T extends string | number | boolean> = {
  [key: string]: T | NestedObject<T>;
};
export function flattenObject<T extends string | number | boolean>(obj: NestedObject<T>): T[] {
  const result: T[] = [];

  const keys = Object.keys(obj) as (keyof typeof obj)[];
  keys.forEach((key) => {
    const value = obj[key];
    if (isObject(value)) {
      const nestedValues = flattenObject(value as NestedObject<T>);
      nestedValues.forEach((value) => {
        result.push(value);
      });
    } else {
      result.push(value as T);
    }
  });

  return result;
}
