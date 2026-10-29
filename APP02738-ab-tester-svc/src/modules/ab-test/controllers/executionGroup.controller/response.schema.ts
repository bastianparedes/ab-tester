import { z } from 'zod';
import {
  campaignForExecutionGroupResponseSchema,
  emptyResponseSchema,
  executionGroupForMenuResponseSchema,
  executionGroupResponseSchema,
} from '../../../../response-validation/schemas';

export const executionGroupResponseSchemas = {
  copy: emptyResponseSchema,
  create: emptyResponseSchema,
  get: z.object({ campaigns: z.array(campaignForExecutionGroupResponseSchema), executionGroup: executionGroupResponseSchema }),
  getMany: z.object({ count: z.number().int(), executionGroups: z.array(executionGroupForMenuResponseSchema) }),
  remove: emptyResponseSchema,
  update: emptyResponseSchema,
};
