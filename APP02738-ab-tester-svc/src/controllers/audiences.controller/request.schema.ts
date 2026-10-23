import { z } from 'zod';
import commonConstants from '../../libs/sharedConstants';
import { NodeRequirementSchema } from './requirementsValidator';

export const getAudiencesQuerySchema = z
  .object({
    orderBy: z.enum(['status', 'name', 'id', 'updatedAt']).meta({ example: 'updatedAt' }),
    orderDirection: z.enum(commonConstants.orderDirectionArray).meta({ example: 'desc' }),
    page: z.coerce.number().int().meta({ example: 0 }),
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

export const audienceSchema = z
  .object({
    name: z.string(),
    requirements: NodeRequirementSchema,
  })
  .strip();

export const copyAudienceSchema = z
  .object({
    targetTenantId: z.number().int(),
  })
  .strip();
