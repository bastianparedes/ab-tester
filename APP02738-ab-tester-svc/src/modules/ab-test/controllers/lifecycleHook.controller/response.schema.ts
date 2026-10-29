import { z } from 'zod';
import { emptyResponseSchema, lifecycleHookForMenuResponseSchema, lifecycleHookResponseSchema } from '../../../../response-validation/schemas';

export const lifecycleHookResponseSchemas = {
  copy: emptyResponseSchema,
  create: emptyResponseSchema,
  get: z.object({ lifecycleHook: lifecycleHookResponseSchema }),
  getMany: z.object({ count: z.number().int(), lifecycleHooks: z.array(lifecycleHookForMenuResponseSchema) }),
  remove: emptyResponseSchema,
  update: emptyResponseSchema,
};
