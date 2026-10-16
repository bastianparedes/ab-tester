import { describe, expect, it } from 'vitest';
import { getRandomFromArray, getRandomIntegerNumber, seededRandomFromInputs } from './random';

describe('getRandomIntegerNumber', () => {
  it('returns an integer within inclusive positive bounds', () => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const result = getRandomIntegerNumber(2, 8);

      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(8);
    }
  });

  it('supports negative bounds', () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const result = getRandomIntegerNumber(-8, -2);

      expect(result).toBeGreaterThanOrEqual(-8);
      expect(result).toBeLessThanOrEqual(-2);
    }
  });

  it('returns the bound when the range contains one value', () => {
    expect(getRandomIntegerNumber(4, 4)).toBe(4);
  });
});

describe('getRandomFromArray', () => {
  it('returns an element from the provided array', () => {
    const values = ['alpha', 'beta', 'gamma'];

    for (let attempt = 0; attempt < 30; attempt++) {
      expect(values).toContain(getRandomFromArray(values));
    }
  });

  it('returns undefined for an empty array', () => {
    expect(getRandomFromArray([])).toBeUndefined();
  });
});

describe('seededRandomFromInputs', () => {
  it('returns the same result for the same inputs', () => {
    const args = { inputs: [12, 42, 7], max: 100, min: 1 };

    expect(seededRandomFromInputs(args)).toBe(seededRandomFromInputs(args));
  });

  it('returns an integer within inclusive bounds for varied inputs', () => {
    for (let input = -20; input <= 20; input++) {
      const result = seededRandomFromInputs({ inputs: [input, input * 3], max: 5, min: -5 });

      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(-5);
      expect(result).toBeLessThanOrEqual(5);
    }
  });

  it('returns the bound when the range contains one value', () => {
    expect(seededRandomFromInputs({ inputs: [1, 2, 3], max: 9, min: 9 })).toBe(9);
  });

  it('handles an empty input list deterministically', () => {
    const args = { inputs: [], max: 17, min: 3 };

    expect(seededRandomFromInputs(args)).toBe(seededRandomFromInputs(args));
    expect(seededRandomFromInputs(args)).toBeGreaterThanOrEqual(3);
    expect(seededRandomFromInputs(args)).toBeLessThanOrEqual(17);
  });
});
