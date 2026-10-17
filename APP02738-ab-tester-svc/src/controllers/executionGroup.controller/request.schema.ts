import { z } from 'zod';
import commonConstants from '../../libs/sharedConstants';

export const getExecutionGroupsQuerySchema = z
  .object({
    orderBy: z.enum(['status', 'name', 'id', 'updatedAt']),
    orderDirection: z.enum(commonConstants.orderDirectionArray),
    page: z.coerce.number().int(),
    quantity: z.coerce.number().int(),
    statusList: z.preprocess(
      (val) => {
        if (!val) return [];
        if (typeof val === 'string') return [val];
        return val;
      },
      z.array(z.enum(commonConstants.arrayStatusArray)),
    ),
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
