import { describe, expect, it } from 'vitest';
import { getExecutionGroupsQuerySchema } from '../executionGroup.controller';
import { getLifecycleHooksQuerySchema, lifecycleHookSchema } from '../lifecycleHook.controller';
import { roleSchema } from '../roles.controller';
import { tenantSchema } from '../tenants.controller';
import { getTrackEventQuerySchema, trackEventSchema } from '../trackEvent.controller';
import { newUserSchema, oldUserSchema } from '../users.controller';

describe('controller request schemas', () => {
  it.each([
    ['execution groups', getExecutionGroupsQuerySchema],
    ['lifecycle hooks', getLifecycleHooksQuerySchema],
    ['track events', getTrackEventQuerySchema],
  ])('normalizes status filters for %s queries', (_name, schema) => {
    const query = { orderBy: 'name', orderDirection: 'asc', page: '1', quantity: '10', textSearch: '' };

    expect(schema.parse(query)).toMatchObject({ page: 1, quantity: 10, statusList: [] });
    expect(schema.parse({ ...query, textSearch: undefined }).textSearch).toBe('');
    expect(schema.parse({ ...query, statusList: 'active' }).statusList).toEqual(['active']);
    expect(schema.parse({ ...query, statusList: ['active'] }).statusList).toEqual(['active']);
  });

  it('validates lifecycle hook JavaScript and strips unknown fields', () => {
    const hook = { extra: true, javascript: 'async () => true', name: 'Start', option: 'scriptStart', status: 'active' };

    expect(lifecycleHookSchema.parse(hook)).toEqual({
      javascript: hook.javascript,
      name: hook.name,
      option: hook.option,
      status: hook.status,
    });
    expect(lifecycleHookSchema.safeParse({ ...hook, javascript: 'async function () {}' }).success).toBe(false);
  });

  it('validates track-event handlers and strips unknown fields', () => {
    const event = { extra: true, getData: 'return { id: 1 };', multipleTimes: true, name: 'Purchase', status: 'active' };

    expect(trackEventSchema.parse(event)).toEqual({
      getData: event.getData,
      multipleTimes: true,
      name: event.name,
      status: event.status,
    });
    expect(trackEventSchema.safeParse({ ...event, getData: 'const = 1;' }).success).toBe(false);
  });

  it('applies the default role permission list and validates provided permissions', () => {
    expect(roleSchema.parse({ description: '', name: 'Reader' }).permissions).toEqual([]);
    expect(roleSchema.parse({ description: '', name: 'Editor', permissions: ['campaign:read'] }).permissions).toEqual(['campaign:read']);
    expect(roleSchema.safeParse({ description: '', name: 'Editor', permissions: [1] }).success).toBe(false);
  });

  it('validates tenant and user request shapes', () => {
    expect(tenantSchema.parse({ description: '', domain: 'example.test', extra: true, name: 'Acme' })).toEqual({
      description: '',
      domain: 'example.test',
      name: 'Acme',
    });
    expect(newUserSchema.parse({ email: 'ada@example.test', name: 'Ada', password: 'secret' })).toEqual({
      email: 'ada@example.test',
      name: 'Ada',
      password: 'secret',
    });
    expect(oldUserSchema.safeParse({ email: 'ada@example.test', name: 'Ada', roleIds: [1, 2] }).success).toBe(true);
    expect(oldUserSchema.safeParse({ email: 'ada@example.test', name: 'Ada', roleIds: ['1'] }).success).toBe(false);
  });
});
