import { z } from 'zod';
import { jsCodeIsSingleAsyncArrowFunction } from '../../libs/jsCode';
import commonConstants from '../../libs/sharedConstants';

export const getTrackEventQuerySchema = z
  .object({
    orderBy: z.enum(['status', 'name', 'id', 'updatedAt']),
    orderDirection: z.enum(commonConstants.orderDirectionArray),
    page: z.coerce.number().int(),
    quantity: z.coerce.number().int(),
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
