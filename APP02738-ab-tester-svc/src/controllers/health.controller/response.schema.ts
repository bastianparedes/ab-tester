import { z } from 'zod';

export const healthResponseSchema = z.object({ deployed: z.boolean(), fileExists: z.boolean() });
