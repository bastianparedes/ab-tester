import { beforeEach, describe, expect, it, vi } from 'vitest';

const { campaignInstances } = vi.hoisted(() => ({ campaignInstances: [] as Array<{ applyChanges: ReturnType<typeof vi.fn> }> }));

vi.mock('../../../classes/Audience', () => ({
  Audience: class {},
}));

vi.mock('../../../classes/Campaign', () => ({
  default: class {
    applyChanges = vi.fn();
    requirementsWereMetPromise: Promise<boolean>;

    constructor(_id: number, _name: string, requirements: { data?: { met?: boolean } }) {
      this.requirementsWereMetPromise = Promise.resolve(requirements.data?.met ?? true);
      campaignInstances.push(this);
    }
  },
}));

vi.mock('../../../classes/Campaign/Trigger', () => ({ default: class {} }));
vi.mock('../../../classes/Campaign/Variation', () => ({ default: class {} }));

import { initSpecificCampaign } from '../forced';

const campaign = {
  id: 3,
  name: 'Campaign',
  requirements: { data: { met: false } },
  triggers: [{ type: 'pageLoad' }],
  variations: [{ id: 7, traffic: 25 }],
};

describe('initSpecificCampaign', () => {
  beforeEach(() => {
    campaignInstances.length = 0;
    window.ab_tester.audiencesData = [];
    window.ab_tester.campaignsData = [campaign] as never;
  });

  it('does nothing when the requested campaign or variation is missing', () => {
    initSpecificCampaign({ campaignId: 99, ignoreRequirements: true, variationId: 7 });
    initSpecificCampaign({ campaignId: 3, ignoreRequirements: true, variationId: 99 });

    expect(campaignInstances).toEqual([]);
  });

  it('runs the selected variation at full traffic only when requirements pass or are ignored', async () => {
    initSpecificCampaign({ campaignId: 3, ignoreRequirements: false, variationId: 7 });
    await Promise.resolve();
    expect(campaignInstances[0].applyChanges).not.toHaveBeenCalled();

    initSpecificCampaign({ campaignId: 3, ignoreRequirements: true, variationId: 7 });
    await Promise.resolve();
    expect(campaignInstances[1].applyChanges).toHaveBeenCalledOnce();
  });

  it('maps configured audiences when the module initializes', async () => {
    window.ab_tester.audiencesData = [{ id: 5, name: 'Returning visitors', requirements: {} }] as never;
    vi.resetModules();

    await import('../forced.js');
  });
});
