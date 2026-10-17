import { z } from 'zod';
import commonConstants from '../../libs/sharedConstants';
import { NodeRequirementSchema } from './requirementsValidator';

export const getAudiencesQuerySchema = z
  .object({
    orderBy: z.enum(['status', 'name', 'id', 'updatedAt']),
    orderDirection: z.enum(commonConstants.orderDirectionArray),
    page: z.coerce.number().int(),
    statusList: z.preprocess(
      (val) => {
        if (!val) return [];
        if (typeof val === 'string') return [val];
        return val;
      },
      z.array(z.enum(commonConstants.arrayStatusArray)),
    ),
    textSearch: z.string().default(''),
  })
  .strip();

export const audienceSchema = z
  .object({
    name: z.string(),
    requirements: NodeRequirementSchema,
  })
  .strip();
