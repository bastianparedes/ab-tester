import { z } from 'zod';
import { audienceForCampaignResponseSchema, audienceForMenuResponseSchema, audienceResponseSchema, emptyResponseSchema } from '../../response-validation/schemas';

export const audienceResponseSchemas = {
  create: emptyResponseSchema,
  get: audienceResponseSchema,
  getAllForCampaign: z.object({ audiences: z.array(audienceForCampaignResponseSchema) }),
  getMany: z.object({ audiences: z.array(audienceForMenuResponseSchema), count: z.number().int() }),
  remove: emptyResponseSchema,
  update: emptyResponseSchema,
};
