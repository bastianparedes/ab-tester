import { describe, expect, it } from 'vitest';
import { variationSchema } from '../variationsValidator';

const variation = (id: number, traffic: number) => ({
  css: '',
  html: '<main>variant</main>',
  id,
  javascript: 'async () => { return true; }',
  name: `variant ${id}`,
  traffic,
});

describe('variationSchema', () => {
  it('accepts variations whose traffic adds up to 100', () => {
    expect(variationSchema.safeParse([variation(1, 60), variation(2, 40)]).success).toBe(true);
  });

  it.each([
    { variations: [variation(1, 99)] },
    { variations: [variation(1, 101)] },
    { variations: [variation(1, 40), variation(2, 40)] },
    { variations: [variation(1, -1), variation(2, 101)] },
    { variations: [variation(1, 100.5)] },
    { variations: [{ ...variation(1, 100), javascript: 'const = 1;' }] },
    { variations: [{ ...variation(1, 100), id: 1.5 }] },
  ])('rejects invalid variations: %o', ({ variations }) => {
    expect(variationSchema.safeParse(variations).success).toBe(false);
  });
});
