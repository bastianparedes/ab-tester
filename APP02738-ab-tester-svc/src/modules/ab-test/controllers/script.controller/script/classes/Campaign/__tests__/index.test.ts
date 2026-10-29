import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Campaign from '../index';

describe('Campaign', () => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

  beforeEach(() => {
    Object.defineProperty(globalThis, 'document', { configurable: true, value: { cookie: '' } });
    Object.defineProperty(window, 'location', { configurable: true, value: { hostname: 'example.test' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else Reflect.deleteProperty(globalThis, 'document');
    if (originalLocation) Object.defineProperty(window, 'location', originalLocation);
    else Reflect.deleteProperty(window, 'location');
  });

  it('evaluates empty requirements as met', async () => {
    const campaign = new Campaign(1, 'Campaign', { data: { children: [] } } as never, [], [], []);

    await expect(campaign.evaluate()).resolves.toBe(true);
    await expect(campaign.requirementsWereMetPromise).resolves.toBe(true);
    expect(campaign.requirementsWereEvaluated).toBe(true);
  });

  it('evaluates after a trigger resolves', async () => {
    const trigger = { setTrigger: vi.fn().mockResolvedValue(undefined) };
    const campaign = new Campaign(1, 'Campaign', { data: { children: [] } } as never, [trigger as never], [], []);

    await expect(campaign.requirementsWereMetPromise).resolves.toBe(true);
    expect(trigger.setTrigger).toHaveBeenCalledOnce();
    expect(campaign.requirementsWereEvaluated).toBe(true);
  });

  it('evaluates unmet audience requirements', async () => {
    const campaign = new Campaign(1, 'Campaign', { data: { children: [{ data: { id: 99 }, type: 'audience' }], operator: 'and' }, type: 'node' } as never, [], [], []);

    await expect(campaign.evaluate()).resolves.toBe(false);
    await expect(campaign.requirementsWereMetPromise).resolves.toBe(false);
    expect(campaign.requirementsWereEvaluated).toBe(true);
  });

  it('selects a variation when cumulative traffic covers its random value', () => {
    const variation = { data: { traffic: 100 } };
    const campaign = new Campaign(1, 'Campaign', { data: { children: [] } } as never, [], [variation as never], []);

    expect(campaign.getVariation()).toBe(variation);
  });

  it('runs lifecycle hooks and applies a selected variation only once', async () => {
    const startHook = { javascript: vi.fn().mockResolvedValue(undefined) };
    const endHook = { javascript: vi.fn().mockResolvedValue(undefined) };
    const originalHooks = window.ab_tester.lifecycleHooksData;
    window.ab_tester.lifecycleHooksData = {
      ...originalHooks,
      variantCampaignEnd: [endHook as never],
      variantCampaignStart: [startHook as never],
    };
    const run = vi.fn();
    const variation = { data: { id: 2, name: 'Variant A', traffic: 100 }, run };
    const campaign = new Campaign(1, 'Campaign', { data: { children: [] } } as never, [], [variation as never], []);

    try {
      await campaign.applyChanges();
      await campaign.applyChanges();

      expect(startHook.javascript).toHaveBeenCalledExactlyOnceWith({ campaign: { id: 1, name: 'Campaign' }, variation: { id: 2, name: 'Variant A' } });
      expect(run).toHaveBeenCalledOnce();
      expect(endHook.javascript).toHaveBeenCalledExactlyOnceWith({ campaign: { id: 1, name: 'Campaign' }, variation: { id: 2, name: 'Variant A' } });
    } finally {
      window.ab_tester.lifecycleHooksData = originalHooks;
    }
  });

  it('does not run hooks when no variation is eligible', async () => {
    const run = vi.fn();
    const campaign = new Campaign(1, 'Campaign', { data: { children: [] } } as never, [], [{ data: { traffic: 0 }, run } as never], []);

    await campaign.applyChanges();

    expect(run).not.toHaveBeenCalled();
  });
});
