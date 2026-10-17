import { z } from 'zod';

export const tenantSchema = z
  .object({
    description: z.string(),
    domain: z.string(),
    name: z.string(),
  })
  .strip();
