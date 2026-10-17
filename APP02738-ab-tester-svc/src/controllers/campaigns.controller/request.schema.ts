import { z } from 'zod';
import commonConstants from '../../libs/sharedConstants';
import { nodeRequirementSchema } from './requirementsValidator';
import { triggerSchema } from './triggersValidator';
import { variationSchema } from './variationsValidator';

export const getCampaignsQuerySchema = z
  .object({
    orderBy: z.enum(['status', 'name', 'id', 'updatedAt']).meta({ example: 'updatedAt' }),
    orderDirection: z.enum(commonConstants.orderDirectionArray).meta({ example: 'desc' }),
    page: z.coerce.number().int().meta({ example: 0 }),
    quantity: z.coerce.number().meta({ example: 25 }),
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

export const campaignSchema = z
  .object({
    name: z.string(),
    requirements: nodeRequirementSchema,
    status: z.enum(commonConstants.arrayStatusArray),
    triggers: triggerSchema,
    variations: variationSchema,
  })
  .strip();
