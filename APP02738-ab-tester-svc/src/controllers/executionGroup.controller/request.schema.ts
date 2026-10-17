import { z } from 'zod';
import commonConstants from '../../libs/sharedConstants';

export const getExecutionGroupsQuerySchema = z
  .object({
    orderBy: z.enum(['status', 'name', 'id', 'updatedAt']).meta({ example: 'id' }),
    orderDirection: z.enum(commonConstants.orderDirectionArray).meta({ example: 'asc' }),
    page: z.coerce.number().int().meta({ example: 0 }),
    quantity: z.coerce.number().int().meta({ example: 25 }),
    statusList: z
      .preprocess(
        (val) => {
          if (!val) return [];
          if (typeof val === 'string') return [val];
          return val;
        },
        z.array(z.enum(commonConstants.arrayStatusArray)),
      )
      .meta({ description: 'Repeat this parameter to filter by status.', example: ['active'], xOpenApiOptional: true }),
    textSearch: z.string().default(''),
  })
  .strip();

export const executionGroupSchema = z
  .object({
    campaignIds: z.array(z.number().int()),
    name: z.string(),
    onlyCampaignsPreviouslyExecuted: z.boolean(),
    onlyOneCampaignPerPageLoad: z.boolean(),
    status: z.enum(commonConstants.arrayStatusArray),
    waitForEveryCampaignToBeEvaluated: z.boolean(),
  })
  .strip();
