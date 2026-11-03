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
    status: z.enum(['active', 'inactive']),
  })
  .strip();

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(1),
  })
  .strip();
