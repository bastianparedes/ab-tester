import { z } from 'zod';

export const logInSchema = z
  .object({
    email: z.email(),
    password: z.string(),
  })
  .strip();
