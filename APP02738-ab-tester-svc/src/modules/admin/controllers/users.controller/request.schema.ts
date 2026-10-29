import { z } from 'zod';

export const newUserSchema = z
  .object({
    email: z.string(),
    name: z.string(),
    password: z.string(),
  })
  .strip();

export const oldUserSchema = z
  .object({
    email: z.string(),
    name: z.string(),
    roleIds: z.array(z.number().int()),
  })
  .strip();
