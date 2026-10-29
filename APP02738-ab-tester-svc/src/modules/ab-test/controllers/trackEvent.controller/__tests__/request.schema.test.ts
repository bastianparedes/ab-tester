import { describe, expect, it } from 'vitest';
import { copyTrackEventSchema, getTrackEventQuerySchema, trackEventSchema } from '../request.schema';

describe('track event schemas', () => {
  it('normalizes status filters', () => {
    const query = { orderBy: 'name', orderDirection: 'asc', page: '1', quantity: '10', textSearch: '' };

    expect(getTrackEventQuerySchema.parse(query)).toMatchObject({ page: 1, quantity: 10, statusList: [] });
    expect(getTrackEventQuerySchema.parse({ ...query, textSearch: undefined }).textSearch).toBe('');
    expect(getTrackEventQuerySchema.parse({ ...query, statusList: 'active' }).statusList).toEqual(['active']);
    expect(getTrackEventQuerySchema.parse({ ...query, statusList: ['active'] }).statusList).toEqual(['active']);
  });

  it('validates handlers and strips unknown fields', () => {
    const event = { extra: true, javascript: 'async () => { return { id: 1 }; }', multipleTimes: true, name: 'Purchase', status: 'active' };

    expect(trackEventSchema.parse(event)).toEqual({
      javascript: event.javascript,
      multipleTimes: true,
      name: 'Purchase',
      status: 'active',
    });
    expect(trackEventSchema.safeParse({ ...event, javascript: 'const = 1;' }).success).toBe(false);
  });

  it('validates the target tenant when copying an event', () => {
    expect(copyTrackEventSchema.parse({ extra: true, targetTenantId: 12 })).toEqual({ targetTenantId: 12 });
    expect(copyTrackEventSchema.safeParse({ targetTenantId: '12' }).success).toBe(false);
  });
});
