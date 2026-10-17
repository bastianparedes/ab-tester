import { z } from 'zod';
import { jsCodeIsSingleAsyncArrowFunction } from '../../libs/jsCode';
import commonConstants from '../../libs/sharedConstants';

export const lifecycleHookSchema = z
  .object({
    javascript: z.string().refine(jsCodeIsSingleAsyncArrowFunction, {
      message: 'JavaScript must contain exactly one async arrow function',
    }),
    name: z.string(),
    option: z.enum(commonConstants.lifecycleHookOptionsArray),
    status: z.enum(commonConstants.arrayStatusArray),
  })
  .strip();

export const getLifecycleHooksQuerySchema = z
  .object({
    orderBy: z.enum(['id', 'name', 'option', 'status', 'updatedAt']),
    orderDirection: z.enum(commonConstants.orderDirectionArray),
    page: z.coerce.number().int(),
    quantity: z.coerce.number().int(),
    statusList: z.preprocess(
      (value) => {
        if (!value) return [];
        if (typeof value === 'string') return [value];
        return value;
      },
      z.array(z.enum(commonConstants.arrayStatusArray)),
    ),
    textSearch: z.string().default(''),
  })
  .strip();
