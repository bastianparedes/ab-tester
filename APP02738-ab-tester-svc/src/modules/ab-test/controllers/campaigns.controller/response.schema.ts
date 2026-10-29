import { z } from 'zod';
import {
  campaignForExecutionGroupResponseSchema,
  campaignForMenuResponseSchema,
  campaignResponseSchema,
  emptyResponseSchema,
  executionGroupResponseSchema,
} from '../../../../response-validation/schemas';

export const campaignResponseSchemas = {
  copy: emptyResponseSchema,
  create: emptyResponseSchema,
  get: campaignResponseSchema.extend({ executionGroup: executionGroupResponseSchema.nullable() }),
  getAllForExecutionGroup: z.object({ campaigns: z.array(campaignForExecutionGroupResponseSchema) }),
  getMany: z.object({
    campaigns: z.array(campaignForMenuResponseSchema.extend({ executionGroup: executionGroupResponseSchema.nullable() })),
    count: z.number().int(),
  }),
  remove: emptyResponseSchema,
  update: emptyResponseSchema,
};
