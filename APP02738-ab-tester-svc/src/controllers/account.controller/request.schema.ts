import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    newPassword: z.string(),
    oldPassword: z.string(),
  })
  .strip();

export const accountSchema = z
  .object({
    email: z.string(),
    name: z.string(),
  })
  .strip();
