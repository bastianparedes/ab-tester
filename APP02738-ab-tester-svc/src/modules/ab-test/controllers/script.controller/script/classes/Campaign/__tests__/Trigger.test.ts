import { afterEach, describe, expect, it, vi } from 'vitest';
import Trigger from '../Trigger';

describe('Trigger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('resolves after a click inside the configured selector', async () => {
    const handlers = new Map<string, (event: MouseEvent) => void>();
    const removeEventListener = vi.fn();
    vi.stubGlobal('window', {
      addEventListener: vi.fn((event: string, handler: (event: MouseEvent) => void) => handlers.set(event, handler)),
      removeEventListener,
    });
    const trigger = new Trigger({ data: { selector: '.buy' }, id: 1, type: 'clickOnElement' } as never, 7);

    const result = trigger.setTrigger();
    const handler = handlers.get('click');
    handler?.({ target: { closest: () => null } } as unknown as MouseEvent);
    handler?.({ target: { closest: () => ({}) } } as unknown as MouseEvent);

    await expect(result).resolves.toBeUndefined();
    expect(removeEventListener).toHaveBeenCalledWith('click', handler);
  });

  it('resolves with the custom trigger result', async () => {
    const trigger = new Trigger({ data: { javascript: async () => 'matched', name: 'custom' }, id: 2, type: 'custom' } as never, 7);

    await expect(trigger.setTrigger()).resolves.toBe('matched');
  });

  it('resolves immediately for page-load triggers', async () => {
    const trigger = new Trigger({ data: {}, id: 3, type: 'pageLoad' } as never, 7);

    await expect(trigger.setTrigger()).resolves.toBeUndefined();
  });

  it('resolves when the configured time has already elapsed', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(performance.timeOrigin + 1_000);
    const trigger = new Trigger({ data: { milliseconds: 100 }, id: 4, type: 'timeOnPage' } as never, 7);

    await expect(trigger.setTrigger()).resolves.toBeUndefined();
  });

  it('rejects unsupported trigger types', async () => {
    const trigger = new Trigger({ data: {}, id: 5, type: 'unsupported' } as never, 7);

    await expect(trigger.setTrigger()).rejects.toThrow('Unknown trigger type');
  });
});
