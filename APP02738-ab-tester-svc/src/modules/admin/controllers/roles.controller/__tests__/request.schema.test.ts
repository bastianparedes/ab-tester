import { describe, expect, it } from 'vitest';
import { roleSchema } from '../request.schema';

describe('role schema', () => {
  it('defaults the permission list and validates provided permissions', () => {
    expect(roleSchema.parse({ description: '', name: 'Reader' }).permissions).toEqual([]);
    expect(roleSchema.parse({ description: '', name: 'Editor', permissions: ['campaign:read'] }).permissions).toEqual(['campaign:read']);
    expect(roleSchema.safeParse({ description: '', name: 'Editor', permissions: [1] }).success).toBe(false);
  });
});
