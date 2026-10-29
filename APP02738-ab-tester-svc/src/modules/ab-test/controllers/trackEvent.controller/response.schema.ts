import { z } from 'zod';
import { emptyResponseSchema, trackEventForAudienceResponseSchema, trackEventForMenuResponseSchema, trackEventResponseSchema } from '../../../../response-validation/schemas';

export const trackEventResponseSchemas = {
  copy: emptyResponseSchema,
  create: emptyResponseSchema,
  get: z.object({ trackEvent: trackEventResponseSchema }),
  getAllForAudience: z.object({ trackEvents: z.array(trackEventForAudienceResponseSchema) }),
  getMany: z.object({ count: z.number().int(), trackEvents: z.array(trackEventForMenuResponseSchema) }),
  remove: emptyResponseSchema,
  update: emptyResponseSchema,
};
