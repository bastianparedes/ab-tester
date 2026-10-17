import { z } from 'zod';
import { emptyResponseSchema, userResponseSchema } from '../../response-validation/schemas';

export const userResponseSchemas = {
  create: emptyResponseSchema,
  get: userResponseSchema,
  getAll: z.array(userResponseSchema),
  remove: emptyResponseSchema,
  update: emptyResponseSchema,
};
