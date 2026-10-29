import { describe, expect, it } from 'vitest';
import { getLifecycleHooksQuerySchema, lifecycleHookSchema } from '../request.schema';

describe('lifecycle hook schemas', () => {
  it('normalizes status filters', () => {
    const query = { orderBy: 'name', orderDirection: 'asc', page: '1', quantity: '10', textSearch: '' };

    expect(getLifecycleHooksQuerySchema.parse(query)).toMatchObject({ page: 1, quantity: 10, statusList: [] });
    expect(getLifecycleHooksQuerySchema.parse({ ...query, textSearch: undefined }).textSearch).toBe('');
    expect(getLifecycleHooksQuerySchema.parse({ ...query, statusList: 'active' }).statusList).toEqual(['active']);
    expect(getLifecycleHooksQuerySchema.parse({ ...query, statusList: ['active'] }).statusList).toEqual(['active']);
  });

  it('validates JavaScript and strips unknown fields', () => {
    const hook = { extra: true, javascript: 'async () => { return true; }', name: 'Start', option: 'scriptStart', status: 'active' };

    expect(lifecycleHookSchema.parse(hook)).toEqual({
      javascript: hook.javascript,
      name: hook.name,
      option: hook.option,
      status: hook.status,
    });
    expect(lifecycleHookSchema.safeParse({ ...hook, javascript: 'async function () {}' }).success).toBe(false);
  });
});
