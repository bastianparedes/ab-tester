import { describe, expect, it } from 'vitest';
import { flattenObject, isObject } from './object';

describe('isObject', () => {
  it('accepts plain and null-prototype objects', () => {
    expect(isObject({ answer: 42 })).toBe(true);
    expect(isObject(Object.create(null))).toBe(true);
  });

  it.each([null, undefined, [], 'text', 42, () => {}])('rejects non-objects: %s', (value) => {
    expect(isObject(value)).toBe(false);
  });
});

describe('flattenObject', () => {
  it('flattens nested values in key iteration order', () => {
    expect(flattenObject<string | number | boolean>({ first: 1, last: 4, nested: { deeper: { third: true }, second: 'two' } })).toEqual([1, 4, true, 'two']);
  });

  it('returns an empty array for an empty object', () => {
    expect(flattenObject({})).toEqual([]);
  });
});
