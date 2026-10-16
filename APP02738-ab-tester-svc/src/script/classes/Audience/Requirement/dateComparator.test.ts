import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { filterByDate } from './dateComparator';

describe('filterByDate', () => {
  const now = new Date('2026-10-04T12:00:00.000Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    { milliseconds: 60_000, timeUnit: 'minutes' as const },
    { milliseconds: 3_600_000, timeUnit: 'hours' as const },
    { milliseconds: 86_400_000, timeUnit: 'days' as const },
  ])('filters using the $timeUnit cutoff and keeps values at the boundary', ({ timeUnit, milliseconds }) => {
    const items = [
      { date: new Date(now - milliseconds - 1), id: 'old' },
      { date: new Date(now - milliseconds), id: 'boundary' },
      { date: new Date(now - 1), id: 'recent' },
    ];

    expect(filterByDate({ items, timeUnit, value: 1 }).map(({ id }) => id)).toEqual(['boundary', 'recent']);
  });

  it('returns an empty array for empty input', () => {
    expect(filterByDate({ items: [], timeUnit: 'days', value: 1 })).toEqual([]);
  });

  it('returns all entries when every date is within the window', () => {
    const items = [{ date: new Date(now - 1) }, { date: new Date(now) }];

    expect(filterByDate({ items, timeUnit: 'days', value: 1 })).toEqual(items);
  });

  it('returns an empty array when every date is outside the window', () => {
    const items = [{ date: new Date(now - 86_400_001) }, { date: new Date(now - 90_000_000) }];

    expect(filterByDate({ items, timeUnit: 'days', value: 1 })).toEqual([]);
  });
});
