import { z } from 'zod';
import { jsCodeIsSingleAsyncArrowFunction } from '../../libs/jsCode';
import commonConstants from '../../libs/sharedConstants';

export const getTrackEventQuerySchema = z
  .object({
    orderBy: z.enum(['status', 'name', 'id', 'updatedAt']).meta({ example: 'name' }),
    orderDirection: z.enum(commonConstants.orderDirectionArray).meta({ example: 'asc' }),
    page: z.coerce.number().int().meta({ example: 0 }),
    quantity: z.coerce.number().int().meta({ example: 25 }),
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

export const trackEventSchema = z
  .object({
    javascript: z.string().refine(jsCodeIsSingleAsyncArrowFunction, {
      message: 'Invalid JavaScript code',
    }),
    multipleTimes: z.boolean(),
    name: z.string(),
    status: z.enum(commonConstants.arrayStatusArray),
  })
  .strip();
