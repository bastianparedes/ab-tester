import { describe, expect, it } from 'vitest';
import { newUserSchema, oldUserSchema } from '../request.schema';

describe('user schemas', () => {
  it('validates new user values', () => {
    expect(newUserSchema.parse({ email: 'ada@example.test', name: 'Ada', password: 'secret' })).toEqual({
      email: 'ada@example.test',
      name: 'Ada',
      password: 'secret',
    });
  });

  it('validates role ids for user updates', () => {
    expect(oldUserSchema.safeParse({ email: 'ada@example.test', name: 'Ada', roleIds: [1, 2] }).success).toBe(true);
    expect(oldUserSchema.safeParse({ email: 'ada@example.test', name: 'Ada', roleIds: ['1'] }).success).toBe(false);
  });
});
