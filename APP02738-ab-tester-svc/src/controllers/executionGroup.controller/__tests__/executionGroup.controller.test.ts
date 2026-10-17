import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ExecutionGroupsController } from '../index';

const body = {
  campaignIds: [11, 12],
  name: 'Primary group',
  onlyCampaignsPreviouslyExecuted: false,
  onlyOneCampaignPerPageLoad: true,
  status: 'active',
  waitForEveryCampaignToBeEvaluated: true,
};

describe('ExecutionGroupsController', () => {
  it('returns lists and separates the execution group from campaigns', async () => {
    const list = [{ id: 1 }];
    const result = { campaigns: [{ id: 2 }], executionGroup: { id: 1 } };
    const controller = new ExecutionGroupsController({
      executionGroup: { get: async () => result, getMany: async () => list },
    } as never);

    await expect(controller.getMany(4, { page: 1 } as never)).resolves.toBe(list);
    await expect(controller.get(4, 1)).resolves.toEqual(result);
  });

  it('throws when an execution group does not exist', async () => {
    const controller = new ExecutionGroupsController({ executionGroup: { get: async () => null } } as never);

    await expect(controller.get(4, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates execution groups for the authenticated user', async () => {
    const calls: unknown[] = [];
    const controller = new ExecutionGroupsController({ executionGroup: { create: async (input: unknown) => calls.push(input) } } as never);

    await expect(controller.create(4, body as never, { user: { id: 7 } } as never)).resolves.toEqual({});
    expect(calls).toEqual([
      {
        campaignIds: body.campaignIds,
        tenantId: 4,
        userId: 7,
        values: {
          name: body.name,
          onlyCampaignsPreviouslyExecuted: body.onlyCampaignsPreviouslyExecuted,
          onlyOneCampaignPerPageLoad: body.onlyOneCampaignPerPageLoad,
          status: body.status,
          waitForEveryCampaignToBeEvaluated: body.waitForEveryCampaignToBeEvaluated,
        },
      },
    ]);
  });

  it('rejects create and update requests without an authenticated user', async () => {
    const controller = new ExecutionGroupsController({ executionGroup: {} } as never);

    await expect(controller.create(4, body as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.update(4, 2, body as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('updates an execution group and removes it', async () => {
    const updates: unknown[] = [];
    const removals: unknown[] = [];
    const controller = new ExecutionGroupsController({
      executionGroup: {
        remove: async (input: unknown) => removals.push(input),
        update: async (input: unknown) => updates.push(input),
      },
    } as never);

    await expect(controller.update(4, 2, body as never, { user: { id: 7 } } as never)).resolves.toEqual({});
    await expect(controller.remove(4, 2)).resolves.toEqual({});
    expect(updates).toEqual([
      {
        campaignIds: body.campaignIds,
        executionGroupId: 2,
        tenantId: 4,
        userId: 7,
        values: {
          name: body.name,
          onlyCampaignsPreviouslyExecuted: body.onlyCampaignsPreviouslyExecuted,
          onlyOneCampaignPerPageLoad: body.onlyOneCampaignPerPageLoad,
          status: body.status,
          waitForEveryCampaignToBeEvaluated: body.waitForEveryCampaignToBeEvaluated,
        },
      },
    ]);
    expect(removals).toEqual([{ executionGroupId: 2, tenantId: 4 }]);
  });
});
