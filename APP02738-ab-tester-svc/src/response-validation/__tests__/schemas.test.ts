import { describe, expect, it } from 'vitest';
import { audienceResponseSchema, campaignResponseSchema } from '../schemas';

describe('response schemas', () => {
  it('validates recursively nested campaign and audience requirements', () => {
    const timestamp = new Date();
    const campaignRequirements = {
      data: {
        children: [{ data: { children: [], operator: 'or' }, type: 'node' }],
        operator: 'and',
      },
      type: 'node',
    };
    const audienceRequirements = {
      data: {
        children: [
          {
            data: {
              children: [
                {
                  data: {
                    eventCount: 1,
                    quantityOperator: 'atLeast',
                    timeAmount: 2,
                    timeUnit: 'days',
                    trackEventId: 3,
                  },
                  type: 'any',
                },
              ],
              operator: 'or',
            },
            type: 'node',
          },
        ],
        operator: 'and',
      },
      type: 'node',
    };

    expect(
      campaignResponseSchema.parse({
        createdAt: timestamp,
        executionGroupId: null,
        id: 1,
        name: 'Experiment',
        requirements: campaignRequirements,
        status: 'active',
        tenantId: 2,
        triggers: [],
        updatedAt: timestamp,
        variations: [],
      }).requirements,
    ).toEqual(campaignRequirements);
    expect(
      audienceResponseSchema.parse({
        createdAt: timestamp,
        id: 3,
        name: 'Recent visitors',
        requirements: audienceRequirements,
        tenantId: 2,
        updatedAt: timestamp,
      }).requirements,
    ).toEqual(audienceRequirements);
  });
});
