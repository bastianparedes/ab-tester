import { beforeEach, describe, expect, it, vi } from 'vitest';

const { initCampaigns, setTrackEvents } = vi.hoisted(() => ({
  initCampaigns: vi.fn(),
  setTrackEvents: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../processes/initCampaigns', () => ({ initCampaigns }));
vi.mock('../processes/setTrackEvents', () => ({ setTrackEvents }));

describe('script entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTrackEvents.mockResolvedValue(undefined);
  });

  it('runs script lifecycle hooks around track-event and campaign initialization', async () => {
    const calls: string[] = [];
    window.ab_tester.lifecycleHooksData.scriptStart = [{ javascript: async () => calls.push('start') } as never];
    window.ab_tester.lifecycleHooksData.scriptEnd = [{ javascript: async () => calls.push('end') } as never];

    await import('../index.js');
    await vi.waitFor(() => expect(calls).toContain('end'));

    expect(calls).toEqual(['start', 'end']);
    expect(setTrackEvents).toHaveBeenCalledOnce();
    expect(initCampaigns).toHaveBeenCalledOnce();
  });
});
