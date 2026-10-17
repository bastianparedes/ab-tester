import { z } from 'zod';

export const roleSchema = z
  .object({
    description: z.string(),
    name: z.string(),
    permissions: z.array(z.string()).optional().default([]),
  })
  .strip();
