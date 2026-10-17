import { describe, expect, it } from 'vitest';
import { getTrackEventQuerySchema, trackEventSchema } from '../request.schema';

describe('track event schemas', () => {
  it('normalizes status filters', () => {
    const query = { orderBy: 'name', orderDirection: 'asc', page: '1', quantity: '10', textSearch: '' };

    expect(getTrackEventQuerySchema.parse(query)).toMatchObject({ page: 1, quantity: 10, statusList: [] });
    expect(getTrackEventQuerySchema.parse({ ...query, textSearch: undefined }).textSearch).toBe('');
    expect(getTrackEventQuerySchema.parse({ ...query, statusList: 'active' }).statusList).toEqual(['active']);
    expect(getTrackEventQuerySchema.parse({ ...query, statusList: ['active'] }).statusList).toEqual(['active']);
  });

  it('validates handlers and strips unknown fields', () => {
    const event = { extra: true, getData: 'return { id: 1 };', multipleTimes: true, name: 'Purchase', status: 'active' };

    expect(trackEventSchema.parse(event)).toEqual({
      getData: event.getData,
      multipleTimes: true,
      name: 'Purchase',
      status: 'active',
    });
    expect(trackEventSchema.safeParse({ ...event, getData: 'const = 1;' }).success).toBe(false);
  });
});
