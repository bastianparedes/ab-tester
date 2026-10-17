import { describe, expect, it } from 'vitest';
import { flattenObject, isObject } from '../object';

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({ value: 1 })).toBe(true);
  });

  it.each([null, [], 'value', 1, true])('returns false for %s', (value) => {
    expect(isObject(value)).toBe(false);
  });
});

describe('flattenObject', () => {
  it('flattens nested values in key order', () => {
    expect(flattenObject<string | number | boolean>({ first: 1, last: 2, nested: { deeper: { third: 'value' }, second: true } })).toEqual([1, 2, 'value', true]);
  });

  it('returns an empty array for an empty object', () => {
    expect(flattenObject({})).toEqual([]);
  });
});
