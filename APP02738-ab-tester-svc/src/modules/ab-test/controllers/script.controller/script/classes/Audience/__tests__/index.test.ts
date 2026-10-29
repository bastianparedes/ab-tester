import { describe, expect, it } from 'vitest';
import { Audience } from '../index';

describe('Audience', () => {
  it('evaluates requirements once and reuses the result', async () => {
    const audience = new Audience({
      id: 3,
      name: 'Returning customers',
      requirementData: { data: { children: [], operator: 'and' }, type: 'node' },
    });

    await expect(audience.evaluate()).resolves.toBe(true);
    await expect(audience.evaluate()).resolves.toBe(true);
  });
});
