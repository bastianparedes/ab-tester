import { z } from 'zod';
import { jsCodeHasCorrectSyntax } from '../../libs/jsCode';

export const variationSchema = z
  .array(
    z.object({
      css: z.string(),
      html: z.string(),
      id: z.number().int(),
      javascript: z.string().refine((val) => jsCodeHasCorrectSyntax(val), {
        message: 'Invalid JavaScript code',
      }),
      name: z.string(),
      traffic: z.number().int().min(0).max(100),
    }),
  )
  .refine((variations) => variations.reduce((sum, v) => sum + v.traffic, 0) === 100, {
    message: 'Total traffic must equal 100',
    path: ['traffic'],
  });
