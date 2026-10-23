import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ExecutionGroupsController } from '../index';
import { copyExecutionGroupSchema } from '../request.schema';

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

  it('copies an execution group and requires permissions for all campaign dependencies', async () => {
    const calls: unknown[] = [];
    const controller = new ExecutionGroupsController({
      audiences: {
        get: async (input: unknown) => {
          calls.push(input);
          return {
            requirements: {
              data: { children: [{ data: { eventCount: 1, quantityOperator: 'atLeast', timeAmount: 30, timeUnit: 'days', trackEventId: 9 }, type: 'any' }], operator: 'and' },
              type: 'node',
            },
          };
        },
      },
      campaigns: {
        get: async (input: unknown) => {
          calls.push(input);
          return { requirements: { data: { children: [{ data: { id: 6 }, type: 'audience' }], operator: 'and' }, type: 'node' } };
        },
      },
      executionGroup: {
        copy: async (input: unknown) => calls.push(input),
        get: async (input: unknown) => {
          calls.push(input);
          return { campaigns: [{ id: 5 }], executionGroup: { id: 4 } };
        },
      },
    } as never);
    const request = {
      user: {
        id: 8,
        roles: [
          {
            permissions: [
              'tenant.12.feature.execution-group.action.create',
              'tenant.3.feature.campaign.action.read',
              'tenant.12.feature.campaign.action.create',
              'tenant.3.feature.audience.action.read',
              'tenant.12.feature.audience.action.create',
              'tenant.3.feature.track-event.action.read',
              'tenant.12.feature.track-event.action.create',
            ],
          },
        ],
      },
    };

    expect(copyExecutionGroupSchema.parse({ extra: true, targetTenantId: 12 })).toEqual({ targetTenantId: 12 });
    expect(copyExecutionGroupSchema.safeParse({ targetTenantId: '12' }).success).toBe(false);
    await expect(controller.copy(3, 4, { targetTenantId: 12 }, request as never)).resolves.toEqual({});
    expect(calls).toEqual([
      { executionGroupId: 4, tenantId: 3 },
      { campaignId: 5, tenantId: 3 },
      { audienceId: 6, tenantId: 3 },
      { executionGroupId: 4, sourceTenantId: 3, targetTenantId: 12, userId: 8 },
    ]);

    const insufficientPermissionsController = new ExecutionGroupsController({
      executionGroup: { get: async () => ({ campaigns: [], executionGroup: { id: 4 } }) },
    } as never);
    await expect(insufficientPermissionsController.copy(3, 4, { targetTenantId: 12 }, { user: { id: 8, roles: [{ permissions: [] }] } } as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(controller.copy(3, 4, { targetTenantId: 12 }, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
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
