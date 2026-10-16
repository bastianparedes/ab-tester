import { describe, expect, it } from 'vitest';
import { comparatorResolver } from './comparatorResolver';

type ComparatorCase = {
  name: string;
  input: Parameters<typeof comparatorResolver>[0];
  expected: boolean;
};

const cases: ComparatorCase[] = [
  { expected: true, input: { comparator: 'atLeast', expectedValue: 5, obtainedValue: 5 }, name: 'atLeast includes equality' },
  { expected: true, input: { comparator: 'atLeast', expectedValue: 5, obtainedValue: 6 }, name: 'atLeast accepts larger values' },
  { expected: false, input: { comparator: 'atLeast', expectedValue: 5, obtainedValue: 4 }, name: 'atLeast rejects smaller values' },
  { expected: true, input: { comparator: 'atMost', expectedValue: 5, obtainedValue: 5 }, name: 'atMost includes equality' },
  { expected: true, input: { comparator: 'atMost', expectedValue: 5, obtainedValue: 4 }, name: 'atMost accepts smaller values' },
  { expected: false, input: { comparator: 'atMost', expectedValue: 5, obtainedValue: 6 }, name: 'atMost rejects larger values' },
  { expected: true, input: { comparator: 'lessThan', expectedValue: 5, obtainedValue: 4 }, name: 'lessThan is strict' },
  { expected: false, input: { comparator: 'lessThan', expectedValue: 5, obtainedValue: 5 }, name: 'lessThan rejects equality' },
  { expected: true, input: { comparator: 'moreThan', expectedValue: 5, obtainedValue: 6 }, name: 'moreThan is strict' },
  { expected: false, input: { comparator: 'moreThan', expectedValue: 5, obtainedValue: 5 }, name: 'moreThan rejects equality' },
  { expected: true, input: { comparator: 'contains', expectedValue: 'world', obtainedValue: 'hello world' }, name: 'contains finds a substring' },
  { expected: false, input: { comparator: 'contains', expectedValue: 'WORLD', obtainedValue: 'hello world' }, name: 'contains is case-sensitive' },
  { expected: true, input: { comparator: 'contains', expectedValue: '', obtainedValue: 'hello' }, name: 'contains accepts the empty string' },
  { expected: true, input: { comparator: 'doesNotContain', expectedValue: 'bye', obtainedValue: 'hello' }, name: 'doesNotContain accepts a missing substring' },
  { expected: false, input: { comparator: 'doesNotContain', expectedValue: 'ell', obtainedValue: 'hello' }, name: 'doesNotContain rejects a present substring' },
  { expected: true, input: { comparator: 'equal', expectedValue: 'same', obtainedValue: 'same' }, name: 'equal compares strings' },
  { expected: false, input: { comparator: 'equal', expectedValue: 'two', obtainedValue: 'one' }, name: 'equal rejects different strings' },
  { expected: true, input: { comparator: 'equal', expectedValue: 3, obtainedValue: 3 }, name: 'equal compares numbers' },
  { expected: true, input: { comparator: 'isNot', expectedValue: 'two', obtainedValue: 'one' }, name: 'isNot accepts different strings' },
  { expected: false, input: { comparator: 'isNot', expectedValue: 'same', obtainedValue: 'same' }, name: 'isNot rejects equal strings' },
  { expected: true, input: { comparator: 'doesNotExist', expectedValue: undefined, obtainedValue: null }, name: 'doesNotExist accepts null' },
  { expected: true, input: { comparator: 'doesNotExist', expectedValue: undefined, obtainedValue: undefined }, name: 'doesNotExist accepts undefined' },
  { expected: false, input: { comparator: 'doesNotExist', expectedValue: undefined, obtainedValue: '' }, name: 'doesNotExist rejects an empty string' },
  { expected: true, input: { comparator: 'exists', expectedValue: undefined, obtainedValue: 'value' }, name: 'exists accepts a string' },
  { expected: true, input: { comparator: 'exists', expectedValue: undefined, obtainedValue: '' }, name: 'exists accepts an empty string' },
  { expected: false, input: { comparator: 'exists', expectedValue: undefined, obtainedValue: null }, name: 'exists rejects null' },
  { expected: false, input: { comparator: 'exists', expectedValue: undefined, obtainedValue: undefined }, name: 'exists rejects undefined' },
];

describe('comparatorResolver', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    expect(comparatorResolver(input)).toBe(expected);
  });
});
