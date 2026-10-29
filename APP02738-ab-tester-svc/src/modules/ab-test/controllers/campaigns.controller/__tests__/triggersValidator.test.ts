import { describe, expect, it } from 'vitest';
import { triggerSchema } from '../triggersValidator';

describe('triggerSchema', () => {
  it.each([
    { data: { selector: '.primary-button' }, id: 1, type: 'clickOnElement' },
    { data: { javascript: 'async () => { return true; }', name: 'custom trigger' }, id: 2, type: 'custom' },
    { data: {}, id: 3, type: 'pageLoad' },
    { data: { milliseconds: 500 }, id: 4, type: 'timeOnPage' },
  ])('accepts $type triggers', (trigger) => {
    expect(triggerSchema.safeParse([trigger]).success).toBe(true);
  });

  it.each([
    { triggers: [{ data: { selector: '.button' }, id: 1.5, type: 'clickOnElement' }] },
    { triggers: [{ data: { javascript: 'const = 1;', name: 'broken' }, id: 2, type: 'custom' }] },
    { triggers: [{ data: { milliseconds: 1.5 }, id: 3, type: 'timeOnPage' }] },
    { triggers: [{ data: {}, id: 4, type: 'unknown' }] },
    {
      triggers: [
        { data: { selector: '.button' }, id: 5, type: 'clickOnElement' },
        { data: {}, id: 6, type: 'unknown' },
      ],
    },
  ])('rejects invalid trigger arrays: %o', ({ triggers }) => {
    expect(triggerSchema.safeParse(triggers).success).toBe(false);
  });
});
