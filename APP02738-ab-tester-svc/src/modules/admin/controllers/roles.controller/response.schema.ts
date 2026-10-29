import { z } from 'zod';
import { emptyResponseSchema, roleResponseSchema } from '../../../../response-validation/schemas';

export const roleResponseSchemas = {
  create: emptyResponseSchema,
  getAll: z.array(roleResponseSchema),
  remove: emptyResponseSchema,
  update: emptyResponseSchema,
};
