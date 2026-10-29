import { z } from 'zod';
import { tenantResponseSchema } from '../../../../response-validation/schemas';

export const tenantResponseSchemas = {
  create: tenantResponseSchema,
  get: tenantResponseSchema,
  getAll: z.array(tenantResponseSchema),
  remove: tenantResponseSchema,
  update: tenantResponseSchema,
};
