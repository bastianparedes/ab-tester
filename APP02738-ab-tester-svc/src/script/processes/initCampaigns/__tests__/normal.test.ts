import { beforeEach, describe, expect, it, vi } from 'vitest';

const { campaignInstances, cookieState } = vi.hoisted(() => ({
  campaignInstances: [] as Array<{
    applyChanges: ReturnType<typeof vi.fn>;
    id: number;
    name: string;
  }>,
  cookieState: { deletedIds: [] as number[], ids: [] as number[], insertedIds: [] as number[] },
}));

vi.mock('../../../classes/Audience', () => ({
  Audience: class {},
}));

vi.mock('../../../classes/Campaign', () => ({
  default: class {
    applyChanges = vi.fn();
    id: number;
    name: string;
    requirementsWereEvaluated: boolean;
    requirementsWereMet: boolean;
    requirementsWereMetPromise: Promise<boolean>;

    constructor(id: number, name: string, requirements: { data?: { evaluated?: boolean; met?: boolean } }) {
      this.id = id;
      this.name = name;
      this.requirementsWereEvaluated = requirements.data?.evaluated ?? true;
      this.requirementsWereMet = requirements.data?.met ?? true;
      this.requirementsWereMetPromise = Promise.resolve(this.requirementsWereMet);
      campaignInstances.push(this);
    }
  },
}));

vi.mock('../../../classes/Campaign/Trigger', () => ({ default: class {} }));
vi.mock('../../../classes/Campaign/Variation', () => ({ default: class {} }));
vi.mock('../../../classes/ExecutionGroupCookieManager', () => ({
  ExecutionGroupCookieManager: class {
    getCampaignIds() {
      return [...cookieState.ids];
    }
    deleteCampaignId(id: number) {
      cookieState.deletedIds.push(id);
      cookieState.ids = cookieState.ids.filter((savedId) => savedId !== id);
    }
    insertCampaignId(id: number) {
      cookieState.insertedIds.push(id);
      cookieState.ids.push(id);
    }
  },
}));

vi.mock('../../../utils/random', () => ({ getRandomFromArray: <T>(items: T[]) => items[0] }));

import { initExecutionGroups } from '../normal';

const makeCampaign = (id: number, requirements: { data?: { evaluated?: boolean; met?: boolean } } = { data: { met: true } }) =>
  ({
    id,
    name: `Campaign ${id}`,
    requirements,
    triggers: [{ type: 'pageLoad' }],
    variations: [{ id: id * 10 }],
  }) as never;

const makeGroup = (overrides: Record<string, unknown> = {}) =>
  ({
    campaigns: [1, 2],
    id: 4,
    name: 'Group',
    onlyCampaignsPreviouslyExecuted: false,
    onlyOneCampaignPerPageLoad: false,
    waitForEveryCampaignToBeEvaluated: false,
    ...overrides,
  }) as never;

describe('initExecutionGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campaignInstances.length = 0;
    cookieState.ids = [];
    cookieState.deletedIds = [];
    cookieState.insertedIds = [];
    window.ab_tester.audiencesData = [];
    window.ab_tester.campaignsData = [makeCampaign(1), makeCampaign(2)];
    window.ab_tester.executionGroupsData = [makeGroup()];
    window.ab_tester.lifecycleHooksData.executionGroupStart = [];
    window.ab_tester.lifecycleHooksData.executionGroupEnd = [];
    window.ab_tester.lifecycleHooksData.campaignStart = [];
    window.ab_tester.lifecycleHooksData.campaignEnd = [];
  });

  it('runs group and campaign hooks and applies each eligible campaign', async () => {
    const calls: Array<[string, unknown]> = [];
    window.ab_tester.lifecycleHooksData.executionGroupStart = [{ javascript: (args: unknown) => calls.push(['group-start', args]) } as never];
    window.ab_tester.lifecycleHooksData.executionGroupEnd = [{ javascript: (args: unknown) => calls.push(['group-end', args]) } as never];
    window.ab_tester.lifecycleHooksData.campaignStart = [{ javascript: (args: unknown) => calls.push(['campaign-start', args]) } as never];
    window.ab_tester.lifecycleHooksData.campaignEnd = [{ javascript: (args: unknown) => calls.push(['campaign-end', args]) } as never];

    await initExecutionGroups();

    expect(campaignInstances.map((campaign) => campaign.applyChanges)).toHaveLength(2);
    expect(campaignInstances.every((campaign) => campaign.applyChanges.mock.calls.length === 1)).toBe(true);
    expect(cookieState.insertedIds).toEqual([1, 2]);
    expect(calls.map(([hook]) => hook)).toEqual(['group-start', 'campaign-start', 'campaign-end', 'campaign-start', 'campaign-end', 'group-end']);
  });

  it('clears stale saved campaigns and filters to previously executed campaigns', async () => {
    window.ab_tester.executionGroupsData = [makeGroup({ onlyCampaignsPreviouslyExecuted: true })];
    cookieState.ids = [1, 99];

    await initExecutionGroups();

    expect(cookieState.deletedIds).toEqual([99]);
    expect(campaignInstances.map(({ id }) => id)).toEqual([1, 2]);

    campaignInstances.length = 0;
    cookieState.ids = [2];
    await initExecutionGroups();

    expect(campaignInstances.map(({ id }) => id)).toEqual([1, 2]);
    expect(campaignInstances[0].applyChanges).not.toHaveBeenCalled();
    expect(campaignInstances[1].applyChanges).toHaveBeenCalledOnce();
    expect(cookieState.insertedIds).toEqual([1, 2]);
  });

  it('waits for requirements and limits execution to one matching campaign', async () => {
    window.ab_tester.executionGroupsData = [
      makeGroup({
        onlyOneCampaignPerPageLoad: true,
        waitForEveryCampaignToBeEvaluated: true,
      }),
    ];
    cookieState.ids = [8, 9];

    await initExecutionGroups();

    expect(cookieState.deletedIds).toEqual([9]);
    expect(cookieState.insertedIds).toEqual([1]);
    expect(campaignInstances.map(({ id }) => id)).toEqual([1, 2]);
    expect(campaignInstances[0].applyChanges).toHaveBeenCalledOnce();
    expect(campaignInstances[1].applyChanges).not.toHaveBeenCalled();
  });

  it('waits for the first successful pending campaign and does not apply failed campaigns', async () => {
    window.ab_tester.campaignsData = [makeCampaign(1, { data: { evaluated: false, met: false } }), makeCampaign(2, { data: { evaluated: false, met: true } })];
    window.ab_tester.executionGroupsData = [makeGroup({ onlyOneCampaignPerPageLoad: true })];

    await initExecutionGroups();

    expect(cookieState.insertedIds).toEqual([2]);
    expect(campaignInstances[0].applyChanges).not.toHaveBeenCalled();
    expect(campaignInstances[1].applyChanges).toHaveBeenCalledOnce();
  });

  it('skips campaign execution when no requirement matches', async () => {
    window.ab_tester.campaignsData = [makeCampaign(1, { data: { met: false } })];
    window.ab_tester.executionGroupsData = [makeGroup({ campaigns: [1], onlyOneCampaignPerPageLoad: true })];

    await initExecutionGroups();

    expect(cookieState.insertedIds).toEqual([]);
    expect(campaignInstances[0].applyChanges).not.toHaveBeenCalled();
  });

  it('does nothing when there are no execution groups', async () => {
    window.ab_tester.executionGroupsData = [];

    await expect(initExecutionGroups()).resolves.toBeUndefined();
    expect(campaignInstances).toEqual([]);
  });
});
