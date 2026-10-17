import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { add } = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('../../classes/IndexedDB', () => ({ indexedDBCrud: { add } }));

import { setTrackEvents } from '../setTrackEvents';

describe('setTrackEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    add.mockResolvedValue(undefined);
    window.ab_tester.trackEventsData = [];
    window.ab_tester.lifecycleHooksData.trackEventStart = [];
    window.ab_tester.lifecycleHooksData.trackEventEnd = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs track-event hooks and stores a single event for non-repeating events', async () => {
    const calls: Array<[string, unknown]> = [];
    const javascript = vi.fn().mockResolvedValue({ value: 1 });
    window.ab_tester.trackEventsData = [{ javascript, id: 7, multipleTimes: false, name: 'Purchase' }] as never;
    window.ab_tester.lifecycleHooksData.trackEventStart = [{ javascript: (input: unknown) => calls.push(['start', input]) } as never];
    window.ab_tester.lifecycleHooksData.trackEventEnd = [{ javascript: (input: unknown) => calls.push(['end', input]) } as never];

    await setTrackEvents();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls.map(([event]) => event)).toEqual(['start', 'end']);
    expect(javascript).toHaveBeenCalledOnce();
    expect(add).toHaveBeenCalledWith('7', expect.objectContaining({ date: expect.any(Date), value: { value: 1 } }));
  });

  it('limits repeat events to five per time window and resets the count after the window expires', async () => {
    const cappedJavascript = vi.fn().mockResolvedValue('event');
    window.ab_tester.trackEventsData = [{ javascript: cappedJavascript, id: 8, multipleTimes: true, name: 'Capped' }] as never;
    vi.spyOn(Date, 'now').mockReturnValue(0);

    await setTrackEvents();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(cappedJavascript).toHaveBeenCalledTimes(6);
    expect(add).toHaveBeenCalledTimes(5);

    add.mockClear();
    const eventData = { javascript: vi.fn(), id: 9, multipleTimes: true, name: 'Windowed' };
    eventData.javascript.mockImplementation(async () => {
      if (eventData.javascript.mock.calls.length === 7) eventData.multipleTimes = false;
      return 'event';
    });
    window.ab_tester.trackEventsData = [eventData] as never;
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(500)
      .mockReturnValueOnce(500);

    await setTrackEvents();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(eventData.javascript).toHaveBeenCalledTimes(7);
    expect(add).toHaveBeenCalledTimes(7);
  });
});
